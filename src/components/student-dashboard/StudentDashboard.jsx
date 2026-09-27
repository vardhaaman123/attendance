import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Calendar,
  CheckCircle,
  XCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flame,
  Award,
  Clock,
  ArrowUpRight,
  Megaphone,
  ShieldCheck,
  Printer,
  AlertCircle,
  Sparkles,
  Target,
  FileText,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getIndianHoliday } from '../../utils/indianHolidays';

export default function StudentDashboard() {
  const { currentStudent } = useAuth();
  const { attendanceRecords, settings, messages, addToast } = useApp();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);
  const [targetGoal, setTargetGoal] = useState(75); // Target percentage (75, 80, 85, 90)

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate overall student statistics
  const stats = useMemo(() => {
    let present = 0, absent = 0, late = 0;
    const dayMap = {};
    const recordsList = Object.values(attendanceRecords).sort((a, b) => new Date(a.date) - new Date(b.date));

    recordsList.forEach((record) => {
      const status = record.attendance?.[currentStudent?.id];
      if (!status) return;
      dayMap[record.date] = {
        status,
        markedBy: record.markedBy || 'Class Teacher',
        section: record.section,
      };
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
    });

    const total = present + absent + late;
    const attended = present + late;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

    // Calculate current consecutive attendance streak
    let currentStreak = 0;
    for (let i = recordsList.length - 1; i >= 0; i--) {
      const rec = recordsList[i];
      const st = rec.attendance?.[currentStudent?.id];
      if (!st) continue;
      if (st === 'present' || st === 'late') {
        currentStreak++;
      } else {
        break;
      }
    }

    return { present, absent, late, total, attended, percentage, dayMap, currentStreak };
  }, [attendanceRecords, currentStudent]);

  // Target attendance / Safe Bunk calculation
  const targetCalc = useMemo(() => {
    const { total, attended } = stats;
    if (total === 0) return { status: 'safe', count: 0, text: 'No attendance records yet.' };

    const T = targetGoal / 100;
    const currentRate = attended / total;

    if (currentRate >= T) {
      // Can miss M more classes while staying >= T
      // attended / (total + M) >= T => M <= (attended - T*total) / T
      const maxBunks = Math.floor((attended - T * total) / T);
      return {
        status: 'safe',
        count: Math.max(0, maxBunks),
        headline: maxBunks > 0 ? `Safe Zone: You can miss ${maxBunks} more class${maxBunks > 1 ? 'es' : ''}!` : `Borderline: Do not miss any upcoming classes!`,
        desc: `You currently maintain ${stats.percentage}%, which is above your ${targetGoal}% goal.`,
      };
    } else {
      // Must attend C consecutive classes to reach T
      // (attended + C) / (total + C) >= T => C * (1 - T) >= T*total - attended
      const needed = Math.ceil((T * total - attended) / (1 - T));
      return {
        status: 'danger',
        count: Math.max(1, needed),
        headline: `Attendance Alert: Attend next ${needed} consecutive class${needed > 1 ? 'es' : ''}!`,
        desc: `You need ${needed} unbroken attendance day${needed > 1 ? 's' : ''} to recover and reach ${targetGoal}%.`,
      };
    }
  }, [stats, targetGoal]);

  // Calendar month days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const record = stats.dayMap[dateStr];
      const holiday = getIndianHoliday(dateStr);
      days.push({
        day: d,
        dateStr,
        status: record ? record.status : null,
        holiday,
        markedBy: record ? record.markedBy : null,
      });
    }

    return {
      days,
      monthName: currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
    };
  }, [stats.dayMap, currentDate]);

  const handlePrevMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // Subject-wise attendance calculation
  const subjectBreakdown = useMemo(() => {
    const subjects = [
      { name: 'Mathematics', base: 94, icon: '📐' },
      { name: 'Science', base: 88, icon: '🔬' },
      { name: 'English Literature', base: 92, icon: '📖' },
      { name: 'Social Studies', base: 84, icon: '🌍' },
      { name: 'Computer Science', base: 96, icon: '💻' },
    ];

    return subjects.map((sub) => {
      // Scaled by student's overall attendance ratio
      const adjusted = Math.min(100, Math.max(50, Math.round(sub.base * (stats.percentage > 0 ? stats.percentage / 90 : 1))));
      return {
        ...sub,
        percentage: adjusted,
        held: Math.round(stats.total * 0.9) || 18,
        attended: Math.round((stats.total * 0.9) * (adjusted / 100)) || 16,
      };
    });
  }, [stats.percentage, stats.total]);

  // Recent announcements preview for students
  const studentNotices = useMemo(() => {
    return (messages || [])
      .filter((m) => m.targetId === 'all' || m.targetRole === 'student' || m.targetRole === 'all')
      .slice(-3)
      .reverse();
  }, [messages]);

  const pctColor =
    stats.percentage >= 85
      ? 'text-emerald-400'
      : stats.percentage >= 75
      ? 'text-amber-400'
      : 'text-rose-400';

  const pctStroke =
    stats.percentage >= 85
      ? 'stroke-emerald-500'
      : stats.percentage >= 75
      ? 'stroke-amber-500'
      : 'stroke-rose-500';

  const handlePrintSlip = () => {
    window.print();
  };

  if (!currentStudent) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in text-slate-100 pb-10">
      {/* ── STUDENT HERO PROFILE BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0E1528] via-[#0B0F1A] to-[#070A12] border border-white/10 p-5 sm:p-7 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight break-words">
                Welcome back, <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-300 bg-clip-text text-transparent break-words">{currentStudent.name}</span>! 👋
              </h1>
            </div>
          </div>

          {/* Glowing Radial Attendance Ring & Standing */}
          <div className="flex items-center gap-4 sm:gap-6 bg-[#111726]/60 border border-white/[0.08] p-3.5 sm:p-4 rounded-2xl backdrop-blur-md w-full sm:w-auto self-start md:self-auto">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 70 70">
                <circle cx="35" cy="35" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle
                  cx="35"
                  cy="35"
                  r="28"
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className={pctStroke}
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - stats.percentage / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-sm font-extrabold ${pctColor}`}>{stats.percentage}%</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Official Standing</p>
              <p className={`text-sm font-bold mt-0.5 ${pctColor}`}>
                {stats.percentage >= 85 ? '🏆 High Standing' : stats.percentage >= 75 ? '✅ Examination Eligible' : '⚠️ Low Attendance Risk'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {stats.attended} of {stats.total} days attended
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 KPI STAT TILES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Present */}
        <div className="rounded-2xl bg-[#0B0F19]/80 border border-white/10 hover:border-emerald-500/30 p-4 backdrop-blur-xl transition-all shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <CheckCircle size={18} />
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
          <p className="text-2xl font-extrabold text-white tracking-tight">{stats.present}</p>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Days Present</p>
        </div>

        {/* Absent */}
        <div className="rounded-2xl bg-[#0B0F19]/80 border border-white/10 hover:border-rose-500/30 p-4 backdrop-blur-xl transition-all shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              <XCircle size={18} />
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Leaves
            </span>
          </div>
          <p className="text-2xl font-extrabold text-white tracking-tight">{stats.absent}</p>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Days Absent</p>
        </div>

        {/* Total */}
        <div className="rounded-2xl bg-[#0B0F19]/80 border border-white/10 hover:border-blue-500/30 p-4 backdrop-blur-xl transition-all shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Calendar size={18} />
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Total Recorded
            </span>
          </div>
          <p className="text-2xl font-extrabold text-white tracking-tight">{stats.total}</p>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Total Classes</p>
        </div>

        {/* Streak */}
        <div className="rounded-2xl bg-[#0B0F19]/80 border border-white/10 hover:border-orange-500/30 p-4 backdrop-blur-xl transition-all shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
              <Flame size={18} />
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Streak
            </span>
          </div>
          <p className="text-2xl font-extrabold text-white tracking-tight">{stats.currentStreak} Days</p>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Consecutive Streak</p>
        </div>
      </div>

      {/* ── TARGET ATTENDANCE & SAFE BUNK SIMULATOR (HIGH VALUE FEATURE) ── */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0B1222] via-[#0E1528] to-[#0B0F19] border border-blue-500/20 p-5 sm:p-6 shadow-[0_4px_25px_rgba(59,130,246,0.1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Target Attendance & Safe Leave Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Calculate how many days you can safely miss or must attend to hit your goal.
              </p>
            </div>
          </div>

          {/* Goal Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#111726] border border-white/10 p-1 rounded-xl self-start sm:self-auto">
            {[75, 80, 85, 90].map((goal) => (
              <button
                key={goal}
                onClick={() => setTargetGoal(goal)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  targetGoal === goal
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {goal}% Goal
              </button>
            ))}
          </div>
        </div>

        {/* Simulator Results Card */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          targetCalc.status === 'safe'
            ? 'bg-emerald-500/[0.06] border-emerald-500/20'
            : 'bg-rose-500/[0.06] border-rose-500/20'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${targetCalc.status === 'safe' ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
              <p className="text-sm font-bold text-white">{targetCalc.headline}</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{targetCalc.desc}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Required Minimum</p>
              <p className="text-base font-extrabold text-blue-400">{targetGoal}% Threshold</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW: INTERACTIVE CALENDAR & SUBJECT BREAKDOWN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Calendar Area (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#0B0F19]/80 border border-white/10 p-3.5 sm:p-5 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <CalendarDays size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">{calendarDays.monthName}</h2>
                <p className="text-[11px] text-slate-400">Tap any date to inspect details</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="w-full">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-[11px] font-bold text-slate-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.days.map((day, i) => {
                if (!day) return <div key={i} className="h-9 sm:h-11" />;

                const isToday = day.dateStr === new Date().toISOString().split('T')[0];
                const isSelected = selectedDayInfo?.dateStr === day.dateStr;

                let tileBg = 'bg-[#111726]/60 text-slate-400 border-white/[0.04] hover:bg-[#161F34]';
                let indicator = null;

                if (day.holiday) {
                  tileBg = 'bg-purple-500/15 border-purple-500/30 text-purple-300 font-bold';
                  indicator = <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />;
                } else if (day.status === 'present') {
                  tileBg = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold';
                  indicator = <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />;
                } else if (day.status === 'late') {
                  tileBg = 'bg-amber-500/15 border-amber-500/30 text-amber-300 font-bold';
                  indicator = <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />;
                } else if (day.status === 'absent') {
                  tileBg = 'bg-rose-500/15 border-rose-500/30 text-rose-300 font-bold';
                  indicator = <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />;
                }

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDayInfo(day)}
                    className={`h-9 sm:h-11 rounded-xl flex flex-col items-center justify-center relative border transition-all cursor-pointer ${tileBg} ${
                      isToday ? 'ring-2 ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]' : ''
                    } ${isSelected ? 'ring-2 ring-white scale-105 z-10' : ''}`}
                  >
                    <span className="text-xs sm:text-sm">{day.day}</span>
                    <div className="absolute bottom-1">{indicator}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar Day Inspector Card */}
          {selectedDayInfo && (
            <div className="mt-4 p-3.5 rounded-xl bg-[#111726] border border-blue-500/30 flex items-center justify-between gap-3 animate-fade-in">
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs font-bold text-white">
                  {new Date(selectedDayInfo.dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-[11px] text-slate-300">
                  {selectedDayInfo.holiday
                    ? `🎉 School Holiday: ${selectedDayInfo.holiday.name}`
                    : selectedDayInfo.status === 'present'
                    ? '✅ Marked Present in School Register'
                    : selectedDayInfo.status === 'late'
                    ? '⏰ Marked Late Arrival (Recorded)'
                    : selectedDayInfo.status === 'absent'
                    ? '❌ Marked Absent'
                    : '📅 No attendance recorded on this day'}
                </p>
              </div>
              <button
                onClick={() => setSelectedDayInfo(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-white/[0.04]"
              >
                Close
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-white/[0.06] text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>Holiday</span>
            </div>
          </div>
        </div>

        {/* Subject Breakdown & Announcements (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          {/* Subject Attendance Breakdown */}
          <div className="rounded-2xl bg-[#0B0F19]/80 border border-white/10 p-5 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <BookOpen size={16} />
                </div>
                <h2 className="text-sm font-bold text-white tracking-tight">Subject Attendance</h2>
              </div>
              <span className="text-[11px] text-slate-400">Estimated</span>
            </div>

            <div className="space-y-3">
              {subjectBreakdown.map((sub) => (
                <div key={sub.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>{sub.icon}</span> {sub.name}
                    </span>
                    <span className="font-bold text-blue-400">{sub.percentage}%</span>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${sub.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Notices Feed */}
          <div className="rounded-2xl bg-[#0B0F19]/80 border border-white/10 p-5 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Megaphone size={16} />
                </div>
                <h2 className="text-sm font-bold text-white tracking-tight">School Notices</h2>
              </div>
              <button
                onClick={() => navigate('/messages')}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowUpRight size={12} />
              </button>
            </div>

            <div className="space-y-2">
              {studentNotices.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No notices posted yet.</p>
              ) : (
                studentNotices.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => navigate('/messages')}
                    className="p-3 rounded-xl bg-[#111726]/80 hover:bg-[#161F34] border border-white/[0.06] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-blue-400">{msg.senderName || 'School'}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed group-hover:text-white">
                      {msg.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={handlePrintSlip}
              className="mt-4 w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Attendance Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
