// Unified messaging utilities for unread status and user identity mapping

export const normalizeRoll = (roll) => (roll != null ? String(roll).trim().toLowerCase().replace(/^0+/, '') : '');

export const matchesStudent = (stu, id, roll, email, name) => {
  if (!stu) return false;
  const sId = stu.id || stu._docId;
  if (id && (sId === id || stu.entityId === id)) return true;
  if (roll && stu.rollNumber) {
    const r1 = normalizeRoll(roll);
    const r2 = normalizeRoll(stu.rollNumber);
    if (r1 && r2 && r1 === r2) return true;
  }
  if (email) {
    const cleanEmail = String(email).trim().toLowerCase();
    if (stu.email && stu.email.trim().toLowerCase() === cleanEmail) return true;
    if (stu.parentEmail && stu.parentEmail.trim().toLowerCase() === cleanEmail) return true;
  }
  if (name && stu.name) {
    if (stu.name.trim().toLowerCase() === String(name).trim().toLowerCase()) return true;
  }
  return false;
};

export const getUserIdentities = ({ role, user, currentStudent, teachers = [], students = [] }) => {
  const normRole = (role || 'admin').toLowerCase();

  if (normRole === 'student') {
    const currentStudentRecord = (students || []).find((s) => {
      if (!currentStudent) return false;
      const sId = s.id || s._docId;
      const cId = currentStudent.id || currentStudent._docId;
      if (cId && (sId === cId || s._docId === cId)) return true;
      if (currentStudent.rollNumber && s.rollNumber) {
        const sRoll = normalizeRoll(s.rollNumber);
        const cRoll = normalizeRoll(currentStudent.rollNumber);
        if (sRoll && cRoll && sRoll === cRoll) return true;
      }
      if (currentStudent.email && s.email && s.email.toLowerCase().trim() === currentStudent.email.toLowerCase().trim()) return true;
      if (currentStudent.email && s.parentEmail && s.parentEmail.toLowerCase().trim() === currentStudent.email.toLowerCase().trim()) return true;
      if (currentStudent.parentEmail && s.parentEmail && s.parentEmail.toLowerCase().trim() === currentStudent.parentEmail.toLowerCase().trim()) return true;
      if (currentStudent.parentEmail && s.email && s.email.toLowerCase().trim() === currentStudent.parentEmail.toLowerCase().trim()) return true;
      if (currentStudent.name && s.name && s.name.toLowerCase().trim() === currentStudent.name.toLowerCase().trim()) return true;
      return false;
    }) || currentStudent;

    const myId = currentStudentRecord?.id || currentStudentRecord?._docId || currentStudent?.id || currentStudent?._docId || 'student';

    const rawRoll = currentStudentRecord?.rollNumber || currentStudent?.rollNumber;
    const strippedRoll = rawRoll ? String(rawRoll).trim().replace(/^0+/, '') : null;
    const paddedRoll = rawRoll ? String(rawRoll).trim().padStart(3, '0') : null;

    const myAllIds = [
      currentStudentRecord?.id,
      currentStudentRecord?._docId,
      currentStudentRecord?.entityId,
      currentStudent?.id,
      currentStudent?._docId,
      currentStudent?.entityId,
      rawRoll ? String(rawRoll).trim() : null,
      strippedRoll,
      paddedRoll,
      currentStudentRecord?.email?.toLowerCase().trim(),
      currentStudent?.email?.toLowerCase().trim(),
      currentStudentRecord?.parentEmail?.toLowerCase().trim(),
      currentStudent?.parentEmail?.toLowerCase().trim(),
      currentStudentRecord?.name?.toLowerCase().trim(),
      currentStudent?.name?.toLowerCase().trim(),
    ].filter(Boolean);

    return {
      normRole: 'student',
      myId,
      myAllIds,
      studentRecord: currentStudentRecord,
      teacherRecord: null,
    };
  }

  if (normRole === 'teacher') {
    const currentTeacherRecord = (teachers || []).find((t) =>
      t && (
        (user?.id && (t.id === user.id || t._docId === user.id)) ||
        (user?.email && t.email && String(t.email).toLowerCase().trim() === String(user.email).toLowerCase().trim()) ||
        (user?.name && t.name && String(t.name).toLowerCase().trim() === String(user.name).toLowerCase().trim())
      )
    ) || user;

    const myId = currentTeacherRecord?.id || currentTeacherRecord?._docId || user?.id || user?.uid || 'teacher';

    const myAllIds = [
      currentTeacherRecord?.id,
      currentTeacherRecord?._docId,
      currentTeacherRecord?.entityId,
      user?.id,
      user?.uid,
      currentTeacherRecord?.email ? String(currentTeacherRecord.email).toLowerCase().trim() : null,
      user?.email ? String(user.email).toLowerCase().trim() : null,
      currentTeacherRecord?.name ? String(currentTeacherRecord.name).toLowerCase().trim() : null,
      user?.name ? String(user.name).toLowerCase().trim() : null,
    ].filter(Boolean);

    return {
      normRole: 'teacher',
      myId,
      myAllIds,
      studentRecord: null,
      teacherRecord: currentTeacherRecord,
    };
  }

  // Admin
  const myId = 'admin';
  const myAllIds = ['admin', user?.uid, user?.id, user?.email ? String(user.email).toLowerCase().trim() : null].filter(Boolean);

  return {
    normRole: 'admin',
    myId,
    myAllIds,
    studentRecord: null,
    teacherRecord: null,
  };
};

export const isMessageSentByMe = (msg, identities, students = []) => {
  if (!msg || !identities) return false;
  const { normRole, myAllIds = [], studentRecord } = identities;
  const msgSenderRole = (msg.senderRole || '').toLowerCase();
  const senderId = msg.senderId;

  if (normRole === 'admin') {
    return msgSenderRole === 'admin' || senderId === 'admin' || (myAllIds && myAllIds.includes(senderId));
  }

  if (normRole === 'student') {
    if (myAllIds && myAllIds.includes(senderId)) return true;
    if (matchesStudent(studentRecord, senderId, msg.senderRollNumber, msg.senderEmail, msg.senderName)) return true;
    if (senderId && students?.length > 0 && studentRecord) {
      const found = students.find((s) => s && (s.id || s._docId) === senderId);
      if (found && matchesStudent(studentRecord, found.id, found.rollNumber, found.email || found.parentEmail, found.name)) return true;
    }
    return false;
  }

  // Teacher
  if (myAllIds && myAllIds.includes(senderId)) return true;
  if (msg.senderEmail && myAllIds && myAllIds.includes(String(msg.senderEmail).toLowerCase().trim())) return true;
  return false;
};

export const isMessageTargetingMe = (msg, identities, students = []) => {
  if (!msg || !identities) return false;
  const { normRole, myAllIds = [], studentRecord } = identities;
  const msgTargetRole = (msg.targetRole || '').toLowerCase();
  const targetId = msg.targetId;

  // 1. Broadcast to Everyone
  if (targetId === 'all' || !targetId || msgTargetRole === 'all') {
    if (!msgTargetRole || msgTargetRole === 'all') return true;
    if (normRole === 'admin') return true;
    if (normRole === 'student' && msgTargetRole === 'student') return true;
    if (normRole === 'teacher' && msgTargetRole === 'teacher') return true;
    return false;
  }

  // 2. Role = Admin
  if (normRole === 'admin') {
    if (msgTargetRole === 'admin' || targetId === 'admin') return true;
    if (myAllIds.includes(targetId)) return true;
    return false;
  }

  // 3. Role = Teacher
  if (normRole === 'teacher') {
    if (msgTargetRole === 'teacher' && (targetId === 'all' || !targetId)) return true;
    if (myAllIds.includes(targetId)) return true;
    if (msg.targetEmail && myAllIds.includes(String(msg.targetEmail).toLowerCase().trim())) return true;
    return false;
  }

  // 4. Role = Student
  if (normRole === 'student') {
    if (msgTargetRole === 'student' && (targetId === 'all' || !targetId)) return true;
    if (myAllIds.includes(targetId)) return true;
    if (matchesStudent(studentRecord, targetId, msg.targetRollNumber, msg.targetEmail || msg.targetParentEmail, msg.targetName)) return true;
    if (targetId && students?.length > 0 && studentRecord) {
      const found = students.find((s) => (s.id || s._docId) === targetId);
      if (found && matchesStudent(studentRecord, found.id, found.rollNumber, found.email || found.parentEmail, found.name)) return true;
    }
    return false;
  }

  return false;
};

export const isMessageUnreadForUser = (msg, identities, students = []) => {
  if (!msg || !identities) return false;
  if (isMessageSentByMe(msg, identities, students)) return false;
  if (!isMessageTargetingMe(msg, identities, students)) return false;

  const readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
  const { myId, myAllIds } = identities;

  if (readBy.includes(myId)) return false;
  if (myAllIds.some((id) => readBy.includes(id))) return false;

  return true;
};

export const getUnreadMessagesCountForUser = (messages = [], identities, students = []) => {
  if (!messages || !identities) return 0;
  return messages.filter((m) => isMessageUnreadForUser(m, identities, students)).length;
};
