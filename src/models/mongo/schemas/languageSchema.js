import mongoose from "mongoose";

/**
 * Language schema for Judge0 supported programming languages
 * Contains language ID and name information
 */
const languageSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      description: "Judge0 language ID",
    },
    name: {
      type: String,
      required: true,
      description: "Programming language name",
    },
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to get language category (for future use)
languageSchema.virtual("category").get(function () {
  const name = this.name.toLowerCase();
  if (name.includes("c++") || name.includes("c (")) return "C/C++";
  if (name.includes("python")) return "Python";
  if (name.includes("java")) return "Java";
  if (name.includes("javascript")) return "JavaScript";
  if (name.includes("rust")) return "Rust";
  if (name.includes("go")) return "Go";
  return "Other";
});

export default languageSchema;
