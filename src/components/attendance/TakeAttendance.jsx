import { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Save, RefreshCw, UserCheck, UserX, Clock,
  Search, Filter, CheckSquare, Download, Printer, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calcAttendanceStats } from '../../utils/attendanceCalc';

const STATUS = { present: 'present', absent: 'absent', late: 'late' };

function DateNav({ date, onChange }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(date);
  selected.setHours(0, 0, 0, 0);
  const isToday = selected.getTime() === today.getTime();
  const isFuture = selected > today;

  const move = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    if (d > today) return;
    onChange(d.toISOString().split('T')[0]);
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => move(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-500 transition-colors">
        <ChevronLeft size={16} />
      </button>
      <div className="relative">
        <input
          type="date"
          value={date}
          max={new Date().toISOString().split('T')[0]}
          onChange={e => onChange(e.target.value)}
          className="input-field text-xs py-2 px-3 cursor-pointer w-36"
        />
      </div>
      <button
        onClick={() => move(1)}
        disabled={isFuture || isToday}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
      {!isToday && (
        <button
          onClick={() => onChange(new Date().toISOString().split('T')[0])}
          className="text-xs text-brand-blue hover:underline font-medium"
        >
          Today
        </button>
      )}
    </div>
  );
}

function StatusButton({ status, current, onClick }) {
  const labels = { present: 'Present', absent: 'Absent', late: 'Late' };
  const icons = {
    present: <span className="text-green-500 text-xs">●</span>,
    absent: <span className="text-red-500 text-xs">●</span>,
    late: <span className="text-amber-500 text-xs">●</span>,
  };
  const selected = current === status;
  return (
    <button
      onClick={onClick}
      className={`status-btn status-btn-${status} ${selected ? 'selected' : ''}`}
    >
      {icons[status]}
      {labels[status]}
    </button>
  );
}

function ProgressRing({ percentage }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  const color = percentage >= 85 ? '#16A34A' : percentage >= 70 ? '#F59E0B' : '#DC2626';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" className="dark:stroke-navy-700" />
        <circle
          cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-base font-bold text-navy-900 dark:text-white leading-none">{percentage}%</p>
      </div>
    </div>
  );
}

export default function TakeAttendance() {
  const { students, attendanceRecords, saveAttendanceRecord, selectedClass, setSelectedClass, selectedSection, setSelectedSection, addToast } = useApp();

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const recordKey = `${date}_${selectedClass}_${selectedSection}`;
  const existingRecord = attendanceRecords[recordKey];

  const [attendance, setAttendance] = useState(() => {
    if (existingRecord) return { ...existingRecord.attendance };
    const classStudents = students.filter(s => s.class === selectedClass && s.section === selectedSection);
    const init = {};
    classStudents.forEach(s => { init[s.id] = 'present'; });
    return init;
  });

  // Reset attendance when class/section/date changes
  const resetToRecord = useCallback((cls, sec, dt) => {
    const key = `${dt}_${cls}_${sec}`;
    const rec = attendanceRecords[key];
    const classStudents = students.filter(s => s.class === cls && s.section === sec);
    if (rec) {
      setAttendance({ ...rec.attendance });
    } else {
      const init = {};
      classStudents.forEach(s => { init[s.id] = 'present'; });
      setAttendance(init);
    }
    setSaved(false);
  }, [attendanceRecords, students]);

  const handleClassChange = (cls) => {
    setSelectedClass(cls);
    resetToRecord(cls, selectedSection, date);
  };

  const handleSectionChange = (sec) => {
    setSelectedSection(sec);
    resetToRecord(selectedClass, sec, date);
  };

  const handleDateChange = (dt) => {
    setDate(dt);
    resetToRecord(selectedClass, selectedSection, dt);
  };

  const classStudents = useMemo(() =>
    students.filter(s => s.class === selectedClass && s.section === selectedSection)
      .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber)),
    [students, selectedClass, selectedSection]
  );

  const filteredStudents = useMemo(() => {
    let list = classStudents;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.rollNumber.includes(q));
    }
    if (filter !== 'all') {
      list = list.filter(s => attendance[s.id] === filter);
    }
    return list;
  }, [classStudents, search, filter, attendance]);

  const stats = useMemo(() => calcAttendanceStats(classStudents, { attendance }),
    [classStudents, attendance]);

  const setStatus = useCallback((id, status) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
    setSaved(false);
  }, []);

  const markAll = useCallback((status) => {
    const updated = {};
    classStudents.forEach(s => { updated[s.id] = status; });
    setAttendance(updated);
    setSaved(false);
  }, [classStudents]);

  const resetAttendance = useCallback(() => {
    resetToRecord(selectedClass, selectedSection, date);
  }, [resetToRecord, selectedClass, selectedSection, date]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    saveAttendanceRecord(recordKey, {
      date,
      class: selectedClass,
      section: selectedSection,
      attendance,
      savedAt: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
    addToast(`Attendance for Class ${selectedClass}-${selectedSection} saved successfully. ✓`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const isEditing = !!existingRecord;
  const alreadySavedForKey = !!existingRecord && !saved;

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-navy-900 dark:text-white">Take Attendance</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select class, section and mark attendance for each student.</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button onClick={handlePrint} className="btn-secondary">
            <Printer size={15} />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Class / Section / Date Selector */}
      <div className="card animate-slide-up">
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Class */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Class</label>
            <div className="flex gap-2">
              {['8', '9', '10'].map(cls => (
                <button
                  key={cls}
                  onClick={() => handleClassChange(cls)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    selectedClass === cls
                      ? 'bg-brand-blue border-brand-blue text-white shadow-sm'
                      : 'border-slate-200 dark:border-navy-600 text-slate-600 dark:text-slate-400 hover:border-brand-blue/40'
                  }`}
                >
                  {cls}th
                </button>
              ))}
            </div>
          </div>

          {/* Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Section</label>
            <div className="flex gap-2">
              {['A', 'B'].map(sec => (
                <button
                  key={sec}
                  onClick={() => handleSectionChange(sec)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    selectedSection === sec
                      ? 'bg-brand-blue border-brand-blue text-white shadow-sm'
                      : 'border-slate-200 dark:border-navy-600 text-slate-600 dark:text-slate-400 hover:border-brand-blue/40'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Date</label>
            <DateNav date={date} onChange={handleDateChange} />
          </div>
        </div>

        {/* Already recorded warning */}
        {alreadySavedForKey && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
              Attendance has already been recorded for Class {selectedClass}-{selectedSection} on this date. You can edit and save again.
            </p>
          </div>
        )}
      </div>

      {/* Progress + Quick controls row */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Progress ring */}
        <div className="card flex items-center gap-4">
          <ProgressRing percentage={stats.percentage} />
          <div className="space-y-1">
            <p className="text-xs font-bold text-navy-900 dark:text-white">Class {selectedClass}-{selectedSection}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400">Present: <b>{stats.present}</b></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400">Absent: <b>{stats.absent}</b></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400">Late: <b>{stats.late}</b></span>
            </div>
          </div>
        </div>

        {/* Quick controls */}
        <div className="sm:col-span-2 card">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">Quick Controls</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => markAll('present')} className="btn-success">
              <UserCheck size={15} /> Mark All Present
            </button>
            <button onClick={() => markAll('absent')} className="btn-danger">
              <UserX size={15} /> Mark All Absent
            </button>
            <button onClick={resetAttendance} className="btn-secondary">
              <RefreshCw size={15} /> Reset
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-brand-blue hover:bg-brand-blue-light text-white shadow-sm'
            } disabled:opacity-70`}
          >
            {saving ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Saving...</>
            ) : saved ? (
              <><CheckCircle2 size={16} /> Attendance Saved Successfully ✓</>
            ) : (
              <><Save size={16} /> {isEditing ? 'Update Attendance' : 'Save Attendance'}</>
            )}
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 no-print">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name or roll number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-1.5">
          {['all', 'present', 'absent', 'late'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                filter === f
                  ? f === 'present' ? 'bg-green-100 border-green-300 text-green-700'
                  : f === 'absent' ? 'bg-red-100 border-red-300 text-red-700'
                  : f === 'late' ? 'bg-amber-100 border-amber-300 text-amber-700'
                  : 'bg-brand-blue border-brand-blue text-white'
                  : 'bg-white dark:bg-navy-700 border-slate-200 dark:border-navy-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="ml-1">({f === 'present' ? stats.present : f === 'absent' ? stats.absent : stats.late})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-navy-700/50 border-b border-slate-100 dark:border-navy-700">
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 w-16">Roll No</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Student Name</th>
                <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 w-24">Status</th>
                <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 text-sm">
                    {search ? 'No students match your search.' : 'No students in this class.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const status = attendance[student.id] || 'present';
                  return (
                    <tr
                      key={student.id}
                      className={`border-b border-slate-50 dark:border-navy-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-navy-700/30 transition-colors ${
                        status === 'absent' ? 'bg-red-50/30 dark:bg-red-900/5' :
                        status === 'late' ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-navy-700 px-2 py-0.5 rounded-md">
                          {student.rollNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                            style={{ background: `hsl(${(student.rollNumber.charCodeAt(0) * 47) % 360}, 60%, 55%)` }}>
                            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-navy-900 dark:text-white">{student.name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">Roll #{student.rollNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge-${status}`}>
                          <span className="text-[10px]">●</span>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5 no-print">
                          <StatusButton status="present" current={status} onClick={() => setStatus(student.id, 'present')} />
                          <StatusButton status="absent" current={status} onClick={() => setStatus(student.id, 'absent')} />
                          <StatusButton status="late" current={status} onClick={() => setStatus(student.id, 'late')} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-700/30 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {filteredStudents.length} of {classStudents.length} students
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[11px] text-slate-500">{stats.present} Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[11px] text-slate-500">{stats.absent} Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[11px] text-slate-500">{stats.late} Late</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
