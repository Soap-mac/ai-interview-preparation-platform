const coercePrimitive = (tok) => {
    if (tok === "true") return true;
    if (tok === "false") return false;
    if (tok === "null") return null;
    if (/^-?\d+$/.test(tok)) return parseInt(tok, 10);
    if (/^-?\d*\.\d+$/.test(tok)) return parseFloat(tok);
    return tok.replace(/^"(.*)"$/, '$1');
};

const splitTopLevel = (str, delim) => {
    const result = [];
    let depth = 0, current = '';
    for (const ch of str) {
        if (ch === '[' || ch === '{') depth++;
        if (ch === ']' || ch === '}') depth--;
        if (ch === delim && depth === 0) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    if (current.trim() !== '') result.push(current);
    return result;
};

const parseValue = (raw) => {
    if (raw === null || raw === undefined) return null;
    let s = String(raw).trim();
    if (s === "") return null;

    s = s.replace(/\.\.\.\(\d+\)\s*more\s*items?/gi, '');

    const jsonCandidate = s.replace(/'/g, '"');
    try {
        return JSON.parse(jsonCandidate);
    } catch {
        // not valid JSON, fall through
    }

    if (/^\[.*\]$/.test(s)) {
        const inner = s.slice(1, -1);
        return splitTopLevel(inner, ',').map(p => parseValue(p.trim()));
    }

    const tokens = s.split(/[\s,]+/).filter(Boolean);
    if (tokens.length > 1) {
        return tokens.map(coercePrimitive);
    }
    return coercePrimitive(s);
};

const deepEqual = (a, b) => {
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((v, i) => deepEqual(v, b[i]));
    }
    if (typeof a === 'number' && typeof b === 'number') {
        return Math.abs(a - b) < 1e-9;
    }
    return a === b;
};

module.exports = { parseValue, deepEqual };