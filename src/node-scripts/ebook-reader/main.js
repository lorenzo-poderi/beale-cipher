'use strict';

const path = require('path');

const {
    loadConfig,
    getListOfResults,
    getListOfBooks,
    getCipher1,
    getCipher2,
    getCipher3,
} = require('./src/config');

const {
    createLogger
} = require('./src/logger');

const {
    processIds,
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
    const listOfResults = getListOfResults(config);

    const args = process.argv.slice(2);


    /*
     * Parametri opzionali.
     */
    const simulate = args.includes('--simulate');

    /*
     * Parametri di elaborazione.
     */
    const id = getArgument(args, '--id');

    // if (!id) {

    //     throw new Error(
    //         'È necessario specificare --id <id> oppure ' +
    //         '--json <file.json>.'
    //     );
    // }

    /*
     * Parametri comuni utilizzati dall'orchestrator.
     */
    const common = {

        basePath: config.basePath,
        listOfResults: listOfResults,
        cipher1: getCipher1(config),
        cipher2: getCipher2(config),
        cipher3: getCipher3(config),
        config,
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
    else
    {
        // Rielaboro tutti gli id disponibili
        let books = getListOfBooks(config);
        let ids = books.map(x => x.id);

        result = 
            await processIds({
                ...common,

                ids: ids
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
        config.listOfFirstLettersFile,
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