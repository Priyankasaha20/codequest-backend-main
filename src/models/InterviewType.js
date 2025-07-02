import mongoose from "mongoose";
import { Schema, model } from "mongoose";

const InterviewTypeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    title: { type: String }, // Keep for backward compatibility
    description: String,
    questions: [String],
    duration: String,
    difficulty: String,
    icon: String,
  },
  { timestamps: true }
);

// Pre-save middleware to ensure title is set if name is provided
InterviewTypeSchema.pre("save", function (next) {
  if (this.name && !this.title) {
    this.title = this.name;
  }
  next();
});

export default model("InterviewType", InterviewTypeSchema);
