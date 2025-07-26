// Coding System Models
import Question from "./models/question.js";
import Submission from "./models/submission.js";

// Question Schema Components
import difficultySchema from "./schemas/question/difficultySchema.js";
import problemTestCaseSchema from "./schemas/question/problemTestCaseSchema.js";
import exampleSchema from "./schemas/question/exampleSchema.js";
import constraintsSchema from "./schemas/question/constraintsSchema.js";
import problemStatsSchema from "./schemas/question/problemStatsSchema.js";

// Submission Schema Components
import statusSchema from "./schemas/submission/statusSchema.js";
import languageSchema from "./schemas/submission/languageSchema.js";
import testCaseSchema from "./schemas/submission/testCaseSchema.js";
import judge0DataSchema from "./schemas/submission/judge0DataSchema.js";
import batchSummarySchema from "./schemas/submission/batchSummarySchema.js";

// Named exports for individual access
export {
  // Main Models
  Question,
  Submission,

  // Question Schemas
  difficultySchema,
  problemTestCaseSchema,
  exampleSchema,
  constraintsSchema,
  problemStatsSchema,

  // Submission Schemas
  statusSchema,
  languageSchema,
  testCaseSchema,
  judge0DataSchema,
  batchSummarySchema,
};

// Default export with organized structure
export default {
  // Main models
  models: {
    Question,
    Submission,
  },

  // Organized schemas for reuse
  schemas: {
    question: {
      difficultySchema,
      problemTestCaseSchema,
      exampleSchema,
      constraintsSchema,
      problemStatsSchema,
    },
    submission: {
      statusSchema,
      languageSchema,
      testCaseSchema,
      judge0DataSchema,
      batchSummarySchema,
    },
  },
};
