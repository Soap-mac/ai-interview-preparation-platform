const groq = require("../utils/aiClient");

const generateQuestion = async (topic, difficulty, previousQuestions = []) => {

    const history = previousQuestions.length
        ? previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
        : "None";

    const prompt = `
You are a strict technical interviewer.

Your task is to generate ONE interview question.

Interview Context:
Topic: ${topic}
Difficulty: ${difficulty}

Rules:
- Ask exactly ONE question.
- Do NOT repeat or closely resemble any previous questions.
- Focus on a different concept within the topic.
- The question should test understanding, not simple definitions.
- Keep the question clear and concise.
- Maximum length: 2 sentences.

The question should be one of the following types:
- conceptual understanding
- scenario/problem-solving
- design/implementation

Output Rules:
- Return ONLY the question.
- No numbering.
- No explanations.
- No extra text.
- Plain text only.

Previously Asked Questions:
${history}
`;

    try {

        const res = await groq.responses.create({
            model: "llama-3.3-70b-versatile",
            input: prompt,
            temperature: 0.4
        });

        if (!res.output_text) {
            throw new Error("AI returned empty question");
        }

        let question = res.output_text.trim();

        question = question
            .replace(/^["']|["']$/g, "")
            .replace(/^Question:\s*/i, "")
            .trim();

        return question;

    } catch (error) {
        console.error("Question generation failed:", error);
        throw new Error("AI question generation failed");
    }
};

module.exports = generateQuestion;