'use strict';
const fs = require('fs');
const {
    readBook,
    findMarker,
    extractLines
} = require('./gutenberg');

async function extractSingleBook({
    id,
    filePath,
    config,
    logger,
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
        return {
            id,
            status: 'Not found',
            trimmedLines: null,
            firstSentenceLine: null,
            confidence: null,
            firstSentence: null
        };
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
            return {
                id,
                status: 'Error',
                trimmedLines: markerLine,
                firstSentenceLine: null,
                confidence: null,
                firstSentence: null
            };
        }
        if (ai.status === 'Done') {
            const original = markerLine + 1 + ai.firstSentenceLine;
            if (original < 0 || original >= lines.length) throw new Error(`Calculated original line ${original} is invalid.`);
            logger.write(`Start detected at local line ${ai.firstSentenceLine}`);
            logger.write(`Original start line: ${original}`);
            return {
                id,
                status: 'Done',
                trimmedLines: markerLine,
                firstSentenceLine: original,
                confidence: ai.confidence,
                firstSentence: ai.firstSentence
            };
        }
        if (attempt + 1 < config.maxAttempts) {
            logger.write('Start not found. Retrying with larger sample...');
            continue;
        }
        logger.write('Maximum number of attempts reached. Manual search required.');
        return {
            id,
            status: 'Not found',
            trimmedLines: markerLine,
            firstSentenceLine: null,
            confidence: null,
            firstSentence: null
        };
    }
    return {
        id,
        status: 'Error',
        trimmedLines: markerLine,
        firstSentenceLine: null,
        confidence: null,
        firstSentence: null
    };
}
module.exports = {
    extractSingleBook
};