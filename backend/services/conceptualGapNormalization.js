const groq = require('../utils/aiClient');

const NormalizeConceptualGaps = async (conceptualGaps) => {

    const gaps = conceptualGaps.slice(0, 100);

    const prompt = `
You are an expert computer science interviewer and educator.

Your task is to normalize a list of conceptual gaps identified during interview evaluations.

The input list may contain multiple phrases that mean the same concept but are written differently.

Your job:
1. Group semantically similar gaps into a single canonical concept.
2. Return the normalized concept for EACH input gap (do not remove items).
3. Use short concept labels (2–5 words).
4. Concepts should represent real technical topics.

Rules:
- Output array length must match input array length.
- Each element must correspond to the same index input.
- Do NOT include explanations.
- Do NOT include numbering.
- Return ONLY valid JSON.
- No backticks.
- No text outside JSON.

Conceptual Gaps:
${JSON.stringify(gaps)}
`;

    try {
        const res = await groq.responses.create({
            model: "openai/gpt-oss-20b",
            input: prompt,
            temperature: 0.2
        });

        return res.output_text.trim();

    } catch (error) {
        console.log("AI Error in conceptual gap normalization:", error);
        throw new Error("AI conceptual gap normalization failed");
    }
};

module.exports = NormalizeConceptualGaps;