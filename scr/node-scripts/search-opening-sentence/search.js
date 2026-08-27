'use strict';
const path = require('path');
const {
    loadConfig,
    loadPrompt,
    getApiKey
} = require('./src/config');
const {
    createLogger
} = require('./src/logger');
const {
    searchByAI
} = require('./src/ai-search');
const {
    processIds,
    processJsonFile
} = require('./src/orchestrator');

async function main() {

    const config = loadConfig(),
        prompt = loadPrompt(config),
        apiKey = getApiKey(config),
        args = process.argv.slice(2);

    const simulate = args.includes('--simulate');

    const mi = args.indexOf('--model');

    const modelName = mi >= 0 ? args[mi + 1] : config.modelName;

    const ii = args.indexOf('--id'),
        ji = args.indexOf('--json');

    const common = {
        basePath: config.basePath,
        config,
        searchByAI,
        prompt,
        apiKey,
        modelName,
        simulate,
        loggerFactory: id => createLogger(id, config)
    };

    let result;

    if (ii >= 0) {
        result = (await processIds({
            ...common,
            ids: [Number(args[ii + 1])]
        }))[0]
    } else if (ji >= 0) {
        result = await processJsonFile({
            ...common,
            jsonFile: path.resolve(args[ji + 1])
        })
    } else throw new Error('Usage: node search.js --id <id> [--model <model>] [--simulate] OR node search.js --json <file.json> [--model <model>] [--simulate]');
    
    
    console.log(JSON.stringify(result, null, 2));
}

main().catch(e => {
    console.error(`ERROR: ${e.message}`);
    process.exitCode = 1;
});