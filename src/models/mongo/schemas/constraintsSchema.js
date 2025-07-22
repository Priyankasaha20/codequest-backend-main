import mongoose from "mongoose";

/**
 * Constraints schema for coding problems
 * Defines input constraints and limits
 */
const constraintsSchema = new mongoose.Schema(
  {
    timeLimit: {
      type: Number,
      default: 2000, // milliseconds
      min: 100,
      max: 10000,
      description: "Time limit for code execution in milliseconds",
    },
    memoryLimit: {
      type: Number,
      default: 256, // MB
      min: 16,
      max: 1024,
      description: "Memory limit for code execution in MB",
    },
    inputConstraints: [
      {
        type: String,
        description: "Text descriptions of input constraints",
      },
    ],
    notes: [
      {
        type: String,
        description: "Additional notes about the problem constraints",
      },
    ],
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to get formatted time limit
constraintsSchema.virtual("formattedTimeLimit").get(function () {
  if (this.timeLimit < 1000) return `${this.timeLimit}ms`;
  return `${(this.timeLimit / 1000).toFixed(1)}s`;
});

// Virtual to get formatted memory limit
constraintsSchema.virtual("formattedMemoryLimit").get(function () {
  return `${this.memoryLimit}MB`;
});

export default constraintsSchema;
