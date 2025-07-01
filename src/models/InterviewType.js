import mongoose from "mongoose";
import { Schema,model } from "mongoose";


const InterviewTypeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: String,
    duration: String,
    difficulty: String,
    icon: String,
  },
  { timestamps: true }
);

export default model("InterviewType", InterviewTypeSchema);
