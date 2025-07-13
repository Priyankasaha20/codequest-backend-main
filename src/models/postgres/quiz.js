import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  json,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";

// Quiz table
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  topic: varchar("topic", { length: 100 }).notNull(),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: json("options").notNull(),
  answer: varchar("answer", { length: 1 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
