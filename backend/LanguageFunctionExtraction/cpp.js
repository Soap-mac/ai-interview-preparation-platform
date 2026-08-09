function extractCppBody(code) {
    const match = code.match(/\{([\s\S]*)\}/);
    if (!match) throw new Error("Invalid C++ function");
    return match[1].trim();
}

module.exports = extractCppBody