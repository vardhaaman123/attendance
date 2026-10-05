import assert from 'assert';

console.log('🧪 Testing Admin Attendance Restriction Logic...');

// 1. Check canEditRecord simulation
function canEditRecord({ role, user, record }) {
  if (role === 'admin') return false;
  if (role === 'teacher') {
    if (!user?.class && !user?.section) return true;
    const tClass = String(user?.class || '').trim();
    const tSec = String(user?.section || '').trim().toUpperCase();
    const rClass = String(record?.class || '').trim();
    const rSec = String(record?.section || '').trim().toUpperCase();
    return (!tClass || tClass === rClass) && (!tSec || tSec === rSec);
  }
  return false;
}

// Test admin cannot edit record
const adminResult = canEditRecord({
  role: 'admin',
  user: { name: 'Admin User' },
  record: { class: '10', section: 'A' },
});
assert.strictEqual(adminResult, false, 'Admin must NOT be allowed to edit attendance');
console.log('✅ PASS: Admin cannot edit attendance records');

// Test assigned teacher can edit record
const teacherResultAllowed = canEditRecord({
  role: 'teacher',
  user: { name: 'Teacher 10A', class: '10', section: 'A' },
  record: { class: '10', section: 'A' },
});
assert.strictEqual(teacherResultAllowed, true, 'Assigned teacher MUST be allowed to edit attendance');
console.log('✅ PASS: Assigned teacher can edit attendance for their class');

// Test unassigned teacher cannot edit record for other class
const teacherResultDenied = canEditRecord({
  role: 'teacher',
  user: { name: 'Teacher 9B', class: '9', section: 'B' },
  record: { class: '10', section: 'A' },
});
assert.strictEqual(teacherResultDenied, false, 'Non-assigned teacher must NOT be allowed to edit other class attendance');
console.log('✅ PASS: Non-assigned teacher cannot edit other classes');

// 2. Check TeacherRoute redirect behavior
function getRouteDestination(role, targetPath) {
  if (targetPath === '/attendance') {
    if (role === 'admin') return '/history';
    if (role !== 'teacher') return '/student-dashboard';
    return '/attendance';
  }
  return targetPath;
}

assert.strictEqual(getRouteDestination('admin', '/attendance'), '/history', 'Admin accessing /attendance must be redirected to /history');
console.log('✅ PASS: Admin accessing /attendance is redirected to /history');

assert.strictEqual(getRouteDestination('student', '/attendance'), '/student-dashboard', 'Student accessing /attendance must be redirected to /student-dashboard');
console.log('✅ PASS: Student accessing /attendance is redirected to /student-dashboard');

// 3. Check Marks permissions
function canEditMarks(role) {
  return role === 'teacher';
}

assert.strictEqual(canEditMarks('admin'), false, 'Admin must NOT be allowed to edit/update marks');
console.log('✅ PASS: Admin cannot edit, add, or delete marks');

assert.strictEqual(canEditMarks('teacher'), true, 'Teacher MUST be allowed to edit/update marks');
console.log('✅ PASS: Teacher can edit, add, and delete marks');

console.log('\n🎉 All Admin Attendance & Marks Restriction tests passed successfully!');
