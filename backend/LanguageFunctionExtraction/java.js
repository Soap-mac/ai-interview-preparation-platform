function extractJavaBody(code) {
    const match = code.match(/\{([\s\S]*)\}/);
    if (!match) throw new Error("Invalid Java function");
    return match[1].trim();
}

module.exports = extractJavaBody;