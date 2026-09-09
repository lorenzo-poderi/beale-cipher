'use strict';
const fs = require('fs');
const path = require('path');
const {
    searchSingleBook
} = require('./book-search');

function validateId(id) {
    return Number.isInteger(id) && id >= 1 && id <= 80000;
}

function buildBookPath(basePath, id) {
    return path.join(basePath, 'txt-files', 'cache', 'epub', String(id), `pg${id}.txt`);
}
async function processIds({
    ids,
    basePath,
    config,
    searchByAI,
    prompt,
    apiKey,
    modelName,
    simulate,
    loggerFactory
}) {
    const results = [];
    for (const id of ids) {
        if (!validateId(id)) {
            results.push({
                id,
                status: 'Error',
                trimmedLines: null,
                firstSentenceLine: null,
                confidence: null,
                firstSentence: null
            });
            continue;
        }
        const logger = loggerFactory(id);
        try {
            results.push(await searchSingleBook({
                id,
                filePath: buildBookPath(basePath, id),
                config,
                searchByAI,
                logger,
                prompt,
                apiKey,
                modelName,
                simulate
            }));
        } catch (e) {
            logger.write(`UNHANDLED ERROR: ${e.stack||e.message}`);
            results.push({
                id,
                status: 'Error',
                trimmedLines: null,
                firstSentenceLine: null,
                confidence: null,
                firstSentence: null
            });
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