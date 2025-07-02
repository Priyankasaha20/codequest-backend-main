import OpenAI from "openai";
import InterviewType from "../models/InterviewType.js";
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
    try {
      // Get the interview type with all questions
      const interviewType = await InterviewType.findById(typeId).exec();

      if (
        !interviewType ||
        !interviewType.questions ||
        interviewType.questions.length === 0
      ) {
        return "Thank you for your responses. The interview is now complete.";
      }

      // Return a random question from the available questions
      const randomIndex = Math.floor(
        Math.random() * interviewType.questions.length
      );
      return interviewType.questions[randomIndex];
    } catch (error) {
      console.error("Error fetching next question:", error);
      return "Could not fetch the next question. Please try again.";
    }
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
