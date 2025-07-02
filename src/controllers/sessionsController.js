import Session from "../models/Session.js";
import InterviewType from "../models/InterviewType.js";
import aiService from "../services/aiService.js";

export async function startSession(req, res, next) {
  try {
    const { userId, typeSlug } = req.body;

    // Validate required fields
    if (!userId || !typeSlug) {
      return res.status(400).json({
        error: "Missing required fields: userId and typeSlug",
      });
    }

    const type = await InterviewType.findOne({ slug: typeSlug });
    if (!type) {
      return res.status(404).json({ error: "Interview type not found" });
    }

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

    // Validate input
    if (!question || !answer) {
      return res
        .status(400)
        .json({ error: "Question and answer are required" });
    }

    // Find the session
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Get AI feedback
    const feedback = await aiService.evaluate(session.type, question, answer);

    // Add feedback to session
    session.feedback.push(feedback);
    await session.save();

    // Get next question
    const nextQuestion = await aiService.getNextQuestion(session.type);

    // Return response
    res.json({
      feedback,
      nextQuestion,
      progress: {
        questionsAnswered: session.feedback.length,
        sessionStatus: session.status,
      },
    });
  } catch (err) {
    console.error("Error submitting answer:", err);
    next(err);
  }
}

export async function completeSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.endedAt = new Date();
    session.status = "completed";
    session.score =
      session.feedback.reduce((sum, f) => sum + (f.score || 0), 0) /
      (session.feedback.length || 1);
    await session.save();
    res.json(session);
  } catch (err) {
    console.error("Error completing session:", err);
    next(err);
  }
}

export async function getUserSessions(req, res, next) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const sessions = await Session.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("type");

    res.json(sessions);
  } catch (err) {
    console.error("Error getting user sessions:", err);
    next(err);
  }
}
