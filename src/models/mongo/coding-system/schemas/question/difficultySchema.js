import mongoose from "mongoose";

/**
 * Difficulty schema for coding problems
 * Represents the difficulty level of a problem (Easy, Medium, Hard)
 */
const difficultySchema = new mongoose.Schema(
  {
    level: {
      type: String,
      required: true,
      enum: ["Easy", "Medium", "Hard"],
      description: "Difficulty level of the problem",
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      description: "Numeric difficulty score (1-10)",
    },
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to get difficulty color (for UI purposes)
difficultySchema.virtual("color").get(function () {
  switch (this.level) {
    case "Easy":
      return "#00b894";
    case "Medium":
      return "#fdcb6e";
    case "Hard":
      return "#e84393";
    default:
      return "#636e72";
  }
});

// Virtual to check if problem is hard
difficultySchema.virtual("isHard").get(function () {
  return this.level === "Hard";
});

export default difficultySchema;
