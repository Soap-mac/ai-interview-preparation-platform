const mongoose = require("mongoose");
const Interview = require("../models/interview");
require("dotenv").config();

const TOPICS = ["DSA", "OS", "CN", "DBMS", "HR"];
const DIFFICULTIES = ["easy", "medium", "hard"];
const LANGUAGES = ["python", "javascript", "java", "cpp"];

const STRENGTH_POOL = [
    "Correct implementation of the optimal algorithm",
    "Efficient use of standard library functions",
    "Handles edge cases gracefully",
    "Clean and readable code structure",
    "Good variable naming conventions",
    "Uses appropriate data structures",
    "Avoids unnecessary time/space overhead",
    "Well-commented logic",
    "Clear and structured explanation",
    "Demonstrates solid conceptual understanding"
];

const WEAKNESS_POOL = [
    "Misses a few edge cases like empty input",
    "Slightly suboptimal time complexity",
    "Could improve variable naming",
    "No input validation",
    "Uses extra space that could be avoided",
    "Logic could be simplified",
    "Minor inefficiency in nested loops",
    "Explanation lacks depth in places",
    "Missed a key related concept",
    "Answer could be more concise"
];

const EDGE_CASE_POOL = [
    "Does not handle empty array input",
    "Fails on negative numbers",
    "Integer overflow not considered for large inputs",
    "Duplicate elements not handled correctly"
];

const CONCEPTUAL_GAP_POOL = {
    DSA: ["Time complexity analysis", "Space-time tradeoffs", "Edge case handling", "Recursion vs iteration tradeoffs"],
    OS: ["Process scheduling algorithms", "Deadlock prevention strategies", "Virtual memory paging", "Thread synchronization primitives"],
    CN: ["TCP three-way handshake", "OSI vs TCP/IP model differences", "Subnetting and CIDR notation", "Congestion control mechanisms"],
    DBMS: ["Isolation levels in ACID", "B-Tree vs Hash index tradeoffs", "Normalization forms (3NF vs BCNF)", "Deadlock detection in transactions"],
    HR: ["STAR method structuring", "Quantifying impact in answers", "Handling conflict scenarios", "Articulating career goals clearly"]
};

const OPTIMIZATION_POOL = [
    "Could use a hashmap to reduce time complexity to O(n)",
    "Consider using two pointers instead of nested loops",
    "Precompute prefix sums to avoid recomputation",
    "Use binary search instead of linear scan"
];

const FEEDBACK_POOL = [
    "Solid solution overall with correct logic and reasonable efficiency.",
    "Good attempt but missed a couple of edge cases that affected correctness.",
    "Optimal and clean implementation, well done.",
    "Works correctly but could be optimized further for large inputs.",
    "Logic has some flaws leading to incorrect results on certain inputs."
];

const CODE_SNIPPETS = {
    python: "def solve(arr):\n    result = []\n    for x in arr:\n        if x > 0:\n            result.append(x)\n    return result",
    javascript: "function solve(arr) {\n    return arr.filter(x => x > 0);\n}",
    java: "public static int[] solve(int[] arr) {\n    return Arrays.stream(arr)\n        .filter(x -> x > 0)\n        .toArray();\n}",
    cpp: "vector<int> solve(vector<int> arr) {\n    vector<int> result;\n    for (int x : arr) {\n        if (x > 0) result.push_back(x);\n    }\n    return result;\n}"
};

const IMPROVED_CODE_SNIPPETS = {
    python: "def solve(arr):\n    if not arr:\n        return []\n    return [x for x in arr if x > 0]",
    javascript: "function solve(arr) {\n    if (!arr || arr.length === 0) return [];\n    return arr.filter(x => x > 0);\n}",
    java: "public static int[] solve(int[] arr) {\n    if (arr == null || arr.length == 0) return new int[0];\n    return Arrays.stream(arr)\n        .filter(x -> x > 0)\n        .toArray();\n}",
    cpp: "vector<int> solve(const vector<int>& arr) {\n    vector<int> result;\n    if (arr.empty()) return result;\n    for (int x : arr) {\n        if (x > 0) result.push_back(x);\n    }\n    return result;\n}"
};

const TEXT_ANSWER_POOL = {
    OS: "A process scheduling algorithm determines the order in which processes access the CPU. Round Robin gives each process a fixed time slice, ensuring fairness, while Priority Scheduling favors higher-priority tasks but can cause starvation without aging.",
    CN: "The TCP three-way handshake establishes a reliable connection: the client sends a SYN, the server responds with SYN-ACK, and the client confirms with an ACK. This ensures both sides agree on initial sequence numbers before data transfer begins.",
    DBMS: "ACID properties ensure reliable transactions. Isolation levels like READ COMMITTED and SERIALIZABLE control how concurrent transactions interact, trading off consistency guarantees against performance.",
    HR: "In my previous project, I led a team of four to deliver a feature two weeks ahead of schedule by breaking down tasks into smaller milestones and running daily standups to catch blockers early."
};

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomSubset = (arr, count) => [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateQuestion = (topic, difficulty, index) => {
    const score = randomInt(3, 10);
    const correctness = randomInt(40, 100); // 0-100 scale, shared across all topics per schema

    const base = {
        type: topic === "DSA" ? "code" : "text",
        question:
            topic === "DSA"
                ? `Given an array, solve a ${difficulty} problem involving optimal subset selection (sample #${index + 1}).`
                : `Explain a key ${difficulty}-level concept in ${topic} (sample question #${index + 1}).`,
        difficulty,
        metadata: {
            title: `Sample ${topic} Problem ${index + 1}`,
            difficulty,
            topic,
            description: `This is a seeded sample problem for ${topic} at ${difficulty} level, used for analytics testing.`
        },
        correctness,
        score,
        strengths: randomSubset(STRENGTH_POOL, randomInt(1, 3)),
        weaknesses: randomSubset(WEAKNESS_POOL, randomInt(0, 2)),
        conceptualGaps: randomSubset(CONCEPTUAL_GAP_POOL[topic] || [], randomInt(0, 2)),
        feedback: randomItem(FEEDBACK_POOL),
        evaluatedAt: new Date()
    };

    if (topic === "DSA") {
        const language = randomItem(LANGUAGES);
        const passedTestCases = randomInt(1, 5);
        const totalTestCases = 5;

        return {
            ...base,
            userAnswer: null,
            clarity: null,
            depth: null,
            language,
            code: CODE_SNIPPETS[language],
            output: null,
            passedTestCases,
            totalTestCases,
            timeComplexity: randomItem(["O(n)", "O(n log n)", "O(n^2)", "O(1)", "O(log n)"]),
            spaceComplexity: randomItem(["O(1)", "O(n)", "O(log n)"]),
            codeQuality: {
                readability: randomInt(4, 10),
                modularity: randomInt(4, 10),
                naming: randomInt(4, 10)
            },
            optimizationSuggestions: randomSubset(OPTIMIZATION_POOL, randomInt(0, 2)),
            edgeCaseIssues: randomSubset(EDGE_CASE_POOL, randomInt(0, 2)),
            improvedAnswer: IMPROVED_CODE_SNIPPETS[language]
        };
    }

    // Non-DSA (text-based) topics
    return {
        ...base,
        userAnswer: TEXT_ANSWER_POOL[topic] || `Sample answer for ${topic} question #${index + 1}.`,
        clarity: randomInt(4, 10),
        depth: randomInt(4, 10),
        language: null,
        code: null,
        output: null,
        passedTestCases: null,
        totalTestCases: null,
        timeComplexity: null,
        spaceComplexity: null,
        codeQuality: null,
        optimizationSuggestions: null,
        edgeCaseIssues: null,
        improvedAnswer: `A more thorough version: ${TEXT_ANSWER_POOL[topic] || "expanded explanation with concrete examples."} This could be further improved by including a real-world example and discussing trade-offs explicitly.`
    };
};

const seedAnalyticsData = async (userId, numInterviews = 8) => {
    const interviews = [];

    for (let i = 0; i < numInterviews; i++) {
        const topic = randomItem(TOPICS);
        const numQuestions = randomInt(3, 5);
        const questions = [];

        for (let q = 0; q < numQuestions; q++) {
            const difficulty = randomItem(DIFFICULTIES);
            questions.push(generateQuestion(topic, difficulty, q));
        }

        const avgScore = Number(
            (questions.reduce((sum, q) => sum + q.score, 0) / questions.length).toFixed(2)
        );

        const daysAgo = randomInt(0, 30);
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        interviews.push({
            user: userId,
            topic,
            questions,
            totalQuestions: numQuestions,
            currentQuestionIndex: numQuestions,
            status: "completed",
            finalScore: avgScore,
            createdAt,
            updatedAt: createdAt
        });
    }

    await Interview.insertMany(interviews);
    console.log(`✓ Seeded ${numInterviews} completed interviews for user ${userId}`);
};

const run = async () => {
    const userId = process.argv[2];
    const clearFirst = process.argv[3] === "--clear";

    if (!userId) {
        console.error("Usage: node scripts/seedAnalyticsData.js <userId> [--clear]");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    if (clearFirst) {
        const result = await Interview.deleteMany({ user: userId, status: "completed" });
        console.log(`✓ Cleared ${result.deletedCount} old seeded interviews`);
    }

    await seedAnalyticsData(userId, 8);

    await mongoose.disconnect();
    console.log("Done. Disconnected.");
};

run().catch(err => {
    console.error(err);
    process.exit(1);
});