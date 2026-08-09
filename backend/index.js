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

// app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', require("./routes/authRoutes"));
app.use('/api/interview', require("./routes/interviewRoutes.js"));
app.use('/api/interview', require("./routes/dsaInterview.js"));


app.listen(8000, () => {
    console.log("Server listening on port 8000");
});