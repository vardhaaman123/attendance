// Marks retention utility — marks and exam records are preserved permanently
export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Filter and validate exam objects.
 * Exams are permanently retained across Admin, Teacher, and Student portals.
 */
export function filterValidExams(examList) {
  if (!Array.isArray(examList)) return [];
  return examList.filter((exam) => exam && typeof exam === 'object');
}

/**
 * Exams are retained permanently and never auto-expire.
 */
// eslint-disable-next-line no-unused-vars
export function getExamDaysRemaining(exam) {
  return null;
}

