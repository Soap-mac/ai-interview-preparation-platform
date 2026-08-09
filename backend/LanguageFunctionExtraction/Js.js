function extractJSBody(code) {
    const match = code.match(/function\s+solve\s*\([^)]*\)\s*{([\s\S]*)}/);
    if (!match) throw new Error("Invalid JS function");
    return match[1].trim();
}

module.exports = extractJSBody;