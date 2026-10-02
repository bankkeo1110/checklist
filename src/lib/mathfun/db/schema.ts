import { pgTable, serial, text, integer, boolean, timestamp, varchar, unique } from 'drizzle-orm/pg-core';

export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 100 }),
  avatar: varchar('avatar', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id),
  topic: varchar('topic', { length: 50 }).notNull(),
  startedAt: timestamp('started_at').defaultNow(),
  finishedAt: timestamp('finished_at'),
});

export const answers = pgTable('answers', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id),
  studentId: integer('student_id').references(() => students.id),
  topic: varchar('topic', { length: 50 }).notNull(),
  question: text('question').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  studentAnswer: text('student_answer').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  answeredAt: timestamp('answered_at').defaultNow(),
});

// badge: 'bronze' (any score) | 'silver' (≥70%) | 'gold' (≥90%) | 'perfect' (100%)
export const studentBadges = pgTable('student_badges', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id).notNull(),
  topic: varchar('topic', { length: 50 }).notNull(),
  badge: varchar('badge', { length: 20 }).notNull(),
  bestScore: integer('best_score').notNull(),
  attempts: integer('attempts').notNull().default(1),
  earnedAt: timestamp('earned_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  studentTopicUniq: unique().on(table.studentId, table.topic),
}));

// One row per full exam (practice test) a student submits. `answers` and
// `bySkill` are JSON strings (Neon's HTTP driver + this schema don't need a
// native jsonb column for something this small and write-once).
export const examAttempts = pgTable('exam_attempts', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id).notNull(),
  examId: varchar('exam_id', { length: 100 }).notNull(),
  correct: integer('correct').notNull(),
  total: integer('total').notNull(),
  // JSON: Record<questionIndex, { given: string | string[]; correct: boolean }>
  answers: text('answers').notNull(),
  // JSON: Record<skillLabel, { correct: number; total: number }>
  bySkill: text('by_skill').notNull(),
  finishedAt: timestamp('finished_at').defaultNow(),
});
