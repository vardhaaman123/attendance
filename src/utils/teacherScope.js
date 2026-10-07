/**
 * Utility to extract and enforce teacher access boundaries
 * based on admin-assigned class, section, and subject data.
 */

export function getTeacherScope(user, role) {
  const isTeacher = role === 'teacher' || (user?.role && String(user.role).toLowerCase() === 'teacher');

  if (!isTeacher) {
    return {
      isTeacher: false,
      isRestricted: false,
      allowedClasses: [],
      allowedSections: [],
      allowedSubjects: [],
      defaultClass: '',
      defaultSection: '',
      teacherSubject: '',
      isClassAllowed: () => true,
      isSectionAllowed: () => true,
      isSubjectAllowed: () => true,
      isStudentAllowed: () => true,
      filterStudents: (list) => list || [],
    };
  }

  // 1. Parse assigned class(es) (e.g. 8, 8th, Class 8, 8, 9, 8 & 9, 8 and 9)
  const rawClass = String(user?.class || '').trim();
  let allowedClasses = [];
  if (rawClass) {
    allowedClasses = Array.from(new Set(
      rawClass
        .replace(/\band\b/gi, ',')
        .split(/[,\/&|]+/)
        .map(c => c.trim().replace(/^(class|cls)\.?\s*/i, '').replace(/(st|nd|rd|th)$/i, '').trim())
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  // 2. Parse assigned section(s) (e.g. A, B, a , b, A,B, A & B, A and B, Sec A, B, All)
  const rawSection = String(user?.section || '').trim().toUpperCase();
  let allowedSections = [];
  if (rawSection && !rawSection.includes('ALL')) {
    allowedSections = Array.from(new Set(
      rawSection
        .replace(/\bAND\b/gi, ',')
        .split(/[,\/&|\s]+/)
        .map(s => s.trim().replace(/^(SEC|SECTION)\.?\s*/i, '').replace(/[^A-Z0-9]/g, ''))
        .filter(s => Boolean(s) && s !== 'AND' && s !== 'SEC' && s !== 'SECTION')
    )).sort();
  }

  // 3. Parse assigned subject(s) (e.g. Mathematics, Science, English, etc.)
  const rawSubject = String(user?.subject || '').trim();
  let allowedSubjects = [];
  if (rawSubject && !rawSubject.toLowerCase().includes('all')) {
    allowedSubjects = Array.from(new Set(
      rawSubject
        .replace(/\band\b/gi, ',')
        .split(/[,\/&|]+/)
        .map(s => s.trim())
        .filter(Boolean)
    ));
  }

  const isClassAllowed = (cls) => {
    if (allowedClasses.length === 0) return true;
    const clean = String(cls || '').trim().replace(/^(class|cls)\.?\s*/i, '').replace(/(st|nd|rd|th)$/i, '').trim();
    return allowedClasses.includes(clean);
  };

  const isSectionAllowed = (sec) => {
    if (allowedSections.length === 0) return true;
    const clean = String(sec || '').trim().toUpperCase().replace(/^(SEC|SECTION)\.?\s*/i, '').replace(/[^A-Z0-9]/g, '');
    return allowedSections.includes(clean);
  };

  const isSubjectAllowed = (subj) => {
    if (allowedSubjects.length === 0) return true;
    const clean = String(subj || '').trim().toLowerCase();
    return allowedSubjects.some(s => s.toLowerCase() === clean);
  };

  const isStudentAllowed = (student) => {
    if (!student) return false;
    return isClassAllowed(student.class) && isSectionAllowed(student.section);
  };

  const filterStudents = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(isStudentAllowed);
  };

  return {
    isTeacher: true,
    isRestricted: allowedClasses.length > 0 || allowedSections.length > 0,
    allowedClasses,
    allowedSections,
    allowedSubjects,
    defaultClass: allowedClasses[0] || '',
    defaultSection: allowedSections[0] || '',
    teacherSubject: allowedSubjects[0] || rawSubject || '',
    isClassAllowed,
    isSectionAllowed,
    isSubjectAllowed,
    isStudentAllowed,
    filterStudents,
  };
}
