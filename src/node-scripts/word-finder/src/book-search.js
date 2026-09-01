'use strict';
const fs = require('fs');
const {
    readBook,
    findMarker,
    extractLines
} = require('./gutenberg');

const {
    isAlphanumeric,
    isIsolatedCharacter,
    isListMarker,
    isHyphenatedWord,
    isApostropheWord,
    splitApostrophe,
    startsOrEndsWithSpecialCharWord
} = require('./word-parser');

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

    // array di prime lettere di tutte le parole
    let results = [];

    const lines = await readBook(filePath);

    const startLine = findMarker(lines, config.startOfProjectGutenberg);
    const endLine = findMarker(lines, config.endOfProjectGutenberg);

    logger.write(`File read successfully. Total lines: ${lines.length}`);
    logger.write(`Gutenberg start marker found at line ${startLine}`);
    logger.write(`Gutenberg end marker found at line ${endLine}`);

    let line = null;
    let words = [];
    let word = null;
    let character = '';

    for (let i = startLine +1; i < endLine; i++) {

        line = lines[i];

        words = line != null ? line.split(' ') : [];

        for (let j = 0; j < words.length; j++) {
            word = words[j];

            if (word != null && word.length > 0) {

                if (!isAlphanumeric(word)) {

                    if (!startsOrEndsWithSpecialCharWord(word))
                    {
                        results.push(word);
                    }
                }
            }
        }

        i++;
    }

    return results;
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