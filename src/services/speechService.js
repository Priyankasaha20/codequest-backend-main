// src/services/speechService.js
import fs from "fs/promises";
import OpenAI from "openai";
const openai = new OpenAI();

export async function transcribeAudio(buffer, mimeType) {
  // Whisper endpoint expects a file on disk
  const tmpPath = `/tmp/${Date.now()}.${mimeType.split("/")[1]}`;
  await fs.writeFile(tmpPath, buffer);
  const resp = await openai.audio.transcriptions.create({
    file: fs.createReadStream(tmpPath),
    model: "whisper-1",
  });
  await fs.unlink(tmpPath);
  return resp.text;
}

export async function summarizeSessionFeedback(feedbackArray) {
  // Build a prompt listing all Q/A+feedback
  const prompt =
    "You are an interview coach. Here are the Q&A pairs and feedback:\n\n" +
    feedbackArray
      .map(
        ({ question, summary, score, improvements }, i) =>
          `Q${i + 1}: ${question}\n` +
          `Feedback summary: ${summary}\n` +
          `Score: ${score}\n` +
          `Improvements: ${improvements.join(", ")}\n`
      )
      .join("\n") +
    "\n\nPlease provide an overall summary of the candidate’s performance, highlight strengths, and key areas to improve.";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  return completion.choices[0].message.content.trim();
}
