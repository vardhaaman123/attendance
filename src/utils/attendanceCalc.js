// Utility functions for attendance calculation

export function calcAttendanceStats(students, attendanceRecord) {
  if (!attendanceRecord) return { present: 0, absent: 0, late: 0, total: students ? students.length : 0, percentage: 0 };

  let present = 0, absent = 0, late = 0;
  const attMap = attendanceRecord.attendance || {};

  if (students && students.length > 0) {
    students.forEach(s => {
      const sId = s.id || s._docId;
      const status = attMap[sId] !== undefined ? attMap[sId] : (s.id ? attMap[s.id] : undefined);
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else absent++;
    });

    const total = students.length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { present, absent, late, total, percentage };
  }

  // Fallback: If students array is not yet loaded or empty, compute directly from attendance record map
  const entries = Object.values(attMap);
  entries.forEach(status => {
    if (status === 'present') present++;
    else if (status === 'absent') absent++;
    else if (status === 'late') late++;
    else absent++;
  });

  const total = entries.length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  return { present, absent, late, total, percentage };
}

export function calcStudentAttendancePercentage(studentId, allRecords) {
  const studentRecords = Object.values(allRecords).filter(r => r.attendance && r.attendance[studentId] !== undefined);
  if (!studentRecords.length) return { present: 0, absent: 0, late: 0, total: 0, percentage: 0 };

  let present = 0, absent = 0, late = 0;
  studentRecords.forEach(r => {
    const status = r.attendance[studentId];
    if (status === 'present') present++;
    else if (status === 'late') late++;
    else absent++;
  });

  const total = studentRecords.length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  return { present, absent, late, total, percentage };
}

export function getStudentMonthlyCalendar(studentId, allRecords, year, month) {
  // month is 0-indexed
  const days = {};
  Object.values(allRecords).forEach(r => {
    const d = new Date(r.date);
    if (d.getFullYear() === year && d.getMonth() === month && r.attendance?.[studentId]) {
      days[r.date] = r.attendance[studentId];
    }
  });
  return days;
}

export function getClassStats(cls, section, allRecords, allStudents) {
  const students = allStudents.filter(s =>
    String(s.class || '').trim() === String(cls || '').trim() &&
    String(s.section || '').trim().toUpperCase() === String(section || '').trim().toUpperCase()
  );
  const today = new Date().toISOString().split('T')[0];
  const key = `${today}_${cls}_${section}`;
  const todayRecord = allRecords[key];
  return calcAttendanceStats(students, todayRecord);
}

export function getTodayStats(allStudents, allRecords) {
  const today = new Date().toISOString().split('T')[0];
  let present = 0, absent = 0, late = 0;

  allStudents.forEach(s => {
    const sId = s.id || s._docId;
    const key = `${today}_${s.class}_${s.section}`;
    const record = allRecords[key];
    const status = record?.attendance?.[sId];
    if (status === 'present') present++;
    else if (status === 'late') late++;
    else if (status === 'absent') absent++;
  });

  const total = allStudents.length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  return { present, absent, late, total, percentage };
}

export function getWeeklyData(allStudents, allRecords) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const dateStr = d.toISOString().split('T')[0];
    let present = 0, total = 0;

    allStudents.forEach(s => {
      const key = `${dateStr}_${s.class}_${s.section}`;
      const record = allRecords[key];
      if (record?.attendance?.[s.id]) {
        total++;
        const status = record.attendance[s.id];
        if (status === 'present' || status === 'late') present++;
      }
    });

    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    days.push({
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: dateStr,
      percentage,
      present,
      total,
    });
  }
  return days;
}

export function getMonthlyData(allStudents, allRecords) {
  const today = new Date();
  const months = [];

  for (let m = 5; m >= 0; m--) {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    let present = 0, total = 0;

    Object.values(allRecords).forEach(record => {
      const rd = new Date(record.date);
      if (rd.getFullYear() === year && rd.getMonth() === month) {
        Object.entries(record.attendance || {}).forEach(([sid, status]) => {
          total++;
          if (status === 'present' || status === 'late') present++;
        });
      }
    });

    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    months.push({
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      percentage,
    });
  }
  return months;
}

export function getClassComparison(allStudents, allRecords) {
  return ['8', '9', '10'].map(cls => {
    let present = 0, total = 0;
    const students = allStudents.filter(s => String(s.class || '').trim() === String(cls).trim());
    students.forEach(s => {
      const sId = s.id || s._docId;
      Object.values(allRecords).forEach(record => {
        if (String(record.class || '').trim() === String(cls).trim() && record.attendance?.[sId]) {
          total++;
          if (record.attendance[sId] === 'present' || record.attendance[sId] === 'late') present++;
        }
      });
    });
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { class: `Class ${cls}`, percentage };
  });
}

export function getLowAttendanceStudents(allStudents, allRecords, threshold = 75) {
  return allStudents
    .map(s => {
      const stats = calcStudentAttendancePercentage(s.id, allRecords);
      return { ...s, ...stats };
    })
    .filter(s => s.total > 0 && s.percentage < threshold)
    .sort((a, b) => a.percentage - b.percentage);
}
