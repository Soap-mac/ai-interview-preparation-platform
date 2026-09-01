const fetch = require("node-fetch");

const PISTON_URL = process.env.PISTON_URL;

const LANGUAGE_VERSIONS = {
    python: "3.12.0",
    java: "15.0.2",
    cpp: "10.2.0",
    javascript: "18.15.0",
};

const FILE_NAMES = {
    python: "main.py",
    java: "Solution.java",
    cpp: "main.cpp",
    javascript: "main.js",
};

const executeOnPiston = async ({ sourceCode, language, stdin }) => {
    const response = await fetch(`${PISTON_URL}/api/v2/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            language,
            version: LANGUAGE_VERSIONS[language],
            files: [{ name: FILE_NAMES[language], content: sourceCode }],
            stdin: stdin || "",
        }),
    });

    const data = await response.json();

    if (data.compile && data.compile.stderr) {
        const err = new Error(`Compile error: ${data.compile.stderr}`);
        err.stderr = data.compile.stderr;
        throw err;
    }
    if (data.run && data.run.stderr) {
        const err = new Error(`Runtime error: ${data.run.stderr}`);
        err.stderr = data.run.stderr;
        throw err;
    }
    if (!data.run || data.run.stdout === undefined || data.run.stdout.trim() === "") {
        const err = new Error("Program produced empty output");
        err.stderr = data.run?.stderr || "(no stderr — program ran but printed nothing)";
        throw err;
    }
    return data.run.stdout.trim();
};

// Used by generateDSA.js — raw Python reference solution, real stdin
const runOnPiston = async (sourceCode, language, stdin) => {
    return executeOnPiston({ sourceCode, language, stdin });
};

// Used by compilers/*.js — driver+user code, INPUT_STRING replacement, no stdin
const runDriverCode = async (finalCode, language, inputStr) => {
    const injectedCode = finalCode.replace(
        /INPUT_STRING/g,
        JSON.stringify((inputStr || "").trim())
    );
    return executeOnPiston({ sourceCode: injectedCode, language, stdin: "" });
};

module.exports = { runOnPiston, runDriverCode, LANGUAGE_VERSIONS };