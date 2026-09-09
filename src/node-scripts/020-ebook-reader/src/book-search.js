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
    cipher1,
    cipher2,
    cipher3,
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
    logger.write(`First sentence found at line ${firstSentenceLine}`);

    let i = 0;
    let line = null;
    let words = [];
    let word = null;
    let character = '';

    while (firstLetters.length < config.maxWords) {
        line = lines[firstSentenceLine + i];

        if (line.startsWith(config.endOfProjectGutenberg))
        {
            break;
        }

        words = line != null ? line.split(' ') : [];

        for (let j = 0; j < words.length; j++) {
            word = words[j];

            if (word != null && word.length > 0) {
                word = removeSpecialChars(word, config.charsToRemove);
                if (word.length > 0) {
                    character = word[0];
                    firstLetters.push(character.toUpperCase());
                }

            }
        }

        i++;
    }

    let solvedCipher1 = solveCipher(cipher1, firstLetters);
    let solvedCipher2 = solveCipher(cipher2, firstLetters);
    let solvedCipher3 = solveCipher(cipher3, firstLetters);

    return {
        id,
        status: 'Done',
        firstLetters: firstLetters.join(''),
        firstLettersLength: firstLetters.length,
        solvedCipher1: solvedCipher1,
        solvedCipher2: solvedCipher2,
        solvedCipher3: solvedCipher3
    };
}

function solveCipher(cipher, firstLetters) 
{
    return cipher.map(x => x < firstLetters.length ? firstLetters[x-1] : '_').join('');
}



function removeSpecialChars(text, charsToRemove) {
    for (const char of charsToRemove) {
        text = text.replaceAll(char, '');
    }

    return text;
}

module.exports = {
    extractSingleBook
};