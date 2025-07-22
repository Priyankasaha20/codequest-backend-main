// Main models
import Submission from "./submission.js";

// Schema components (for reuse in other models)
import statusSchema from "./schemas/statusSchema.js";
import languageSchema from "./schemas/languageSchema.js";
import testCaseSchema from "./schemas/testCaseSchema.js";
import judge0DataSchema from "./schemas/judge0DataSchema.js";
import batchSummarySchema from "./schemas/batchSummarySchema.js";

// Named exports
export {
  Submission,
  // Schema components
  statusSchema,
  languageSchema,
  testCaseSchema,
  judge0DataSchema,
  batchSummarySchema,
};

// Default export for convenience
export default {
  Submission,
  // Schema components for building other models
  schemas: {
    statusSchema,
    languageSchema,
    testCaseSchema,
    judge0DataSchema,
    batchSummarySchema,
  },
};
