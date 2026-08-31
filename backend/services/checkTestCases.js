
const groq = require("../utils/aiClient");

const checkTestCases = async (code, language, testcases) => {
    if (!Array.isArray(testcases) || testcases.length === 0) {
        return { allPassed: false, passedCount: 0, totalCount: 0, results: [] };
    }

    try {
        const results = await Promise.all(
            testcases.map(async (tc, index) => {
                const response = await groq.chat.completions.create({
                    model: "openai/gpt-oss-20b",
                    messages: [
                        {
                            role: "system",
                            content: `You are a code execution engine.
When given code and input, simulate running it and return ONLY the exact output the code would produce.
Do not explain anything. Do not add any extra text. Do not add any markdown formatting.
Just return the raw output exactly as the program would print it.`,
                        },
                        {
                            role: "user",
                            content: `Language: ${language}
Input (stdin):
${tc.input}

Code:
${code}`,
                        },
                    ],
                    temperature: 0,
                });

                const stdout = (response?.choices?.[0]?.message?.content || "").trim();
                const expected = (tc.expected || "").trim();
                const passed = stdout === expected;

                return {
                    testcase: index + 1,
                    input: tc.input,
                    expected,
                    stdout,
                    passed,
                };
            })
        );

        const allPassed = results.every((r) => r.passed);
        const passedCount = results.filter((r) => r.passed).length;

        return {
            allPassed,
            passedCount,
            totalCount: testcases.length,
            results,
        };
    } catch (error) {
        console.error("Test case checking failed:", error);
        throw new Error("Failed to check test cases");
    }
};

module.exports = checkTestCases;