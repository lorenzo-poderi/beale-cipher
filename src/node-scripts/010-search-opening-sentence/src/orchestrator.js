'use strict';
const fs = require('fs');
const path = require('path');
const {
    searchByAI
} = require('../../001-common-files/src/ai-search');
const {
    readFile
} = require('../../001-common-files/src/file-reader');
const {
    readBook,
    findMarker,
    extractLines
} = require('../../001-common-files/src/book-reader');

const PROMPT_FILE = path.join(__dirname, '..', 'prompts', 'search-start.md');

function validateId(id) {
    return Number.isInteger(id) && id >= 1 && id <= 80000;
}

function buildBookPath(basePath, id) {
    return path.join(basePath, 'txt-files', 'cache', 'epub', String(id), `pg${id}.txt`);
}

function buildResult(id, status, trimmedLines = null, firstSentenceLine = null, confidence = null, firstSentence = null) {
    return {
        id,
        status,
        trimmedLines,
        firstSentenceLine,
        confidence,
        firstSentence
    };
}

async function searchSingleBook({
    id,
    filePath,
    config,
    logger,
    prompt,
    apiKey,
    modelName,
    simulate
}) {

    // Ritorna un oggetto come il seguente:
    // {
    //     id: <book id>,
    //     status: 'Done' | 'Not found' | 'Error',
    //     trimmedLines: <number of lines trimmed from the start>,
    //     firstSentenceLine: <line number of the first sentence>,
    //     confidence: <AI confidence score>,
    //     firstSentence: <the first sentence detected>
    // }


    // Ensure the file exists and is readable before proceeding
    logger.write('Reading file...');
    try {
        await fs.promises.access(filePath, fs.constants.R_OK)
    } catch (e) {
        throw new Error(`Cannot access ebook: ${filePath}`)
    }

    // Read the book file into lines
    const lines = await readBook(filePath);
    logger.write(`File read successfully. Total lines: ${lines.length}`);

    // Find the Gutenberg marker line in the book
    const markerLine = findMarker(lines, config.startOfProjectGutenberg);

    if (markerLine < 0) {
        logger.write('Gutenberg marker not found.');
        return buildResult(id, 'Not found');
    }

    // If the marker line is found, log its position
    logger.write(`Gutenberg marker found at line ${markerLine}`);

    // Define the sizes of the samples to be extracted for AI analysis
    const sizes = [config.firstSampleLines, config.secondSampleLines];

    // Attempt to find the opening sentence using progressively larger samples
    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {

        // Extract a sample of lines around the Gutenberg marker for this attempt
        const s = extractLines(lines, markerLine, sizes[Math.min(attempt, sizes.length - 1)]);

        logger.write(`Sending lines ${s.startLine}-${s.endLine} to AI...`);

        // Send the extracted lines to the AI for analysis
        let ai;
        try {

            // Call the AI search function with the extracted lines
            ai = await searchByAI({
                id,
                lines: s.lines,
                modelName,
                prompt,
                apiKey,
                maxRetries: config.maxRetries,
                requestTimeoutMs: config.requestTimeoutMs,
                logger,
                simulate
            })
        } catch (e) {
            logger.write(`ERROR: ${e.message}`);

            // Return the result indicating that an error occurred during AI analysis
            return buildResult(id, 'Error', markerLine);
        }
        if (ai.status === 'Done') {
            const original = markerLine + 1 + ai.firstSentenceLine;
            if (original < 0 || original >= lines.length) throw new Error(`Calculated original line ${original} is invalid.`);
            logger.write(`Start detected at local line ${ai.firstSentenceLine}`);
            logger.write(`Original start line: ${original}`);

            // Return the result of the AI analysis
            return buildResult(id, 'Done', markerLine, original, ai.confidence, ai.firstSentence);
        }
        if (attempt + 1 < config.maxAttempts) {
            logger.write('Start not found. Retrying with larger sample...');
            continue;
        }
        logger.write('Maximum number of attempts reached. Manual search required.');

        // Return the result indicating that the opening sentence was not found
        return buildResult(id, 'Not found', markerLine);
    }
    return buildResult(id, 'Error', markerLine);
}

async function processIds({
    ids,
    config,
    simulate,
    loggerFactory
}) {

    // Parametri per la chiamata all'AI
    const prompt = readFile(PROMPT_FILE);
    const apiKey = config.apiKey;
    const modelName = config.modelName;
    
    // Array di risultati per ogni libro processato
    const results = [];


    for (const id of ids) {

        if (!validateId(id)) {
            results.push(buildResult(id, 'Error'));
            continue;
        }

        // Creazione del logger per il libro corrente
        const logger = loggerFactory(id);

        try {

            // Search for the opening sentence of the book using AI
            const searchResult = await searchSingleBook({
                id,
                filePath: buildBookPath(config.basePath, id),
                config,
                logger,
                prompt,
                apiKey,
                modelName,
                simulate
            });

            // Aggiungi il risultato della ricerca all'array dei risultati
            results.push(searchResult);
        } catch (e) {
            logger.write(`UNHANDLED ERROR: ${e.stack||e.message}`);
            results.push(buildResult(id, 'Error'));
        }
    }
    return results;
}
async function processJsonFile({
    jsonFile,
    ...options
}) {
    const data = JSON.parse(await fs.promises.readFile(jsonFile, 'utf8'));
    if (!Array.isArray(data)) throw new Error('Input JSON must contain an array.');
    return processIds({
        ...options,
        ids: data.map(x => Number(x.id))
    });
}
module.exports = {
    processIds,
    processJsonFile,
    buildBookPath,
    validateId
};