/** Tiny class-name joiner (avoids a clsx dependency). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

// ---- Inlined from @goinze/shared-utils ----

export interface GradeBand {
  grade: string;
  min: number;
  max: number;
  point: number;
  remark: string;
}

export interface GpaResult {
  totalUnits: number;
  totalPoints: number;
  gpa: number;
  classification: string;
}

const DEFAULT_GRADE_BANDS: GradeBand[] = [
  { grade: 'A', min: 70, max: 100, point: 5, remark: 'Excellent' },
  { grade: 'B', min: 60, max: 69, point: 4, remark: 'Very Good' },
  { grade: 'C', min: 50, max: 59, point: 3, remark: 'Good' },
  { grade: 'D', min: 45, max: 49, point: 2, remark: 'Pass' },
  { grade: 'E', min: 40, max: 44, point: 1, remark: 'Weak Pass' },
  { grade: 'F', min: 0, max: 39, point: 0, remark: 'Fail' },
];

export function resolveGrade(score: number, bands: GradeBand[] = DEFAULT_GRADE_BANDS): GradeBand {
  const clamped = Math.max(0, Math.min(100, score));
  return bands.find((b) => clamped >= b.min && clamped <= b.max) ?? bands[bands.length - 1]!;
}

function round(value: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

function classifyGpa(gpa: number): string {
  if (gpa >= 4.5) return 'First Class';
  if (gpa >= 3.5) return 'Second Class Upper';
  if (gpa >= 2.4) return 'Second Class Lower';
  if (gpa >= 1.5) return 'Third Class';
  if (gpa >= 1.0) return 'Pass';
  return 'Fail';
}

export interface CourseGrade {
  creditUnits: number;
  score: number;
}

export function computeGpa(courses: CourseGrade[], bands: GradeBand[] = DEFAULT_GRADE_BANDS): GpaResult {
  let totalUnits = 0;
  let totalPoints = 0;
  for (const c of courses) {
    const band = resolveGrade(c.score, bands);
    totalUnits += c.creditUnits;
    totalPoints += band.point * c.creditUnits;
  }
  const gpa = totalUnits > 0 ? totalPoints / totalUnits : 0;
  return { totalUnits, totalPoints, gpa: round(gpa, 2), classification: classifyGpa(gpa) };
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(amount);
}
