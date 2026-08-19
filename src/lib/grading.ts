export const GRADES = [
  { grade: 'A+', point: 4.0 },
  { grade: 'A', point: 4.0 },
  { grade: 'A-', point: 3.7 },
  { grade: 'B+', point: 3.3 },
  { grade: 'B', point: 3.0 },
  { grade: 'B-', point: 2.7 },
  { grade: 'C+', point: 2.3 },
  { grade: 'C', point: 2.0 },
  { grade: 'C-', point: 1.7 },
  { grade: 'D', point: 1.0 },
  { grade: 'F', point: 0.0 },
];

export function getGradePoint(grade: string): number | null {
  const match = GRADES.find((g) => g.grade === grade.toUpperCase());
  return match ? match.point : null;
}

export function calculateGPA(records: { creditHours: number; gradePoint: number }[]): number {
  if (!records || records.length === 0) return 0;

  let totalCredits = 0;
  let totalPoints = 0;

  for (const record of records) {
    if (record.creditHours > 0) {
      totalCredits += record.creditHours;
      totalPoints += record.creditHours * record.gradePoint;
    }
  }

  if (totalCredits === 0) return 0;

  return Number((totalPoints / totalCredits).toFixed(2));
}
