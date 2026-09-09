'use strict';
const fs = require('fs');
const path = require('path');
const DEFAULTS = {
    firstSampleLines: 100,
    secondSampleLines: 500,
    maxAttempts: 2,
    gutenbergMarker: '*** START OF THE PROJECT GUTENBERG EBOOK',
    modelName: 'gpt-5.6-luna',
    requestTimeoutMs: 300000,
    maxRetries: 2,
    logDirectory: path.join(__dirname, '..', 'logs'),
    promptFile: path.join(__dirname, '..', 'prompts', 'search-start.md'),
    costCsvFile: path.join(__dirname, '..', 'logs', 'token-usage.csv'),
    apiConfigFile: path.join(__dirname, '..', 'config', 'config.local.json'),
    basePath: 'D:\\LolloNewPc\\Sviluppo\\data'
};

function loadConfig() {
    const c = {
        ...DEFAULTS
    };
    if (fs.existsSync(c.apiConfigFile)) Object.assign(c, JSON.parse(fs.readFileSync(c.apiConfigFile, 'utf8')));
    for (const k of ['logDirectory', 'promptFile', 'costCsvFile', 'apiConfigFile']) c[k] = path.resolve(c[k]);
    return c;
}

function loadPrompt(c) {
    if (!fs.existsSync(c.promptFile)) throw new Error(`Prompt file not found: ${c.promptFile}`);
    return fs.readFileSync(c.promptFile, 'utf8').trim();
}

function getApiKey(c) {
    if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
    if (!fs.existsSync(c.apiConfigFile)) return null;
    return JSON.parse(fs.readFileSync(c.apiConfigFile, 'utf8')).apiKey || null;
}
module.exports = {
    loadConfig,
    loadPrompt,
    getApiKey
};