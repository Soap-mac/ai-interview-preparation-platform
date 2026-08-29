require("dotenv").config();

const OpenAI = require("openai");

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

async function test() {
    try {
        const models = await groq.models.list();

        console.log(
            models.data.map(model => model.id)
        );
    } catch (error) {
        console.error(error);
    }
}

test();