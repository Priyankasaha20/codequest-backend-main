// ------------------------------------------------------------
// Mongoose models for the entire CodeQuest / PrepPortal backend
// ------------------------------------------------------------
// Each section is a standalone file in /models.  Copy‑paste or split
// them as you wish.  All schemas use mongoose timestamps (createdAt,
// updatedAt) and follow the naming conventions in the schema blueprint.

import { Schema, model, Types } from "mongoose";

/* ------------------------------------------------------------------
   1 · AUTH & IDENTITY
-------------------------------------------------------------------*/
// models/User.js
const profileSchema = new Schema(
  {
    provider: { type: String, enum: ["google", "github", "linkedin"] },
    providerId: String,
    username: String,
    accessToken: String,
    refreshToken: String,
    lastSynced: Date,
  },
  { _id: false }
);

const statsSnapshotSchema = new Schema(
  {
    problemsSolved: Number,
    successRate: Number,
    currentStreak: Number,
    contestRating: Number,
    lastUpdate: Date,
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: { type: String, lowercase: true, unique: true, sparse: true },
    passwordHash: String,
    name: String,
    image: String,
    bio: String,
    location: String,
    graduationYear: Number,
    social: {
      github: String,
      linkedin: String,
      portfolio: String,
    },
    profiles: [profileSchema], // OAuth links (optional)
    statsSnapshot: statsSnapshotSchema, // Dashboard metrics
    deletedAt: Date,
  },
  { timestamps: true }
);
export const User = model("User", userSchema);

// models/Account.js (only if you want a separate link table)
const accountSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", index: true },
    provider: { type: String, enum: ["google", "github", "linkedin"] },
    providerId: String,
    username: String,
    accessToken: String,
    refreshToken: String,
  },
  { timestamps: true }
);
accountSchema.index({ provider: 1, providerId: 1 }, { unique: true });
export const Account = model("Account", accountSchema);

/* ------------------------------------------------------------------
   2 · PROBLEM BANK & SUBMISSIONS
-------------------------------------------------------------------*/
// models/Problem.js
const problemSchema = new Schema(
  {
    slug: { type: String, unique: true },
    title: String,
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], index: true },
    topics: { type: [String], index: true },
    companyTags: [String],
    description: String, // markdown
    constraints: [String],
    examples: [{ input: String, output: String, explanation: String }],
    starterCode: Schema.Types.Mixed, // { cpp, python, java, ... }
    stats: {
      attempts: { type: Number, default: 0 },
      accepted: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);
export const Problem = model("Problem", problemSchema);

// models/Testcase.js
const testcaseSchema = new Schema({
  problemId: { type: Types.ObjectId, ref: "Problem", index: true },
  input: String,
  expected: String,
  isSample: { type: Boolean, default: false, index: true },
  weight: { type: Number, default: 1 },
});
export const Testcase = model("Testcase", testcaseSchema);

// models/Language.js (static seed)
const languageSchema = new Schema({
  _id: String, // "cpp", "python" ...
  judge0Id: Number,
  displayName: String,
});
export const Language = model("Language", languageSchema);

// models/Submission.js
const submissionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", index: true },
    problemId: { type: Types.ObjectId, ref: "Problem", index: true },
    contestId: { type: Types.ObjectId, ref: "Contest" },
    companySetId: { type: Types.ObjectId, ref: "CompanySet" },
    language: { type: String, ref: "Language" },
    sourceCode: String,
    judge0: {
      token: String,
      status: Schema.Types.Mixed,
      stdout: String,
      stderr: String,
      time: String,
      memory: String,
    },
    verdict: String,
    score: Number,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
export const Submission = model("Submission", submissionSchema);

// models/UserProblemStat.js
const userProblemStatSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", index: true },
  problemId: { type: Types.ObjectId, ref: "Problem", index: true },
  solved: Boolean,
  attempts: Number,
  bestTimeSec: Number,
  lastSubmissionId: { type: Types.ObjectId, ref: "Submission" },
  firstSolvedAt: Date,
});
userProblemStatSchema.index({ userId: 1, problemId: 1 }, { unique: true });
export const UserProblemStat = model("UserProblemStat", userProblemStatSchema);

// models/TopicProgress.js
const topicProgressSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", index: true },
  topic: { type: String, index: true },
  solved: Number,
  total: Number,
  percentage: Number,
});
topicProgressSchema.index({ userId: 1, topic: 1 }, { unique: true });
export const TopicProgress = model("TopicProgress", topicProgressSchema);

/* ------------------------------------------------------------------
   3 · DAILY CHALLENGE
-------------------------------------------------------------------*/
// models/DailyChallenge.js
const dailyChallengeSchema = new Schema({
  _id: String, // ISO date "2025-06-26"
  problemId: { type: Types.ObjectId, ref: "Problem" },
  difficulty: String,
  points: Number,
});
export const DailyChallenge = model("DailyChallenge", dailyChallengeSchema);

// models/UserDailyAttempt.js
const userDailyAttemptSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", index: true },
  challengeId: { type: String, ref: "DailyChallenge", index: true },
  submissionId: { type: Types.ObjectId, ref: "Submission" },
  score: Number,
  completedAt: Date,
});
userDailyAttemptSchema.index({ userId: 1, challengeId: 1 }, { unique: true });
export const UserDailyAttempt = model(
  "UserDailyAttempt",
  userDailyAttemptSchema
);

/* ------------------------------------------------------------------
   4 · LEARNING TRACKS
-------------------------------------------------------------------*/
// models/LearningTrack.js
const learningTrackSchema = new Schema(
  {
    title: String,
    order: [Types.ObjectId], // array of module ids
  },
  { timestamps: true }
);
export const LearningTrack = model("LearningTrack", learningTrackSchema);

// models/LearningModule.js
const learningModuleSchema = new Schema(
  {
    trackId: { type: Types.ObjectId, ref: "LearningTrack", index: true },
    title: String,
    description: String,
    videoUrl: String,
    articleUrl: String,
    order: Number,
    points: Number,
  },
  { timestamps: true }
);
export const LearningModule = model("LearningModule", learningModuleSchema);

// models/UserModuleProgress.js
const userModuleProgressSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", index: true },
  moduleId: { type: Types.ObjectId, ref: "LearningModule", index: true },
  status: { type: String, enum: ["NotStarted", "InProgress", "Done"] },
  percentage: Number,
  startedAt: Date,
  completedAt: Date,
});
userModuleProgressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });
export const UserModuleProgress = model(
  "UserModuleProgress",
  userModuleProgressSchema
);

/* ------------------------------------------------------------------
   5 · QUIZZES
-------------------------------------------------------------------*/
// models/Quiz.js
const quizSchema = new Schema(
  {
    slug: { type: String, unique: true },
    title: String,
    subject: String,
    totalQuestions: Number,
    timeLimitSec: Number,
  },
  { timestamps: true }
);
export const Quiz = model("Quiz", quizSchema);

// models/QuizQuestion.js
const quizQuestionSchema = new Schema({
  quizId: { type: Types.ObjectId, ref: "Quiz", index: true },
  order: Number,
  type: { type: String, enum: ["mcq", "tf"] },
  question: String,
  options: [{ text: String, isCorrect: Boolean }],
});
export const QuizQuestion = model("QuizQuestion", quizQuestionSchema);

// models/QuizAttempt.js
const quizAttemptSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", index: true },
  quizId: { type: Types.ObjectId, ref: "Quiz", index: true },
  score: Number,
  answers: [{ questionId: Types.ObjectId, chosen: Schema.Types.Mixed }],
  startedAt: Date,
  finishedAt: Date,
});
quizAttemptSchema.index({ userId: 1, quizId: 1 });
export const QuizAttempt = model("QuizAttempt", quizAttemptSchema);

/* ------------------------------------------------------------------
   6 · COMPANY PREP
-------------------------------------------------------------------*/
// models/CompanySet.js
const companySetSchema = new Schema(
  {
    company: String,
    title: String,
    badgeName: String,
    problemIds: [Types.ObjectId],
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  { timestamps: true }
);
export const CompanySet = model("CompanySet", companySetSchema);

// models/UserCompanyProgress.js
const userCompanyProgressSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", index: true },
  companySetId: { type: Types.ObjectId, ref: "CompanySet", index: true },
  completedProblems: [Types.ObjectId],
  finishedAt: Date,
});
userCompanyProgressSchema.index(
  { userId: 1, companySetId: 1 },
  { unique: true }
);
export const UserCompanyProgress = model(
  "UserCompanyProgress",
  userCompanyProgressSchema
);

/* ------------------------------------------------------------------
   7 · BADGES & ACHIEVEMENTS
-------------------------------------------------------------------*/
// models/Badge.js
const badgeSchema = new Schema({
  title: String,
  rarity: { type: String, enum: ["Gold", "Silver", "Bronze"] },
  icon: String,
  criteria: Schema.Types.Mixed, // flexible JSON rule
});
export const Badge = model("Badge", badgeSchema);

// models/UserBadge.js
const userBadgeSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", index: true },
  badgeId: { type: Types.ObjectId, ref: "Badge", index: true },
  earnedAt: Date,
});
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
export const UserBadge = model("UserBadge", userBadgeSchema);

/* ------------------------------------------------------------------
   8 · AI INTERVIEW COACH
-------------------------------------------------------------------*/
// models/InterviewTemplate.js
const interviewTemplateSchema = new Schema({
  title: String,
  icon: String,
  durationMin: Number,
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
  description: String,
});
export const InterviewTemplate = model(
  "InterviewTemplate",
  interviewTemplateSchema
);

// models/InterviewSession.js
const interviewSessionSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", index: true },
  templateId: { type: Types.ObjectId, ref: "InterviewTemplate" },
  company: String,
  startedAt: Date,
  finishedAt: Date,
  score: Number,
  feedbackSummary: String,
  improvementTips: [String],
});
export const InterviewSession = model(
  "InterviewSession",
  interviewSessionSchema
);

// models/InterviewTurn.js
const interviewTurnSchema = new Schema({
  sessionId: { type: Types.ObjectId, ref: "InterviewSession", index: true },
  order: Number,
  question: String,
  transcript: String,
  aiNotes: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});
export const InterviewTurn = model("InterviewTurn", interviewTurnSchema);

/* ------------------------------------------------------------------
   9 · CONTESTS
-------------------------------------------------------------------*/
// models/Contest.js
const contestSchema = new Schema(
  {
    name: String,
    startAt: Date,
    endAt: Date,
    problemIds: [Types.ObjectId],
    state: {
      type: String,
      enum: ["Upcoming", "Running", "Finished"],
      index: true,
    },
  },
  { timestamps: true }
);
export const Contest = model("Contest", contestSchema);

// models/ContestRegistration.js
const contestRegistrationSchema = new Schema({
  contestId: { type: Types.ObjectId, ref: "Contest", index: true },
  userId: { type: Types.ObjectId, ref: "User", index: true },
  registeredAt: Date,
});
contestRegistrationSchema.index({ contestId: 1, userId: 1 }, { unique: true });
export const ContestRegistration = model(
  "ContestRegistration",
  contestRegistrationSchema
);

/* ------------------------------------------------------------------
   10 · MULTIPLAYER ARENA
-------------------------------------------------------------------*/
// models/Room.js
const roomSchema = new Schema(
  {
    name: String,
    hostId: { type: Types.ObjectId, ref: "User" },
    isOpen: { type: Boolean, default: true, index: true },
    maxSeats: Number,
    currentProblemId: { type: Types.ObjectId, ref: "Problem" },
  },
  { timestamps: true }
);
export const Room = model("Room", roomSchema);

// models/RoomParticipant.js
const roomParticipantSchema = new Schema({
  roomId: { type: Types.ObjectId, ref: "Room", index: true },
  userId: { type: Types.ObjectId, ref: "User", index: true },
  joinedAt: Date,
  leftAt: Date,
});
roomParticipantSchema.index({ roomId: 1, userId: 1 }, { unique: true });
export const RoomParticipant = model("RoomParticipant", roomParticipantSchema);

// models/RoomMessage.js
const roomMessageSchema = new Schema({
  roomId: { type: Types.ObjectId, ref: "Room", index: true },
  userId: { type: Types.ObjectId, ref: "User" },
  text: String,
  createdAt: { type: Date, default: Date.now },
});
export const RoomMessage = model("RoomMessage", roomMessageSchema);

// models/RoomRound.js
const roomRoundSchema = new Schema({
  roomId: { type: Types.ObjectId, ref: "Room", index: true },
  problemId: { type: Types.ObjectId, ref: "Problem" },
  startedAt: Date,
  endedAt: Date,
});
export const RoomRound = model("RoomRound", roomRoundSchema);

/* ------------------------------------------------------------------
   11 · NOTIFICATIONS & EVENTS
-------------------------------------------------------------------*/
// models/Notification.js
const notificationSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", index: true },
  type: { type: String, enum: ["badge", "contest", "system"] },
  title: String,
  body: String,
  link: String,
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date, // optional TTL
});
export const Notification = model("Notification", notificationSchema);

// models/Event.js (capped collection)
const eventSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", index: true },
  type: String, // "submission", "badge", etc.
  payload: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now, index: true },
});
export const Event = model("Event", eventSchema, "events"); // supply collection name if capped

/* ------------------------------------------------------------------
   12 · EXPORT CONVENIENCE (optional)
-------------------------------------------------------------------*/
export default {
  User,
  Account,
  Problem,
  Testcase,
  Language,
  Submission,
  UserProblemStat,
  TopicProgress,
  DailyChallenge,
  UserDailyAttempt,
  LearningTrack,
  LearningModule,
  UserModuleProgress,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  CompanySet,
  UserCompanyProgress,
  Badge,
  UserBadge,
  InterviewTemplate,
  InterviewSession,
  InterviewTurn,
  Contest,
  ContestRegistration,
  Room,
  RoomParticipant,
  RoomMessage,
  RoomRound,
  Notification,
  Event,
};
