const express = require("express");
const router = express.Router();
const generateQuestion = require("../services/generateDSA");
const authMiddleware = require("../middlewares/authMiddleware");
const Interview = require("../models/interview");
const axios = require("axios");
const evaluateDSA = require("../services/evaluateDSA");
const getNextDifficulty = require("../utils/getNextDifficulty");
const buildFinalCode = require("../utils/buildFinalCode");
const { parseValue, deepEqual } = require("../utils/compareOutput");
const path = require('path')


// Test Route
router.post("/dsa/start-test", authMiddleware, async (req, res) => {
    try {
        const { questionNo, questionFile } = req.body;
        const fileName = questionFile || "question1.json";

        delete require.cache[require.resolve(`../testData/${fileName}`)];
        const question = require(`../testData/${fileName}`);

        const interview = await Interview.create({
            user: req.user,
            topic: "DSA",
            totalQuestions: questionNo || 1,
            questions: [
                {
                    question: question.description,
                    difficulty: question.difficulty.toLowerCase(),
                    type: "code",
                    metadata: question,
                }
            ]
        });

        return res.json({
            interviewId: interview._id,
            question
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to start test interview" });
    }
});

// till here it is test route

router.post("/dsa/start", authMiddleware, async (req, res) => {
    try {

        const { difficulty, questionNo } = req.body;

        const question = await generateQuestion(difficulty);
        console.log(question);
        console.log("Here");
        const interview = await Interview.create({
            user: req.user,
            topic: "DSA",
            totalQuestions: questionNo,

            questions: [
                {
                    question: question.description,
                    difficulty: question.difficulty.toLowerCase(),
                    type: "code",
                    metadata: question,
                }
            ]
        });
        console.log(interview);

        return res.json({
            interviewId: interview._id,
            question
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to start interview" });
    }
});

router.get("/:id/currentDSA", authMiddleware, async (req, res) => {
    console.log("hiiiiiiiiiiiiiiiiiiiiiii");
    const interview = await Interview.findOne({
        _id: req.params.id,
        user: req.user
    });

    if (!interview) {
        return res.status(404).json({ success: false });
    }

    if (interview.currentQuestionIndex == interview.totalQuestions) {
        return res.json({
            success: false,
            message: "All Questions are answered"
        })
    }
    const currentQuestion =
        interview.questions[interview.currentQuestionIndex];
    console.log(currentQuestion.metadata);
    return res.json({
        question: currentQuestion.metadata
    });
});

const runJava = require("../compilers/java");
const runCpp = require("../compilers/cpp");
const runJS = require("../compilers/js");
const runPython = require("../compilers/python");

const extractJSBody = require("../LanguageFunctionExtraction/Js");

async function executeCode(code, input, language) {
    switch (language) {
        case "javascript": return runJS(code, input);
        case "python": return runPython(code, input);
        case "cpp": return runCpp(code, input);
        case "java": return runJava(code, input);
        default: throw new Error("Unsupported language");
    }
}

async function functionExtraction(language, code) {
    switch (language) {
        case "javascript": return extractJSBody(code);
        case "python": return runPython(code);
        case "cpp": return runCpp(code);
        case "java": return runJava(code);
        default: throw new Error("Unsupported language");
    }
}

router.post("/run", async (req, res) => {
    try {
        const { code, language, InterviewId } = req.body;

        const interview = await Interview.findById(InterviewId);
        if (!interview) throw new Error("Interview not found");

        const question = interview.questions[interview.currentQuestionIndex];
        if (!question) throw new Error("Question not found");

        const testcases = question.metadata.examples;

        const driver = question.metadata.driverCode[language];
        if (!driver) throw new Error("Driver code missing");

        console.log("=== DRIVER CODE FOR", language, "===");
        console.log(driver);
        console.log("=== END DRIVER ===");
        const finalCode = buildFinalCode(driver, code, language);



        const results = [];

        for (const tc of testcases) {
            try {
                const output = await executeCode(finalCode, tc.input, language);

                const outVal = parseValue(output);
                const expVal = parseValue(tc.output ?? tc.expected);

                results.push({
                    input: tc.input,
                    expected: JSON.stringify(expVal),
                    output: JSON.stringify(outVal),
                    passed: deepEqual(outVal, expVal),
                });
            } catch (err) {
                results.push({
                    input: tc.input,
                    expected: tc.output ?? tc.expected ?? "",
                    output: "Error: " + err.message,
                });
            }
        }

        console.log(results)

        res.json({ results });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
});
router.post("/submitDSA", authMiddleware, async (req, res) => {
    try {
        const { code, language, InterviewId } = req.body;

        console.log(language);

        const interview = await Interview.findById(InterviewId);
        if (!interview) throw new Error("Interview not found");
        const question = interview.questions[interview.currentQuestionIndex];
        if (!question) throw new Error("Question not found");

        const testcases = question.metadata.testcases;

        const driver = question.metadata.driverCode[language];

        if (!driver) throw new Error("Driver code missing");
        const safeDriver = driver.replace(/split\(\/s\+\/\)/g, "split(/\\s+/)");

        let finalCode = safeDriver.replace(`// Write your code here`, code);

        finalCode = finalCode.replace(
            /const (\w+) = tokens\.slice\((\d+|\w+(?:[+\-]\d+)?)\)\.map\(Number\);/g,
            `const $1 = tokens.slice($2).join(' ');`
        );



        let passedCount = 0;
        const results = [];

        for (const tc of testcases) {
            try {
                const output = await executeCode(finalCode, tc.input, language);

                const outVal = parseValue(output);
                const expVal = parseValue(tc.output ?? tc.expected);
                const passed = deepEqual(outVal, expVal);

                if (passed) passedCount++;

                results.push({
                    input: tc.input,
                    expected: JSON.stringify(expVal),
                    output: JSON.stringify(outVal),
                    passed
                });
            } catch (err) {
                results.push({
                    input: tc.input,
                    expected: tc.expected,
                    output: "Error",
                    passed: false,
                    error: err.toString()
                });
            }
        }

        const total = testcases.length;
        const allPassed = passedCount === total;

        question.code = code;
        question.language = language;
        question.passedTestCases = passedCount;
        question.totalTestCases = total;
        console.log("Results " + results);
        // question.output = results;
        question.correctness = (passedCount / total) * 100;

        const evaluation = await evaluateDSA({ question, code, results });
        console.log("After evaluateDSA");
        console.log("Evaluated results by ai", evaluation);
        question.score = evaluation.score;
        // question.verdict = evaluation.verdict;
        question.feedback = evaluation.feedback;
        question.strengths = evaluation.strengths;
        question.weaknesses = evaluation.weaknesses;
        question.timeComplexity = evaluation.timeComplexity;
        question.spaceComplexity = evaluation.spaceComplexity;
        question.userAnswer = code;
        question.improvedAnswer = evaluation.improvedCode;
        question.edgeCaseIssues = evaluation.edgeCaseIssues;
        question.codeQuality = evaluation.codeQuality;
        question.optimizationSuggestions = evaluation.optimizationSuggestions;

        interview.currentQuestionIndex = interview.currentQuestionIndex + 1;
        interview.finalScore = (interview.finalScore || 0) + question.score;

        if (interview.currentQuestionIndex >= interview.totalQuestions) {
            interview.finalScore =
                Number((interview.finalScore / interview.totalQuestions).toFixed(2));

            interview.status = "completed";

            console.log("Before saving");
            await interview.save();
            console.log("After saving");

            return res.json({
                success: true,
                message: "Interview Finished",
                finalScore: interview.finalScore,
                results,
                feedback: evaluation
            });
        }

        const nextDifficulty = await getNextDifficulty(question.difficulty, question.score);
        const newQuestion = await generateQuestion(nextDifficulty);

        interview.questions.push(
            {
                question: newQuestion.description,
                difficulty: newQuestion.difficulty.toLowerCase(),
                type: "code",
                metadata: newQuestion,
            }
        );

        await interview.save();
        return res.json({
            question: newQuestion
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
});

module.exports = router;