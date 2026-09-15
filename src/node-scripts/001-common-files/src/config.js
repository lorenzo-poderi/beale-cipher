'use strict';
const fs = require('fs');
const path = require('path');

const commonConfigFile = path.join(__dirname, '..', 'config', 'config.common.json');
const pathProperties = [
    'logDirectory',
    'dataPath',
    'generatedPath',
    'listOfBooksFile',
    'listOfFirstSentencesFile',
    'listOfFirstLettersFile',
    'listOfSpecialWordsFile',
    'cipher1',
    'cipher2',
    'cipher3'
];

const DEFAULTS = {
    ...JSON.parse(fs.readFileSync(commonConfigFile, 'utf8')),
    commonConfigFile
};

for (const key of pathProperties) {
    DEFAULTS[key] = path.resolve(path.dirname(commonConfigFile), DEFAULTS[key]);
}

function loadConfig(localConfigFile, scriptDefaults = {}) {
    const c = {
        ...DEFAULTS,
        ...scriptDefaults,
        commonConfigFile: DEFAULTS.commonConfigFile,
        localConfigFile: localConfigFile || null
    };
    Object.assign(c, JSON.parse(fs.readFileSync(c.commonConfigFile, 'utf8')));
    if (c.localConfigFile && fs.existsSync(c.localConfigFile)) {
        Object.assign(c, JSON.parse(fs.readFileSync(c.localConfigFile, 'utf8')));
    }
    for (const k of pathProperties) c[k] = path.resolve(path.dirname(c.commonConfigFile), c[k]);
    c.commonConfigFile = path.resolve(c.commonConfigFile);
    if (c.localConfigFile) c.localConfigFile = path.resolve(c.localConfigFile);
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