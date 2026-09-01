/**
 * Analizza un testo e individua le possibili suddivisioni in parole.
 *
 * Non cerca di scegliere una sola interpretazione:
 * mantiene le ambiguità che potrebbero essere significative
 * per successive elaborazioni/cifrari.
 *
 * @param {string} text
 * @returns {Object}
 */
function analyzeWords(text) {
    if (!text || typeof text !== "string") {
        return {
            words: [],
            ambiguous: [],
            count: 0
        };
    }

    // Normalizzazione minima degli spazi.
    const tokens = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split(/\s+/)
        .filter(token => token.length > 0);

    const words = [];
    const ambiguous = [];

    for (const token of tokens) {
        const result = analyzeToken(token);

        if (result.ignore) {
            continue;
        }

        words.push(result);

        if (result.ambiguous) {
            ambiguous.push(result);
        }
    }

    return {
        words,
        ambiguous,
        count: words.length
    };
}


/**
 * Analizza un singolo token.
 *
 * @param {string} token
 * @returns {Object}
 */
function analyzeToken(token) {

    // ---------------------------------------------------------
    // 1. Caratteri isolati che sicuramente NON sono parole
    // ---------------------------------------------------------

    if (isIsolatedCharacter(token)) {
        return {
            original: token,
            ignore: true,
            ambiguous: false,
            possibilities: []
        };
    }


    // ---------------------------------------------------------
    // 2. Elenchi numerati
    //
    // Esempi:
    // 1)
    // 2.
    // 1-
    // a)
    // b.
    // ---------------------------------------------------------

    if (isListMarker(token)) {
        return {
            original: token,
            ignore: false,
            ambiguous: true,
            type: "list-marker",
            possibilities: [
                [token],
                []
            ]
        };
    }


    // ---------------------------------------------------------
    // 3. Parole composte con trattino
    //
    // self-contained
    // well-known
    // nineteenth-century
    // ---------------------------------------------------------

    if (isHyphenatedWord(token)) {

        const parts = token.split("-");

        // Caso particolare: più di due parti.
        if (parts.length >= 3) {
            return {
                original: token,
                ignore: false,
                ambiguous: true,
                type: "hyphenated",
                possibilities: [
                    [token],
                    parts
                ]
            };
        }

        return {
            original: token,
            ignore: false,
            ambiguous: true,
            type: "hyphenated",
            possibilities: [
                [token],
                parts
            ]
        };
    }


    // ---------------------------------------------------------
    // 4. Apostrofi
    //
    // don't
    // John's
    // o'clock
    // ---------------------------------------------------------

    if (isApostropheWord(token)) {
        return {
            original: token,
            ignore: false,
            ambiguous: true,
            type: "apostrophe",
            possibilities: [
                [token],
                splitApostrophe(token)
            ]
        };
    }


    // ---------------------------------------------------------
    // 5. Token normale
    // ---------------------------------------------------------

    return {
        original: token,
        ignore: false,
        ambiguous: false,
        type: "word",
        possibilities: [
            [token]
        ]
    };
}


/**
 * Determina se il token è costituito solamente da
 * un carattere isolato/simbolo.
 *
 * Esempi ignorati:
 *
 * *
 * -
 * +
 * =
 * |
 * ~
 */
function isIsolatedCharacter(token) {

    if (token.length !== 1) {
        return false;
    }

    return !/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/.test(token);
}


/**
 * Determina se il token è un indicatore di elenco.
 *
 * Esempi:
 *
 * 1)
 * 2.
 * 10-
 * a)
 * b.
 */
function isListMarker(token) {

    return /^(?:\d+|[A-Za-z])[.)-]$/.test(token);
}


/**
 * Determina se il token contiene un trattino
 * che potrebbe separare due parole.
 *
 * Non consideriamo trattini all'inizio o alla fine.
 */
function isHyphenatedWord(token) {

    return /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:-[A-Za-zÀ-ÖØ-öø-ÿ]+)+$/.test(token);
}


/**
 * Determina se una parola contiene un apostrofo.
 *
 * Gestisce sia:
 *
 * don't
 * John's
 * o'clock
 *
 * sia gli apostrofi tipografici:
 *
 * don’t
 * John’s
 */
function isApostropheWord(token) {

    return /^[A-Za-zÀ-ÖØ-öø-ÿ]+['’][A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(token);
}

function endsWithSpecialCharWord(token) {
    return /^[A-Za-zÀ-ÖØ-öø-ÿ]+[',.]?$/.test(token);
}


/**
 * Divide una parola contenente apostrofo.
 */
function splitApostrophe(token) {

    return token.split(/['’]/);
}

function isAlphanumeric(text) { if (!text || typeof text !== "string") { return false; } return /^[A-Za-zÀ-ÖØ-öø-ÿ0-9]+$/.test(text); }


module.exports = {
    analyzeWords,
    analyzeToken,
    isAlphanumeric,
    isIsolatedCharacter,
    isListMarker,
    isHyphenatedWord,
    isApostropheWord,
    splitApostrophe,
    endsWithSpecialCharWord
};
