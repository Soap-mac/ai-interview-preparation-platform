// const groq = require("../utils/aiClient");
// const fetch = require("node-fetch");

// const TOPICS = [
//   "Sliding Window",
//   "Binary Search",
//   "Dynamic Programming",
//   "Backtracking",
//   "Heaps/Priority Queues",
//   "Greedy Algorithms",
//   "Bit Manipulation",
//   "Two Pointers",
//   "Prefix Sum",
//   "Sorting"
// ];

// const getTrueExpectedOutput = async (pythonCode, inputStr) => {
//   const response = await fetch("https://glot.io/api/run/python/latest", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Token ${process.env.GLOT_TOKEN}`,
//     },
//     body: JSON.stringify({
//       files: [{ name: "main.py", content: pythonCode }],
//       stdin: inputStr.trim(),
//     }),
//   });

//   const data = await response.json();

//   if (data.error) throw new Error(`Glot error: ${data.error}`);
//   if (data.stderr) throw new Error(`Python error: ${data.stderr}`);
//   if (!data.stdout) throw new Error("Python reference produced empty output");

//   return data.stdout.trim();
// };

// const buildPrompt = (difficulty, topic, history) => `
// You are a senior DSA interviewer and problem setter.

// Return STRICT JSON only. No markdown. No explanations. No extra text.

// -----------------------------------
// PROBLEM CONFIG
// -----------------------------------
// Difficulty: ${difficulty}
// Topic: ${topic}
// Avoid repeating: ${history}

// -----------------------------------
// HARD REQUIREMENTS (MANDATORY)
// -----------------------------------
// 1. Generate ONE unique DSA problem.
// 2. Input must be FULLY whitespace-parsable (space or newline separated tokens).
// 3. Output must be deterministic (NO randomness, NO sets, always same order).
// 4. Constraints must support up to N = 1e5.
// 5. Problem must be solvable in O(N log N) or better.

// -----------------------------------
// REFERENCE SOLUTION RULES (PYTHON)
// -----------------------------------
// - Must be valid Python 3 code.
// - Must read input using: data = sys.stdin.read().split()
// - Must compute correct output.
// - Must print ONLY the final result (no debug text, no extra prints).
// - Must handle ALL edge cases.
// - DO NOT use semicolons to join lines.
// - USE actual newlines and 4-space indentation.
// - Example structure:
//   import sys
//   def solve(...):
//       ...
//       return result
//   data = sys.stdin.read().split()
//   # parse data here
//   print(solve(...))

// -----------------------------------
// EXAMPLES + TESTCASES
// -----------------------------------
// - 2-3 examples (with explanation)
// - 3-4 testcases (input only, NO output — backend will compute)
// - Inputs must be valid and consistent with InputFormat
// - Avoid trivial or repeated cases
// - Keep inputs small enough to verify manually

// -----------------------------------
// !! CRITICAL: DRIVER CODE RULES !!
// -----------------------------------
// The driver code will have the user's INPUT injected as a variable called INPUT_STRING.
// INPUT_STRING is a raw string containing all input tokens separated by spaces/newlines.

// JAVASCRIPT DRIVER CODE RULES:
// - Start with: const tokens = INPUT_STRING.trim().split(/\s+/);
// - Parse tokens to get all variables needed by solve()
// - Call solve() with the parsed variables
// - Print result using EXACTLY: console.log(JSON.stringify(result))
// - The placeholder "// Write your code here" MUST appear exactly once
// - DO NOT use fs, require, readline, or process.stdin anywhere
// - DO NOT use console.log anywhere except the final result line

// JAVASCRIPT DRIVER TEMPLATE (follow this structure exactly):
// const tokens = INPUT_STRING.trim().split(/\s+/);
// // parse tokens here
// // Write your code here
// const result = solve(...parsed variables...);
// console.log(JSON.stringify(result));

// PYTHON DRIVER CODE RULES:
// - Start with: data = INPUT_STRING.strip().split()
// - Parse data to get all variables needed by solve()
// - Call solve() with the parsed variables
// - Print result using: print(json.dumps(result)) for arrays, print(result) for numbers/strings
// - The placeholder "# Write your code here" MUST appear exactly once
// - DO NOT use sys, input(), or stdin anywhere

// PYTHON DRIVER TEMPLATE:
// import json
// data = INPUT_STRING.strip().split()
// # parse data here
// # Write your code here
// result = solve(...parsed variables...)
// print(json.dumps(result))

// -----------------------------------
// FUNCTION SIGNATURE RULES
// -----------------------------------
// - functionSignature is the STARTER CODE shown to the user in the editor
// - It must contain ONLY the solve() function with "// Write your code here" inside
// - DO NOT include driver code inside functionSignature
// - DO NOT include INPUT_STRING inside functionSignature
// - JavaScript example:
//   function solve(nums, target) {
//     // Write your code here
//   }
// - Python example:
//   def solve(nums, target):
//       # Write your code here
//       pass

// -----------------------------------
// INPUT FORMAT RULES
// -----------------------------------
// - InputFormat must EXACTLY describe how tokens map to variables
// - Must be consistent with how driverCode parses INPUT_STRING
// - Example for Two Sum:
//   "Line 1: n (array length)\\nLine 2: n space-separated integers (the array)\\nLine 3: target integer"

// -----------------------------------
// STRICT OUTPUT FORMAT
// -----------------------------------
// {
//   "title": "string",
//   "difficulty": "${difficulty}",
//   "topic": "${topic}",
//   "description": "string — explain the problem clearly",
//   "InputFormat": "string — describe exactly how input tokens map to variables",
//   "constraints": ["string"],
//   "referenceSolution": "full valid python3 script that reads from stdin and prints result",
//   "examples": [
//     {
//       "input": "string — raw input tokens exactly as they would appear",
//       "explanation": "string — explain why this is the correct output"
//     }
//   ],
//   "testcases": [
//     {
//       "input": "string — raw input tokens"
//     }
//   ],
//   "functionSignature": {
//     "javascript": "function solve(...args) {\\n  // Write your code here\\n}",
//     "python": "def solve(...args):\\n    # Write your code here\\n    pass",
//     "cpp": "#include <bits/stdc++.h>\\nusing namespace std;\\n\\n// Write your code here",
//     "java": "public class Solution {\\n    public static ... solve(...) {\\n        // Write your code here\\n    }\\n}"
//   },
//   "driverCode": {
//     "javascript": "FULL JS DRIVER — uses INPUT_STRING, parses tokens, calls solve(), ends with console.log(JSON.stringify(result))",
//     "python": "FULL PYTHON DRIVER — uses INPUT_STRING, parses data, calls solve(), ends with print()"
//   }
// }

// -----------------------------------
// EXAMPLE OF CORRECT DRIVER CODE (Two Sum)
// -----------------------------------
// javascript driverCode:
// const tokens = INPUT_STRING.trim().split(/\s+/);
// const n = parseInt(tokens[0]);
// const nums = tokens.slice(1, n + 1).map(Number);
// const target = parseInt(tokens[n + 1]);
// // Write your code here
// const result = solve(nums, target);
// console.log(JSON.stringify(result));

// python driverCode:
// import json
// data = INPUT_STRING.strip().split()
// n = int(data[0])
// nums = list(map(int, data[1:n+1]))
// target = int(data[n+1])
// # Write your code here
// result = solve(nums, target)
// print(json.dumps(result))

// corresponding input example:
// "3\\n2 7 11\\n9"
// (first token = n, next n tokens = array, last token = target)

// -----------------------------------
// FAILURE CONDITIONS (DO NOT VIOLATE)
// -----------------------------------
// - Missing any field → INVALID
// - Using fs/readline/process.stdin in JS driver → INVALID
// - Using sys/input() in Python driver → INVALID
// - INPUT_STRING missing from driver code → INVALID
// - console.log not using JSON.stringify → INVALID
// - functionSignature containing driver code → INVALID
// - Mismatched input parsing → INVALID
// - Extra text outside JSON → INVALID
// - Randomness in output → INVALID

// Return ONLY the JSON object. Nothing else.
// `;

// const generateQuestion = async (difficulty, previousQuestions = [], maxRetries = 3) => {
//   const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
//   const history = previousQuestions.length ? previousQuestions.join(", ") : "None";

//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       console.log(`Attempt ${attempt}: Generating ${topic} question...`);

//       const res = await groq.chat.completions.create({
//         model: "llama-3.3-70b-versatile",
//         messages: [
//           { role: "system", content: "Return ONLY valid JSON. No markdown." },
//           { role: "user", content: buildPrompt(difficulty, topic, history) }
//         ],
//         response_format: { type: "json_object" },
//         temperature: 0.3,
//       });

//       const parsed = JSON.parse(res.choices[0].message.content);

//       const requiredFields = ["title", "difficulty", "topic", "description", "InputFormat", "constraints", "referenceSolution", "examples", "testcases", "functionSignature", "driverCode"];
//       for (const field of requiredFields) {
//         if (!parsed[field]) throw new Error(`Missing required field: ${field}`);
//       }

//       if (!parsed.driverCode.javascript?.includes("INPUT_STRING")) {
//         throw new Error("JS driver code missing INPUT_STRING");
//       }

//       ["javascript", "python", "cpp", "java"].forEach(lang => {
//         if (parsed.functionSignature[lang]) {
//           parsed.functionSignature[lang] = parsed.functionSignature[lang].replace(/\.\.\./g, " ");
//         }
//       });

//       console.log("Syncing truth via Glot.io Python execution...");

//       for (const ex of parsed.examples) {
//         ex.output = await getTrueExpectedOutput(parsed.referenceSolution, ex.input);
//         console.log(`Example verified: input="${ex.input}" → output="${ex.output}"`);
//       }

//       parsed.testcases = await Promise.all(
//         parsed.testcases.map(async (tc, i) => {
//           const expected = await getTrueExpectedOutput(parsed.referenceSolution, tc.input);
//           console.log(`Testcase ${i + 1} verified: input="${tc.input}" → expected="${expected}"`);
//           return {
//             id: i + 1,
//             label: `Case ${i + 1}`,
//             input: tc.input.trim(),
//             expected,
//           };
//         })
//       );

//       console.log(`Success: "${parsed.title}" generated and verified!`);
//       return parsed;

//     } catch (error) {
//       console.warn(`Attempt ${attempt} failed: ${error.message}`);
//       if (attempt === maxRetries) throw error;
//       await new Promise(r => setTimeout(r, 1500 * attempt));
//     }
//   }
// };

// module.exports = generateQuestion;

const groq = require("../utils/aiClient");
const fetch = require("node-fetch");

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

const getTrueExpectedOutput = async (pythonCode, inputStr) => {
  const response = await fetch("https://glot.io/api/run/python/latest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${process.env.GLOT_TOKEN}`,
    },
    body: JSON.stringify({
      files: [{ name: "main.py", content: pythonCode }],
      stdin: inputStr.trim(),
    }),
  });

  const data = await response.json();

  if (data.error) {
    const err = new Error(`Glot error: ${data.error}`);
    err.stderr = data.stderr || data.error;
    throw err;
  }
  if (data.stderr) {
    const err = new Error(`Python error: ${data.stderr}`);
    err.stderr = data.stderr;
    throw err;
  }
  if (!data.stdout) throw new Error("Python reference produced empty output");

  return data.stdout.trim();
};

const fixReferenceSolution = async (brokenSolution, stderr, topic, difficulty) => {
  console.log("  → Asking AI to fix broken reference solution...");
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "Return ONLY valid JSON. No markdown." },
      {
        role: "user",
        content: `
You are a Python expert. The following Python reference solution for a ${difficulty} ${topic} DSA problem has a runtime error.

BROKEN SOLUTION:
\`\`\`python
${brokenSolution}
\`\`\`

PYTHON ERROR:
${stderr}

Fix the solution so it:
1. Reads input using: data = sys.stdin.read().split()
2. Computes the correct output
3. Prints ONLY the final result
4. Has no syntax or runtime errors
5. Uses actual newlines and 4-space indentation (NO semicolons)

Return ONLY this JSON:
{ "referenceSolution": "fixed python3 code here" }
        `.trim()
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const parsed = JSON.parse(res.choices[0].message.content);
  if (!parsed.referenceSolution) throw new Error("AI failed to produce a fixed solution");
  return parsed.referenceSolution;
};

// ── Prompt Builder ──
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

-----------------------------------
!! CRITICAL: DRIVER CODE RULES !!
-----------------------------------
The driver code will have the user's INPUT injected as a variable called INPUT_STRING.
INPUT_STRING is a raw string containing all input tokens separated by spaces/newlines.

JAVASCRIPT DRIVER CODE RULES:
- Start with: const tokens = INPUT_STRING.trim().split(/\s+/);
- Parse tokens to get all variables needed by solve()
- Call solve() with the parsed variables
- Print result using EXACTLY: console.log(JSON.stringify(result))
- The placeholder "// Write your code here" MUST appear exactly once
- DO NOT use fs, require, readline, or process.stdin anywhere
- DO NOT use console.log anywhere except the final result line

JAVASCRIPT DRIVER TEMPLATE (follow this structure exactly):
const tokens = INPUT_STRING.trim().split(/\s+/);
// parse tokens here
// Write your code here
const result = solve(...parsed variables...);
console.log(JSON.stringify(result));

PYTHON DRIVER CODE RULES:
- Start with: data = INPUT_STRING.strip().split()
- Parse data to get all variables needed by solve()
- Call solve() with the parsed variables
- Print result using: print(json.dumps(result)) for arrays, print(result) for numbers/strings
- The placeholder "# Write your code here" MUST appear exactly once
- DO NOT use sys, input(), or stdin anywhere

PYTHON DRIVER TEMPLATE:
import json
data = INPUT_STRING.strip().split()
# parse data here
# Write your code here
result = solve(...parsed variables...)
print(json.dumps(result))

JAVA DRIVER CODE RULES:
- The class MUST be named exactly: Solution
- Read input using: Scanner sc = new Scanner(System.in); then sc.nextInt()/sc.next()/sc.nextLine() as needed
- Do NOT read from INPUT_STRING directly — Java driver receives input via stdin, not string injection
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
        Scanner sc = new Scanner(System.in);
        // parse input here using sc.nextInt() / sc.next() etc
        int result = solve(/* parsed variables */);
        System.out.println(result);
    }

    // Write your code here
}

CPP DRIVER CODE RULES:
- Read input using: cin >> variable; (standard cin, NOT INPUT_STRING)
- Do NOT read from INPUT_STRING directly — C++ driver receives input via stdin, not string injection
- Parse stdin to get all variables needed by solve()
- Call solve() with the parsed variables
- Print result using EXACTLY: cout << result << endl; for primitives/strings,
  or loop and print space-separated values for vectors/arrays
- The placeholder "// Write your code here" MUST appear exactly once, inside the function body
- Must #include <bits/stdc++.h> and using namespace std;
- main() must be defined, calling the solve function and printing its result

CPP DRIVER TEMPLATE (follow this structure exactly):
#include <bits/stdc++.h>
using namespace std;

// Write your code here

int main() {
    // parse input here using cin
    // call solve() with parsed variables
    // print result
    return 0;
}

-----------------------------------
FUNCTION SIGNATURE RULES
-----------------------------------
- functionSignature is the STARTER CODE shown to the user in the editor
- It must contain ONLY the solve() function with "// Write your code here" inside
- DO NOT include driver code inside functionSignature
- DO NOT include INPUT_STRING inside functionSignature
- For Java specifically: functionSignature.java must contain ONLY the solve() method signature — NO "public class Solution" wrapper. The class already exists in driverCode.java; the method will be inserted directly inside it.
- JavaScript example:
  function solve(nums, target) {
    // Write your code here
  }
- Python example:
  def solve(nums, target):
      # Write your code here
      pass

- Java example (method only — NO class wrapper):
  public static int solve(int[] nums, int target) {
      // Write your code here
  }
-----------------------------------
INPUT FORMAT RULES
-----------------------------------
- InputFormat must EXACTLY describe how tokens map to variables
- Must be consistent with how driverCode parses INPUT_STRING
- Example for Two Sum:
  "Line 1: n (array length)\\nLine 2: n space-separated integers (the array)\\nLine 3: target integer"

-----------------------------------
STRICT OUTPUT FORMAT
-----------------------------------
{
  "title": "string",
  "difficulty": "${difficulty}",
  "topic": "${topic}",
  "description": "string — explain the problem clearly",
  "InputFormat": "string — describe exactly how input tokens map to variables",
  "constraints": ["string"],
  "referenceSolution": "full valid python3 script that reads from stdin and prints result",
  "examples": [
    {
      "input": "string — raw input tokens exactly as they would appear",
      "explanation": "string — explain why this is the correct output"
    }
  ],
  "testcases": [
    {
      "input": "string — raw input tokens"
    }
  ],
  "functionSignature": {
    "javascript": "function solve(...args) {\\n  // Write your code here\\n}",
    "python": "def solve(...args):\\n    # Write your code here\\n    pass",
    "cpp": "#include <bits/stdc++.h>\\nusing namespace std;\\n\\n// Write your code here",
    "java": "public static <returnType> solve(<params>) {\\n    // Write your code here\\n}"  },
  "driverCode": {
    "javascript": "FULL JS DRIVER — uses INPUT_STRING, parses tokens, calls solve(), ends with console.log(JSON.stringify(result))",
    "python": "FULL PYTHON DRIVER — uses INPUT_STRING, parses data, calls solve(), ends with print()",
    "java": "FULL JAVA DRIVER — class Solution, reads via Scanner from stdin, calls solve(), ends with System.out.println(result)",
    "cpp": "FULL CPP DRIVER — reads via cin from stdin, calls solve(), ends with cout << result"
  }
}

-----------------------------------
EXAMPLE OF CORRECT DRIVER CODE (Two Sum)
-----------------------------------
javascript driverCode:
const tokens = INPUT_STRING.trim().split(/\s+/);
const n = parseInt(tokens[0]);
const nums = tokens.slice(1, n + 1).map(Number);
const target = parseInt(tokens[n + 1]);
// Write your code here
const result = solve(nums, target);
console.log(JSON.stringify(result));

python driverCode:
import json
data = INPUT_STRING.strip().split()
n = int(data[0])
nums = list(map(int, data[1:n+1]))
target = int(data[n+1])
# Write your code here
result = solve(nums, target)
print(json.dumps(result))

corresponding input example:
"3\\n2 7 11\\n9"
(first token = n, next n tokens = array, last token = target)

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

const verifyWithSelfHealing = async (parsed, maxFixes = 2) => {
  let solution = parsed.referenceSolution;

  for (let fixAttempt = 0; fixAttempt <= maxFixes; fixAttempt++) {
    try {
      const verifiedExamples = [];
      for (const ex of parsed.examples) {
        const output = await getTrueExpectedOutput(solution, ex.input);
        console.log(`  ✓ Example verified: input="${ex.input}" → output="${output}"`);
        verifiedExamples.push({ ...ex, output });
      }

      const verifiedTestcases = await Promise.all(
        parsed.testcases.map(async (tc, i) => {
          const expected = await getTrueExpectedOutput(solution, tc.input);
          console.log(`  ✓ Testcase ${i + 1} verified: input="${tc.input}" → expected="${expected}"`);
          return { id: i + 1, label: `Case ${i + 1}`, input: tc.input.trim(), expected };
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

      console.warn(`  ✗ Glot execution failed: ${err.message}`);
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
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Return ONLY valid JSON. No markdown." },
          { role: "user", content: buildPrompt(difficulty, topic, history) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const parsed = JSON.parse(res.choices[0].message.content);

      const requiredFields = ["title", "difficulty", "topic", "description", "InputFormat", "constraints", "referenceSolution", "examples", "testcases", "functionSignature", "driverCode"];
      for (const field of requiredFields) {
        if (!parsed[field]) throw new Error(`Missing required field: ${field}`);
      }

      if (!parsed.driverCode.javascript?.includes("INPUT_STRING")) {
        throw new Error("JS driver code missing INPUT_STRING");
      }
      if (!parsed.driverCode.python?.includes("INPUT_STRING")) {
        throw new Error("Python driver code missing INPUT_STRING");
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

      console.log("Syncing truth via Glot.io Python execution...");

      const verified = await verifyWithSelfHealing(parsed);

      console.log(`Success: "${verified.title}" generated and verified!`);
      return verified;

    } catch (error) {
      console.warn(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt === maxRetries) throw error;
      const delay = 1500 * attempt;
      console.log(`Retrying in ${delay / 1000}s with a fresh question...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

module.exports = generateQuestion;