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
    listOfBooks,
    cipher1,
    cipher2,
    cipher3,
    config,
    simulate,
    logger
}) {
    // Risultati come i seguenti:
    // [{ word: "test", count: 3 }, { word: "example", count: 2 }]
    const results = [];

    let index = 0;
    let totalIds = ids.length;

    for (const id of ids) {
        index++;
        
        logger.write(`Reading id: ${id} (${index} / ${totalIds})`);

        try {
            let specialWords = await extractSingleBook({
                id,
                filePath: buildBookPath(basePath, id),
                config,
                logger,
                simulate
            })

            // Effettuo la distinct di tutte le parole speciali ritornando un oggetto composto dalla parola e dal numero delle occorrenze della stessa
            // { word: "test", count: 3 }
            let distinctSpecialWords = [...new Set(specialWords)].map(word => ({
                word,
                count: specialWords.filter(x => x === word).length
            }));

            // Per ogni parola speciale estratta aggiungo il conteggio delle occorrenze nell'array distinctSpecialWords
            for (const item of distinctSpecialWords) {
                let matchingResults = results.filter(x => x.word === item.word);
                if (matchingResults.length === 0) {
                    results.push({
                        word: item.word,
                        count: item.count
                    });
                }else {
                    for (const match of matchingResults) {
                        match.count += item.count;
                    }
                }
            }
       
        } catch (e) {
            logger.write(`UNHANDLED ERROR: ${e.stack || e.message}`);
        }

    }
    return results;
}

module.exports = {
    processIds,
    buildBookPath,
    validateId
};