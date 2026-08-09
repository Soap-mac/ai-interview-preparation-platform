function extractPythonBody(code) {
    const lines = code.split("\n").slice(1);
    return lines.map(line => line.replace(/^ {4}/, "")).join("\n");
}

module.exports = extractPythonBody;