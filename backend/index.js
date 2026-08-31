const express = require('express');
const app = express();
require('dotenv').config();

const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

require('./databases/connection');

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10
});

app.use('/api/auth', require("./routes/authRoutes"));
app.use('/api/interview', require("./routes/interviewRoutes.js"));
app.use('/api/interview', require("./routes/dsaInterview.js"));


app.use((err, req, res, next) => {
    console.error("Unhandled route error:", err);
    if (res.headersSent) return next(err);
    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
});

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

app.listen(8000, () => {
    console.log("Server listening on port 8000");
});