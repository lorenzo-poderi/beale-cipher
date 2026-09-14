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
    logger.write('Reading file...');
    try {
        await fs.promises.access(filePath, fs.constants.R_OK)
    } catch (e) {
        throw new Error(`Cannot access ebook: ${filePath}`)
    }
    const lines = await readBook(filePath);
    logger.write(`File read successfully. Total lines: ${lines.length}`);
    const markerLine = findMarker(lines, config.gutenbergMarker);

    if (markerLine < 0) {
        logger.write('Gutenberg marker not found.');
        return buildResult(id, 'Not found');
    }

    logger.write(`Gutenberg marker found at line ${markerLine}`);

    const sizes = [config.firstSampleLines, config.secondSampleLines];

    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
        const s = extractLines(lines, markerLine, sizes[Math.min(attempt, sizes.length - 1)]);
        logger.write(`Sending lines ${s.startLine}-${s.endLine} to AI...`);
        let ai;
        try {
            ai = await searchByAI({
                id,
                lines: s.lines,
                modelName,
                prompt,
                apiKey,
                config,
                logger,
                simulate
            })
        } catch (e) {
            logger.write(`ERROR: ${e.message}`);
            return buildResult(id, 'Error', markerLine);
        }
        if (ai.status === 'Done') {
            const original = markerLine + 1 + ai.firstSentenceLine;
            if (original < 0 || original >= lines.length) throw new Error(`Calculated original line ${original} is invalid.`);
            logger.write(`Start detected at local line ${ai.firstSentenceLine}`);
            logger.write(`Original start line: ${original}`);
            return buildResult(id, 'Done', markerLine, original, ai.confidence, ai.firstSentence);
        }
        if (attempt + 1 < config.maxAttempts) {
            logger.write('Start not found. Retrying with larger sample...');
            continue;
        }
        logger.write('Maximum number of attempts reached. Manual search required.');
        return buildResult(id, 'Not found', markerLine);
    }
    return buildResult(id, 'Error', markerLine);
}

async function processIds({
    ids,
    basePath,
    config,
    simulate,
    loggerFactory
}) {
    const prompt = readFile(PROMPT_FILE);
    const apiKey = config.apiKey;
    const modelName = config.modelName;
    const results = [];
    for (const id of ids) {
        if (!validateId(id)) {
            results.push(buildResult(id, 'Error'));
            continue;
        }
        const logger = loggerFactory(id);
        try {
            results.push(await searchSingleBook({
                id,
                filePath: buildBookPath(basePath, id),
                config,
                logger,
                prompt,
                apiKey,
                modelName,
                simulate
            }));
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