// src/controllers/sessionsController.js
const InterviewType = require('../models/InterviewType');
const Session       = require('../models/Session');
const speechService = require('../services/speechService');
const aiService     = require('../services/aiService');

exports.startSession = async (req, res, next) => {
  try {
    const { interviewTypeId } = req.body;
    const it = await InterviewType.findById(interviewTypeId);
    if (!it) return res.status(404).json({ error: 'Interview type not found' });

    const session = await Session.create({
      user: req.user.id,
      interviewType: it._id,
      questions: it.questions,      // assume your InterviewType holds an array of Qs
      answers: []
    });

    res.json({
      sessionId: session._id,
      questions: session.questions
    });
  } catch (err) {
    next(err);
  }
};

exports.handleAudioChunk = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { questionIndex } = req.body;
    const audioBuffer = req.file.buffer;

    // transcribe to text
    const text = await speechService.transcribe(audioBuffer);

    // append answer
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    session.answers.push({ questionIndex, text });
    await session.save();

    res.json({ text });
  } catch (err) {
    next(err);
  }
};

exports.completeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // evaluate answers → feedback & per-Q score
    const evaluations = await aiService.evaluate(
      session.questions,
      session.answers
    );
    session.feedback = evaluations.map(ev => ev.feedback);
    session.scores   = evaluations.map(ev => ev.score);
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
      answers:   session.answers,
      feedback:  session.feedback,
      scores:    session.scores,
      totalScore: session.totalScore,
      summary:   session.summary
    });
  } catch (err) {
    next(err);
  }
};

exports.getResults = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.json({
      questions: session.questions,
      answers:   session.answers,
      feedback:  session.feedback,
      scores:    session.scores,
      totalScore: session.totalScore,
      summary:   session.summary
    });
  } catch (err) {
    next(err);
  }
};
