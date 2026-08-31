const groq = require("../utils/aiClient");
const fetch = require("node-fetch");
const { runOnPiston } = require("../utils/pistonRunner");

const TOPICS = [
  "Sliding Window",
  "Binary Search",
  "Dynamic Programming",
  "Backtracking",
  "Heaps/Priority Queues",
  "Greedy Algorithms",
  "Bit Manipulation",
  "Two Pointers",
  "Prefix Sum",
  "Sorting"
];

const unescapeNewlines = (str) => {
  if (typeof str !== "string") return str;
  return str.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
};

const fixJavaRegexEscaping = (javaCode) => {
  if (!javaCode) return javaCode;
  return javaCode.replace(/"\\s\+"/g, '"\\\\s+"');
};

const getTrueExpectedOutput = async (pythonCode, inputStr) => {
  return runOnPiston(pythonCode, "python", (inputStr || "").trim());
};

const fixReferenceSolution = async (brokenSolution, stderr, topic, difficulty) => {
  console.log("  → Asking AI to fix broken reference solution...");
  const res = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    max_tokens: 4500,
    messages: [
      { role: "system", content: "Return ONLY valid JSON. No markdown." },
      {
        role: "user",
        content: `
You are a Python expert. The following Python reference solution for a ${difficulty} ${topic} DSA problem is INCORRECT — either it crashes, or it produces the wrong output compared to a known-correct expected value.

BROKEN SOLUTION:
\`\`\`python
${brokenSolution}
\`\`\`

PROBLEM WITH THIS SOLUTION:
${stderr}

Fix the solution so it:
1. Reads input using: data = sys.stdin.read().split()
2. Computes the CORRECT output for the problem (re-derive the correct algorithm/logic if the previous logic was wrong, don't just fix syntax)
3. Prints ONLY the final result
4. Has no syntax or runtime errors
5. Uses actual newlines and 4-space indentation (NO semicolons)

Return ONLY this JSON:
{ "referenceSolution": "fixed python3 code here" }
        `.trim()
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "fixed_solution",
        strict: true,
        schema: {
          type: "object",
          properties: {
            referenceSolution: { type: "string" }
          },
          required: ["referenceSolution"],
          additionalProperties: false
        }
      }
    },
    temperature: 0.2,
  });

  const parsed = JSON.parse(res.choices[0].message.content);
  if (!parsed.referenceSolution) throw new Error("AI failed to produce a fixed solution");
  return unescapeNewlines(parsed.referenceSolution);
};

// ── Prompt Builder ──
// NOTE ON TRIMMING: the JavaScript/Python driver rules and the Function
// Signature rules below were shortened to remove prose that duplicated
// what the templates already show concretely. The Java and C++ driver
// rules and the Failure Conditions checklist are LEFT UNCHANGED on
// purpose — every constraint in those two sections maps directly to a
// real bug we hit in production today (Scanner vs INPUT_STRING, solve()
// being pre-declared, placeholder counts, nested function definitions).
// Do not trim those further without re-testing extensively.
const buildPrompt = (difficulty, topic, history) => `
You are a senior DSA interviewer and problem setter.

Return STRICT JSON only. No markdown. No explanations. No extra text.

-----------------------------------
PROBLEM CONFIG
-----------------------------------
Difficulty: ${difficulty}
Topic: ${topic}
Avoid repeating: ${history}

-----------------------------------
HARD REQUIREMENTS (MANDATORY)
-----------------------------------
1. Generate ONE unique DSA problem.
2. Input must be FULLY whitespace-parsable (space or newline separated tokens).
3. Output must be deterministic (NO randomness, NO sets, always same order).
4. Constraints must support up to N = 1e5.
5. Problem must be solvable in O(N log N) or better.

-----------------------------------
REFERENCE SOLUTION RULES (PYTHON)
-----------------------------------
- Must be valid Python 3 code.
- Must read input using: data = sys.stdin.read().split()
- Must compute correct output.
- Must print ONLY the final result (no debug text, no extra prints).
- Must handle ALL edge cases.
- DO NOT use semicolons to join lines.
- USE actual newlines and 4-space indentation.
- Example structure:
  import sys
  def solve(...):
      ...
      return result
  data = sys.stdin.read().split()
  # parse data here
  print(solve(...))

-----------------------------------
EXAMPLES + TESTCASES
-----------------------------------
- 2-3 examples (with explanation)
- 3-4 testcases (input only, NO output — backend will compute)
- Inputs must be valid and consistent with InputFormat
- Avoid trivial or repeated cases
- Keep inputs small enough to verify manually
- CRITICAL: For each example, the "output" field must be the exact correct result you get by reasoning through the problem statement directly, BEFORE writing referenceSolution. Compute it carefully and independently — this value will be checked against what your referenceSolution actually produces, and a mismatch means the question will be rejected and regenerated. Do not just guess or copy a number without verifying it against your own explanation.

-----------------------------------
!! CRITICAL: DRIVER CODE RULES !!
-----------------------------------
The driver code will have the user's INPUT injected as a variable called INPUT_STRING.
INPUT_STRING is a raw string containing all input tokens separated by spaces/newlines.

JAVASCRIPT DRIVER CODE RULES:
- The placeholder "// Write your code here" must appear EXACTLY once.
- DO NOT use fs, require, readline, or process.stdin anywhere.
- The ONLY console.log allowed is the final result line, using EXACTLY: console.log(JSON.stringify(result))

JAVASCRIPT DRIVER TEMPLATE (follow this structure exactly):
const tokens = INPUT_STRING.trim().split(/\s+/);
// parse tokens here
// Write your code here
const result = solve(...parsed variables...);
console.log(JSON.stringify(result));

PYTHON DRIVER CODE RULES:
- The placeholder "# Write your code here" must appear EXACTLY once.
- DO NOT use sys, input(), or stdin anywhere.
- Print using: print(json.dumps(result)) for arrays, print(result) for numbers/strings.

PYTHON DRIVER TEMPLATE:
import json
data = INPUT_STRING.strip().split()
# parse data here
# Write your code here
result = solve(...parsed variables...)
print(json.dumps(result))

JAVA DRIVER CODE RULES:
- The class MUST be named exactly: Solution
- Read input using a variable INPUT_STRING (a literal string injected into the file, e.g. String inputStr = INPUT_STRING;)
- Parse inputStr by splitting on whitespace (e.g. String[] tokens = inputStr.trim().split("\\s+");)
- Do NOT use Scanner or System.in — input is injected as INPUT_STRING, not read from stdin
- Parse stdin to get all variables needed by solve()
- Call the static solve() method with the parsed variables inside main()
- Print result using EXACTLY: System.out.println(result) for primitives/strings,
  or System.out.println(java.util.Arrays.toString(result)) for arrays
- The Solution class must contain ONLY the main() method. Do NOT declare, stub, or define solve() anywhere in driverCode — it does not exist yet in this file.
- Place a SINGLE placeholder "// Write your code here" as a member of the Solution class, positioned AFTER the closing brace of main(), where the user's complete solve() method will be inserted.
- The placeholder MUST appear exactly once in the entire driver file.
- DO NOT include a separate public class other than Solution
- DO NOT use any external libraries beyond java.util.* and java.io.*

JAVA DRIVER TEMPLATE (follow this structure exactly — note solve() is NOT defined here, only called):
import java.util.*;

public class Solution {
    public static void main(String[] args) {
        String inputStr = INPUT_STRING;
        String[] tokens = inputStr.trim().split("\\s+");
        // parse tokens here
        int result = solve(/* parsed variables */);
        System.out.println(result);
    }

    // Write your code here
}

CPP DRIVER CODE RULES:
- Read input using a variable INPUT_STRING (a literal string injected into the file, e.g. string inputStr = INPUT_STRING;)
- Parse inputStr using an istringstream to extract whitespace-separated tokens
- Do NOT use cin — input is injected as INPUT_STRING, not read from stdin
- Parse inputStr to get all variables needed by solve()
- Call solve() with the parsed variables inside main()
- Print result using EXACTLY: cout << result << endl; for primitives/strings,
  or loop and print space-separated values for vectors/arrays
- Must #include <bits/stdc++.h> and using namespace std;
- main() must be defined, calling the solve function and printing its result
- CRITICAL: Do NOT declare or define solve() anywhere in driverCode.cpp — it does not exist yet in this file. The placeholder "// Write your code here" MUST be a bare top-level comment placed BEFORE int main(), with NO function signature wrapped around it. The user's complete function (signature + body, exactly as shown in functionSignature.cpp) will be inserted at that exact placeholder.
- solve() must appear exactly ONCE in the entire driverCode.cpp file — as a function call inside main(). Do NOT write a stub, forward declaration, or empty definition of solve() anywhere else.
- The placeholder "// Write your code here" MUST appear exactly once, at file scope before main().

CPP DRIVER TEMPLATE (follow this structure exactly):
#include <bits/stdc++.h>
using namespace std;

// Write your code here

int main() {
    string inputStr = INPUT_STRING;
    istringstream iss(inputStr);
    // parse tokens from iss here
    // call solve() with parsed variables
    // print result
    return 0;
}

-----------------------------------
FUNCTION SIGNATURE RULES
-----------------------------------
- functionSignature is the STARTER CODE shown to the user in the editor: ONLY the solve() function/method with "// Write your code here" inside — NO driver code, NO INPUT_STRING.
- C++: driverCode.cpp must NOT pre-declare or define solve() anywhere. The placeholder there is a bare top-level marker before main(); the user's full function (as shown in functionSignature.cpp) is inserted there directly, becoming the actual solve() definition.
- Java: functionSignature.java must contain ONLY the solve() method signature — NO "public class Solution" wrapper (the class already exists in driverCode.java).

Examples:
  JavaScript: function solve(nums, target) {\n    // Write your code here\n  }
  Python: def solve(nums, target):\n      # Write your code here\n      pass
  Java (method only, no class wrapper): public static int solve(int[] nums, int target) {\n      // Write your code here\n  }

-----------------------------------
INPUT FORMAT RULES
-----------------------------------
- InputFormat must EXACTLY describe how tokens map to variables
- Must be consistent with how driverCode parses INPUT_STRING
- Example for Two Sum:
  "Line 1: n (array length)\\nLine 2: n space-separated integers (the array)\\nLine 3: target integer"

Return valid JSON matching the provided schema exactly.

-----------------------------------
FAILURE CONDITIONS (DO NOT VIOLATE)
-----------------------------------
- Missing any field → INVALID
- Using fs/readline/process.stdin in JS driver → INVALID
- Using sys/input() in Python driver → INVALID
- INPUT_STRING missing from driver code → INVALID
- console.log not using JSON.stringify → INVALID
- functionSignature containing driver code → INVALID
- Mismatched input parsing → INVALID
- Extra text outside JSON → INVALID
- Randomness in output → INVALID

Return ONLY the JSON object. Nothing else.
`;

const normalizeForCompare = (str) => (str || "").replace(/\s+/g, " ").trim();

const verifyWithSelfHealing = async (parsed, maxFixes = 2) => {
  let solution = parsed.referenceSolution;

  for (let fixAttempt = 0; fixAttempt <= maxFixes; fixAttempt++) {
    try {
      const verifiedExamples = await Promise.all(
        (parsed.examples || []).map(async (ex) => {
          const computedOutput = await getTrueExpectedOutput(solution, ex.input);
          const statedOutput = ex.output;

          // Cross-check: does the code's real output match what the AI itself
          // reasoned the answer should be, when it wrote the example?
          if (
            statedOutput &&
            normalizeForCompare(computedOutput) !== normalizeForCompare(statedOutput)
          ) {
            throw new Error(
              `Reference solution mismatch on example (input="${ex.input}"): ` +
              `the code computed "${computedOutput}" but the example's own stated ` +
              `expected output was "${statedOutput}". This means the reference ` +
              `solution's logic is likely wrong for this problem.`
            );
          }

          console.log(`  ✓ Example verified: input="${ex.input}" → output="${computedOutput}"`);
          return { ...ex, output: computedOutput };
        })
      );

      const verifiedTestcases = await Promise.all(
        (parsed.testcases || []).map(async (tc, i) => {
          const expected = await getTrueExpectedOutput(solution, tc.input);
          console.log(`  ✓ Testcase ${i + 1} verified: input="${tc.input}" → expected="${expected}"`);
          return { id: i + 1, label: `Case ${i + 1}`, input: (tc.input || "").trim(), expected };
        })
      );

      return {
        ...parsed,
        referenceSolution: solution,
        examples: verifiedExamples,
        testcases: verifiedTestcases,
      };

    } catch (err) {
      const isLastFix = fixAttempt === maxFixes;
      if (isLastFix) {
        console.warn(`  ✗ Solution could not be fixed after ${maxFixes} attempts.`);
        throw err;
      }

      console.warn(`  ✗ Verification failed: ${err.message}`);
      console.log(`  → Fix attempt ${fixAttempt + 1}/${maxFixes}...`);
      solution = await fixReferenceSolution(solution, err.stderr || err.message, parsed.topic, parsed.difficulty);
    }
  }
};

const generateQuestion = async (difficulty, previousQuestions = [], maxRetries = 3) => {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const history = previousQuestions.length ? previousQuestions.join(", ") : "None";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\nAttempt ${attempt}: Generating ${topic} question...`);

      const res = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        max_tokens: 4500,
        messages: [
          { role: "system", content: "Return ONLY valid JSON. No markdown." },
          { role: "user", content: buildPrompt(difficulty, topic, history) }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "dsa_question",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                difficulty: {
                  type: "string",
                  enum: ["Easy", "Medium", "Hard"]
                },
                topic: { type: "string" },
                description: { type: "string" },
                InputFormat: { type: "string" },
                constraints: {
                  type: "array",
                  items: { type: "string" }
                },
                referenceSolution: { type: "string" },

                examples: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      input: { type: "string" },
                      output: { type: "string" },
                      explanation: { type: "string" }
                    },
                    required: [
                      "input",
                      "output",
                      "explanation"
                    ],
                    additionalProperties: false
                  }
                },

                testcases: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      input: { type: "string" }
                    },
                    required: [
                      "input"
                    ],
                    additionalProperties: false
                  }
                },

                functionSignature: {
                  type: "object",
                  properties: {
                    javascript: { type: "string" },
                    python: { type: "string" },
                    cpp: { type: "string" },
                    java: { type: "string" }
                  },
                  required: [
                    "javascript",
                    "python",
                    "cpp",
                    "java"
                  ],
                  additionalProperties: false
                },

                driverCode: {
                  type: "object",
                  properties: {
                    javascript: { type: "string" },
                    python: { type: "string" },
                    cpp: { type: "string" },
                    java: { type: "string" }
                  },
                  required: [
                    "javascript",
                    "python",
                    "cpp",
                    "java"
                  ],
                  additionalProperties: false
                }
              },

              required: [
                "title",
                "difficulty",
                "topic",
                "description",
                "InputFormat",
                "constraints",
                "referenceSolution",
                "examples",
                "testcases",
                "functionSignature",
                "driverCode"
              ],

              additionalProperties: false
            }
          }
        },
        temperature: 0.3,
      });

      let parsed;
      try {
        parsed = JSON.parse(res.choices[0].message.content);
      } catch (parseErr) {
        throw new Error(`AI returned invalid JSON: ${parseErr.message}`);
      }

      if (!parsed || typeof parsed !== "object") {
        throw new Error("AI returned an empty or invalid response");
      }

      parsed.referenceSolution = unescapeNewlines(parsed.referenceSolution);
      ["javascript", "python", "cpp", "java"].forEach(lang => {
        if (parsed.driverCode?.[lang]) {
          parsed.driverCode[lang] = unescapeNewlines(parsed.driverCode[lang]);
        }
        if (parsed.functionSignature?.[lang]) {
          parsed.functionSignature[lang] = unescapeNewlines(parsed.functionSignature[lang]);
        }
      });
      if (parsed.driverCode?.java) {
        parsed.driverCode.java = fixJavaRegexEscaping(parsed.driverCode.java);
      }
      parsed.examples = (parsed.examples || []).map(ex => ({
        ...ex,
        input: unescapeNewlines(ex.input),
        output: unescapeNewlines(ex.output),
      }));
      parsed.testcases = (parsed.testcases || []).map(tc => ({
        ...tc,
        input: unescapeNewlines(tc.input),
      }));

      const requiredFields = ["title", "difficulty", "topic", "description", "InputFormat", "constraints", "referenceSolution", "examples", "testcases", "functionSignature", "driverCode"];
      for (const field of requiredFields) {
        if (!parsed[field]) throw new Error(`Missing required field: ${field}`);
      }

      if (!Array.isArray(parsed.examples) || parsed.examples.length === 0) {
        throw new Error("No examples were generated");
      }
      if (!Array.isArray(parsed.testcases) || parsed.testcases.length === 0) {
        throw new Error("No testcases were generated");
      }

      if (!parsed.driverCode.javascript?.includes("INPUT_STRING")) {
        throw new Error("JS driver code missing INPUT_STRING");
      }
      if (!parsed.driverCode.python?.includes("INPUT_STRING")) {
        throw new Error("Python driver code missing INPUT_STRING");
      }
      if (!parsed.driverCode.java?.includes("INPUT_STRING")) {
        throw new Error("Java driver code missing INPUT_STRING");
      }
      if (!parsed.driverCode.cpp?.includes("INPUT_STRING")) {
        throw new Error("C++ driver code missing INPUT_STRING");
      }
      const cppSolveMentions = (parsed.driverCode.cpp?.match(/\bsolve\s*\(/g) || []).length;
      if (cppSolveMentions !== 1) {
        throw new Error(`C++ driver code should reference solve() exactly once (the call in main), found ${cppSolveMentions} — likely a duplicate/stub declaration`);
      }

      const javaSolveMentions = (parsed.driverCode.java?.match(/\bsolve\s*\(/g) || []).length;
      if (javaSolveMentions !== 1) {
        throw new Error(`Java driver code should reference solve() exactly once (the call in main), found ${javaSolveMentions} — likely a duplicate/stub declaration`);
      }
      const javaPlaceholderCount = (parsed.driverCode.java?.match(/\/\/ Write your code here/g) || []).length;
      if (javaPlaceholderCount !== 1) {
        throw new Error(`Java driver code placeholder appears ${javaPlaceholderCount} times, expected exactly 1`);
      }

      if (parsed.functionSignature.java?.includes("class")) {
        throw new Error("Java functionSignature must not contain a class declaration");
      }
      if (!parsed.driverCode.cpp?.includes("// Write your code here")) {
        throw new Error("C++ driver code missing placeholder");
      }

      ["javascript", "python", "cpp", "java"].forEach(lang => {
        if (parsed.functionSignature[lang]) {
          parsed.functionSignature[lang] = parsed.functionSignature[lang].replace(/\.\.\./g, " ");
        }
      });

      console.log("Syncing truth via Piston Python execution...");
      const verified = await verifyWithSelfHealing(parsed);

      if (!verified) {
        throw new Error("Verification returned no result");
      }

      console.log(`Success: "${verified.title}" generated and verified!`);
      return verified;

    } catch (error) {
      console.warn(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt === maxRetries) throw error;

      const isRateLimit = error.status === 429 || /rate.?limit/i.test(error.message || "");
      const delay = isRateLimit ? 10000 * attempt : 1500 * attempt;

      console.log(`Retrying in ${delay / 1000}s with a fresh question...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

module.exports = generateQuestion;