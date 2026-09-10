'use strict';
const fs = require('fs');
const path = require('path');

const DEFAULTS = {
    logDirectory: path.join(__dirname, '..', 'logs'),
    apiConfigFile: path.join(__dirname, '..', 'config', 'config.local.json'),
    maxWordsCipher1: 2906,
    maxWordsCipher2: 1005,
    maxWordsCipher3: 975,
    maxWords: 2906,
    basePath: 'D:\\LolloNewPc\\Sviluppo\\data',
    dataPath: path.join(__dirname, '..', '..', '..', 'data'),
    generatedPath: path.join(__dirname, '..', '..', '..', 'data', 'generated'),
    listOfBooksFile: path.join(__dirname, '..', '..', '..', 'data', 'generated','list-of-books.json'),
    //listOfResultsFile: path.join(__dirname, '..', '..', '..', 'data', 'generated','list-of-results.json'),
    listOfFirstSentencesFile: path.join(__dirname, '..', '..', '..', 'data', 'generated','list-of-first-sentences.json'),
    listOfFirstLettersFile: path.join(__dirname, '..', '..', '..', 'data', 'generated','list-of-first-letters.json'),
    listOfSpecialWordsFile: path.join(__dirname, '..', '..', '..', 'data', 'generated','list-of-special-words.json'),
    cipher1: path.join(__dirname, '..', '..', '..', 'data', 'originals','ciphers','cipher1.txt'),
    cipher2: path.join(__dirname, '..', '..', '..', 'data', 'originals','ciphers','cipher2.txt'),
    cipher3: path.join(__dirname, '..', '..', '..', 'data', 'originals','ciphers','cipher3.txt'),
    startOfProjectGutenberg: "*** START OF THE PROJECT GUTENBERG EBOOK",
    endOfProjectGutenberg: "*** END OF THE PROJECT GUTENBERG",
    apiKey: ""
};

function loadConfig() {
    const c = {
        ...DEFAULTS
    };
    if (fs.existsSync(c.apiConfigFile)) Object.assign(c, JSON.parse(fs.readFileSync(c.apiConfigFile, 'utf8')));
    for (const k of ['logDirectory', 'apiConfigFile']) c[k] = path.resolve(c[k]);
    return c;
}

function readFile(filePath, defaultValue = '') {
    if (!fs.existsSync(filePath)) return defaultValue;
    return fs.readFileSync(filePath, 'utf8');
}

function getListOfResults(c) {
    return JSON.parse(readFile(c.listOfResultsFile, '{}'));
}

function getListOfBooks(c) {
    return JSON.parse(readFile(c.listOfBooksFile, '{}'));
}

function getListOfSpecialWords(c) {
    return JSON.parse(readFile(c.listOfSpecialWordsFile, '{}'));
}

function getCipher1(c) {
    return readFile(c.cipher1).replaceAll('\r\n','').split(',').map(x => x.replace(' ',''));
}
function getCipher2(c) {
    return readFile(c.cipher2).replaceAll('\r\n','').split(',').map(x => x.replace(' ',''));
}
function getCipher3(c) {
    return readFile(c.cipher3).replaceAll('\r\n','').split(',').map(x => x.replace(' ',''));
}


/**
 * Legge un parametro dalla riga di comando.
 *
 * Esempio:
 *
 * --model gpt-5.6
 *
 * restituisce:
 *
 * gpt-5.6
 */
function getArgument(args, name) {

    const index = args.indexOf(name);

    if (index === -1) {
        return null;
    }

    return args[index + 1];
}


module.exports = {
    DEFAULTS,
    getArgument,
    loadConfig,
    readFile,
    getListOfResults,
    getListOfBooks,
    getListOfSpecialWords,
    getCipher1,
    getCipher2,
    getCipher3
};