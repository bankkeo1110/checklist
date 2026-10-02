// A graded practice test ("đề thi"), as opposed to the endless-random-question
// Practice mode in questions.ts — same idea as a VioEdu "skill test" export,
// but authored as data so it can be auto-graded and saved to the DB.
//
// `content` (and each choice) is plain text with:
//   - $...$          inline KaTeX math
//   - [I:filename]    image from VioEdu's image_question bucket (kept for the
//                      imported exam; new exams avoid this entirely)
//   - [U:full-url]    image from a full URL
//   - {}              a blank, filled in order by `blanks`/`dropdowns`

export type QuestionType = "single" | "multi" | "fill" | "choose";

export type ExamQuestion = {
  type: QuestionType;
  /** Must match a label in the exam's `skills` list — powers the Learn page's per-skill accuracy. */
  skill: string;
  content: string;
  /** "single" | "multi" — the options to pick from. */
  choices?: string[];
  /** "single" | "multi" — correct indices into `choices`. */
  correctChoices?: number[];
  /** "fill" — correct answer text for each {} blank, in order. Compared trimmed, case-insensitively. */
  blanks?: string[];
  /** "choose" — one entry per {} blank: the options for that blank's dropdown, and the correct index. */
  dropdowns?: { options: string[]; correct: number }[];
};

export type Exam = {
  id: string;
  title: string;
  grade: number;
  durationMinutes: number;
  /** Skills in question order, each with how many consecutive questions cover it — drives the overview table. */
  skills: { label: string; count: number }[];
  questions: ExamQuestion[];
};

/** Expands `skills` (run-length by question order) into one skill label per question. */
export function skillPerQuestion(exam: Exam): string[] {
  const out: string[] = [];
  for (const { label, count } of exam.skills) {
    for (let i = 0; i < count; i++) out.push(label);
  }
  return out;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Grades one question against a student's given answer(s); see submitted shape per type below. */
export type SafeQuestion = Omit<ExamQuestion, "correctChoices" | "blanks" | "dropdowns"> & {
  /** Blank count only (no answers) — client renders this many inputs. */
  blankCount?: number;
  /** Dropdown options only (no `correct` index). */
  dropdowns?: { options: string[] }[];
};

export type SafeExam = Omit<Exam, "questions"> & { questions: SafeQuestion[] };

/** Strips every correct-answer field before a question goes to the client. */
export function sanitizeExam(exam: Exam): SafeExam {
  return {
    ...exam,
    questions: exam.questions.map((q) => {
      const { correctChoices: _cc, blanks, dropdowns, ...rest } = q;
      void _cc;
      return {
        ...rest,
        ...(blanks ? { blankCount: blanks.length } : {}),
        ...(dropdowns ? { dropdowns: dropdowns.map((d) => ({ options: d.options })) } : {}),
      };
    }),
  };
}

/** Human-readable correct answer, for the post-submit review screen. */
export function correctAnswerSummary(q: ExamQuestion): string {
  switch (q.type) {
    case "single":
    case "multi":
      return (q.correctChoices ?? []).map((i) => q.choices?.[i] ?? "").join(", ");
    case "fill":
      return (q.blanks ?? []).join(", ");
    case "choose":
      return (q.dropdowns ?? []).map((d) => d.options[d.correct]).join(", ");
    default:
      return "";
  }
}

export function gradeQuestion(
  q: ExamQuestion,
  given: number | number[] | string[] | undefined,
): boolean {
  if (given === undefined) return false;
  switch (q.type) {
    case "single":
      return typeof given === "number" && q.correctChoices?.[0] === given;
    case "multi": {
      if (!Array.isArray(given) || !q.correctChoices) return false;
      const givenSet = new Set(given as number[]);
      const wantSet = new Set(q.correctChoices);
      return givenSet.size === wantSet.size && [...wantSet].every((i) => givenSet.has(i));
    }
    case "fill": {
      if (!Array.isArray(given) || !q.blanks) return false;
      return q.blanks.every((correct, i) => normalize(String(given[i] ?? "")) === normalize(correct));
    }
    case "choose": {
      if (!Array.isArray(given) || !q.dropdowns) return false;
      return q.dropdowns.every((d, i) => Number(given[i]) === d.correct);
    }
    default:
      return false;
  }
}
