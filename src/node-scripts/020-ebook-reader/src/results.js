'use strict';

const fs = require('fs');


/**
 * Carica i risultati dal file JSON.
 *
 * Se il file non esiste ancora, restituisce un array vuoto.
 */
async function loadResults(resultsFile) {

    try {

        const content = await fs.promises.readFile(
            resultsFile,
            'utf8'
        );

        const results = JSON.parse(content);

        if (!Array.isArray(results)) {
            throw new Error(
                `Il file ${resultsFile} deve contenere un array JSON.`
            );
        }

        return results;

    } catch (error) {

        // Il file non esiste ancora.
        if (error.code === 'ENOENT') {
            return [];
        }

        throw error;
    }
}


/**
 * Salva i risultati nel file JSON.
 *
 * Prima del salvataggio gli elementi vengono ordinati
 * per ID crescente.
 */
async function saveResults(resultsFile, results) {

    results.sort((a, b) => a.id - b.id);

    const content = JSON.stringify(
        results,
        null,
        2
    );

    await fs.promises.writeFile(
        resultsFile,
        content,
        'utf8'
    );
}


/**
 * Determina se un nuovo risultato può sostituire
 * un risultato già presente.
 *
 * Regole:
 *
 * - Done sostituisce sempre il risultato precedente.
 * - Not found sostituisce solamente Error.
 * - Error sostituisce solamente Error.
 */
function canReplace(existingResult, newResult) {

    if (newResult.status === 'Done') {
        return true;
    }

    if (newResult.status === 'Not found') {
        return existingResult.status === 'Error';
    }

    if (newResult.status === 'Error') {
        return existingResult.status === 'Error';
    }

    return false;
}


/**
 * Aggiorna il file dei risultati con una serie
 * di nuovi risultati.
 *
 * Per ogni ID:
 *
 * - se non esiste, viene aggiunto;
 * - se esiste e il nuovo risultato può sostituirlo,
 *   viene sostituito;
 * - altrimenti il risultato precedente viene mantenuto.
 */
async function updateResults(resultsFile, newResults) {

    const existingResults = await loadResults(resultsFile);

    for (const newResult of newResults) {

        const existingIndex = existingResults.findIndex(
            result => result.id === newResult.id
        );


        /*
         * L'ID non è ancora presente.
         *
         * Aggiungiamo il risultato indipendentemente
         * dal suo status.
         */
        if (existingIndex === -1) {

            existingResults.push(newResult);

            continue;
        }


        const existingResult = existingResults[existingIndex];


        /*
         * L'ID esiste già.
         *
         * Verifichiamo se il nuovo risultato può
         * sostituire quello precedente.
         */
        if (canReplace(existingResult, newResult)) {

            existingResults[existingIndex] = newResult;
        }
    }


    /*
     * Salva tutti i risultati ordinati per ID.
     */
    await saveResults(
        resultsFile,
        existingResults
    );
}


module.exports = {
    loadResults,
    saveResults,
    updateResults
};
