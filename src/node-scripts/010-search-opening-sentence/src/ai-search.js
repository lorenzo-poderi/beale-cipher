'use strict';
const https = require('https');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function post(apiKey, body, timeout) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = https.request({
            hostname: 'api.openai.com',
            path: '/v1/responses',
            method: 'POST',
            timeout,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, res => {
            let out = '';
            res.setEncoding('utf8');
            res.on('data', x => out += x);
            res.on('end', () => {
                let j;
                try {
                    j = JSON.parse(out)
                } catch (e) {
                    return reject(new Error(`Invalid OpenAI JSON (HTTP ${res.statusCode})`))
                }
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    const e = new Error(`OpenAI API error: ${j?.error?.message||`HTTP ${res.statusCode}`}`);
                    e.statusCode = res.statusCode;
                    return reject(e)
                }
                resolve(j)
            })
        });
        req.on('timeout', () => req.destroy(new Error(`OpenAI request timeout after ${timeout} ms.`)));
        req.on('error', reject);
        req.end(data);
    });
}

function outputText(r) {
    if (typeof r.output_text === 'string') return r.output_text;
    for (const i of r.output || [])
        for (const c of i.content || [])
            if (c.type === 'output_text' && typeof c.text === 'string') return c.text;
    return null;
}

function validate(r) {
    if (!r || !['Done', 'Not found'].includes(r.status)) throw new Error('Invalid AI status.');
    if (r.status === 'Not found') return;
    if (!Number.isInteger(r.firstSentenceLine) || r.firstSentenceLine < 0) throw new Error('Invalid firstSentenceLine.');
    if (typeof r.firstSentence !== 'string' || !r.firstSentence) throw new Error('Invalid firstSentence.');
    if (typeof r.confidence !== 'number' || r.confidence < 0 || r.confidence > 1) throw new Error('Invalid confidence.');
}

function verify(r, lines) {
    if (r.status !== 'Done') return;
    if (r.firstSentenceLine >= lines.length || lines[r.firstSentenceLine] !== r.firstSentence) throw new Error('firstSentence does not correspond exactly to firstSentenceLine.');
}

function simulate(id, lines) {
    const a = lines.map((line, index) => ({
        line,
        index
    })).filter(x => x.line.trim());
    if (!a.length) return {
        id,
        status: 'Not found',
        firstSentenceLine: null,
        firstSentence: null,
        confidence: null,
        tokenInput: 0,
        tokenOutput: 0
    };
    const x = a[Math.floor(Math.random() * a.length)];
    return {
        id,
        status: 'Done',
        firstSentenceLine: x.index,
        firstSentence: x.line,
        confidence: .5,
        tokenInput: 0,
        tokenOutput: 0
    };
}
async function searchByAI({
    id,
    lines,
    modelName,
    prompt,
    apiKey,
    config,
    logger,
    simulate = false
}) {
    if (simulate) return simulateResult(id, lines, logger);
    if (!apiKey) throw new Error('OpenAI API key not configured.');
    const text = lines.map((x, i) => `${i}: ${x}`).join('\n');
    const schema = {
        type: 'object',
        additionalProperties: false,
        properties: {
            status: {
                type: 'string',
                enum: ['Done', 'Not found']
            },
            firstSentenceLine: {
                type: ['integer', 'null']
            },
            firstSentence: {
                type: ['string', 'null']
            },
            confidence: {
                type: ['number', 'null']
            }
        },
        required: ['status', 'firstSentenceLine', 'firstSentence', 'confidence']
    };
    const body = {
        model: modelName,
        instructions: prompt,
        input: 'Analyze the following Project Gutenberg excerpt. Line numbers are 0-based. Return the exact physical line.\n\n' + text,
        text: {
            format: {
                type: 'json_schema',
                name: 'ebook_start_detection',
                strict: true,
                schema
            }
        }
    };
    let response, last;
    for (let n = 0; n <= config.maxRetries; n++) {
        try {
            logger.write(`Calling API with model ${modelName} (attempt ${n+1})`);
            response = await post(apiKey, body, config.requestTimeoutMs);
            break
        } catch (e) {
            last = e;
            logger.write(`OpenAI API error: ${e.message}`);
            if (n >= config.maxRetries || !(e.statusCode === 408 || e.statusCode === 409 || e.statusCode === 429 || e.statusCode >= 500)) throw e;
            await sleep(2 ** n * 1000);
        }
    }
    if (!response) throw last || new Error('No OpenAI response.');
    const raw = outputText(response);
    if (!raw) throw new Error('OpenAI response has no output text.');
    let ai;
    try {
        ai = JSON.parse(raw)
    } catch (e) {
        throw new Error(`AI output is not valid JSON: ${e.message}`)
    }
    const tokenInput = response.usage?.input_tokens || 0,
        tokenOutput = response.usage?.output_tokens || 0;
    logger.write(`Token (input): ${tokenInput}`);
    logger.write(`Token (output): ${tokenOutput}`);
    validate(ai);
    const result = {
        id,
        status: ai.status,
        firstSentenceLine: ai.firstSentenceLine,
        firstSentence: ai.firstSentence,
        confidence: ai.confidence,
        tokenInput,
        tokenOutput
    };
    verify(result, lines);
    if (result.status === 'Done') {
        logger.write(`First sentence found: "${result.firstSentence}"`);
        logger.write(`Confidence: ${result.confidence}`);
        logger.write('Verification: OK');
    } else logger.write('First sentence not found.');
    return result;
}

function simulateResult(id, lines, logger) {
    logger.write('Simulation mode enabled. No API call will be made.');
    return simulate(id, lines);
}
module.exports = {
    searchByAI,
    validate,
    verify
};