# CodeQuest Backend - Modular MongoDB Architecture

A complete restructuring of the coding judge system with clean, modular MongoDB schemas and elimination of in-memory storage for LeetCode-style coding problems.

## 🏗️ Architecture Overview

The system is now fully modular with clear separation of concerns:

- **MongoDB with Mongoose**: Primary data persistence for questions and submissions
- **PostgreSQL with Drizzle ORM**: Authentication system (unchanged)
- **Judge0 API**: External code execution service
- **Express.js**: RESTful API with service layer pattern

## 📁 Project Structure

```
src/
├── models/
│   ├── mongo/
│   │   ├── question.js           # Question model with embedded schemas
│   │   ├── submission.js         # Submission model (updated)
│   │   └── schemas/              # Modular schema components
│   │       ├── difficultySchema.js
│   │       ├── problemTestCaseSchema.js
│   │       ├── exampleSchema.js
│   │       ├── constraintsSchema.js
│   │       └── problemStatsSchema.js
│   └── postgres/                 # Authentication models (unchanged)
├── services/
│   ├── questionService.js        # Question management service
│   └── submissionService.js      # Updated submission service (no in-memory storage)
├── controllers/
│   ├── judgeController.js        # Updated judge controller (no in-memory storage)
│   └── questionController.js     # New question management controller
├── routes/
│   ├── questions.js              # Question management routes
│   └── ...                       # Other routes
└── utils/
    └── questionSeeder.js         # Sample question data seeder
```

## 🚀 Key Features

### Question Management

- **Comprehensive Question Model**: LeetCode-style problems with examples, test cases, constraints
- **Difficulty Scoring**: Easy (1-3), Medium (4-7), Hard (8-10) with points
- **Test Cases**: Both public examples and hidden test cases
- **Statistics Tracking**: Submission counts, acceptance rates, performance metrics
- **Search & Filtering**: By difficulty, tags, category, keywords
- **Random Question**: Get random questions for practice

### Submission System

- **Pure MongoDB Storage**: Completely eliminated in-memory storage
- **Judge0 Integration**: Seamless code execution and evaluation
- **Real-time Updates**: Automatic question statistics updates
- **Performance Tracking**: Execution time and memory usage analytics

## 📊 Database Schema

### Question Schema

```javascript
{
  title: String,                    // "Two Sum"
  slug: String,                     // "two-sum" (unique)
  description: String,              // Problem description
  difficulty: {
    level: String,                  // "Easy", "Medium", "Hard"
    score: Number                   // 1-10 points
  },
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: Boolean
  }],
  constraints: {
    timeLimit: Number,              // milliseconds
    memoryLimit: Number,            // MB
    inputConstraints: [String]
  },
  stats: {
    totalSubmissions: Number,
    acceptedSubmissions: Number,
    acceptanceRate: Number,
    averageExecutionTime: Number,
    averageMemoryUsage: Number
  },
  tags: [String],                   // ["array", "hash-table"]
  category: String,                 // "Array", "String", etc.
  hints: [String],
  isActive: Boolean,
  isVerified: Boolean
}
```

### Submission Schema (Updated)

```javascript
{
  questionId: ObjectId,             // Reference to Question
  userId: ObjectId,                 // Reference to User
  code: String,                     // Source code
  language: String,                 // Programming language
  status: {
    id: Number,                     // Judge0 status ID
    description: String             // Status description
  },
  judge0Data: { ... },             // Complete Judge0 response
  isCorrect: Boolean,
  executionTime: Number,
  memoryUsed: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🛠️ API Endpoints

### Question Management

```
GET    /api/questions              # Get all questions (paginated)
GET    /api/questions/search       # Search questions
GET    /api/questions/random       # Get random question
GET    /api/questions/:id          # Get specific question
POST   /api/questions              # Create question (admin)
PUT    /api/questions/:id          # Update question (admin)
DELETE /api/questions/:id          # Delete question (admin)
```

### Code Submission

```
POST   /api/judge/submit           # Submit code solution
GET    /api/judge/submission/:id   # Get submission details
```

## 🔧 Installation & Setup

1. **Clone and Install**

   ```bash
   git clone <repository>
   cd codequest-backend
   npm install
   ```

2. **Environment Variables**

   ```bash
   # Create .env file
   MONGODB_URI=mongodb://localhost:27017/codequest
   POSTGRESQL_URL=postgresql://user:password@localhost:5432/codequest
   JUDGE0_HOST=localhost
   JUDGE0_PORT=2358
   ```

3. **Database Setup**

   ```bash
   # Run migrations for PostgreSQL (auth)
   npm run db:migrate

   # Seed the database with sample questions
   npm run seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🧪 Testing

Run the system test to verify everything works:

```bash
node test-system.js
```

This will:

- Connect to MongoDB
- Seed sample questions
- Test question queries and search
- Create test submissions
- Verify statistics updates

## 📈 Usage Examples

### Creating a Question

```javascript
import Question from "./src/models/mongo/question.js";

const question = await Question.create({
  title: "Two Sum",
  slug: "two-sum",
  description: "Given an array of integers...",
  difficulty: { level: "Easy", score: 2 },
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
    },
  ],
  testCases: [
    {
      input: "[2,7,11,15]\n9",
      expectedOutput: "[0,1]",
      isHidden: false,
    },
  ],
  tags: ["array", "hash-table"],
  category: "Array",
});
```

### Submitting Code

```javascript
import { submitCode } from "./src/services/submissionService.js";

const submission = await submitCode({
  questionId: "question_id_here",
  userId: "user_id_here",
  code: "def two_sum(nums, target): ...",
  language: "python",
});
```

### Searching Questions

```javascript
import { searchQuestions } from "./src/services/questionService.js";

const results = await searchQuestions({
  difficulty: ["Easy", "Medium"],
  tags: ["array"],
  category: "Array",
  limit: 10,
});
```

## 🔄 Migration from Old System

The key changes from the previous system:

1. **Eliminated In-Memory Storage**: All data now persists in MongoDB
2. **Modular Schema Design**: Reusable schema components for maintainability
3. **Question-Centric Architecture**: Submissions now reference questions properly
4. **Statistics Integration**: Real-time updates of question performance metrics
5. **Service Layer**: Clean abstraction between controllers and database

## 🚨 Important Notes

- **No In-Memory Dependencies**: The system no longer uses `Map` or other in-memory storage
- **MongoDB Primary**: All coding challenge data is stored in MongoDB
- **PostgreSQL Auth**: Authentication remains in PostgreSQL for consistency
- **Judge0 Integration**: External service for code execution (unchanged)
- **Backward Compatibility**: API endpoints maintain compatibility where possible

## 🔮 Future Enhancements

- [ ] Question versioning system
- [ ] Advanced analytics and insights
- [ ] Contest and tournament support
- [ ] Collaborative coding features
- [ ] AI-powered hint generation
- [ ] Custom test case creation by users

## 📝 Contributing

When adding new features:

1. Follow the modular schema pattern
2. Use the service layer for business logic
3. Maintain clean separation of concerns
4. Update tests and documentation
5. Ensure MongoDB-first approach

---

_This system provides a solid foundation for a scalable, maintainable coding judge platform with clean architecture and proper data persistence._
