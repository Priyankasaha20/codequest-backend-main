import { db } from "../config/dbPostgres.js";
import { quizzes, questions } from "../models/postgres/quiz.js";
import { eq, sql } from "drizzle-orm";

export const getQuizQuestions = async (req, res) => {
  try {
    const { topic, count = 10 } = req.query;

    const questionCount = parseInt(count, 10);
    if (isNaN(questionCount) || questionCount < 1 || questionCount > 50) {
      return res.status(400).json({
        error: "Count must be a number between 1 and 50",
      });
    }

    let quiz;
    let quizQuestions;

    if (topic) {

      [quiz] = await db.select().from(quizzes).where(eq(quizzes.topic, topic));

      if (!quiz) {
        return res.status(404).json({
          error: `No quiz found for topic: ${topic}`,
        });
      }

      quizQuestions = await db
        .select({
          id: questions.id,
          question: questions.question,
          options: questions.options,
        })
        .from(questions)
        .where(eq(questions.quizId, quiz.id))
        .orderBy(sql`RANDOM()`)
        .limit(questionCount);
    } else {

      quizQuestions = await db
        .select({
          id: questions.id,
          question: questions.question,
          options: questions.options,
          quiz: {
            id: quizzes.id,
            title: quizzes.title,
            topic: quizzes.topic,
          },
        })
        .from(questions)
        .leftJoin(quizzes, eq(questions.quizId, quizzes.id))
        .orderBy(sql`RANDOM()`)
        .limit(questionCount);

      quiz = {
        id: "mixed",
        title: "Mixed Topics Quiz",
        topic: "Mixed",
        description: "Random questions from various topics",
      };
    }

    if (!quizQuestions || quizQuestions.length === 0) {
      return res.status(404).json({
        error: topic
          ? `No questions found for topic: ${topic}`
          : "No questions available",
      });
    }

    return res.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        topic: quiz.topic,
        description: quiz.description,
      },
      questions: quizQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        ...(topic ? {} : { topic: q.quiz?.topic }),
      })),
      totalQuestions: quizQuestions.length,
      requestedCount: questionCount,
    });
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
