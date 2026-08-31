const express = require("express");
const router = express.Router();
const generateQuestion = require("../services/generateQuestion");
const authMiddleware = require("../middlewares/authMiddleware");
const Interview = require("../models/interview");
const evaluateAnswer = require("../services/evaluateAnswer");
const getNextDifficulty = require("../utils/getNextDifficulty");
const NormalizeConceptualGaps = require("../services/conceptualGapNormalization");
const { getCachedAnalytics, setCachedAnalytics, invalidateAnalyticsCache } = require("../utils/analyticsCache");


router.post('/start', authMiddleware, async (req, res) => {
    try {

        const { topic, difficulty, questionNo } = req.body;
        console.log(topic + " " + difficulty + " " + questionNo);


        if (!topic || !difficulty) {
            return res.status(400).json({
                success: false,
                message: "Topic and difficulty are required"
            });
        }

        const validTopics = ["DSA", "OS", "CN", "DBMS", "HR"];
        const validDifficulty = ["easy", "medium", "hard"];

        const normalizedDifficulty = difficulty.toLowerCase();

        if (!validTopics.includes(topic) || !validDifficulty.includes(normalizedDifficulty)) {
            return res.status(400).json({
                success: false,
                message: "Invalid topic or difficulty"
            });
        }

        const existingPending = await Interview.findOne({
            user: req.user,
            status: "in-progress"
        });

        // if (existingPending) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "You already have a pending interview"
        //     });
        // }

        const question = await generateQuestion(topic, normalizedDifficulty);

        if (!question) {
            return res.status(500).json({
                success: false,
                message: "AI was not able to generate a question"
            });
        }
        console.log("Till here");
        const interview = await Interview.create({
            user: req.user,
            topic,
            questions: [
                {
                    question: question,
                    difficulty: normalizedDifficulty
                }
            ],
            currentQuestionIndex: 0,
            totalQuestions: questionNo,
        });

        return res.status(201).json({
            success: true,
            interviewId: interview._id,
            question: question
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }
});

// authMiddleware,

router.post('/answer', authMiddleware, async (req, res) => {
    try {
        const { interviewId, answer, questionId } = req.body;

        if (!interviewId || !answer || !questionId) {
            return res.status(400).json({
                success: false,
                message: "Interview ID, Question ID and answer are required"
            });
        };

        const interview = await Interview.findOne({
            _id: interviewId,
            user: req.user
        });

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found"
            });
        }

        if (interview.status == "completed") {
            return res.status(400).json({
                success: false,
                message: "Interview is already submitted",
            });
        }

        const question = interview.questions.id(questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found"
            });
        }

        if (question.userAnswer) {
            return res.status(400).json({
                success: false,
                message: "Question already answered"
            });
        }

        const response = await evaluateAnswer({
            topic: interview.topic,
            difficulty: question.difficulty,
            question: question.question,
            userAnswer: answer
        });

        let parsed;

        try {
            parsed = JSON.parse(response);
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: "AI returned invalid JSON format"
            });
        }

        // Defensive: coerce to numbers first so a missing/non-numeric field
        // doesn't silently become NaN and get saved to the database.
        parsed.clarity = Math.max(0, Math.min(10, Number(parsed.clarity) || 0));
        parsed.depth = Math.max(0, Math.min(10, Number(parsed.depth) || 0));
        parsed.correctness = Math.max(0, Math.min(10, Number(parsed.correctness) || 0));

        question.userAnswer = answer;
        question.clarity = parsed.clarity;
        question.depth = parsed.depth;
        question.correctness = parsed.correctness;

        question.score =
            Number(((parsed.clarity + parsed.depth + parsed.correctness) / 3).toFixed(2));
        question.strengths = parsed.strengths || [];
        question.weaknesses = parsed.weaknesses || [];
        question.improvedAnswer = parsed.improvedAnswer || "";
        question.conceptualGaps = parsed.conceptualGaps || [];
        question.feedback = parsed.feedback || "";
        question.evaluatedAt = Date.now();

        interview.currentQuestionIndex += 1;

        interview.currentQuestionIndex == interview.totalQuestions ? interview.status = "completed" : interview.status = "in-progress";
        interview.finalScore = (interview.finalScore || 0) + question.score;
        if (interview.currentQuestionIndex == interview.totalQuestions) {

            interview.finalScore =
                Number((interview.finalScore / interview.totalQuestions).toFixed(2));

            interview.status = "completed";

            await interview.save();
            invalidateAnalyticsCache(req.user);

            return res.json({
                success: true,
                message: "Interview Finished",
                finalScore: interview.finalScore,
            });
        }

        const newDifficulty = getNextDifficulty(question.difficulty, question.score);

        const nextQuestion = await generateQuestion(interview.topic, newDifficulty, interview.questions);

        if (!nextQuestion) {
            return res.status(500).json({
                success: false,
                message: "AI was not able to generate a question"
            });
        }

        interview.questions.push({
            question: nextQuestion,
            difficulty: newDifficulty,
        });

        await interview.save();

        const currentQuestionId =
            interview.questions[interview.currentQuestionIndex]._id;

        return res.status(201).json({
            success: true,
            interviewId: interview._id,
            question: nextQuestion,
            questionId: currentQuestionId,
        });


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});

router.post('/submit', authMiddleware, async (req, res) => {
    try {
        const { interviewId, answer } = req.body;

        if (!interviewId || !answer) {
            return res.status(400).json({
                success: false,
                message: "Interview ID and answer are required"
            });
        }

        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found",
            });
        }

        if (interview.status == "complete") {
            return res.status(400).json({
                success: false,
                message: "Interview is already submitted",
            });
        }

        const response = await evaluateAnswer({
            topic: interview.topic,
            difficulty: interview.difficulty,
            question: interview.question,
            userAnswer: answer
        });

        let parsed;

        try {
            parsed = JSON.parse(response);
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: "AI returned invalid JSON format"
            });
        }

        parsed.score = Math.max(0, Math.min(100, Number(parsed.score) || 0));

        interview.userAnswer = answer;
        interview.score = parsed.score;
        interview.strengths = parsed.strengths || [];
        interview.weaknesses = parsed.weaknesses || [];
        interview.conceptualGaps = parsed.conceptualGaps || [];
        interview.improvedAnswer = parsed.improvedAnswer || "";
        interview.status = "completed";

        await interview.save();
        invalidateAnalyticsCache(req.user);

        return res.json({
            success: true,
            evaluation: parsed
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.user;

        const interview = await Interview.find({
            user: userId,
            status: "completed",
        });

        if (interview.length == 0) {
            return res.json({
                success: true,
                stats: {
                    total: 0,
                    averageScore: 0,
                    strongestTopic: null,
                    weakestTopic: null,
                    topicWise: [],
                    recentTrend: []
                }
            })
        };

        const total = interview.length;
        let totalScore = 0;
        for (let i = 0; i < total; i++) {
            totalScore += interview[i].score || 0
        }

        const avgScore = totalScore / total;

        const topicMap = {};

        interview.forEach(i => {
            if (!topicMap[i.topic]) {
                topicMap[i.topic] = {
                    total: 0,
                    count: 0,
                }
            }

            topicMap[i.topic].total += i.score || 0;
            topicMap[i.topic].count += 1;
        });

        const topicWise = Object.keys(topicMap).map(topic => ({
            topic,
            average: topicMap[topic].total / topicMap[topic].count
        }));

        topicWise.sort((a, b) => b.average - a.average);

        const strongestTopic = topicWise[0]?.topic || null;
        const weakestTopic = topicWise[topicWise.length - 1]?.topic || null;

        const recentTrend = interview
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map(i => i.score);


        return res.json({
            success: true,
            stats: {
                total: total,
                totalScore: totalScore,
                averageScore: avgScore,
                strongestTopic: strongestTopic,
                weakestTopic: weakestTopic,
                topicWise: topicWise,
                recentTrend: recentTrend,
            }
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        })
    }
});

router.get("/history", authMiddleware, async (req, res) => {
    try {

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const skip = (page - 1) * limit;

        const [interviews, total] = await Promise.all([
            Interview.find({
                user: req.user,
                status: "completed"
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("topic finalScore status createdAt currentQuestionIndex")
                .lean(),

            Interview.countDocuments({
                user: req.user,
                status: "completed"
            })
        ]);

        return res.json({
            success: true,
            page,
            total,
            totalPages: Math.max(Math.ceil(total / limit), 1),
            interviews
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

router.get('/interviewDetails/:id', authMiddleware, async (req, res) => {
    try {
        const interviewId = req.params.id;

        const interview = await Interview.findOne({
            user: req.user,
            _id: interviewId
        });

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found"
            })
        }
        return res.status(200).json({
            success: true,
            interview
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

router.get("/:id/current", authMiddleware, async (req, res) => {

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
        interview.questions[interview.currentQuestionIndex].question;
    const difficulty =
        interview.questions[interview.currentQuestionIndex].difficulty;
    const id =
        interview.questions[interview.currentQuestionIndex]._id;

    return res.json({
        success: true,
        question: currentQuestion,
        totalQuestions: interview.totalQuestions,
        currentQuestionIndex: interview.currentQuestionIndex,
        topic: interview.topic,
        difficulty: difficulty,
        id: id
    });
});


router.get("/report/:id", authMiddleware, async (req, res) => {
    try {
        const interview = await Interview.findOne({
            _id: req.params.id,
            // user: req.user
        }).lean();

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found"
            });
        }

        const questions = interview.questions;

        if (!questions.length) {
            return res.status(400).json({
                success: false,
                message: "Interview has no questions"
            });
        }

        let totalClarity = 0;
        let totalDepth = 0;
        let totalCorrectness = 0;
        let testCasePass = 0;
        let totalTestCases = 0;
        let readability = 0;
        let modularity = 0;
        let naming = 0;
        // let readability = 0;

        questions.forEach(q => {
            totalClarity += q.clarity || 0;
            totalDepth += q.depth || 0;
            totalCorrectness += q.correctness || 0;
            testCasePass += q.passedTestCases || 0;
            totalTestCases += q.totalTestCases || 0;
            readability += q.codeQuality?.readability || 0;
            modularity += q.codeQuality?.modularity || 0,
                naming += q.codeQuality?.naming || 0;
        });

        const avgClarity = Number((totalClarity / questions.length).toFixed(2));
        const avgDepth = Number((totalDepth / questions.length).toFixed(2));
        const avgCorrectness = Number(((totalCorrectness / questions.length) / 10).toFixed(2));
        console.log("total correctness ", totalCorrectness, "questions length ", questions.length);
        const testCasePassPercentage = totalTestCases > 0
            ? Number(((testCasePass / totalTestCases) * 10).toFixed(2))
            : 0;
        const codeQuality = Number(((readability + modularity + naming) / (questions.length * 3)).toFixed(0));
        console.log("modularity ", modularity, " readability ", readability, " naming ", naming, " codeQuality ", codeQuality);
        let metrics = {};
        if (interview.topic == "DSA") {
            metrics = {

                correctness: avgCorrectness,
                testCasePassPercentage: testCasePassPercentage,
                codeQuality: codeQuality,
            };
        } else {
            metrics = {
                clarity: avgClarity,
                depth: avgDepth,
                correctness: avgCorrectness,

            };
        }


        const sorted = Object.entries(metrics).sort((a, b) => b[1] - a[1]);
        const strongestArea = sorted[0][0];
        const weakestArea = sorted[sorted.length - 1][0];
        // console.log(questions[0].passedTestCases);
        // console.log(questions[0].totalTestCases);

        const formattedQuestions = questions.map(q => ({

            id: q._id,
            type: q.type,
            question: q.question,
            difficulty: q.difficulty,
            userAnswer: q.userAnswer,
            language: q.language,
            code: q.code,
            clarity: q.clarity,
            depth: q.depth,
            correctness: q.correctness,
            testCasePassPercentage: q.totalTestCases
                ? Number(((q.passedTestCases / q.totalTestCases) * 100).toFixed(2))
                : null,
            score: q.score,
            readability: q.codeQuality?.readability != null ? q.codeQuality.readability * 10 : null,
            modularity: q.codeQuality?.modularity != null ? q.codeQuality.modularity * 10 : null,
            naming: q.codeQuality?.naming != null ? q.codeQuality.naming * 10 : null,
            strengths: q.strengths,
            weaknesses: q.weaknesses,
            edgeCaseIssues: q.edgeCaseIssues,
            conceptualGaps: q.conceptualGaps,
            feedback: q.feedback,
            improvedAnswer: q.improvedAnswer
        }));

        // console.log(formattedQuestions);


        return res.json({
            success: true,
            interview: {
                topic: interview.topic,
                finalScore: interview.finalScore,
                createdAt: interview.createdAt,
                totalQuestions: questions.length
            },
            analytics: {
                averageClarity: avgClarity,
                averageDepth: avgDepth,
                averageCorrectness: avgCorrectness,
                averageTestCasePassPercentage: testCasePassPercentage,
                averageCodeQuality: codeQuality,
                strongestArea,
                weakestArea
            },
            questions: formattedQuestions
        });

    } catch (error) {
        console.error("Report API error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

router.get("/analytics/overall", authMiddleware, async (req, res) => {
    try {
        const cached = getCachedAnalytics(req.user);
        if (cached) {
            return res.status(200).json(cached);
        }

        const allInterviews = await Interview.find({
            user: req.user,
            status: "completed"
        }).lean();

        const totalInterviews = allInterviews.length;
        let avgScoreSum = 0;

        const topics = {
            DSA: { total: 0, count: 0 },
            OS: { total: 0, count: 0 },
            CN: { total: 0, count: 0 },
            DBMS: { total: 0, count: 0 },
            HR: { total: 0, count: 0 },
        };

        allInterviews.forEach((i) => {
            const score = i.finalScore || 0;
            avgScoreSum += score;
            const topic = i.topic;
            if (topics[topic]) {
                topics[topic].total += score;
                topics[topic].count += 1;
            }
        });

        const avgScore = totalInterviews === 0 ? "0.00" : (avgScoreSum / totalInterviews).toFixed(2);

        let correctness = 0;
        let clarity = 0;
        let depth = 0;
        const gaps = [];

        allInterviews.forEach(interview => {
            (interview.questions || []).forEach(q => {
                correctness += q.correctness || 0;
                clarity += q.clarity || 0;
                depth += q.depth || 0;

                if (Array.isArray(q.conceptualGaps)) {
                    gaps.push(...q.conceptualGaps);
                }
            });
        });

        const metrics = { clarity, depth, correctness };
        const sortedMetrics = Object.entries(metrics).sort((a, b) => b[1] - a[1]);
        const strongestArea = sortedMetrics[0][0];
        const weakestArea = sortedMetrics[sortedMetrics.length - 1][0];

        const limitedGaps = gaps.slice(0, 100);
        const normalizedGaps = await NormalizeConceptualGaps(limitedGaps);

        const gapFrequency = {};
        normalizedGaps.forEach(g => {
            if (!g) return;
            gapFrequency[g] = (gapFrequency[g] || 0) + 1;
        });

        const topGaps = Object.entries(gapFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([gap, count]) => ({ concept: gap, frequency: count }));

        const responsePayload = {
            success: true,
            totalInterviews,
            avgScore,
            strongestArea,
            weakestArea,
            topics,
            topGaps,
        };

        setCachedAnalytics(req.user, responsePayload);

        return res.status(200).json(responsePayload);

    } catch (error) {
        console.error("analytics/overall error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server Error",
        });
    }
});

//question
// userAnswer
// score
// strengths
// weaknesses
// improvedAnswer
// conceptualGaps

module.exports = router;