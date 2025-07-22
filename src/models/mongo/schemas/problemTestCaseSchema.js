import mongoose from "mongoose";

/**
 * Test case schema for coding problems
 * Each problem contains multiple test cases for validation
 */
const problemTestCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      default: "",
      description: "Input data for the test case",
    },
    expectedOutput: {
      type: String,
      required: true,
      description: "Expected output for the test case",
    },
    isHidden: {
      type: Boolean,
      default: false,
      description: "Whether this test case is hidden from users",
    },
    weight: {
      type: Number,
      default: 1,
      min: 1,
      description: "Weight/importance of this test case for scoring",
    },
    description: {
      type: String,
      default: "",
      description: "Optional description of what this test case tests",
    },
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to check if test case is visible to users
problemTestCaseSchema.virtual("isVisible").get(function () {
  return !this.isHidden;
});

// Virtual to get formatted input (truncated for display)
problemTestCaseSchema.virtual("formattedInput").get(function () {
  if (this.input.length <= 50) return this.input;
  return this.input.substring(0, 47) + "...";
});

export default problemTestCaseSchema;
