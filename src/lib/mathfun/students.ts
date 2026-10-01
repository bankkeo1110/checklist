// The standalone MathFun site had its own signup, so the two kids' existing
// `students` rows (with their practice history and badges) are keyed by
// whatever name they picked there — not the checklist ChildName enum. Map the
// two known accounts explicitly so checklist sessions resolve to the same
// MathFun profile instead of a blank one.
export const STUDENT_NAME_BY_CHILD: Partial<Record<string, string>> = {
  OTIS: "Otis",
  LIAM: "Liam",
};

export function mathfunStudentName(childName: string): string {
  return STUDENT_NAME_BY_CHILD[childName] ?? childName;
}
