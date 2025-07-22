import { db } from "../config/dbPostgres.js";
import { quizzes, questions } from "../models/postgres/quiz.js";
import { users } from "../models/postgres/auth.js";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedQuestions } from "./questionSeeder.js";

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Load and parse the question bank
    const questionBankPath = path.join(
      process.cwd(),
      "assets",
      "question_bank_100_fixed.json"
    );
    const questionBankData = JSON.parse(
      fs.readFileSync(questionBankPath, "utf8")
    );

    // Find or create system user
    let [systemUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "system@codequest.com"));

    if (!systemUser) {
      [systemUser] = await db
        .insert(users)
        .values({
          email: "system@codequest.com",
          name: "System",
          emailVerified: true,
        })
        .returning();
      console.log("✅ Created system user for seeding");
    }

    // Seed quizzes and questions
    for (const [topic, questionsData] of Object.entries(questionBankData)) {
      console.log(`📚 Processing topic: ${topic}`);

      const [existingQuiz] = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.topic, topic));

      if (existingQuiz) {
        console.log(
          `⚠️  Quiz for topic "${topic}" already exists. Skipping...`
        );
        continue;
      }

      const [quiz] = await db
        .insert(quizzes)
        .values({
          title: `${topic} Quiz`,
          description: `Comprehensive quiz covering ${topic} concepts`,
          topic,
          createdBy: systemUser.id,
        })
        .returning();

      console.log(`✅ Created quiz: ${quiz.title}`);

      const validQuestions = questionsData.filter(
        (q) => q.question && q.options && q.answer
      );

      console.log(
        `📝 Found ${validQuestions.length} valid questions out of ${questionsData.length} total`
      );

      const questionInserts = validQuestions.map((q) => ({
        quizId: quiz.id,
        question: q.question,
        options: q.options,
        answer: q.answer,
      }));

      if (questionInserts.length > 0) {
        await db.insert(questions).values(questionInserts);
        console.log(
          `✅ Inserted ${questionInserts.length} questions for ${topic}`
        );
      }
    }

    // MongoDB Seeding
    console.log("🌿 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    console.log("📥 Seeding MongoDB questions...");
    await seedQuestions();
    console.log("🎉 MongoDB question seeding completed");

    await mongoose.disconnect();
    console.log("🔌 MongoDB connection closed");

    console.log("✅🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}

export default seedDatabase;
