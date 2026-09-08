import { useMemo, useState } from 'react';
import { Phone, User, Mail, BookOpen, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { calcStudentAttendancePercentage, getStudentMonthlyCalendar } from '../../utils/attendanceCalc';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function MonthCalendar({ days, year, month }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, status: days[dateStr] || null });
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[9px] font-semibold text-slate-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`h-7 flex items-center justify-center rounded text-[10px] font-bold ${
              !cell ? '' :
              cell.status === 'present' ? 'bg-green-100 text-green-700' :
              cell.status === 'absent' ? 'bg-red-100 text-red-700' :
              cell.status === 'late' ? 'bg-amber-100 text-amber-700' :
              'text-slate-300'
            }`}
          >
            {cell ? (
              cell.status
                ? (cell.status === 'present' ? 'P' : cell.status === 'absent' ? 'A' : 'L')
                : <span className="text-slate-300 text-[9px]">{cell.day}</span>
            ) : ''}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-3 flex-wrap">
        {[
          ['P', 'Present', 'bg-green-100 text-green-700'],
          ['A', 'Absent', 'bg-red-100 text-red-700'],
          ['L', 'Late', 'bg-amber-100 text-amber-700'],
        ].map(([k, l, c]) => (
          <div key={k} className="flex items-center gap-1">
            <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${c}`}>{k}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentProfileModal({ open, student, onClose }) {
  const { attendanceRecords } = useApp();
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const stats = useMemo(() =>
    student ? calcStudentAttendancePercentage(student.id, attendanceRecords) : {},
    [student, attendanceRecords]
  );

  const calDays = useMemo(() =>
    student ? getStudentMonthlyCalendar(student.id, attendanceRecords, calYear, calMonth) : {},
    [student, attendanceRecords, calYear, calMonth]
  );

  const pct = stats.percentage || 0;
  const color = pct >= 85 ? '#16A34A' : pct >= 75 ? '#F59E0B' : '#DC2626';
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (calYear > now.getFullYear() || (calYear === now.getFullYear() && calMonth >= now.getMonth())) return;
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  if (!student) return null;

  const avatarHue = (student.rollNumber?.charCodeAt(0) || 65) * 47 % 360;
  const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <Modal open={open} onClose={onClose} title="Student Profile" maxWidth="max-w-xl">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
            style={{ background: `hsl(${avatarHue}, 60%, 55%)` }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{student.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Roll #{student.rollNumber} · Class {student.class}-{student.section}
            </p>
          </div>
          <div className="relative inline-flex items-center justify-center flex-shrink-0">
            <svg width="72" height="72" className="-rotate-90">
              <circle cx="36" cy="36" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
              <circle
                cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-xs font-bold leading-none" style={{ color }}>{pct}%</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            ['Present', stats.present || 0, 'text-green-600', 'bg-green-50 dark:bg-green-900/10'],
            ['Absent', stats.absent || 0, 'text-red-600', 'bg-red-50 dark:bg-red-900/10'],
            ['Late', stats.late || 0, 'text-amber-600', 'bg-amber-50 dark:bg-amber-900/10'],
          ].map(([l, v, c, bg]) => (
            <div key={l} className={`${bg} rounded-xl p-3 text-center`}>
              <p className={`text-xl font-bold ${c}`}>{v}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{l}</p>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="space-y-2">
          {[
            [User, 'Parent / Guardian', student.parentName],
            [Phone, 'Contact', student.contact],
            [Mail, 'Email', student.email],
            [BookOpen, 'Class', `${student.class}-${student.section}`],
          ].map(([Icon, label, val]) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Icon size={13} className="text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">{label}</p>
                <p className="text-xs font-medium text-slate-900 dark:text-white">{val || '—'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Calendar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={14} className="text-blue-600" />
              Monthly Attendance
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {new Date(calYear, calMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={nextMonth}
                disabled={calYear === now.getFullYear() && calMonth >= now.getMonth()}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <MonthCalendar days={calDays} year={calYear} month={calMonth} />
        </div>
      </div>
    </Modal>
  );
}
