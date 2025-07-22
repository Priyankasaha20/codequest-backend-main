import mongoose from "mongoose";

// Import modular schema components
import statusSchema from "./schemas/statusSchema.js";
import languageSchema from "./schemas/languageSchema.js";
import testCaseSchema from "./schemas/testCaseSchema.js";
import judge0DataSchema from "./schemas/judge0DataSchema.js";
import batchSummarySchema from "./schemas/batchSummarySchema.js";

// Import methods
import staticMethods from "./methods/staticMethods.js";
import instanceMethods from "./methods/instanceMethods.js";

// Import configuration
import {
  applyIndexes,
  applyVirtuals,
  applyMiddleware,
} from "./config/submissionConfig.js";

/**
 * Main submission schema for Judge0 code execution submissions
 * Links to PostgreSQL user table and stores comprehensive execution data
 */
const submissionSchema = new mongoose.Schema(
  {
    // Reference to PostgreSQL user ID
    userId: {
      type: Number,
      required: true,
      index: true,
      description: "Reference to PostgreSQL users.id",
    },

    // Judge0 submission token(s)
    tokens: [
      {
        type: String,
        required: true,
        unique: true,
        description: "Judge0 submission tokens",
      },
    ],

    // Source code details
    sourceCode: {
      type: String,
      required: true,
      maxlength: 65536, // Judge0 limit
      description: "User's source code",
    },

    language: {
      type: languageSchema,
      required: true,
      description: "Programming language information",
    },

    // Submission type
    submissionType: {
      type: String,
      enum: ["single", "batch"],
      required: true,
      description: "Type of submission: single test or batch",
    },

    // For single submissions
    stdin: {
      type: String,
      default: "",
      description: "Input data for single submission",
    },

    stdout: {
      type: String,
      default: "",
      description: "Output from code execution",
    },

    stderr: {
      type: String,
      default: "",
      description: "Error output from code execution",
    },

    expectedOutput: {
      type: String,
      default: "",
      description: "Expected output for single submission",
    },

    // For batch submissions
    testCases: {
      type: [testCaseSchema],
      default: [],
      description: "Test cases for batch submissions",
    },

    // Execution details
    status: {
      type: statusSchema,
      default: { id: 1, description: "In Queue" },
      description: "Current execution status",
    },

    verdict: {
      type: String,
      enum: [
        "Accepted",
        "Wrong Answer",
        "Time Limit Exceeded",
        "Runtime Error",
        "Compilation Error",
        "Unknown",
        "Pending",
      ],
      default: "Pending",
      description: "Final judgment on the submission",
    },

    executionTime: {
      type: Number, // in milliseconds
      default: null,
      description: "Time taken for code execution",
    },

    memoryUsed: {
      type: Number, // in KB
      default: null,
      description: "Memory consumed during execution",
    },

    // Compile output for compilation errors
    compileOutput: {
      type: String,
      default: "",
      description: "Compiler output for compilation errors",
    },

    // Judge0 specific fields
    judge0Data: {
      type: judge0DataSchema,
      default: {},
      description: "Judge0 API specific timing data",
    },

    // Batch submission summary
    batchSummary: {
      type: batchSummarySchema,
      default: {},
      description: "Aggregated results for batch submissions",
    },

    // Metadata
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
      description: "Whether submission has finished processing",
    },

    completedAt: {
      type: Date,
      default: null,
      description: "When the submission finished processing",
    },

    // Additional context
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null,
      index: true,
      description: "Reference to the coding question/problem",
    },

    problemId: {
      type: String,
      default: null,
      index: true,
      description: "Legacy problem identifier (for backward compatibility)",
    },

    contestId: {
      type: String,
      default: null,
      index: true,
      description: "Associated contest identifier",
    },

    tags: [
      {
        type: String,
        trim: true,
        description: "Tags for categorizing submissions",
      },
    ],

    // Error handling
    errorMessage: {
      type: String,
      default: "",
      description: "Error message if submission failed",
    },

    retryCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
      description: "Number of retry attempts",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "submissions",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Apply configuration
applyIndexes(submissionSchema);
applyVirtuals(submissionSchema);
applyMiddleware(submissionSchema);

// Apply static methods
Object.keys(staticMethods).forEach((methodName) => {
  submissionSchema.statics[methodName] = staticMethods[methodName];
});

// Apply instance methods
Object.keys(instanceMethods).forEach((methodName) => {
  submissionSchema.methods[methodName] = instanceMethods[methodName];
});

// Create and export the model
const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
