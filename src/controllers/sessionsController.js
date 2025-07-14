// src/controllers/sessionsController.js
import InterviewType from "../models/InterviewType.js";
import Session from "../models/Session.js";
import aiService from "../services/aiService.js";

export const startSession = async (req, res, next) => {
  try {
    const { interviewTypeId } = req.body;
    const it = await InterviewType.findById(interviewTypeId);
    if (!it) return res.status(404).json({ error: "Interview type not found" });

    const session = await Session.create({
      user: req.user.id,
      interviewType: it._id,
      questions: it.questions, // assume your InterviewType holds an array of Qs
      answers: [],
    });

    res.json({
      sessionId: session._id,
      questions: session.questions,
    });
  } catch (err) {
    next(err);
  }
};

export const submitAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionIndex, answer } = req.body;
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Add the text answer directly to the session (no need for audio processing)
    session.answers.push({ questionIndex, text: answer });
    await session.save();

    res.json({ text: answer, received: true });
  } catch (err) {
    next(err);
  }
};


export const completeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    // evaluate answers → feedback & per-Q score
    const evaluations = await aiService.evaluate(
      session.questions,
      session.answers
    );
    session.feedback = evaluations.map((ev) => ev.feedback);
    session.scores = evaluations.map((ev) => ev.score);
    session.totalScore = evaluations.reduce((sum, ev) => sum + ev.score, 0);

    // overall summary
    session.summary = await aiService.summarize(
      session.questions,
      session.answers,
      session.feedback
    );

    await session.save();

    res.json({
      questions: session.questions,
      answers: session.answers,
      feedback: session.feedback,
      scores: session.scores,
      totalScore: session.totalScore,
      summary: session.summary,
    });
  } catch (err) {
    next(err);
  }
};

export const getResults = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    res.json({
      questions: session.questions,
      answers: session.answers,
      feedback: session.feedback,
      scores: session.scores,
      totalScore: session.totalScore,
      summary: session.summary,
    });
  } catch (err) {
    next(err);
  }
};


export const getUserSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user.id })
      .populate("interviewType")
      .sort({ createdAt: -1 });

    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

