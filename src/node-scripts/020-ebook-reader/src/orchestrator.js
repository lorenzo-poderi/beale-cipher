'use strict';
const fs = require('fs');
const path = require('path');
const {
    extractSingleBook
} = require('./book-search');

function validateId(id) {
    return Number.isInteger(id) && id >= 1 && id <= 80000;
}

function buildBookPath(basePath, id) {
    return path.join(basePath, 'txt-files', 'cache', 'epub', String(id), `pg${id}.txt`);
}

function findFirstSentenceLine(id, listOfResults) {
    let item = listOfResults.find(x => x.id == id);
    let firstSentenceLine = item != null ? item.firstSentenceLine : null;
    return firstSentenceLine;
}

async function processIds({
    ids,
    basePath,
    listOfResults,
    cipher1,
    cipher2,
    cipher3,
    config,
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
        let firstSentenceLine = findFirstSentenceLine(id, listOfResults);

        if (firstSentenceLine != null) {

            try {
                results.push(await extractSingleBook({
                    id,
                    firstSentenceLine,
                    filePath: buildBookPath(basePath, id),
                    cipher1,
                    cipher2,
                    cipher3,
                    config,
                    logger,
                    simulate
                }));
            } catch (e) {
                logger.write(`UNHANDLED ERROR: ${e.stack || e.message}`);
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

    }
    return results;
}

module.exports = {
    processIds,
    buildBookPath,
    validateId
};