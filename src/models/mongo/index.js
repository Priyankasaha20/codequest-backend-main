// Import coding system components
import codingSystem, {
  Question,
  Submission,
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
} from "./coding-system/index.js";

// Named exports for backward compatibility
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
  // Coding system as a whole
  codingSystem,
};

// Default export with organized structure
export default {
  // Coding system (questions and submissions)
  codingSystem,

  // Direct access to main models for backward compatibility
  Submission,
  Question,

  // Schema components for building other models
  schemas: {
    // Submission schemas
    statusSchema,
    languageSchema,
    testCaseSchema,
    judge0DataSchema,
    batchSummarySchema,
    // Question schemas
    difficultySchema,
    problemTestCaseSchema,
    exampleSchema,
    constraintsSchema,
    problemStatsSchema,
  },
};
