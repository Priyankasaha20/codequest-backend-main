import Session from "../models/Session.js";

export async function getStats(req, res, next) {
  try {
    const userId = req.user._id;
    const totalSessions = await Session.countDocuments({ user: userId });
    const sessions = await Session.find({ user: userId, status: "completed" });

    const avgScore = sessions.length
      ? sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length
      : 0;

    const practiceMs = sessions.reduce((sum, s) => {
      if (s.startedAt && s.endedAt) return sum + (s.endedAt - s.startedAt);
      return sum;
    }, 0);
    const practiceHours = Math.round(practiceMs / (1000 * 60 * 60));

    const skillsSet = new Set();
    sessions.forEach((s) => {
      (s.feedback || []).forEach((f) =>
        (f.improvements || []).forEach((i) => skillsSet.add(i))
      );
    });

    res.json({
      totalSessions,
      avgScore: Number(avgScore.toFixed(1)),
      practiceTime: `${practiceHours}h`,
      skillsImproved: skillsSet.size,
    });
  } catch (err) {
    next(err);
  }
}
