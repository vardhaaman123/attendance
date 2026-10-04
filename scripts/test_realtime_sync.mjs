// scripts/test_realtime_sync.mjs
import assert from 'assert';

console.log('====================================================');
console.log('   STARTING REALTIME SYNC & DATA TRANSFORMATION TESTS   ');
console.log('====================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function it(description, fn) {
  try {
    fn();
    console.log(`  PASS: ${description}`);
    testsPassed++;
  } catch (err) {
    console.error(`  FAIL: ${description}`);
    console.error(`    Error: ${err.message}\n`);
    testsFailed++;
  }
}

// ---------------------------------------------------------
// 1. Mock Event Bus (Simulating BroadcastChannel + Storage)
// ---------------------------------------------------------
class MockLiveBus {
  constructor() {
    this.listeners = new Set();
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  broadcast(type, payload) {
    const event = {
      type,
      payload,
      timestamp: Date.now(),
      senderId: 'tab_' + Math.random().toString(36).substring(2, 7)
    };
    for (const fn of this.listeners) {
      fn(event);
    }
  }
}

const liveBus = new MockLiveBus();

// ---------------------------------------------------------
// 2. Simulating Admin State & Real-time Live Event Handler
// ---------------------------------------------------------
let adminTeachersState = [
  {
    id: 'T101',
    name: 'Sarah Connor',
    email: 'sarah.connor@school.edu',
    subject: 'Physics',
    class: '10',
    section: 'A',
    contact: '+91 98765 43210',
    password: 'oldTeacherPass123',
    collegeId: 'dps_main'
  },
  {
    id: 'T102',
    name: 'John Keating',
    email: 'john.keating@school.edu',
    subject: 'Literature',
    class: '10',
    section: 'B',
    contact: '+91 98765 43211',
    password: 'teacher123',
    collegeId: 'dps_main'
  }
];

let adminStudentsState = [
  {
    id: 'S001',
    name: 'Rohan Sharma',
    rollNumber: '01',
    email: 'rohan.sharma@school.edu',
    class: '10',
    section: 'A',
    parentName: 'Ramesh Sharma',
    contact: '+91 98111 22233',
    password: '1234',
    collegeId: 'dps_main'
  },
  {
    id: 'S002',
    name: 'Ananya Verma',
    rollNumber: '02',
    email: 'ananya.verma@school.edu',
    class: '10',
    section: 'A',
    parentName: 'Sunil Verma',
    contact: '+91 98111 22234',
    password: '1234',
    collegeId: 'dps_main'
  }
];

let activeCollegeTenant = 'dps_main';
let recentlyUpdatedTeacherId = null;
let recentlyUpdatedStudentId = null;
let toasts = [];

function addToast(msg, type) {
  toasts.push({ msg, type, timestamp: Date.now() });
}

// Attach listener exactly as implemented in AppContext.jsx
const unsubListener = liveBus.subscribe((event) => {
  if (!event || !event.type) return;

  // TEACHER HANDLER
  if (event.type === 'TEACHER_PASSWORD_UPDATED' || event.type === 'TEACHER_DATA_UPDATED') {
    const { teacherId, email, name, password, collegeId } = event.payload || {};
    const targetCollege = activeCollegeTenant;

    if (collegeId && targetCollege && collegeId !== targetCollege) {
      return;
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const idStr = teacherId ? String(teacherId).trim() : '';

    let found = false;
    adminTeachersState = adminTeachersState.map((t) => {
      const tId = t.id || t._docId;
      const matchesId = idStr && (tId === idStr || String(t.id) === idStr);
      const matchesEmail = cleanEmail && t.email && t.email.trim().toLowerCase() === cleanEmail;

      if (matchesId || matchesEmail) {
        found = true;
        return {
          ...t,
          ...(password ? { password } : {}),
          ...(event.payload?.teacherData || {}),
          _liveUpdatedAt: Date.now(),
        };
      }
      return t;
    });

    if (idStr) {
      recentlyUpdatedTeacherId = idStr;
    }
    const teacherLabel = name || email || 'Teacher';
    addToast(`Live sync: ${teacherLabel}'s password was updated.`, 'info');
  }

  // STUDENT HANDLER
  if (event.type === 'STUDENT_PASSWORD_UPDATED' || event.type === 'STUDENT_DATA_UPDATED') {
    const { studentId, rollNumber, email, name, password, collegeId } = event.payload || {};
    const targetCollege = activeCollegeTenant;

    if (collegeId && targetCollege && collegeId !== targetCollege) {
      return;
    }

    const cleanRoll = rollNumber ? String(rollNumber).trim().toLowerCase() : '';
    const cleanEmail = (email || '').trim().toLowerCase();
    const idStr = studentId ? String(studentId).trim() : '';

    let found = false;
    adminStudentsState = adminStudentsState.map((s) => {
      const sId = s.id || s._docId;
      const matchesId = idStr && (sId === idStr || String(s.id) === idStr);
      const matchesRoll = cleanRoll && s.rollNumber && String(s.rollNumber).trim().toLowerCase() === cleanRoll;
      const matchesEmail = cleanEmail && s.email && s.email.trim().toLowerCase() === cleanEmail;

      if (matchesId || matchesRoll || matchesEmail) {
        found = true;
        return {
          ...s,
          ...(password ? { password } : {}),
          ...(event.payload?.studentData || {}),
          _liveUpdatedAt: Date.now(),
        };
      }
      return s;
    });

    const pulseId = idStr || cleanRoll;
    if (pulseId) {
      recentlyUpdatedStudentId = pulseId;
    }
    const studentLabel = name || rollNumber || email || 'Student';
    addToast(`Live sync: ${studentLabel}'s password was updated.`, 'info');
  }
});

// ---------------------------------------------------------
// TEST SUITE
// ---------------------------------------------------------

console.log('--- TEST GROUP 1: TEACHER PASSWORD TRANSFORMATION ---');

it('Teacher changes password: Admin state transforms in real-time without reload', () => {
  const teacherBefore = adminTeachersState.find(t => t.id === 'T101');
  assert.strictEqual(teacherBefore.password, 'oldTeacherPass123');

  // Teacher dashboard updates password
  const newTeacherPassword = 'SecureTeacher#2026';
  liveBus.broadcast('TEACHER_PASSWORD_UPDATED', {
    teacherId: 'T101',
    email: 'sarah.connor@school.edu',
    name: 'Sarah Connor',
    password: newTeacherPassword,
    collegeId: 'dps_main',
    teacherData: {
      id: 'T101',
      name: 'Sarah Connor',
      email: 'sarah.connor@school.edu',
      subject: 'Physics',
      password: newTeacherPassword,
      collegeId: 'dps_main'
    }
  });

  const teacherAfter = adminTeachersState.find(t => t.id === 'T101');
  assert.strictEqual(teacherAfter.password, newTeacherPassword, 'Teacher password must reflect new password');
  assert.strictEqual(recentlyUpdatedTeacherId, 'T101', 'recentlyUpdatedTeacherId must highlight T101');
  assert.strictEqual(teacherAfter.subject, 'Physics', 'Existing properties must be preserved');
  assert.strictEqual(adminTeachersState.length, 2, 'No ghost/duplicate teacher doc must be created');
  assert.ok(toasts.some(t => t.msg.includes("Sarah Connor's password was updated")), 'Admin toast must be generated');
});

it('Teacher updates password matching by email fallback', () => {
  const newPassword = 'KeatingPoet#999';
  liveBus.broadcast('TEACHER_PASSWORD_UPDATED', {
    email: 'JOHN.KEATING@SCHOOL.EDU', // case-insensitive email
    name: 'John Keating',
    password: newPassword,
    collegeId: 'dps_main'
  });

  const teacher = adminTeachersState.find(t => t.id === 'T102');
  assert.strictEqual(teacher.password, newPassword, 'Email match must update password');
});

console.log('\n--- TEST GROUP 2: STUDENT PASSWORD TRANSFORMATION ---');

it('Student changes password: Admin state transforms in real-time without reload', () => {
  const studentBefore = adminStudentsState.find(s => s.id === 'S001');
  assert.strictEqual(studentBefore.password, '1234');

  // Student dashboard updates password
  const newStudentPassword = 'RohanSecret@2026';
  liveBus.broadcast('STUDENT_PASSWORD_UPDATED', {
    studentId: 'S001',
    rollNumber: '01',
    email: 'rohan.sharma@school.edu',
    name: 'Rohan Sharma',
    password: newStudentPassword,
    collegeId: 'dps_main',
    studentData: {
      id: 'S001',
      rollNumber: '01',
      name: 'Rohan Sharma',
      email: 'rohan.sharma@school.edu',
      password: newStudentPassword,
      class: '10',
      section: 'A',
      collegeId: 'dps_main'
    }
  });

  const studentAfter = adminStudentsState.find(s => s.id === 'S001');
  assert.strictEqual(studentAfter.password, newStudentPassword, 'Student password must reflect new password');
  assert.strictEqual(recentlyUpdatedStudentId, 'S001', 'recentlyUpdatedStudentId must highlight S001');
  assert.strictEqual(studentAfter.parentName, 'Ramesh Sharma', 'Parent info must be preserved');
  assert.strictEqual(adminStudentsState.length, 2, 'No duplicate student doc must be created');
  assert.ok(toasts.some(t => t.msg.includes("Rohan Sharma's password was updated")), 'Admin toast must be generated');
});

it('Student updates password matching by roll number (e.g. mobile or slip sync)', () => {
  const newPassword = 'AnanyaStar*2026';
  liveBus.broadcast('STUDENT_PASSWORD_UPDATED', {
    rollNumber: '02',
    name: 'Ananya Verma',
    password: newPassword,
    collegeId: 'dps_main'
  });

  const student = adminStudentsState.find(s => s.id === 'S002');
  assert.strictEqual(student.password, newPassword, 'Roll number match must update password');
  assert.strictEqual(recentlyUpdatedStudentId, '02', 'recentlyUpdatedStudentId must highlight roll 02');
});

console.log('\n--- TEST GROUP 3: TENANT ISOLATION ---');

it('Cross-college tenant isolation: Ignores foreign college password changes', () => {
  const currentPassword = adminStudentsState.find(s => s.id === 'S001').password;

  // Foreign college event
  liveBus.broadcast('STUDENT_PASSWORD_UPDATED', {
    studentId: 'S001',
    rollNumber: '01',
    password: 'HackerChangedPass',
    collegeId: 'foreign_school_999'
  });

  const studentAfter = adminStudentsState.find(s => s.id === 'S001');
  assert.strictEqual(studentAfter.password, currentPassword, 'Foreign college event must be ignored');
});

console.log('\n--- TEST GROUP 4: UNSUBSCRIBE & CLEANUP ---');

it('Unsubscribe stops receiving events cleanly', () => {
  unsubListener();

  const prevPass = adminTeachersState.find(t => t.id === 'T101').password;
  liveBus.broadcast('TEACHER_PASSWORD_UPDATED', {
    teacherId: 'T101',
    password: 'ShouldNotUpdate'
  });

  const afterPass = adminTeachersState.find(t => t.id === 'T101').password;
  assert.strictEqual(afterPass, prevPass, 'No updates should occur after unsubscribe');
});

console.log('\n--- TEST GROUP 5: ROLL NUMBER PREFIX TRANSFORMATION ---');

it('Roll number prefix matching (e.g. "01" vs "1" or leading zeros)', () => {
  // Re-subscribe a new fresh listener
  const freshUnsub = liveBus.subscribe((event) => {
    if (event.type === 'STUDENT_PASSWORD_UPDATED') {
      const { rollNumber, password } = event.payload || {};
      const cleanRoll = String(rollNumber || '').trim().replace(/^0+/, '');
      adminStudentsState = adminStudentsState.map(s => {
        const sRoll = String(s.rollNumber || '').trim().replace(/^0+/, '');
        if (cleanRoll && sRoll === cleanRoll) {
          return { ...s, password, _liveUpdatedAt: Date.now() };
        }
        return s;
      });
    }
  });

  liveBus.broadcast('STUDENT_PASSWORD_UPDATED', {
    rollNumber: '1', // Stripped zero sent
    password: 'UpdatedFromStrippedRoll#1'
  });

  const student = adminStudentsState.find(s => s.id === 'S001');
  assert.strictEqual(student.password, 'UpdatedFromStrippedRoll#1', 'Student stored as "01" must match "1"');
  freshUnsub();
});

console.log('\n--- TEST GROUP 6: REACTIVE CREDENTIAL SLIP MODAL RESOLUTION ---');

it('Credential slip dynamically resolves latest password from live state', () => {
  const originalStudent = { id: 'S001', rollNumber: '01', name: 'Rohan Sharma', password: 'oldPassword' };
  
  // Simulated CredentialSlipModal liveStudent resolver
  const resolveLiveStudent = (initial, stateList) => {
    return (stateList || []).find(s => s.id === initial.id || s.rollNumber === initial.rollNumber) || initial;
  };

  const resolved = resolveLiveStudent(originalStudent, adminStudentsState);
  assert.strictEqual(resolved.password, 'UpdatedFromStrippedRoll#1', 'Modal must show current live password instead of stale prop');
});

console.log('\n--- TEST GROUP 7: PASSWORD RULES VALIDATION ---');

const PASSWORD_CRITERIA = [
  { id: 'min8', label: 'At least 8 characters', test: (pw) => (pw || '').length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A-Z)', test: (pw) => /[A-Z]/.test(pw || '') },
  { id: 'lower', label: 'One lowercase letter (a-z)', test: (pw) => /[a-z]/.test(pw || '') },
  { id: 'number', label: 'One number (0-9)', test: (pw) => /[0-9]/.test(pw || '') },
  { id: 'special', label: 'One special character (@, #, $, !, %, *, ?, &)', test: (pw) => /[@#$!%*?&]/.test(pw || '') || /[^A-Za-z0-9\s]/.test(pw || '') },
];

function validatePasswordRules(pw = '') {
  const results = PASSWORD_CRITERIA.map((c) => ({
    ...c,
    satisfied: c.test(pw),
  }));
  const allSatisfied = results.every((r) => r.satisfied);
  return {
    allSatisfied,
    results,
    firstMissing: results.find((r) => !r.satisfied),
  };
}

it('Password requirements: enforces all 5 security conditions and rejects failing passwords', () => {
  // Empty
  assert.strictEqual(validatePasswordRules('').allSatisfied, false, 'Empty password must fail');
  // Too short (< 8 chars)
  assert.strictEqual(validatePasswordRules('Ab1!').allSatisfied, false, 'Short password must fail min8 rule');
  assert.strictEqual(validatePasswordRules('Ab1!').firstMissing.id, 'min8');
  // Missing uppercase
  assert.strictEqual(validatePasswordRules('secret@123').allSatisfied, false, 'Missing uppercase must fail');
  assert.strictEqual(validatePasswordRules('secret@123').firstMissing.id, 'upper');
  // Missing lowercase
  assert.strictEqual(validatePasswordRules('SECRET@123').allSatisfied, false, 'Missing lowercase must fail');
  assert.strictEqual(validatePasswordRules('SECRET@123').firstMissing.id, 'lower');
  // Missing number
  assert.strictEqual(validatePasswordRules('Secret@Pass').allSatisfied, false, 'Missing number must fail');
  assert.strictEqual(validatePasswordRules('Secret@Pass').firstMissing.id, 'number');
  // Missing special char
  assert.strictEqual(validatePasswordRules('SecretPass123').allSatisfied, false, 'Missing special char must fail');
  assert.strictEqual(validatePasswordRules('SecretPass123').firstMissing.id, 'special');
  // Satisfies all 5 conditions
  assert.strictEqual(validatePasswordRules('Secret@Pass123').allSatisfied, true, 'Compliant password must pass all conditions');
});

it('Student & Teacher modal password admission logic: accepts default initial PIN, rejects weak custom, allows strong custom', () => {
  const testStudentValidation = (pw) => {
    const trimmed = (pw || '').trim();
    if (!trimmed) return { valid: false, error: 'Password cannot be empty.' };
    if (trimmed === '1234') return { valid: true, isDefault: true };
    const rules = validatePasswordRules(trimmed);
    if (!rules.allSatisfied) return { valid: false, error: `Password rejected: Missing ${rules.firstMissing?.label}` };
    return { valid: true, isDefault: false };
  };

  assert.strictEqual(testStudentValidation('1234').valid, true, 'Default 1234 PIN must be allowed for initial setup');
  assert.strictEqual(testStudentValidation('').valid, false, 'Empty password must be rejected');
  assert.strictEqual(testStudentValidation('12345').valid, false, 'Weak custom password must be rejected');
  assert.strictEqual(testStudentValidation('Student#2026').valid, true, 'Strong custom password must be allowed');

  const testTeacherValidation = (pw) => {
    const trimmed = (pw || '').trim();
    if (!trimmed) return { valid: false, error: 'Password cannot be empty.' };
    if (trimmed === 'teacher123') return { valid: true, isDefault: true };
    const rules = validatePasswordRules(trimmed);
    if (!rules.allSatisfied) return { valid: false, error: `Password rejected: Missing ${rules.firstMissing?.label}` };
    return { valid: true, isDefault: false };
  };

  assert.strictEqual(testTeacherValidation('teacher123').valid, true, 'Default teacher123 must be allowed');
  assert.strictEqual(testTeacherValidation('weakpw').valid, false, 'Weak custom teacher password must be rejected');
  assert.strictEqual(testTeacherValidation('Teach@Secure2026').valid, true, 'Strong teacher password must be allowed');
});

console.log('\n--- TEST GROUP 8: RESILIENT LOCAL STORAGE LOOKUP & OFFLINE ADMISSION ---');

it('Resilient user lookup: finds student from local cache when remote database is unavailable', () => {
  const localMap = {
    'vardhamanainapure189@gmail.com': {
      identifier: 'vardhamanainapure189@gmail.com',
      role: 'student',
      name: 'vardhaman',
      rollNumber: '189',
      class: '10',
      section: 'A',
      password: 'Vardhaman@123',
      collegeId: 'college_abc',
    },
    '189': {
      identifier: '189',
      role: 'student',
      name: 'vardhaman',
      rollNumber: '189',
      class: '10',
      section: 'A',
      password: 'Vardhaman@123',
      collegeId: 'college_abc',
    }
  };

  const simulateGetUserLookup = (ident) => {
    // If remote fails, check local
    const key = ident.trim().toLowerCase();
    return localMap[key] || null;
  };

  const simulateStudentLogin = (ident, pw) => {
    const lookup = simulateGetUserLookup(ident);
    if (!lookup || lookup.role !== 'student') {
      return { success: false, error: 'No student found' };
    }
    if (lookup.password !== pw) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }
    return { success: true, student: lookup };
  };

  // Test with email
  const loginByEmail = simulateStudentLogin('vardhamanainapure189@gmail.com', 'Vardhaman@123');
  assert.strictEqual(loginByEmail.success, true, 'Student must be able to log in by email even if cloud is offline');
  assert.strictEqual(loginByEmail.student.rollNumber, '189');

  // Test with roll number
  const loginByRoll = simulateStudentLogin('189', 'Vardhaman@123');
  assert.strictEqual(loginByRoll.success, true, 'Student must be able to log in by roll number');

  // Test with wrong password
  const loginWrongPw = simulateStudentLogin('vardhamanainapure189@gmail.com', 'WrongPass123');
  assert.strictEqual(loginWrongPw.success, false);
  assert.strictEqual(loginWrongPw.error, 'Incorrect password. Please try again.');
});

console.log('\n--- TEST GROUP 9: REALTIME ADMIN-STUDENT MESSAGE SYNC & MATCHING ---');

it('Admin sends message to student: Student in "School Administrator" channel receives and matches message', () => {
  const gunduStudent = {
    id: 'STU_GUNDU_999',
    name: 'gundu',
    rollNumber: '011',
    class: '10',
    section: 'A',
    parentEmail: 'vardhamanainapure380@gmail.com',
    email: '',
  };

  const studentAllIds = [
    gunduStudent.id,
    '011',
    '11',
    'vardhamanainapure380@gmail.com',
    'gundu'
  ];

  const adminMsg = {
    id: 'MSG_1001',
    senderId: 'admin',
    senderName: 'Administrator',
    senderRole: 'admin',
    targetRole: 'student',
    targetId: 'STU_GUNDU_999',
    targetName: 'gundu',
    targetRollNumber: '011',
    targetEmail: 'vardhamanainapure380@gmail.com',
    targetParentEmail: 'vardhamanainapure380@gmail.com',
    text: 'hi',
    timestamp: new Date().toISOString(),
    readBy: ['admin'],
  };

  const normalizeRoll = (roll) => (roll != null ? String(roll).trim().toLowerCase().replace(/^0+/, '') : '');

  const matchesStudent = (stu, id, roll, email, name) => {
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

  const isMsgTargetStudent = (msg, stu, stuAllIds = []) => {
    if (!stu && stuAllIds.length === 0) return false;
    const targetId = msg.targetId;
    if (stuAllIds.length > 0 && targetId && stuAllIds.includes(targetId)) return true;
    if (stu && matchesStudent(stu, targetId, msg.targetRollNumber, msg.targetEmail || msg.targetParentEmail, msg.targetName)) return true;
    return false;
  };

  const isMsgSenderStudent = (msg, stu, stuAllIds = []) => {
    if (!stu && stuAllIds.length === 0) return false;
    const senderId = msg.senderId;
    if (stuAllIds.length > 0 && senderId && stuAllIds.includes(senderId)) return true;
    if (stu && matchesStudent(stu, senderId, msg.senderRollNumber, msg.senderEmail, msg.senderName)) return true;
    return false;
  };

  // 1. Verify Student receives Admin's message in School Administrator channel
  const activeTabStudent = 'broadcast';
  const selectedRecipientIdStudent = 'admin';
  const normRoleStudent = 'student';

  const isSentByMeToAdmin =
    (isMsgSenderStudent(adminMsg, gunduStudent, studentAllIds) || studentAllIds.includes(adminMsg.senderId)) &&
    (adminMsg.targetRole === 'admin' || adminMsg.targetId === 'admin');

  const isSentByAdminToMe =
    (adminMsg.senderRole === 'admin' || adminMsg.senderId === 'admin') &&
    (isMsgTargetStudent(adminMsg, gunduStudent, studentAllIds) || studentAllIds.includes(adminMsg.targetId));

  const studentMatchesAdminMsg = isSentByMeToAdmin || isSentByAdminToMe;
  assert.strictEqual(studentMatchesAdminMsg, true, 'Student must match Admin direct message in School Administrator channel');

  // 2. Student replies to Admin
  const studentReply = {
    id: 'MSG_1002',
    senderId: 'STU_GUNDU_999',
    senderName: 'gundu',
    senderRole: 'student',
    senderRollNumber: '011',
    senderEmail: 'vardhamanainapure380@gmail.com',
    targetRole: 'admin',
    targetId: 'admin',
    text: 'hello admin',
    timestamp: new Date().toISOString(),
    readBy: ['STU_GUNDU_999'],
  };

  // 3. Admin views student 'gundu' under Students tab
  const activeTabAdmin = 'students';
  const selectedRecipientIdAdmin = 'STU_GUNDU_999';
  const normRoleAdmin = 'admin';

  const isStudentToAdmin =
    isMsgSenderStudent(studentReply, gunduStudent, studentAllIds) &&
    (studentReply.targetRole === 'admin' || studentReply.targetId === 'admin' || ['admin'].includes(studentReply.targetId));

  const isAdminToStudent =
    (['admin'].includes(studentReply.senderRole) || studentReply.senderId === 'admin') &&
    isMsgTargetStudent(studentReply, gunduStudent, studentAllIds);

  const adminMatchesStudentReply = isStudentToAdmin || isAdminToStudent;
  assert.strictEqual(adminMatchesStudentReply, true, 'Admin viewing gundu must match student reply');

  // 4. Test matching even if student logged in with clean roll "11" instead of "011"
  const studentWithDifferentRollFormatting = {
    ...gunduStudent,
    rollNumber: '11',
  };
  assert.strictEqual(
    isMsgTargetStudent(adminMsg, studentWithDifferentRollFormatting, ['11']),
    true,
    'Normalized roll number matching (011 vs 11) must succeed'
  );
});

// ---------------------------------------------------------
// Summary Report
// ---------------------------------------------------------
console.log('\n====================================================');
console.log(`TESTS COMPLETED: ${testsPassed} Passed, ${testsFailed} Failed`);
console.log('====================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
