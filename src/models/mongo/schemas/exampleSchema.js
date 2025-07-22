import mongoose from "mongoose";

/**
 * Example schema for coding problems
 * Contains input/output examples shown to users
 */
const exampleSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: true,
      description: "Example input",
    },
    output: {
      type: String,
      required: true,
      description: "Example output",
    },
    explanation: {
      type: String,
      default: "",
      description: "Optional explanation of the example",
    },
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to check if example has explanation
exampleSchema.virtual("hasExplanation").get(function () {
  return this.explanation && this.explanation.trim().length > 0;
});

export default exampleSchema;
