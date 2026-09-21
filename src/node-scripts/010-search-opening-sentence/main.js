"use strict";

const path = require("path");

const {
  loadConfig,
  getApiKey,
  getArgument,
} = require("../001-common-files/src/config");

const { createLogger } = require("../001-common-files/src/logger");

const { processIds, processJsonFile } = require("./src/orchestrator");

const { updateResults } = require("./src/results");

async function main() {
  // Percorso opzionale del file di configurazione locale.
  const localConfigFile = path.join(__dirname, "config", "config.local.json");

  // Caricamento configurazione
  const config = loadConfig(localConfigFile);

  // Percorso assoluto del file dei risultati
  const resultsFile = path.isAbsolute(config.listOfFirstSentencesFile)
    ? config.listOfFirstSentencesFile
    : path.join(config.generatedPath, config.listOfFirstSentencesFile);

  // Lettura parametri
  const args = process.argv.slice(2);
  const simulate = args.includes("--simulate");
  config.modelName = getArgument(args, "--model") || config.modelName;

  const id = getArgument(args, "--id");
  const jsonFile = getArgument(args, "--json");

  // Controllo parametri
  if (!id && !jsonFile) {
    throw new Error(
      "È necessario specificare --id <id> oppure " + "--json <file.json>.",
    );
  }

  if (id && jsonFile) {
    throw new Error(
      "Non è possibile utilizzare contemporaneamente " + "--id e --json.",
    );
  }

  /*
   * Risolve i percorsi rispetto alla directory
   * dalla quale viene eseguito il programma.
   */
  const resolvedResultsFile = path.resolve(resultsFile);

  /*
   * Parametri comuni utilizzati dall'orchestrator.
   */
  const common = {
    config,
    simulate,
    loggerFactory: (currentId) => createLogger(currentId, config),
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
    console.log(`Processing single ID: ${id}`);
    const ids = [Number(id)];

    // Elaborazione degli ID singoli
    const processedResults = await processIds({
      ...common,
      ids: ids,
    });

    // Prende il primo risultato poiché stiamo elaborando un singolo ID.
    result = processedResults[0];
  } else {
    // Elaborazione degli ID contenuti in un file JSON.
    console.log(`Processing JSON file: ${jsonFile}`);

    result = await processJsonFile({
      ...common,
      jsonFile: path.resolve(jsonFile),
    });
  }

  /*
   * Converte il risultato in un array.
   *
   * processIds() restituisce un array anche quando
   * viene elaborato un solo ID, ma manteniamo questa
   * gestione per sicurezza.
   */
  const results = Array.isArray(result) ? result : [result];

  /*
   * Aggiorna results.json.
   *
   * Tutta la logica relativa agli status e alla
   * sostituzione dei risultati è contenuta in results.js.
   */
  await updateResults(resolvedResultsFile, results);

  /*
   * Mantiene la stampa del risultato a video.
   */
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);

  process.exitCode = 1;
});
