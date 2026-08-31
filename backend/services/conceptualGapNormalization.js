const groq = require('../utils/aiClient');

const MAX_GAPS = 100;

const NormalizeConceptualGaps = async (conceptualGaps) => {
    const gaps = Array.isArray(conceptualGaps) ? conceptualGaps.slice(0, MAX_GAPS) : [];

    // Nothing to normalize — skip the AI call entirely. Saves tokens and
    // avoids asking the model to process an empty list for no reason.
    if (gaps.length === 0) {
        return [];
    }

    const prompt = `
You are an expert computer science interviewer and educator.

Your task is to normalize a list of conceptual gaps identified during interview evaluations.

The input list may contain multiple phrases that mean the same concept but are written differently.

Your job:
1. Group semantically similar gaps into a single canonical concept.
2. Return the normalized concept for EACH input gap (do not remove items).
3. Use short concept labels (2-5 words).
4. Concepts should represent real technical topics.

Rules:
- The "normalized" array length MUST exactly match the number of input gaps below.
- Each element corresponds to the same index in the input list.
- Do NOT include explanations, numbering, or markdown.

Conceptual Gaps (${gaps.length} items):
${JSON.stringify(gaps)}
`;

    try {
        const res = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            max_tokens: 2000,
            temperature: 0.2,
            messages: [
                { role: "system", content: "Return ONLY valid JSON matching the given schema. No markdown, no backticks, no explanation." },
                { role: "user", content: prompt }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "normalized_gaps",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            normalized: {
                                type: "array",
                                items: { type: "string" }
                            }
                        },
                        required: ["normalized"],
                        additionalProperties: false
                    }
                }
            }
        });

        const parsed = JSON.parse(res.choices[0].message.content);
        const normalized = Array.isArray(parsed.normalized) ? parsed.normalized : [];

        // Defensive: the model is instructed to match input length exactly,
        // but never trust that blindly. If it doesn't match, fall back to
        // the original raw gap text for any missing entries instead of
        // crashing or silently losing data.
        if (normalized.length === gaps.length) {
            return normalized;
        }

        console.warn(`Conceptual gap normalization length mismatch: expected ${gaps.length}, got ${normalized.length}. Falling back to raw labels for the difference.`);
        const result = [];
        for (let i = 0; i < gaps.length; i++) {
            result.push(normalized[i] || gaps[i]);
        }
        return result;

    } catch (error) {
        console.error("AI Error in conceptual gap normalization:", error.message);
        return gaps;
    }
};

module.exports = NormalizeConceptualGaps;