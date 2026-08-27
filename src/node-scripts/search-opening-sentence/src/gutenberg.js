'use strict';
const fs = require('fs');
async function readBook(filePath) {
    return (await fs.promises.readFile(filePath, 'utf8')).split(/\r?\n/);
}

function findMarker(lines, marker) {
    return lines.findIndex(x => x.includes(marker));
}

function extractLines(lines, markerLine, count) {
    const start = markerLine + 1,
        end = Math.min(start + count, lines.length);
    return {
        lines: lines.slice(start, end),
        startLine: start,
        endLine: end - 1
    };
}
module.exports = {
    readBook,
    findMarker,
    extractLines
};