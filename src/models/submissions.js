import mongoose from "mongoose";

const TestCaseSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
    },
    problemId: {
      type: String,
      required: true,
    },
    input: {
      type: String,
      required: true,
    },
    expectedOutput: {
      type: String,
      required: true,
    },
    actualOutput: {
      type: String,
      default: null,
    },
    errorOutput: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "accepted",
        "wrong_answer",
        "runtime_error",
        "compilation_error",
        "time_limit_exceeded",
      ],
      default: "pending",
    },
    judge0Token: {
      type: String,
      unique: true,
      sparse: true,
    },
    languageId: {
      type: Number,
      required: true,
    },
    submissionCode: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SubmissionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
    },
    languageId: {
      type: Number,
      required: true,
    },
    problemId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    overallResult: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "wrong_answer",
        "runtime_error",
        "compilation_error",
        "time_limit_exceeded",
      ],
      default: "pending",
    },
    testCases: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestCase",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const TestCase = mongoose.model("TestCase", TestCaseSchema);
export const Submission = mongoose.model("Submission", SubmissionSchema);
