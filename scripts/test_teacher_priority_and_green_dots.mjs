import {
  getUserIdentities,
  isMessageTargetingMe,
  isMessageSentByMe,
  isMessageUnreadForUser,
  getUnreadMessagesCountForUser,
} from '../src/utils/messageUtils.js';

console.log('🧪 Starting Verification Tests for Teacher Message Priority & Green Dot Logic...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// Mock test entities
const mockStudent = {
  id: 'stu-101',
  name: 'Gundu Rao',
  rollNumber: '007',
  class: '10',
  section: 'A',
  email: 'gundu@school.edu',
  parentEmail: 'parent.gundu@school.edu',
};

const mockTeacher = {
  id: 'tch-201',
  name: 'Mrs. Sharma',
  email: 'sharma@school.edu',
  class: '10',
  section: 'A',
  subject: 'Mathematics',
};

const mockAdmin = {
  id: 'admin',
  uid: 'admin-uid-1',
  name: 'Principal Anderson',
  email: 'principal@school.edu',
};

const mockStudentsList = [mockStudent];
const mockTeachersList = [mockTeacher];

// Test 1: Student Identity Resolution
const studentIdentities = getUserIdentities({
  role: 'student',
  user: mockStudent,
  currentStudent: mockStudent,
  teachers: mockTeachersList,
  students: mockStudentsList,
});

assert(studentIdentities.normRole === 'student', 'Student normRole is student');
assert(studentIdentities.myId === 'stu-101', 'Student myId is stu-101');
assert(studentIdentities.myAllIds.includes('7'), 'Student myAllIds includes normalized roll number 7');
assert(studentIdentities.myAllIds.includes('007'), 'Student myAllIds includes raw roll number 007');

// Test 2: Teacher Message Targeting Student
const msgTeacherToStudentUnread = {
  id: 'msg-1',
  senderId: 'tch-201',
  senderName: 'Mrs. Sharma',
  senderRole: 'teacher',
  targetRole: 'student',
  targetId: 'stu-101',
  targetName: 'Gundu Rao',
  targetRollNumber: '007',
  text: 'Don’t forget to submit your math project tomorrow.',
  timestamp: new Date('2026-10-03T10:00:00Z').toISOString(),
  readBy: [],
};

assert(
  isMessageTargetingMe(msgTeacherToStudentUnread, studentIdentities, mockStudentsList),
  'Teacher message directly targets student'
);

assert(
  isMessageUnreadForUser(msgTeacherToStudentUnread, studentIdentities, mockStudentsList),
  'Unread teacher message is flagged as unread (triggers green dot)'
);

// Test 3: Green Dot removed once read
const msgTeacherToStudentRead = {
  ...msgTeacherToStudentUnread,
  readBy: ['stu-101'],
};

assert(
  !isMessageUnreadForUser(msgTeacherToStudentRead, studentIdentities, mockStudentsList),
  'Read message is NOT unread (green dot disappears)'
);

// Test 4: General Announcement vs Teacher Message Priority for Student
const msgGeneralAnnouncement = {
  id: 'msg-gen',
  senderId: 'admin',
  senderName: 'Principal',
  senderRole: 'admin',
  targetId: 'all',
  targetRole: 'all',
  text: 'Annual Sports Day scheduled for next week.',
  timestamp: new Date('2026-10-03T11:00:00Z').toISOString(), // Newer timestamp!
  readBy: [],
};

const allNotices = [msgGeneralAnnouncement, msgTeacherToStudentUnread];

// Sort logic as implemented in StudentDashboard.jsx:
const sortedNotices = [...allNotices].sort((a, b) => {
  const aIsTeacher = (a.senderRole || '').toLowerCase() === 'teacher';
  const bIsTeacher = (b.senderRole || '').toLowerCase() === 'teacher';
  if (aIsTeacher && !bIsTeacher) return -1;
  if (!aIsTeacher && bIsTeacher) return 1;

  const aUnread = isMessageUnreadForUser(a, studentIdentities, mockStudentsList);
  const bUnread = isMessageUnreadForUser(b, studentIdentities, mockStudentsList);
  if (aUnread && !bUnread) return -1;
  if (!aUnread && bUnread) return 1;

  return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
});

assert(
  sortedNotices[0].id === 'msg-1',
  'Teacher message comes FIRST on student desktop even if general notice has newer timestamp'
);
assert(
  sortedNotices[0].senderRole === 'teacher',
  'First notice is from teacher'
);

// Test 5: Admin Desktop Green Dot for Unread Messages from Student/Teacher
const adminIdentities = getUserIdentities({
  role: 'admin',
  user: mockAdmin,
  teachers: mockTeachersList,
  students: mockStudentsList,
});

const msgStudentToAdmin = {
  id: 'msg-stu-to-admin',
  senderId: 'stu-101',
  senderName: 'Gundu Rao',
  senderRole: 'student',
  targetId: 'admin',
  targetRole: 'admin',
  text: 'Respected Principal, I request leave approval.',
  timestamp: new Date('2026-10-03T11:30:00Z').toISOString(),
  readBy: [],
};

assert(
  isMessageTargetingMe(msgStudentToAdmin, adminIdentities, mockStudentsList),
  'Student message to admin targets admin'
);
assert(
  isMessageUnreadForUser(msgStudentToAdmin, adminIdentities, mockStudentsList),
  'Admin sees unread indicator (green dot) for student message'
);

// Test 6: Teacher Desktop Green Dot for Direct Messages
const teacherIdentities = getUserIdentities({
  role: 'teacher',
  user: mockTeacher,
  teachers: mockTeachersList,
  students: mockStudentsList,
});

const msgAdminToTeacher = {
  id: 'msg-admin-to-tch',
  senderId: 'admin',
  senderName: 'Principal',
  senderRole: 'admin',
  targetId: 'tch-201',
  targetRole: 'teacher',
  text: 'Staff meeting at 3 PM today.',
  timestamp: new Date('2026-10-03T11:45:00Z').toISOString(),
  readBy: [],
};

assert(
  isMessageTargetingMe(msgAdminToTeacher, teacherIdentities, mockStudentsList),
  'Admin message targets specific teacher'
);
assert(
  isMessageUnreadForUser(msgAdminToTeacher, teacherIdentities, mockStudentsList),
  'Teacher sees unread indicator (green dot) for admin message'
);

// Test 7: Teacher Desktop Identity Resolution when teachers list is empty/loading
const teacherIdentitiesEmptyList = getUserIdentities({
  role: 'teacher',
  user: {
    id: 'tch-fresh',
    name: 'New Teacher',
    email: 'new.teacher@school.edu',
    class: '9',
    section: 'B',
  },
  teachers: [],
  students: [],
});

assert(
  teacherIdentitiesEmptyList.normRole === 'teacher',
  'Teacher desktop resolves normRole even with empty teachers collection'
);
assert(
  teacherIdentitiesEmptyList.myId === 'tch-fresh',
  'Teacher desktop resolves myId from user object'
);
assert(
  teacherIdentitiesEmptyList.myAllIds.includes('new.teacher@school.edu'),
  'Teacher desktop includes email in myAllIds'
);

// Test 8: Teacher Desktop Identity Resolution with undefined parameters (fail-safe)
const teacherIdentitiesFailsafe = getUserIdentities({
  role: 'teacher',
  user: undefined,
  teachers: undefined,
  students: undefined,
});

assert(
  teacherIdentitiesFailsafe.normRole === 'teacher',
  'Teacher desktop handles undefined user/teachers gracefully'
);

console.log(`\n🎉 Test Suite Completed: ${passedTests}/${totalTests} tests passed!`);
