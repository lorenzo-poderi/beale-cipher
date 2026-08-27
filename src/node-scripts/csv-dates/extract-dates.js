const fs = require('fs');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
    console.error('Utilizzo:');
    console.error('node extract-dates.js input.csv output.csv');
    process.exit(1);
}

const MIN_YEAR = 1000;
const MAX_YEAR = 3000;

// Cerca sequenze di esattamente 4 cifre.
// I controlli sui caratteri circostanti evitano di estrarre
// quattro cifre da numeri più lunghi.
const yearRegex = /(?<!\d)(\d{4})(?!\d)/g;

function extractYears(value) {
    if (!value) {
        return [];
    }

    const years = [];
    let match;

    while ((match = yearRegex.exec(value)) !== null) {
        const year = Number(match[1]);

        if (year >= MIN_YEAR && year <= MAX_YEAR) {
            years.push(year);
        }
    }

    // Necessario quando si riutilizza una RegExp globale
    yearRegex.lastIndex = 0;

    return years;
}

const parser = fs.createReadStream(inputFile, {
    encoding: 'utf8'
}).pipe(
    parse({
        columns: true,
        bom: true,
        relax_quotes: true,
        skip_empty_lines: true
    })
);

const output = fs.createWriteStream(outputFile, {
    encoding: 'utf8'
});

const stringifier = stringify({
    header: true
});

stringifier.pipe(output);

let rowCount = 0;

parser.on('data', (row) => {
    const years = [
        ...extractYears(row.Authors),
        ...extractYears(row.Subjects)
    ];

    if (years.length > 0) {
        row.MinDate = Math.min(...years);
        row.MaxDate = Math.max(...years);
    } else {
        row.MinDate = '';
        row.MaxDate = '';
    }

    stringifier.write(row);

    rowCount++;

    if (rowCount % 10000 === 0) {
        console.log(`Elaborate ${rowCount} righe...`);
    }
});

parser.on('error', (err) => {
    console.error('Errore durante la lettura del CSV:');
    console.error(err.message);

    stringifier.end();
    process.exitCode = 1;
});

parser.on('end', () => {
    stringifier.end();
});

stringifier.on('error', (err) => {
    console.error('Errore durante la scrittura del CSV:');
    console.error(err.message);

    process.exitCode = 1;
});

output.on('finish', () => {
    console.log(`Completato. Righe elaborate: ${rowCount}`);
    console.log(`File generato: ${outputFile}`);
});