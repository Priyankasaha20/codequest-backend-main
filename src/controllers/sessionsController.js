import Session from "../models/Session.js";
import InterviewType from "../models/InterviewType.js";
import aiService from "../services/aiService.js";

export async function startSession(req, res, next) {
  try {
    const userId = req.user._id;
    const { typeSlug } = req.body;
    const type = await InterviewType.findOne({ slug: typeSlug });
    const session = await Session.create({
      user: userId,
      type: type._id,
      startedAt: new Date(),
    });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

export async function submitAnswer(req, res, next) {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;
    const session = await Session.findById(id);

    const feedback = await aiService.evaluate(session.type, question, answer);
    session.feedback.push(feedback);
    await session.save();

    const nextQuestion = await aiService.getNextQuestion(session.type);
    res.json({ feedback, nextQuestion });
  } catch (err) {
    next(err);
  }
}

export async function completeSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    session.endedAt = new Date();
    session.status = "completed";
    session.score =
      session.feedback.reduce((sum, f) => sum + (f.score || 0), 0) /
      (session.feedback.length || 1);
    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
}
