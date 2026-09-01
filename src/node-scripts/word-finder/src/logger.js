'use strict';
const fs = require('fs');
const path = require('path');

function createLogger(c) {
    fs.mkdirSync(c.logDirectory, {
        recursive: true
    });

    //const file = path.join(c.logDirectory, `log-${id}.txt`);
    const file = path.join(c.logDirectory, `log.txt`);

    return {
        file,
        write(message) {
            const d = new Date();
            const ts = `[${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} - ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}]`;
            const line = `${ts} ${message}\n`;
            fs.appendFileSync(file, line);
            console.log(line.trim());
        }
    };
}

function appendTokenUsage(c, row) {
    fs.mkdirSync(path.dirname(c.costCsvFile), {
        recursive: true
    });
    if (!fs.existsSync(c.costCsvFile)) fs.writeFileSync(c.costCsvFile, 'id;status;token input;token output\n');
    fs.appendFileSync(c.costCsvFile, `${row.id};${row.status};${row.tokenInput??''};${row.tokenOutput??''}\n`);
}
module.exports = {
    createLogger,
    appendTokenUsage
};