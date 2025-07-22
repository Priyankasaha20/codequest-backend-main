import mongoose from "mongoose";

// Import schema components
import difficultySchema from "./schemas/difficultySchema.js";
import problemTestCaseSchema from "./schemas/problemTestCaseSchema.js";
import exampleSchema from "./schemas/exampleSchema.js";
import constraintsSchema from "./schemas/constraintsSchema.js";
import problemStatsSchema from "./schemas/problemStatsSchema.js";

/**
 * Question/Problem model for LeetCode-style coding problems
 * Contains problem statements, test cases, and metadata
 */
const questionSchema = new mongoose.Schema(
  {
    // Basic information
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      description: "Problem title",
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
      description: "URL-friendly problem identifier",
    },

    description: {
      type: String,
      required: true,
      maxlength: 5000,
      description: "Problem statement and description",
    },

    difficulty: {
      type: difficultySchema,
      required: true,
      description: "Problem difficulty information",
    },

    // Problem content
    examples: {
      type: [exampleSchema],
      validate: {
        validator: function (examples) {
          return examples && examples.length > 0;
        },
        message: "At least one example is required",
      },
      description: "Example inputs and outputs shown to users",
    },

    constraints: {
      type: constraintsSchema,
      required: true,
      description: "Problem constraints and limits",
    },

    // Test cases for evaluation
    testCases: {
      type: [problemTestCaseSchema],
      validate: {
        validator: function (testCases) {
          return testCases && testCases.length > 0;
        },
        message: "At least one test case is required",
      },
      description: "Test cases for code evaluation",
    },

    // Categorization
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        description: "Problem tags (e.g., 'array', 'dynamic-programming')",
      },
    ],

    category: {
      type: String,
      required: true,
      enum: [
        "Array",
        "String",
        "Dynamic Programming",
        "Tree",
        "Graph",
        "Sorting",
        "Searching",
        "Math",
        "Greedy",
        "Backtracking",
        "Two Pointers",
        "Sliding Window",
        "Stack",
        "Queue",
        "Heap",
        "Hash Table",
        "Linked List",
        "Binary Search",
        "Other",
      ],
      description: "Primary problem category",
    },

    // Content metadata
    author: {
      type: String,
      default: "System",
      description: "Problem author/creator",
    },

    source: {
      type: String,
      default: "",
      description:
        "Original source of the problem (e.g., 'LeetCode 1. Two Sum')",
    },

    hints: [
      {
        type: String,
        maxlength: 500,
        description: "Hints to help users solve the problem",
      },
    ],

    // Status and visibility
    isActive: {
      type: Boolean,
      default: true,
      index: true,
      description: "Whether the problem is active and visible to users",
    },

    isVerified: {
      type: Boolean,
      default: false,
      description: "Whether the problem has been verified and tested",
    },

    // Statistics
    stats: {
      type: problemStatsSchema,
      default: {},
      description: "Problem submission statistics",
    },

    // Contest information (optional)
    contestId: {
      type: String,
      default: null,
      index: true,
      description: "Associated contest identifier",
    },

    contestOrder: {
      type: Number,
      default: null,
      description: "Order of problem within a contest",
    },
  },
  {
    timestamps: true,
    collection: "questions",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================

// Primary indexes for common queries
questionSchema.index({ slug: 1 }); // Unique lookup
questionSchema.index({ isActive: 1, difficulty: 1 }); // Browse by difficulty
questionSchema.index({ category: 1, isActive: 1 }); // Browse by category
questionSchema.index({ tags: 1, isActive: 1 }); // Search by tags
questionSchema.index({ "difficulty.level": 1, "stats.acceptanceRate": 1 }); // Sort by difficulty and acceptance

// Contest-related indexes
questionSchema.index({ contestId: 1, contestOrder: 1 }); // Contest problems
questionSchema.index({ contestId: 1, isActive: 1 }); // Active contest problems

// Performance indexes
questionSchema.index({ createdAt: -1 }); // Recent problems
questionSchema.index({ "stats.totalSubmissions": -1 }); // Popular problems

// ==================== VIRTUALS ====================

// Virtual to get visible test cases (non-hidden)
questionSchema.virtual("visibleTestCases").get(function () {
  return this.testCases.filter((tc) => !tc.isHidden);
});

// Virtual to get hidden test cases count
questionSchema.virtual("hiddenTestCasesCount").get(function () {
  return this.testCases.filter((tc) => tc.isHidden).length;
});

// Virtual to check if problem has hints
questionSchema.virtual("hasHints").get(function () {
  return this.hints && this.hints.length > 0;
});

// Virtual to get formatted acceptance rate
questionSchema.virtual("formattedAcceptanceRate").get(function () {
  return `${this.stats.acceptanceRate || 0}%`;
});

// ==================== STATIC METHODS ====================

// Find active problems with filters
questionSchema.statics.findActive = function (filters = {}) {
  return this.find({ isActive: true, ...filters }).sort({ createdAt: -1 });
};

// Find problems by difficulty
questionSchema.statics.findByDifficulty = function (level) {
  return this.findActive({ "difficulty.level": level });
};

// Find problems by category
questionSchema.statics.findByCategory = function (category) {
  return this.findActive({ category });
};

// Find problems by tags
questionSchema.statics.findByTags = function (tags) {
  const tagArray = Array.isArray(tags) ? tags : [tags];
  return this.findActive({ tags: { $in: tagArray } });
};

// Search problems by text
questionSchema.statics.searchProblems = function (searchText, limit = 20) {
  const searchRegex = new RegExp(searchText, "i");
  return this.findActive({
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { tags: searchRegex },
    ],
  }).limit(limit);
};

// Get problem by slug
questionSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug, isActive: true });
};

// Get contest problems
questionSchema.statics.findByContest = function (contestId) {
  return this.findActive({ contestId }).sort({ contestOrder: 1 });
};

// Get random problem
questionSchema.statics.getRandomProblem = function (difficulty = null) {
  const match = { isActive: true };
  if (difficulty) match["difficulty.level"] = difficulty;

  return this.aggregate([{ $match: match }, { $sample: { size: 1 } }]);
};

// Get problem statistics
questionSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$difficulty.level",
        count: { $sum: 1 },
        avgAcceptanceRate: { $avg: "$stats.acceptanceRate" },
        totalSubmissions: { $sum: "$stats.totalSubmissions" },
      },
    },
  ]);

  const totalProblems = await this.countDocuments({ isActive: true });

  return {
    totalProblems,
    byDifficulty: stats,
  };
};

// ==================== INSTANCE METHODS ====================

// Update problem statistics
questionSchema.methods.updateStats = function (submissionData) {
  const { isAccepted, executionTime } = submissionData;

  this.stats.totalSubmissions += 1;
  if (isAccepted) {
    this.stats.acceptedSubmissions += 1;
  }

  // Update average execution time
  if (executionTime && isAccepted) {
    if (this.stats.averageExecutionTime) {
      this.stats.averageExecutionTime =
        (this.stats.averageExecutionTime + executionTime) / 2;
    } else {
      this.stats.averageExecutionTime = executionTime;
    }
  }

  this.stats.lastSubmissionAt = new Date();

  return this.save();
};

// Get problem summary for API responses
questionSchema.methods.getSummary = function () {
  return {
    id: this._id,
    title: this.title,
    slug: this.slug,
    difficulty: this.difficulty,
    category: this.category,
    tags: this.tags,
    acceptanceRate: this.stats.acceptanceRate,
    totalSubmissions: this.stats.totalSubmissions,
    isVerified: this.isVerified,
  };
};

// Get full problem details for solving
questionSchema.methods.getFullDetails = function () {
  return {
    id: this._id,
    title: this.title,
    slug: this.slug,
    description: this.description,
    difficulty: this.difficulty,
    examples: this.examples,
    constraints: this.constraints,
    visibleTestCases: this.visibleTestCases,
    category: this.category,
    tags: this.tags,
    hints: this.hints,
    stats: this.stats,
    hasHints: this.hasHints,
  };
};

// ==================== MIDDLEWARE ====================

// Pre-save middleware to generate slug if not provided
questionSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }
  next();
});

// Pre-save middleware to validate test cases
questionSchema.pre("save", function (next) {
  if (this.testCases && this.testCases.length > 0) {
    const hasVisibleTestCase = this.testCases.some((tc) => !tc.isHidden);
    if (!hasVisibleTestCase) {
      return next(new Error("At least one test case must be visible to users"));
    }
  }
  next();
});

// Create and export the model
const Question = mongoose.model("Question", questionSchema);

export default Question;
