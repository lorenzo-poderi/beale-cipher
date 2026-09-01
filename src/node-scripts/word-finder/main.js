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

    const listOfBooks = getListOfBooks(config);

    const args = process.argv.slice(2);

    /*
     * Parametri comuni utilizzati dall'orchestrator.
     */
    const common = {

        basePath: config.basePath,
        listOfBooks: listOfBooks,
        config,

        loggerFactory: currentId =>
            createLogger(currentId, config)
    };


    let result;

    const logger = createLogger(config);

    // Rielaboro tutti gli id disponibili
    let ids = listOfBooks.map(x => x.id);

    for (let i = 0; i < ids.length; i += 10) {

        const group = ids.slice(i, i + 10);

        // Elabora il gruppo

        result =
            await processIds({
                ...common,

                ids: group,
                logger
            });


        logger.write("update results...");

        await updateResults(
            config.listOfSpecialWordsFile,
            result
        );

    }


    // /*
    //  * Converte il risultato in un array.
    //  *
    //  * processIds() restituisce un array anche quando
    //  * viene elaborato un solo ID, ma manteniamo questa
    //  * gestione per sicurezza.
    //  */
    // const results = Array.isArray(result)
    //     ? result
    //     : [result];

    // // Riordino tutti i risultati sulla base del conteggio delle occorrenze, dal più alto al più basso.
    // const sortedResults = results.sort((a, b) => b.count - a.count);




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