import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema({
  question: String,
  summary: String,
  score: Number,
  improvements: [String],
});

const SessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewType",
      required: true,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },
    startedAt: Date,
    endedAt: Date,
    score: Number,
    feedback: [FeedbackSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Session", SessionSchema);
