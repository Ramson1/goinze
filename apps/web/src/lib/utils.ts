/**
 * Academic session name derived from the current date, e.g. "2026/2027".
 * The session runs July to June, so from July onwards the session is
 * `year/year+1`, otherwise `year-1/year`.
 */
export function currentAcademicSession(date = new Date()): string {
  const year = date.getFullYear();
  return date.getMonth() >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}
