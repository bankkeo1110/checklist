import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

// Same Postgres database as Prisma (DATABASE_URL) — these tables are owned by
// this Drizzle layer and untouched by `prisma db push`, since they have no
// corresponding Prisma model.
const client = neon(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });

// Idempotent bootstrap — ported from the standalone MathFun app, which had no
// migration history (tables were created once by hand). Mirrors schema.ts
// exactly so a cold start on a fresh database self-heals. Neon's HTTP driver
// runs one statement per call, so each CREATE/ALTER is its own execute, in
// foreign-key dependency order.
async function bootstrap() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(100),
      avatar VARCHAR(10),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id),
      topic VARCHAR(50) NOT NULL,
      started_at TIMESTAMP DEFAULT NOW(),
      finished_at TIMESTAMP
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS answers (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES sessions(id),
      student_id INTEGER REFERENCES students(id),
      topic VARCHAR(50) NOT NULL,
      question TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      student_answer TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      answered_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS student_badges (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id),
      topic VARCHAR(50) NOT NULL,
      badge VARCHAR(20) NOT NULL,
      best_score INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 1,
      earned_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(student_id, topic)
    )
  `);
  await db.execute(sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar VARCHAR(10)`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS exam_attempts (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id),
      exam_id VARCHAR(100) NOT NULL,
      correct INTEGER NOT NULL,
      total INTEGER NOT NULL,
      answers TEXT NOT NULL,
      by_skill TEXT NOT NULL,
      finished_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

export const ready: Promise<void> = bootstrap().catch(() => undefined);
