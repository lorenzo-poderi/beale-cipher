'use strict';
const fs = require('fs');
const path = require('path');
const { loadConfig: loadCommonConfig } = require('../../001-common-files/src/config');
const DEFAULTS = {
    logDirectory: path.join(__dirname, '..', 'logs'),
    maxWordsCipher1: 2906,
    maxWordsCipher2: 1005,
    maxWordsCipher3: 975,
    maxWords: 2906,
    basePath: 'D:\\LolloNewPc\\Sviluppo\\data',
    dataPath: path.join(__dirname, '..', '..', '..', 'data'),
    generatedPath: path.join(__dirname, '..', '..', '..', 'data', 'generated'),
    listOfBooksFile: path.join(__dirname, '..', '..', '..', 'data', 'generated','list-of-books.json'),
    resultFile: path.join(__dirname, '..', '..', '..', 'data', 'generated','list-of-first-letters.json'),
    cipher1: path.join(__dirname, '..', '..', '..', 'data', 'originals','ciphers','cipher1.txt'),
    cipher2: path.join(__dirname, '..', '..', '..', 'data', 'originals','ciphers','cipher2.txt'),
    cipher3: path.join(__dirname, '..', '..', '..', 'data', 'originals','ciphers','cipher3.txt'),
    charsToRemove: "-*\"'“•()0123456789.",
    endOfProjectGutenberg: "*** END OF THE PROJECT GUTENBERG"
};

function loadConfig() {
    return loadCommonConfig(path.join(__dirname, '..', 'config', 'config.local.json'), DEFAULTS);
}

function getResultFile(c) {
    let f = {};
    if (fs.existsSync(c.resultFile)) f = JSON.parse(fs.readFileSync(c.resultFile, 'utf8'));
    return f;
}

function getListOfBooks(c) {
    let f = {};
    if (fs.existsSync(c.listOfBooksFile)) f = JSON.parse(fs.readFileSync(c.listOfBooksFile, 'utf8'));
    return f;
}

function getCipher1(c) {
    let f = "";
    if (fs.existsSync(c.cipher1)) f = fs.readFileSync(c.cipher1, 'utf8');
    let arr = f.replaceAll('\r\n','').split(',').map(x => x.replace(' ',''));
    return arr;
}
function getCipher2(c) {
    let f = "";
    if (fs.existsSync(c.cipher1)) f = fs.readFileSync(c.cipher2, 'utf8');
    let arr = f.replaceAll('\r\n','').split(',').map(x => x.replace(' ',''));
    return arr;
}
function getCipher3(c) {
    let f = "";
    if (fs.existsSync(c.cipher1)) f = fs.readFileSync(c.cipher3, 'utf8');
    let arr = f.replaceAll('\r\n','').split(',').map(x => x.replace(' ',''));
    return arr;
}


module.exports = {
    loadConfig,
    getResultFile,
    getListOfBooks,
    getCipher1,
    getCipher2,
    getCipher3
};