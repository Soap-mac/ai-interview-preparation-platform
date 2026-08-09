const openai = require("openai");

const groq = new openai({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
})

module.exports = groq;