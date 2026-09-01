const groq = require("../utils/aiClient");

const generateQuestion = async (topic, difficulty, previousQuestions = []) => {

    const historyList = (previousQuestions || []).map(q => {
        if (typeof q === "string") return q;
        if (q && typeof q === "object" && typeof q.question === "string") return q.question;
        return null;
    }).filter(Boolean);

    const history = historyList.length
        ? historyList.map((q, i) => `${i + 1}. ${q}`).join("\n")
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
        const res = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            max_completion_tokens: 512,
            reasoning_effort: "low",
            include_reasoning: false,
            temperature: 0.4,
            messages: [
                {
                    role: "system",
                    content: "Return ONLY the interview question. Plain text only."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        const rawQuestion = res?.choices?.[0]?.message?.content;

        if (!rawQuestion?.trim()) {
            console.error("Empty AI response:", JSON.stringify(res, null, 2));
            throw new Error("AI returned empty question");
        }

        const question = rawQuestion
            .trim()
            .replace(/^["']|["']$/g, "")
            .replace(/^Question:\s*/i, "")
            .trim();

        return question;

    } catch (error) {
        console.error("Question generation failed:", error.message);
        throw new Error("AI question generation failed");
    }
};

module.exports = generateQuestion;