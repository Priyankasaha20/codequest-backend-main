# CodeQuest Backend - Complete Coding Judge System

A modern, scalable coding judge platform similar to LeetCode, built with Node.js, Express, MongoDB, and Judge0. Features a consolidated API structure, modular architecture, and comprehensive question management system.

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher)
- **PostgreSQL** (v14 or higher)
- **Judge0** API access (for code execution)

### 1. Clone and Install

```bash
git clone <repository-url>
cd codequest-backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# Database Connections
MONGODB_URI=mongodb://localhost:27017/codequest
POSTGRESQL_URL=postgresql://username:password@localhost:5432/codequest

# Judge0 Configuration
JUDGE0_HOST=localhost
JUDGE0_PORT=2358
JUDGE0_PROTOCOL=http

# Authentication
SESSION_SECRET=your-super-secret-session-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup

```bash
# Setup PostgreSQL tables (for authentication)
npm run migrate:push

# Seed MongoDB with sample questions
npm run seed
```

### 4. Start the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:5000`

## 🐳 Docker Setup (Alternative)

For a complete setup with all dependencies:

```bash
# Start all services (MongoDB, MinIO, App)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 📊 System Architecture

### Technology Stack

- **Backend**: Node.js with Express.js
- **Primary Database**: MongoDB (questions, submissions, test cases)
- **Auth Database**: PostgreSQL (user authentication)
- **Code Execution**: Judge0 API
- **File Storage**: MinIO (optional, for test cases)
- **Session Store**: MongoDB

### Project Structure

```
src/
├── models/
│   ├── mongo/
│   │   ├── question.js           # Main question model
│   │   ├── submission.js         # Code submission model
│   │   └── schemas/              # Reusable schema components
│   └── postgres/                 # Authentication models
├── controllers/
│   ├── questionController.js     # Question management
│   ├── judgeController.js        # Code submission & execution
│   └── authController.js         # User authentication
├── services/
│   ├── questionService.js        # Question business logic
│   ├── submissionService.js      # Submission processing
│   └── authService.js            # Authentication logic
├── routes/
│   ├── questions.js              # Question API routes
│   ├── judge.js                  # Code submission routes
│   └── auth.js                   # Authentication routes
├── middleware/
│   ├── auth.js                   # Authentication middleware
│   └── validation.js             # Request validation
└── utils/
    ├── seeder.js                 # Database seeding
    └── helpers.js                # Utility functions
```

## 🔗 API Documentation

### Consolidated Question API

The API has been streamlined from 14 endpoints to 8 core endpoints using query parameters for filtering.

#### Core Endpoints

| Method   | Endpoint                      | Description                           |
| -------- | ----------------------------- | ------------------------------------- |
| `GET`    | `/api/questions`              | Get questions with flexible filtering |
| `POST`   | `/api/questions`              | Create new question (Admin)           |
| `GET`    | `/api/questions/categories`   | Get available categories              |
| `GET`    | `/api/questions/difficulties` | Get difficulty levels                 |
| `GET`    | `/api/questions/stats`        | Get question statistics               |
| `GET`    | `/api/questions/{id}`         | Get specific question                 |
| `PUT`    | `/api/questions/{id}`         | Update question (Admin)               |
| `DELETE` | `/api/questions/{id}`         | Delete question (Admin)               |

#### Flexible Filtering Examples

```bash
# Basic filtering
GET /api/questions                           # All questions
GET /api/questions?difficulty=Easy           # Easy questions only
GET /api/questions?category=Array            # Array category questions
GET /api/questions?contest=contest123        # Contest questions

# Search and random
GET /api/questions?search=binary             # Search for "binary"
GET /api/questions?random=true               # Random question
GET /api/questions?random=true&difficulty=Hard  # Random hard question

# Advanced filtering
GET /api/questions?tags=dynamic-programming,array  # Multiple tags
GET /api/questions?difficulty=Medium&category=Tree # Combined filters

# Pagination and sorting
GET /api/questions?limit=20&skip=0           # Pagination
GET /api/questions?sortBy=difficulty&sortOrder=asc  # Custom sorting
```

#### Query Parameters

| Parameter    | Type    | Description                      | Example                            |
| ------------ | ------- | -------------------------------- | ---------------------------------- |
| `difficulty` | string  | Filter by difficulty             | `Easy`, `Medium`, `Hard`           |
| `category`   | string  | Filter by category               | `Array`, `String`, `Tree`          |
| `contest`    | string  | Filter by contest ID             | `contest123`                       |
| `search`     | string  | Search in title/description      | `binary search`                    |
| `random`     | boolean | Get random question              | `true`                             |
| `tags`       | string  | Filter by tags (comma-separated) | `array,sorting`                    |
| `limit`      | number  | Results per page (max 100)       | `20`                               |
| `skip`       | number  | Results to skip                  | `0`                                |
| `sortBy`     | string  | Sort field                       | `createdAt`, `difficulty`, `title` |
| `sortOrder`  | string  | Sort direction                   | `asc`, `desc`                      |

### Code Submission API

```bash
# Submit code for evaluation
POST /api/judge/submit
{
  "questionId": "question_id_here",
  "code": "def solution(nums):\n    return nums",
  "language": "python"
}

# Get submission result
GET /api/judge/submission/{submissionId}

# Get user's submissions for a question
GET /api/judge/submissions?questionId=123&userId=456
```

### Authentication API

```bash
# Register new user
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword"
}

# Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securepassword"
}

# Google OAuth
GET /api/auth/google
GET /api/auth/google/callback

# Logout
POST /api/auth/logout
```

## 💾 Database Schemas

### Question Schema (MongoDB)

```javascript
{
  title: "Two Sum",                        // Question title
  slug: "two-sum",                         // URL-friendly identifier
  description: "Given an array...",        // Problem description
  difficulty: {
    level: "Easy",                         // Easy, Medium, Hard
    score: 2                              // Points (1-10)
  },
  examples: [{
    input: "nums = [2,7,11,15], target = 9",
    output: "[0,1]",
    explanation: "nums[0] + nums[1] = 9"
  }],
  testCases: [{
    input: "[2,7,11,15]\n9",
    expectedOutput: "[0,1]",
    isHidden: true                         // Hidden from users
  }],
  constraints: {
    timeLimit: 1000,                       // milliseconds
    memoryLimit: 128,                      // MB
    inputConstraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9"
    ]
  },
  stats: {
    totalSubmissions: 1500,
    acceptedSubmissions: 750,
    acceptanceRate: 50.0,
    averageExecutionTime: 45.5,
    averageMemoryUsage: 14.2
  },
  tags: ["array", "hash-table"],           // Topic tags
  category: "Array",                       // Main category
  hints: ["Use a hash map for O(1) lookup"],
  isActive: true,                          // Published status
  isVerified: true,                        // Admin verified
  contestId: "contest_123",                // Optional contest
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

### Submission Schema (MongoDB)

```javascript
{
  questionId: ObjectId("..."),             // Reference to question
  userId: ObjectId("..."),                 // Reference to user
  code: "def two_sum(nums, target)...",    // Submitted code
  language: "python",                      // Programming language
  status: {
    id: 3,                                 // Judge0 status ID
    description: "Accepted"                // Human readable status
  },
  judge0Data: {                           // Complete Judge0 response
    stdout: "Test passed",
    stderr: null,
    compile_output: null,
    time: "0.045",
    memory: 14336
  },
  testResults: [{
    input: "[2,7,11,15]\n9",
    expectedOutput: "[0,1]",
    actualOutput: "[0,1]",
    passed: true,
    executionTime: 45,
    memoryUsed: 14.2
  }],
  isCorrect: true,                         // All test cases passed
  score: 100,                             // Score percentage
  executionTime: 45,                      // Average execution time
  memoryUsed: 14.2,                       // Average memory usage
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev                    # Start development server with auto-reload
npm run dev:debug             # Start with debugging enabled

# Database
npm run migrate:generate      # Generate new Drizzle migrations
npm run migrate:push         # Apply migrations to PostgreSQL
npm run seed                 # Seed MongoDB with sample questions

# Production
npm start                    # Start production server
npm run build               # Build for production

# Utilities
npm run cleanup:submissions  # Clean up old submissions
npm test                    # Run test suite
```

## 🧪 Testing the System

### 1. Health Check

```bash
curl http://localhost:5000/api/health
```

### 2. Get Questions

```bash
# Get all questions
curl "http://localhost:5000/api/questions"

# Get easy questions
curl "http://localhost:5000/api/questions?difficulty=Easy"

# Search for questions
curl "http://localhost:5000/api/questions?search=array"

# Get random question
curl "http://localhost:5000/api/questions?random=true"
```

### 3. Submit Code

```bash
curl -X POST http://localhost:5000/api/judge/submit \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "question_id_here",
    "code": "def solution(nums, target):\n    return [0, 1]",
    "language": "python"
  }'
```

## 🔧 Configuration

### Supported Programming Languages

The system supports all languages available in Judge0:

- **Python** (3.8, 3.9, 3.10)
- **JavaScript** (Node.js)
- **Java** (OpenJDK 8, 11, 17)
- **C++** (GCC 9.4, Clang 10)
- **C** (GCC 9.4)
- **C#** (.NET Core)
- **Go** (1.19)
- **Rust** (1.65)
- **Ruby** (3.0)
- **PHP** (8.1)

### Judge0 Configuration

If running Judge0 locally:

```bash
# Quick setup with Docker
docker run -p 2358:2358 -d judge0/judge0:1.13.0
```

For production, use the official Judge0 deployment guide.

### Environment Variables Reference

| Variable          | Required | Description                  | Default                 |
| ----------------- | -------- | ---------------------------- | ----------------------- |
| `MONGODB_URI`     | ✅       | MongoDB connection string    | -                       |
| `POSTGRESQL_URL`  | ✅       | PostgreSQL connection string | -                       |
| `JUDGE0_HOST`     | ✅       | Judge0 API host              | `localhost`             |
| `JUDGE0_PORT`     | ✅       | Judge0 API port              | `2358`                  |
| `JUDGE0_PROTOCOL` | ❌       | Protocol for Judge0          | `http`                  |
| `SESSION_SECRET`  | ✅       | Session encryption key       | -                       |
| `PORT`            | ❌       | Server port                  | `5000`                  |
| `NODE_ENV`        | ❌       | Environment                  | `development`           |
| `FRONTEND_URL`    | ❌       | Frontend URL for CORS        | `http://localhost:3000` |

## 🚨 Important Notes

### Migration from Old System

This version completely eliminates in-memory storage:

- ✅ **All data persists in MongoDB**
- ✅ **No data loss on server restart**
- ✅ **Scalable across multiple server instances**
- ✅ **Real-time statistics updates**

### Security Considerations

- User authentication via PostgreSQL
- Session management with MongoDB store
- Input validation on all endpoints
- SQL injection protection with Drizzle ORM
- NoSQL injection protection with Mongoose

### Performance Optimizations

- MongoDB indexing on frequently queried fields
- Pagination for large result sets
- Efficient aggregation pipelines for statistics
- Connection pooling for databases
- Caching for frequently accessed data

## 🔄 Development Workflow

### Adding New Questions

1. **Manual Creation** (via API):

   ```bash
   POST /api/questions
   {
     "title": "New Problem",
     "description": "Problem description...",
     "difficulty": { "level": "Medium", "score": 5 },
     "testCases": [...],
     "examples": [...]
   }
   ```

2. **Bulk Import** (via seeder):
   ```bash
   # Add questions to assets/questions.json
   npm run seed
   ```

### Testing New Features

1. Create test questions
2. Submit test solutions
3. Verify statistics updates
4. Check edge cases

### Database Migrations

For schema changes:

```bash
# PostgreSQL (auth tables)
npm run migrate:generate
npm run migrate:push

# MongoDB (questions/submissions)
# Update models and run seeder
npm run seed
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**

   ```bash
   # Check MongoDB is running
   mongosh --eval "db.adminCommand('ping')"
   ```

2. **Judge0 Not Responding**

   ```bash
   # Test Judge0 directly
   curl http://localhost:2358/about
   ```

3. **PostgreSQL Connection Issues**

   ```bash
   # Test connection
   psql postgresql://username:password@localhost:5432/codequest
   ```

4. **Port Already in Use**
   ```bash
   # Find process using port 5000
   lsof -i :5000
   # Kill process
   kill -9 <PID>
   ```

### Debugging

Enable debug mode:

```bash
DEBUG=codequest:* npm run dev
```

Check logs:

```bash
# Application logs
tail -f logs/app.log

# MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Docker logs
docker-compose logs -f
```

## 📈 Production Deployment

### Environment Setup

1. **Server Requirements**:

   - 2+ CPU cores
   - 4GB+ RAM
   - 20GB+ storage
   - Ubuntu 20.04+ or similar

2. **Dependencies**:

   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt-get update && sudo apt-get install -y mongodb-org
   ```

3. **Process Management**:

   ```bash
   # Install PM2
   npm install -g pm2

   # Start application
   pm2 start ecosystem.config.js

   # Setup auto-restart
   pm2 startup
   pm2 save
   ```

### Load Balancing

For high traffic, use nginx as reverse proxy:

```nginx
upstream codequest_backend {
    server localhost:5000;
    server localhost:5001;
    server localhost:5002;
}

server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://codequest_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Follow the coding standards
4. Add tests for new functionality
5. Update documentation
6. Submit pull request

### Code Style

- Use ESLint configuration
- Follow Prettier formatting
- Write comprehensive JSDoc comments
- Use semantic commit messages

---

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Open GitHub issues for bugs and feature requests
- **Community**: Join our Discord server for discussions

---

_This system provides a complete, production-ready coding judge platform with modern architecture, comprehensive testing capabilities, and easy scalability._
