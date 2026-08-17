/** Tiny class-name joiner used across the lecturer UI. */
export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(' ');
}

// ---- Inlined from @goinze/shared-utils ----

export function currentAcademicSession(date = new Date()): string {
  const year = date.getFullYear();
  return date.getMonth() >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}
