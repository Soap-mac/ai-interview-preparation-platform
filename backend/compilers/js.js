const fetch = require("node-fetch");

async function runJS(code, input) {
    const injectedCode = code.replace(
        'INPUT_STRING',
        JSON.stringify(input.trim())
    );
    console.log(process.env.GLOT_TOKEN);
    console.log("Injected code", injectedCode);

    const response = await fetch("https://glot.io/api/run/javascript/latest", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${process.env.GLOT_TOKEN}`,
        },
        body: JSON.stringify({
            files: [{ name: "main.js", content: injectedCode }],
        }),
    });

    const data = await response.json();

    if (data.stderr) throw new Error(data.stderr);
    if (data.error) throw new Error(data.error);
    return (data.stdout || "").trim();
}

module.exports = runJS;