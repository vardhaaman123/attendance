import { useMemo, useState } from 'react';
import { Phone, User, Mail, BookOpen, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { calcStudentAttendancePercentage, getStudentMonthlyCalendar } from '../../utils/attendanceCalc';
import { getIndianHoliday } from '../../utils/indianHolidays';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function MonthCalendar({ days, year, month }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const holiday = getIndianHoliday(dateStr);
    const isSunday = new Date(year, month, d).getDay() === 0;
    cells.push({ day: d, status: days[dateStr] || null, holiday, isSunday, dateStr });
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map((d, i) => (
          <div key={d} className={`text-center text-[9px] font-semibold py-1 ${i === 0 ? 'text-red-500' : 'text-slate-400'}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="h-7" />;

          const isHoliday = !!cell.holiday;
          let cellStyle = 'text-slate-300';
          let content = <span className="text-[9px]">{cell.day}</span>;

          if (cell.status === 'present') {
            cellStyle = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]';
            content = 'P';
          } else if (cell.status === 'absent') {
            cellStyle = 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold shadow-[0_0_8px_rgba(244,63,94,0.2)]';
            content = 'A';
          } else if (cell.status === 'late') {
            cellStyle = 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold shadow-[0_0_8px_rgba(245,158,11,0.2)]';
            content = 'L';
          } else if (isHoliday) {
            cellStyle = 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold';
            content = <span className="text-[10px]" title={cell.holiday.name}>{cell.holiday.icon}</span>;
          } else if (cell.isSunday) {
            cellStyle = 'bg-rose-500/10 text-rose-400';
            content = <span className="text-[9px]">{cell.day}</span>;
          }

          return (
            <div
              key={i}
              title={cell.holiday ? `${cell.holiday.name} (Holiday)` : cell.status || ''}
              className={`h-7 flex items-center justify-center rounded text-[10px] ${cellStyle}`}
            >
              {content}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-3 flex-wrap">
        {[
          ['P', 'Present', 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'],
          ['A', 'Absent', 'bg-rose-500/20 text-rose-400 border border-rose-500/30'],
          ['🪔', 'Holiday / Festival', 'bg-amber-500/15 text-amber-300 border border-amber-500/30'],
        ].map(([k, l, c]) => (
          <div key={l} className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold ${c}`}>{k}</span>
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
  const color = pct >= 85 ? '#10B981' : pct >= 75 ? '#F59E0B' : '#F43F5E';
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
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-[#111726] border border-slate-200/80 dark:border-white/10 rounded-2xl">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-md"
            style={{ background: `hsl(${avatarHue}, 60%, 50%)` }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{student.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Roll #{student.rollNumber} · Class {student.class}-{student.section}
            </p>
          </div>
          <div className="relative inline-flex items-center justify-center flex-shrink-0">
            <svg width="72" height="72" className="-rotate-90">
              <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
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
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {[
            ['Present', stats.present || 0, 'text-emerald-500 dark:text-emerald-400', 'bg-emerald-500/10 border border-emerald-500/20'],
            ['Absent', stats.absent || 0, 'text-rose-500 dark:text-rose-400', 'bg-rose-500/10 border border-rose-500/20'],
          ].map(([l, v, c, bg]) => (
            <div key={l} className={`${bg} rounded-xl p-3 text-center`}>
              <p className={`text-xl font-bold ${c}`}>{v}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{l}</p>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="space-y-2.5">
          {[
            [User, 'Parent / Guardian', student.parentName],
            [Phone, 'Contact', student.contact],
            [Mail, 'Email', student.email],
            [BookOpen, 'Class', `${student.class}-${student.section}`],
          ].map(([Icon, label, val]) => (
            <div key={label} className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-slate-500 dark:text-slate-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-400">{label}</p>
                <p className="text-xs font-medium text-slate-900 dark:text-white break-all">{val || '—'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Calendar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={14} className="text-blue-500 dark:text-blue-400" />
              Monthly Attendance
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {new Date(calYear, calMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={nextMonth}
                disabled={calYear === now.getFullYear() && calMonth >= now.getMonth()}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 disabled:opacity-30"
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
