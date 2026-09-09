'use strict';

/**
 * special-words.js
 *
 * Classificazione delle stringhe speciali estratte dagli ebook
 * Project Gutenberg.
 */

const CATEGORY = Object.freeze({
    CLEANABLE: 'cleanable',
    EMPTY: 'empty',
    BULLET: 'bullet',
    AMBIGUOUS: 'ambiguous',
    COMPOUND: 'compound',
    OTHER: 'other'
});

const LETTER_OR_NUMBER_RE = /[\p{L}\p{N}]/u;
const WORD_RE = /^[\p{L}\p{N}]+$/u;
const ONLY_SYMBOLS_RE = /^[^\p{L}\p{N}]+$/u;

// Punteggiatura/caratteri ammessi ai bordi e normalmente eliminabili.
const EDGE_RE =
    /^[\s"'“”‘’«».,;:!?()[\]{}<>*_+=|\\/]+|[\s"'“”‘’«».,;:!?()[\]{}<>*_+=|\\/]+$/gu;

// Elenchi puntati o numerati.
const BULLET_RE =
    /^(?:[-–—*+•◦▪▫‣⁃]|\(?[A-Za-z]\)|\(?\d{1,3}[.)])$/u;

const AMBIGUOUS_EXACT = new Set([
    '(Zoöl.)',
    '(Zoˆl.)',
    '(Zoöl.),',
    '[R.]',
    '[F.,',
    '(return)',
    '(Chem.)',
    '[NL.',
    '(Anat.)',
    '[L.,',
    'Eng.]',
    '(Law)',
    '(Naut.)',
    '[Colloq.]',
    '\\tShak.',
    '&',
    '&c.'
]);

/**
 * Verifica se il valore contiene almeno una lettera o un numero.
 */
function containsLetterOrNumber(value) {
    return typeof value === 'string'
        && LETTER_OR_NUMBER_RE.test(value);
}

/**
 * Verifica se il valore contiene esclusivamente lettere e numeri.
 */
function isNormalWord(value) {
    return typeof value === 'string'
        && WORD_RE.test(value);
}

/**
 * Rimuove caratteri estranei presenti all'inizio o alla fine.
 */
function cleanExtraCharacters(value) {
    if (typeof value !== 'string') {
        return value;
    }

    let result = value.replace(/\t/g, '');

    let previous;

    do {
        previous = result;
        result = result.replace(EDGE_RE, '');
    } while (result !== previous);

    // Apostrofo finale isolato, ad esempio: o’
    result = result.replace(/[’']$/u, '');

    return result;
}

/**
 * True se la stringa contiene esclusivamente simboli.
 */
function isOnlySymbols(value) {
    return typeof value === 'string'
        && value.length > 0
        && ONLY_SYMBOLS_RE.test(value);
}

/**
 * True se la stringa rappresenta un elenco puntato/numerato.
 */
function isBullet(value) {
    if (typeof value !== 'string') {
        return false;
    }

    const token = value.trim();

    if (!token) {
        return false;
    }

    return BULLET_RE.test(token);
}

/**
 * True se il token può essere una nota, abbreviazione
 * o annotazione.
 */
function isAmbiguous(value) {
    if (typeof value !== 'string') {
        return false;
    }

    if (AMBIGUOUS_EXACT.has(value)) {
        return true;
    }

    // Esempi:
    // (Chem.)
    // (Law)
    // [Obs.]
    // [Colloq.]
    if (/^\([^)]{1,40}\)[,.;:!?]?$/.test(value)) {
        return containsLetterOrNumber(value);
    }

    if (/^\[[^\]]{1,40}\][,.;:!?]?$/.test(value)) {
        return containsLetterOrNumber(value);
    }

    return false;
}

/**
 * Restituisce le due interpretazioni di un caso ambiguo:
 *
 * 1. parola ripulita
 * 2. stringa vuota
 */
function getAmbiguousAlternatives(value) {
    if (!isAmbiguous(value)) {
        return [];
    }

    return [
        cleanExtraCharacters(value),
        ''
    ];
}

/*
 * Contrazioni esplicitamente gestite.
 *
 * Ogni elemento dell'array rappresenta una possibile interpretazione.
 */
const CONTRACTIONS = new Map([
    ['i’ll', [['ill'], ['i', 'll']]],
    ["i'll", [['ill'], ['i', 'll']]],

    ['don’t', [['dont'], ['don', 't'], ['do', 'not']]],
    ["don't", [['dont'], ['don', 't'], ['do', 'not']]],

    ['can’t', [['cant'], ['can', 't']]],
    ["can't", [['cant'], ['can', 't']]],

    ['won’t', [['wont'], ['won', 't']]],
    ["won't", [['wont'], ['won', 't']]],

    ['one’s', [['ones'], ['one', 's']]],
    ["one's", [['ones'], ['one', 's']]],

    ['man’s', [['mans'], ['man', 's']]],
    ["man's", [['mans'], ['man', 's']]],

    ['didn’t', [['didnt'], ['didn', 't'], ['did', 'not']]],
    ["didn't", [['didnt'], ['didn', 't'], ['did', 'not']]],

    ['father’s', [['fathers'], ['father', 's']]],
    ["father's", [['fathers'], ['father', 's']]],

    ['king’s', [['kings'], ['king', 's']]],
    ["king's", [['kings'], ['king', 's']]],

    ['it’s', [['its'], ['it', 's']]],
    ["it's", [['its'], ['it', 's']]],

    ['i’m', [['im'], ['i', 'am'], ['i', 'm']]],
    ["i'm", [['im'], ['i', 'am'], ['i', 'm']]],

    ['that’s', [['thats'], ['that', 's']]],
    ["that's", [['thats'], ['that', 's']]],

    ['there’s', [['theres'], ['there', 's']]],
    ["there's", [['theres'], ['there', 's']]],

    ['’tis', [['tis']]],
    ["'tis", [['tis']]]
]);

/**
 * True se il token contiene una contrazione o un apostrofo
 * tra due gruppi di lettere.
 */
function isCompound(value) {
    if (typeof value !== 'string') {
        return false;
    }

    if (CONTRACTIONS.has(value.toLowerCase())) {
        return true;
    }

    return /^[\p{L}]+['’][\p{L}]+$/u.test(value);
}

/**
 * Restituisce le possibili interpretazioni di una parola composta.
 */
function getCompoundAlternatives(value) {
    if (!isCompound(value)) {
        return [];
    }

    const predefined = CONTRACTIONS.get(value.toLowerCase());

    if (predefined) {
        return predefined.map(parts => parts.slice());
    }

    const match = value.match(
        /^([\p{L}]+)['’]([\p{L}]+)$/u
    );

    if (!match) {
        return [];
    }

    return [
        [match[1] + match[2]],
        [match[1], match[2]]
    ];
}

/**
 * Analizza completamente un token.
 */
function analyzeSpecialWord(value) {
    if (typeof value !== 'string') {
        return {
            original: value,
            category: CATEGORY.OTHER,
            cleaned: null,
            alternatives: []
        };
    }

    // L'ordine è importante.

    if (isBullet(value)) {
        return {
            original: value,
            category: CATEGORY.BULLET,
            cleaned: '',
            alternatives: []
        };
    }

    if (isAmbiguous(value)) {
        return {
            original: value,
            category: CATEGORY.AMBIGUOUS,
            cleaned: null,
            alternatives: getAmbiguousAlternatives(value)
        };
    }

    if (isCompound(value)) {
        return {
            original: value,
            category: CATEGORY.COMPOUND,
            cleaned: null,
            alternatives: getCompoundAlternatives(value)
        };
    }

    if (isOnlySymbols(value)) {
        return {
            original: value,
            category: CATEGORY.EMPTY,
            cleaned: '',
            alternatives: []
        };
    }

    const cleaned = cleanExtraCharacters(value);

    if (cleaned !== value && isNormalWord(cleaned)) {
        return {
            original: value,
            category: CATEGORY.CLEANABLE,
            cleaned,
            alternatives: []
        };
    }

    return {
        original: value,
        category: CATEGORY.OTHER,
        cleaned: null,
        alternatives: []
    };
}

/**
 * Restituisce solamente la categoria.
 */
function classifySpecialWord(value) {
    return analyzeSpecialWord(value).category;
}

module.exports = {
    CATEGORY,

    containsLetterOrNumber,
    isNormalWord,

    cleanExtraCharacters,

    isOnlySymbols,
    isBullet,

    isAmbiguous,
    getAmbiguousAlternatives,

    isCompound,
    getCompoundAlternatives,

    classifySpecialWord,
    analyzeSpecialWord
};