// Marks retention & 1-week auto-deletion utility
export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (1 week)

/**
 * Filter out any exams whose date/creation is older than 1 week (7 days).
 * Applies across all sides: Admin, Teacher, and Student portals.
 */
export function filterValidExams(examList) {
  if (!Array.isArray(examList)) return [];
  const now = Date.now();
  return examList.filter(exam => {
    if (!exam) return false;
    // Primary reference: exam date (end of day). Fallback: createdAt timestamp
    const dateMs = exam.date ? new Date(exam.date + 'T23:59:59').getTime() : null;
    const createdMs = exam.createdAt ? new Date(exam.createdAt).getTime() : null;
    const refTime = dateMs || createdMs;
    if (!refTime || isNaN(refTime)) return true;
    return (now - refTime) <= ONE_WEEK_MS;
  });
}

/**
 * Calculates remaining days before an exam is automatically deleted.
 */
export function getExamDaysRemaining(exam) {
  if (!exam) return null;
  const dateMs = exam.date ? new Date(exam.date + 'T23:59:59').getTime() : (exam.createdAt ? new Date(exam.createdAt).getTime() : null);
  if (!dateMs || isNaN(dateMs)) return null;
  const remainingMs = (dateMs + ONE_WEEK_MS) - Date.now();
  const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  return Math.max(0, days);
}
