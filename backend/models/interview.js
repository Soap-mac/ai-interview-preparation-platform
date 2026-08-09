const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({

    type: {
        type: String,
        enum: ["text", "code"],
        default: "text"
    },

    question: String,

    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"]
    },

    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

    // -------- TEXT QUESTIONS --------

    userAnswer: {
        type: String,
        default: null
    },

    clarity: {
        type: Number,
        default: null
    },

    depth: {
        type: Number,
        default: null
    },

    // -------- CODING QUESTIONS --------

    language: {
        type: String,
        default: null
    },

    code: {
        type: String,
        default: null
    },

    output: {
        type: String,
        default: null
    },

    passedTestCases: {
        type: Number,
        default: null
    },

    totalTestCases: {
        type: Number,
        default: null
    },

    timeComplexity: {
        type: String,
        default: null
    },

    spaceComplexity: {
        type: String,
        default: null
    },

    codeQuality: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

    optimizationSuggestions: {
        type: [String],
        default: null
    },

    edgeCaseIssues: {
        type: [String],
        default: null
    },

    // -------- COMMON EVALUATION --------

    correctness: {
        type: Number,
        default: null
    },

    score: {
        type: Number,
        default: null
    },

    strengths: {
        type: [String],
        default: []
    },

    weaknesses: {
        type: [String],
        default: []
    },

    improvedAnswer: {
        type: String,
        default: null
    },

    conceptualGaps: {
        type: [String],
        default: []
    },

    feedback: {
        type: String,
        default: null
    },

    evaluatedAt: {
        type: Date,
        default: null
    }

});

const interviewSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    topic: {
        type: String,
        enum: ["DSA", "OS", "CN", "DBMS", "HR"],
        required: true
    },

    questions: [questionSchema],

    totalQuestions: {
        type: Number,
        required: true
    },

    currentQuestionIndex: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ["in-progress", "completed"],
        default: "in-progress"
    },

    finalScore: {
        type: Number,
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model("Interview", interviewSchema);