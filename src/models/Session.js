import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionIndex: Number,
  text: String
});

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  interviewType: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewType' },
  questions: [], // Array to store questions in whatever format needed
  answers: [answerSchema],
  feedback: [String],
  scores: [Number],
  totalScore: Number,
  summary: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Session', sessionSchema);