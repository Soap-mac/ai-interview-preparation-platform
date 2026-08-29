const groq = require("../utils/aiClient");

const checkTestCases = async (code, language, testcases) => {
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

                const stdout = response.choices[0].message.content.trim();
                const expected = tc.expected.trim();
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

        console.log(results);
        console.log(allPassed);
        console.log(passedCount);

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

const code = `n, target = map(int, input().split())
nums = list(map(int, input().split()))

seen = {}
for i, num in enumerate(nums):
    diff = target - num
    if diff in seen:
        print(seen[diff], i)
        break
    seen[num] = i`;

const language = "python";
const testcases = [
    {
        "input": "4 9\n2 7 11 15",
        "expected": "0 1"
    },
    {
        "input": "3 6\n3 2 4",
        "expected": "1 2"
    },
    {
        "input": "2 6\n3 3",
        "expected": "0 1"
    },
    {
        "input": "5 0\n-3 4 3 90 -1",
        "expected": "0 2"
    },
    {
        "input": "6 100\n10 20 30 40 50 60",
        "expected": "3 5"
    }
];

checkTestCases(code, language, testcases);

module.exports = checkTestCases;