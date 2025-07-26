import mongoose from "mongoose";

/**
 * Judge0 specific data schema
 * Contains timing and execution metadata from Judge0 API
 */
const judge0DataSchema = new mongoose.Schema(
  {
    finishedAt: {
      type: Date,
      default: null,
      description: "When the submission finished executing",
    },
    submittedAt: {
      type: Date,
      default: null,
      description: "When the submission was sent to Judge0",
    },
    wallTime: {
      type: Number, // in seconds
      default: null,
      description: "Wall clock time for execution",
    },
    cpuTime: {
      type: Number, // in seconds
      default: null,
      description: "CPU time used for execution",
    },
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to calculate total processing time
judge0DataSchema.virtual("processingTime").get(function () {
  if (this.submittedAt && this.finishedAt) {
    return this.finishedAt.getTime() - this.submittedAt.getTime();
  }
  return null;
});

// Virtual to get formatted processing time
judge0DataSchema.virtual("formattedProcessingTime").get(function () {
  const time = this.processingTime;
  if (!time) return "N/A";
  if (time < 1000) return `${time}ms`;
  return `${(time / 1000).toFixed(2)}s`;
});

export default judge0DataSchema;
