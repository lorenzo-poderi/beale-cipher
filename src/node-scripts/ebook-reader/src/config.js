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
    listOfResultsFile: path.join(__dirname, '..', '..', '..', 'data', 'generated','list-of-results.json'),
    listOfFirstLettersFile: path.join(__dirname, '..', '..', '..', 'data', 'generated','list-of-first-letters.json'),
    cipher1: path.join(__dirname, '..', '..', '..', 'data', 'originals','cipher1.txt'),
    cipher2: path.join(__dirname, '..', '..', '..', 'data', 'originals','cipher2.txt'),
    cipher3: path.join(__dirname, '..', '..', '..', 'data', 'originals','cipher3.txt'),
    charsToRemove: "-*\"'“•()0123456789.",
    endOfProjectGutenberg: "*** END OF THE PROJECT GUTENBERG"
};

function loadConfig() {
    const c = {
        ...DEFAULTS
    };
    if (fs.existsSync(c.apiConfigFile)) Object.assign(c, JSON.parse(fs.readFileSync(c.apiConfigFile, 'utf8')));
    for (const k of ['logDirectory', 'apiConfigFile']) c[k] = path.resolve(c[k]);
    return c;
}

function getListOfResults(c) {
    let f = {};
    if (fs.existsSync(c.listOfResultsFile)) f = JSON.parse(fs.readFileSync(c.listOfResultsFile, 'utf8'));
    return f;
}

function getCipher1() {
    let f = {};
    if (fs.existsSync(c.cipher1)) f = fs.readFileSync(c.cipher1, 'utf8');
    let arr = f.split(',').map(x => x.replace(' ',''));
    return f;
}

module.exports = {
    loadConfig,
    getListOfResults
};