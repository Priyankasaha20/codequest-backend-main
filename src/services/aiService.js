import OpenAI from "openai";
const openai = new OpenAI();

export default {
  async evaluate(typeId, question, answer) {
    const prompt = `Evaluate this answer for interview type ${typeId}: ${question}\nAnswer: ${answer}`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    const raw = completion.choices[0].message.content;
    return parseAI(raw, question);
  },

  async getNextQuestion(typeId) {
    // stubbed: replace with real bank or LLM prompt
    return `What is your approach to the next ${typeId} problem?`;
  },
};

function parseAI(raw, question) {
  const lines = raw.split("\n");
  const summary = lines[0] || "";
  const scoreLine = lines.find((l) => l.toLowerCase().includes("score:"));
  const score = scoreLine ? parseFloat(scoreLine.split(":")[1]) : null;
  const improvements = lines
    .filter((l) => l.startsWith("-"))
    .map((l) => l.slice(1).trim());
  return { question, summary, score, improvements };
}
