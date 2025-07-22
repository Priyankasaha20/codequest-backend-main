import mongoose from "mongoose";

/**
 * Status schema based on Judge0 API status responses
 * Represents the execution status of a submission
 */
const statusSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      description: "Judge0 status ID",
    },
    description: {
      type: String,
      required: true,
      enum: [
        "In Queue",
        "Processing",
        "Accepted",
        "Wrong Answer",
        "Time Limit Exceeded",
        "Compilation Error",
        "Runtime Error (SIGSEGV)",
        "Runtime Error (SIGXFSZ)",
        "Runtime Error (SIGFPE)",
        "Runtime Error (SIGABRT)",
        "Runtime Error (NZEC)",
        "Runtime Error (Other)",
        "Internal Error",
        "Exec Format Error",
      ],
      description: "Human-readable status description",
    },
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to check if status indicates completion
statusSchema.virtual("isCompleted").get(function () {
  return !["In Queue", "Processing"].includes(this.description);
});

// Virtual to check if status indicates success
statusSchema.virtual("isSuccess").get(function () {
  return this.description === "Accepted";
});

export default statusSchema;
