/** Tiny class-name joiner used across the admin UI. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

// ---- Inlined from @goinze/shared-utils ----

export function currentAcademicSession(date = new Date()): string {
  const year = date.getFullYear();
  return date.getMonth() >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(amount);
}
