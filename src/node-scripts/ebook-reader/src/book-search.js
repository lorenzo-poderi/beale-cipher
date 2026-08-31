'use strict';
const fs = require('fs');
const {
    readBook,
    findMarker,
    extractLines
} = require('./gutenberg');

async function extractSingleBook({
    id,
    firstSentenceLine,
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

    // array di prime lettere di tutte le parole
    let firstLetters = [];

    const lines = await readBook(filePath);
    logger.write(`File read successfully. Total lines: ${lines.length}`);

    let i = 0;
    let line = null;
    let words = [];
    let word = null;
    let character = '';

    while (firstLetters.length < config.maxWords) {
        line = lines[firstSentenceLine + i];
        words = line != null ? line.split(' ') : [];

        for (let j = 0; j < words.length; j++) {
            word = words[j];

            if (word != null && word.length > 0) {
                character = word[0]; 

                firstLetters.push(character);
            }
        }

        i++;
    }

    const firstSentence = lines[firstSentenceLine];

    // if (markerLine < 0) {
    //     logger.write('Gutenberg marker not found.');
    //     return {
    //         id,
    //         status: 'Not found',
    //         trimmedLines: null,
    //         firstSentenceLine: null,
    //         confidence: null,
    //         firstSentence: null
    //     };
    // }

    logger.write(`First sentence found at line ${firstSentenceLine}`);

    const sizes = [config.firstSampleLines, config.secondSampleLines];

    return {
        id,
        status: 'Done',
        firstLetters: firstLetters.join(''),
        firstLettersLength: firstLetters.length,
    };
}
module.exports = {
    extractSingleBook
};