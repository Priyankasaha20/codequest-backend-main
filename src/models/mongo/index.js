// Main models
import Submission from "./submission.js";
import Question from "./question.js";

// Schema components (for reuse in other models)
import statusSchema from "./schemas/statusSchema.js";
import languageSchema from "./schemas/languageSchema.js";
import testCaseSchema from "./schemas/testCaseSchema.js";
import judge0DataSchema from "./schemas/judge0DataSchema.js";
import batchSummarySchema from "./schemas/batchSummarySchema.js";
import difficultySchema from "./schemas/difficultySchema.js";
import problemTestCaseSchema from "./schemas/problemTestCaseSchema.js";
import exampleSchema from "./schemas/exampleSchema.js";
import constraintsSchema from "./schemas/constraintsSchema.js";
import problemStatsSchema from "./schemas/problemStatsSchema.js";

// Named exports
export {
  // Main models
  Submission,
  Question,
  // Schema components
  statusSchema,
  languageSchema,
  testCaseSchema,
  judge0DataSchema,
  batchSummarySchema,
  difficultySchema,
  problemTestCaseSchema,
  exampleSchema,
  constraintsSchema,
  problemStatsSchema,
};

// Default export for convenience
export default {
  // Main models
  Submission,
  Question,
  // Schema components for building other models
  schemas: {
    statusSchema,
    languageSchema,
    testCaseSchema,
    judge0DataSchema,
    batchSummarySchema,
    difficultySchema,
    problemTestCaseSchema,
    exampleSchema,
    constraintsSchema,
    problemStatsSchema,
  },
};
