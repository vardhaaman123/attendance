// Utility functions for attendance calculation

export function getStudentStatusFromRecord(param1, param2) {
  if (!param1 || !param2) return undefined;
  let student, attTarget;
  if (param1.rollNumber !== undefined || param1.name !== undefined) {
    student = param1;
    attTarget = param2;
  } else if (param2.rollNumber !== undefined || param2.name !== undefined) {
    student = param2;
    attTarget = param1;
  } else {
    student = param1;
    attTarget = param2;
  }

  const attMap = (attTarget && typeof attTarget === 'object' && attTarget.attendance && typeof attTarget.attendance === 'object')
    ? attTarget.attendance
    : attTarget;

  if (!attMap || typeof attMap !== 'object') return undefined;

  const sId = student.id || student._docId || student.entityId;
  if (sId && attMap[sId] !== undefined) return attMap[sId];
  if (student.id && attMap[student.id] !== undefined) return attMap[student.id];
  if (student._docId && attMap[student._docId] !== undefined) return attMap[student._docId];

  if (student.rollNumber !== undefined && student.rollNumber !== null) {
    const rawRoll = String(student.rollNumber).trim();
    if (rawRoll && attMap[rawRoll] !== undefined) return attMap[rawRoll];
    const stripped = rawRoll.replace(/^0+/, '');
    if (stripped && attMap[stripped] !== undefined) return attMap[stripped];
  }

  return undefined;
}

export function calcAttendanceStats(students, attendanceRecord) {
  if (!attendanceRecord) return { present: 0, absent: 0, late: 0, total: students ? students.length : 0, percentage: 0 };

  let present = 0, absent = 0, late = 0;
  const attMap = attendanceRecord.attendance || {};

  if (students && students.length > 0) {
    let matchedCount = 0;
    students.forEach(s => {
      const status = getStudentStatusFromRecord(s, attMap);
      if (status !== undefined) {
        matchedCount++;
        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        else if (status === 'late') late++;
        else absent++;
      }
    });

    const total = matchedCount > 0 ? matchedCount : (Object.keys(attMap).length || students.length);
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

export function calcStudentAttendancePercentage(studentOrId, allRecords = {}) {
  if (!studentOrId || !allRecords) return { present: 0, absent: 0, late: 0, total: 0, percentage: 0 };

  const possibleKeys = [];
  if (typeof studentOrId === 'object' && studentOrId !== null) {
    if (studentOrId.id) possibleKeys.push(String(studentOrId.id));
    if (studentOrId._docId) possibleKeys.push(String(studentOrId._docId));
    if (studentOrId.entityId) possibleKeys.push(String(studentOrId.entityId));
    if (studentOrId.rollNumber !== undefined && studentOrId.rollNumber !== null) {
      const r = String(studentOrId.rollNumber).trim();
      if (r) {
        possibleKeys.push(r);
        possibleKeys.push(r.replace(/^0+/, ''));
      }
    }
    if (studentOrId.email) possibleKeys.push(studentOrId.email.trim().toLowerCase());
    if (studentOrId.name) {
      possibleKeys.push(studentOrId.name.trim());
      possibleKeys.push(studentOrId.name.trim().toLowerCase());
    }
  } else if (studentOrId) {
    const str = String(studentOrId).trim();
    possibleKeys.push(str);
    possibleKeys.push(str.replace(/^0+/, ''));
  }
  const cleanKeys = Array.from(new Set(possibleKeys.filter(Boolean)));

  let present = 0, absent = 0, late = 0;
  let total = 0;

  Object.values(allRecords).forEach(r => {
    if (!r || !r.attendance) return;
    let status;
    for (const k of cleanKeys) {
      if (r.attendance[k] !== undefined) {
        status = r.attendance[k];
        break;
      }
    }
    if (status !== undefined) {
      total++;
      if (status === 'present') present++;
      else if (status === 'late') late++;
      else if (status === 'absent') absent++;
      else absent++;
    }
  });

  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  return { present, absent, late, total, percentage };
}

export function getStudentMonthlyCalendar(studentOrId, allRecords = {}, year, month) {
  // month is 0-indexed
  const possibleKeys = [];
  if (typeof studentOrId === 'object' && studentOrId !== null) {
    if (studentOrId.id) possibleKeys.push(String(studentOrId.id));
    if (studentOrId._docId) possibleKeys.push(String(studentOrId._docId));
    if (studentOrId.entityId) possibleKeys.push(String(studentOrId.entityId));
    if (studentOrId.rollNumber !== undefined && studentOrId.rollNumber !== null) {
      const r = String(studentOrId.rollNumber).trim();
      if (r) {
        possibleKeys.push(r);
        possibleKeys.push(r.replace(/^0+/, ''));
      }
    }
    if (studentOrId.email) possibleKeys.push(studentOrId.email.trim().toLowerCase());
    if (studentOrId.name) {
      possibleKeys.push(studentOrId.name.trim());
      possibleKeys.push(studentOrId.name.trim().toLowerCase());
    }
  } else if (studentOrId) {
    const str = String(studentOrId).trim();
    possibleKeys.push(str);
    possibleKeys.push(str.replace(/^0+/, ''));
  }
  const cleanKeys = Array.from(new Set(possibleKeys.filter(Boolean)));

  const normalizeDate = (raw) => {
    if (!raw) return null;
    const s = String(raw).trim();
    const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymd) return `${ymd[1]}-${String(ymd[2]).padStart(2, '0')}-${String(ymd[3]).padStart(2, '0')}`;
    const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`;
    try {
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) {
        return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
      }
    } catch (_) {}
    return null;
  };

  const days = {};
  Object.values(allRecords).forEach(r => {
    if (!r?.attendance) return;
    const rawDate = r.date || (typeof r.id === 'string' && r.id.includes('_') ? r.id.split('_')[0] : r.id);
    const dateKey = normalizeDate(rawDate);
    if (!dateKey) return;

    const [y, m] = dateKey.split('-').map(Number);
    if (y === year && (m - 1) === month) {
      for (const k of cleanKeys) {
        if (r.attendance[k] !== undefined && r.attendance[k] !== null && r.attendance[k] !== '') {
          const val = String(r.attendance[k]).trim().toLowerCase();
          const status = val === 'a' ? 'absent' : val === 'p' ? 'present' : val === 'l' ? 'late' : val;
          if (!days[dateKey] || status === 'absent') {
            days[dateKey] = status;
          }
          break;
        }
      }
    }
  });
  return days;
}

export function getClassStats(cls, section, allRecords, allStudents) {
  const students = (allStudents || []).filter(s =>
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

  (allStudents || []).forEach(s => {
    const sClass = String(s.class || '').trim();
    const sSection = String(s.section || '').trim().toUpperCase();
    const key = `${today}_${sClass}_${sSection}`;
    const record = allRecords[key];
    if (!record?.attendance) return;

    const status = getStudentStatusFromRecord(s, record.attendance);
    if (status === 'present') present++;
    else if (status === 'late') late++;
    else if (status === 'absent') absent++;
  });

  const total = (allStudents || []).length;
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

    (allStudents || []).forEach(s => {
      const sClass = String(s.class || '').trim();
      const sSection = String(s.section || '').trim().toUpperCase();
      const key = `${dateStr}_${sClass}_${sSection}`;
      const record = allRecords[key];
      if (!record?.attendance) return;

      const status = getStudentStatusFromRecord(s, record.attendance);
      if (status !== undefined) {
        total++;
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

    Object.values(allRecords || {}).forEach(record => {
      if (!record?.date) return;
      const rd = new Date(record.date);
      if (rd.getFullYear() === year && rd.getMonth() === month) {
        Object.entries(record.attendance || {}).forEach(([, status]) => {
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
  const classSet = new Set((allStudents || []).map(s => String(s.class || '').trim()).filter(Boolean));
  if (!classSet.has('8')) classSet.add('8');
  if (!classSet.has('9')) classSet.add('9');
  if (!classSet.has('10')) classSet.add('10');
  const classes = Array.from(classSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return classes.map(cls => {
    let present = 0, total = 0;
    const students = (allStudents || []).filter(s => String(s.class || '').trim() === String(cls).trim());
    students.forEach(s => {
      Object.values(allRecords || {}).forEach(record => {
        if (String(record.class || '').trim() === String(cls).trim() && record.attendance) {
          const status = getStudentStatusFromRecord(s, record.attendance);
          if (status !== undefined) {
            total++;
            if (status === 'present' || status === 'late') present++;
          }
        }
      });
    });
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { class: `Class ${cls}`, percentage };
  });
}

export function getLowAttendanceStudents(allStudents, allRecords, threshold = 75) {
  return (allStudents || [])
    .map(s => {
      const stats = calcStudentAttendancePercentage(s, allRecords);
      return { ...s, ...stats };
    })
    .filter(s => s.total > 0 && s.percentage < threshold)
    .sort((a, b) => a.percentage - b.percentage);
}
