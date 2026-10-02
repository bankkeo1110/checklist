import type { Exam } from "./types";
import { toan4Ck1De1 } from "./toan4-ck1-de1";
import { toan4Ck1De2 } from "./toan4-ck1-de2";
import { toan4Ck1De3 } from "./toan4-ck1-de3";

export const EXAMS: Exam[] = [toan4Ck1De1, toan4Ck1De2, toan4Ck1De3];

export function getExam(id: string): Exam | undefined {
  return EXAMS.find((e) => e.id === id);
}

export * from "./types";
