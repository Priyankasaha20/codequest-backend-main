import { db } from "../config/dbPostgres.js";
import { quizzes, questions } from "../models/postgres/quiz.js";
import { eq, sql } from "drizzle-orm";

export const startQuiz = async (req, res) => {
  try {
    const { topic, count = 10 } = req.body;
    const userId = req.user.id;

    // Validate count parameter
    const questionCount = parseInt(count, 10);
    if (isNaN(questionCount) || questionCount < 1 || questionCount > 50) {
      return res.status(400).json({
        error: "Count must be a number between 1 and 50",
      });
    }

    let quiz;
    let quizQuestions;

    if (topic) {
      // Get quiz for specific topic
      [quiz] = await db.select().from(quizzes).where(eq(quizzes.topic, topic));

      if (!quiz) {
        return res.status(404).json({
          error: `No quiz found for topic: ${topic}`,
        });
      }

      // Get random questions for this specific quiz
      quizQuestions = await db
        .select({
          id: questions.id,
          question: questions.question,
          options: questions.options,
          answer: questions.answer,
        })
        .from(questions)
        .where(eq(questions.quizId, quiz.id))
        .orderBy(sql`RANDOM()`)
        .limit(questionCount);
    } else {
      // Random questions from all topics
      quizQuestions = await db
        .select({
          id: questions.id,
          question: questions.question,
          options: questions.options,
          answer: questions.answer,
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

      // For random questions, create a mixed quiz object
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

    // Generate unique quiz session ID
    const quizSessionId = `quiz_${userId}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Store quiz session in session storage
    req.session.quizSessions = req.session.quizSessions || {};
    req.session.quizSessions[quizSessionId] = {
      userId,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        topic: quiz.topic,
        description: quiz.description,
      },
      questions: quizQuestions,
      currentQuestionIndex: 0,
      answers: [],
      startedAt: new Date(),
      totalQuestions: quizQuestions.length,
    };

    return res.json({
      quizSessionId,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        topic: quiz.topic,
        description: quiz.description,
      },
      totalQuestions: quizQuestions.length,
      message:
        "Quiz started successfully. Use the quizSessionId to get questions.",
    });
  } catch (error) {
    console.error("Error starting quiz:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getQuizQuestion = async (req, res) => {
  try {
    const { quizSessionId } = req.params;
    const userId = req.user.id;

    // Get quiz session from session storage
    const quizSession = req.session.quizSessions?.[quizSessionId];

    if (!quizSession) {
      return res.status(404).json({
        error: "Quiz session not found or expired",
      });
    }

    // Verify user owns this quiz session
    if (quizSession.userId !== userId) {
      return res.status(403).json({
        error: "Access denied to this quiz session",
      });
    }

    // Check if quiz is completed
    if (quizSession.currentQuestionIndex >= quizSession.questions.length) {
      return res.status(400).json({
        error: "Quiz already completed",
        completed: true,
        totalQuestions: quizSession.totalQuestions,
        answeredQuestions: quizSession.answers.length,
      });
    }

    const currentQuestion =
      quizSession.questions[quizSession.currentQuestionIndex];

    return res.json({
      quizSessionId,
      questionNumber: quizSession.currentQuestionIndex + 1,
      totalQuestions: quizSession.totalQuestions,
      question: {
        id: currentQuestion.id,
        question: currentQuestion.question,
        options: currentQuestion.options,
      },
      timeRemaining: null, // Can be implemented later for timed quizzes
    });
  } catch (error) {
    console.error("Error getting quiz question:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const submitQuizAnswer = async (req, res) => {
  try {
    const { quizSessionId } = req.params;
    const { answer } = req.body;
    const userId = req.user.id;

    if (!answer) {
      return res.status(400).json({
        error: "Answer is required",
      });
    }

    // Get quiz session from session storage
    const quizSession = req.session.quizSessions?.[quizSessionId];

    if (!quizSession) {
      return res.status(404).json({
        error: "Quiz session not found or expired",
      });
    }

    // Verify user owns this quiz session
    if (quizSession.userId !== userId) {
      return res.status(403).json({
        error: "Access denied to this quiz session",
      });
    }

    // Check if quiz is already completed
    if (quizSession.currentQuestionIndex >= quizSession.questions.length) {
      return res.status(400).json({
        error: "Quiz already completed",
      });
    }

    const currentQuestion =
      quizSession.questions[quizSession.currentQuestionIndex];
    const isCorrect =
      answer.toUpperCase() === currentQuestion.answer.toUpperCase();

    // Store the answer
    quizSession.answers.push({
      questionId: currentQuestion.id,
      userAnswer: answer.toUpperCase(),
      correctAnswer: currentQuestion.answer,
      isCorrect,
      answeredAt: new Date(),
    });

    // Move to next question
    quizSession.currentQuestionIndex++;

    // Update session
    req.session.quizSessions[quizSessionId] = quizSession;

    const isCompleted =
      quizSession.currentQuestionIndex >= quizSession.questions.length;

    if (isCompleted) {
      // Calculate final score
      const correctAnswers = quizSession.answers.filter(
        (a) => a.isCorrect
      ).length;
      const score = Math.round(
        (correctAnswers / quizSession.totalQuestions) * 100
      );

      return res.json({
        submitted: true,
        isCorrect,
        completed: true,
        finalResults: {
          score,
          correctAnswers,
          totalQuestions: quizSession.totalQuestions,
          percentage: score,
          timeTaken: Math.round(
            (new Date() - new Date(quizSession.startedAt)) / 1000
          ), // in seconds
        },
      });
    }

    return res.json({
      submitted: true,
      isCorrect,
      completed: false,
      nextQuestion: quizSession.currentQuestionIndex + 1,
      totalQuestions: quizSession.totalQuestions,
    });
  } catch (error) {
    console.error("Error submitting quiz answer:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
