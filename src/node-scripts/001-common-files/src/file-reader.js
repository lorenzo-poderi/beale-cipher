'use strict';
const fs = require('fs');
const path = require('path');

const {
    DEFAULTS,
} = require('./config');

function readFile(filePath, defaultValue = '') {
    if (!fs.existsSync(filePath)) return defaultValue;
    return fs.readFileSync(filePath, 'utf8');
}

function getListOfResults() {
    let c = DEFAULTS;
    return JSON.parse(readFile(c.listOfResultsFile, '{}'));
}

function getListOfBooks() {
    let c = DEFAULTS;
    return JSON.parse(readFile(c.listOfBooksFile, '{}'));
}

function getListOfSpecialWords() {
    let c = DEFAULTS;
    return JSON.parse(readFile(c.listOfSpecialWordsFile, '{}'));
}

function getCipher1() {
    let c = DEFAULTS;
    return readFile(c.cipher1).replaceAll('\r\n','').split(',').map(x => x.replace(' ',''));
}
function getCipher2() {
    let c = DEFAULTS;
    return readFile(c.cipher2).replaceAll('\r\n','').split(',').map(x => x.replace(' ',''));
}
function getCipher3() {
    let c = DEFAULTS;   
    return readFile(c.cipher3).replaceAll('\r\n','').split(',').map(x => x.replace(' ',''));
}

module.exports = {
    readFile,
    getListOfResults,
    getListOfBooks,
    getListOfSpecialWords,
    getCipher1,
    getCipher2,
    getCipher3
};