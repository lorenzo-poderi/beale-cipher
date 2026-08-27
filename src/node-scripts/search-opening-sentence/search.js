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

const {
    updateResults
} = require('./src/results');


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


async function main() {

    const config = loadConfig();
    const prompt = loadPrompt(config);
    const apiKey = getApiKey(config);

    const args = process.argv.slice(2);


    /*
     * Parametri opzionali.
     */
    const simulate = args.includes('--simulate');

    const modelName =
        getArgument(args, '--model')
        || config.modelName;


    /*
     * Parametri di elaborazione.
     */
    const id = getArgument(args, '--id');
    const jsonFile = getArgument(args, '--json');
    const resultsFile = getArgument(args, '--results');


    /*
     * Il file dei risultati è obbligatorio.
     */
    if (!resultsFile) {

        throw new Error(
            'È necessario specificare il file dei risultati ' +
            'con il parametro --results <file.json>.'
        );
    }


    /*
     * Deve essere specificato uno solo dei due
     * metodi di selezione degli ID.
     */
    if (!id && !jsonFile) {

        throw new Error(
            'È necessario specificare --id <id> oppure ' +
            '--json <file.json>.'
        );
    }


    if (id && jsonFile) {

        throw new Error(
            'Non è possibile utilizzare contemporaneamente ' +
            '--id e --json.'
        );
    }


    /*
     * Risolve i percorsi rispetto alla directory
     * dalla quale viene eseguito il programma.
     */
    const resolvedResultsFile = path.resolve(
        resultsFile
    );


    /*
     * Parametri comuni utilizzati dall'orchestrator.
     */
    const common = {

        basePath: config.basePath,

        config,

        searchByAI,

        prompt,

        apiKey,

        modelName,

        simulate,

        loggerFactory: currentId =>
            createLogger(currentId, config)
    };


    let result;


    /*
     * Elaborazione di un singolo ID.
     *
     * Esempio:
     *
     * node search.js
     *     --id 123
     *     --results ./data/results.json
     */
    if (id) {

        result = (
            await processIds({
                ...common,

                ids: [
                    Number(id)
                ]
            })
        )[0];
    }


    /*
     * Elaborazione degli ID contenuti in un file JSON.
     *
     * Esempio:
     *
     * node search.js
     *     --json books.json
     *     --results ./data/results.json
     */
    else {

        result = await processJsonFile({
            ...common,

            jsonFile: path.resolve(jsonFile)
        });
    }


    /*
     * Converte il risultato in un array.
     *
     * processIds() restituisce un array anche quando
     * viene elaborato un solo ID, ma manteniamo questa
     * gestione per sicurezza.
     */
    const results = Array.isArray(result)
        ? result
        : [result];


    /*
     * Aggiorna results.json.
     *
     * Tutta la logica relativa agli status e alla
     * sostituzione dei risultati è contenuta in results.js.
     */
    await updateResults(
        resolvedResultsFile,
        results
    );


    /*
     * Mantiene la stampa del risultato a video.
     */
    console.log(
        JSON.stringify(
            result,
            null,
            2
        )
    );
}


main().catch(error => {

    console.error(
        `ERROR: ${error.message}`
    );

    process.exitCode = 1;
});