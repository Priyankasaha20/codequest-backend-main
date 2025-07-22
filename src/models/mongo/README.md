# MongoDB Models - Modular Structure

This directory contains MongoDB Mongoose models organized in a modular fashion for better maintainability and comprehension.

## 📁 Directory Structure

```
src/models/mongo/
├── index.js                     # Main exports file
├── submission.js               # Main submission model
├── schemas/                    # Reusable schema components
│   ├── statusSchema.js         # Judge0 status schema
│   ├── languageSchema.js       # Programming language schema
│   ├── testCaseSchema.js       # Test case schema for batch submissions
│   ├── judge0DataSchema.js     # Judge0 timing and metadata schema
│   └── batchSummarySchema.js   # Batch submission summary schema
├── methods/                    # Model methods
│   ├── staticMethods.js        # Static methods (called on model)
│   └── instanceMethods.js      # Instance methods (called on documents)
└── config/                     # Configuration and utilities
    └── submissionConfig.js     # Indexes, virtuals, and middleware
```

## 🏗️ Architecture Overview

### Schema Components (`schemas/`)

Modular schemas that can be reused across different models:

- **statusSchema.js**: Judge0 execution status with completion checks
- **languageSchema.js**: Programming language info with categorization
- **testCaseSchema.js**: Individual test case with execution results
- **judge0DataSchema.js**: Judge0 API timing and metadata
- **batchSummarySchema.js**: Aggregated batch submission results

### Methods (`methods/`)

Separated static and instance methods for better organization:

- **staticMethods.js**: Database queries, aggregations, and model-level operations
- **instanceMethods.js**: Document manipulation and business logic

### Configuration (`config/`)

Database optimizations and middleware:

- **submissionConfig.js**: Indexes, virtuals, and middleware functions

## 🚀 Usage Examples

### Importing the Main Model

```javascript
import { Submission } from "../models/mongo/index.js";
// or
import Submission from "../models/mongo/submission.js";
```

### Using Schema Components in Other Models

```javascript
import { statusSchema, languageSchema } from "../models/mongo/index.js";

// Use in another model
const anotherSchema = new mongoose.Schema({
  status: statusSchema,
  language: languageSchema,
  // ... other fields
});
```

### Static Methods

```javascript
// Find by token
const submission = await Submission.findByToken("abc123");

// Get user statistics
const stats = await Submission.getSubmissionStats(userId);

// Get recent submissions
const recent = await Submission.getRecentSubmissions(10);
```

### Instance Methods

```javascript
// Update submission status
await submission.updateStatus(judge0Response);

// Get summary
const summary = submission.getSummary();

// Check if successful
const isSuccess = submission.isSuccessful();
```

## 🔧 Adding New Features

### Adding a New Schema Component

1. Create file in `schemas/` directory
2. Export the schema with proper documentation
3. Add to `index.js` exports
4. Import in `submission.js` if needed

### Adding New Methods

1. Add to appropriate file in `methods/` directory
2. Export from the methods file
3. Methods are auto-applied to the schema

### Adding Indexes or Middleware

1. Add to `config/submissionConfig.js`
2. Use the apply functions in the main model

## 📊 Performance Considerations

- **Indexes**: Optimized for common query patterns (user, token, status, verdict)
- **Virtuals**: Computed fields for formatting and calculations
- **Middleware**: Automatic data validation and logging
- **Aggregations**: Efficient statistics and analytics queries

## 🔍 Key Features

- **Modular Design**: Easy to understand and modify individual components
- **Reusable Schemas**: Components can be used in other models
- **Rich Virtuals**: Formatted output and computed properties
- **Comprehensive Methods**: Both static and instance methods for all operations
- **Performance Optimized**: Strategic indexing and efficient queries
- **Type Safety**: Proper validation and enum constraints
- **Documentation**: Extensive comments and descriptions

This modular approach makes the codebase more maintainable, testable, and easier to understand for new developers.
