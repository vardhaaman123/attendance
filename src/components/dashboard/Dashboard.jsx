import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserX, TrendingUp, ChevronRight, BookOpen, AlertTriangle, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayStats, getLowAttendanceStudents, getWeeklyData } from '../../utils/attendanceCalc';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function StatCard({ icon: Icon, label, value, sub, trend, color, bg }) {
  return (
    <div className="card hover:shadow-card-hover transition-all duration-300 group cursor-default animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon size={20} className={color} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-navy-900 dark:text-white mb-0.5">{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function ClassCard({ cls, students, records, onSelect }) {
  const navigate = useNavigate();
  const sectionStats = ['A', 'B'].map(section => {
    const classStudents = students.filter(s => s.class === cls && s.section === section);
    const today = new Date().toISOString().split('T')[0];
    const key = `${today}_${cls}_${section}`;
    const record = records[key];
    const present = record
      ? Object.values(record.attendance || {}).filter(v => v === 'present' || v === 'late').length
      : null;
    return { section, total: classStudents.length, present };
  });

  return (
    <div
      onClick={() => { onSelect(cls, 'A'); navigate('/attendance'); }}
      className="card hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-blue-soft flex items-center justify-center">
          <BookOpen size={18} className="text-brand-blue" />
        </div>
        <ChevronRight size={16} className="text-slate-400 group-hover:text-brand-blue group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="text-base font-bold text-navy-900 dark:text-white mb-1">Class {cls}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        {students.filter(s => s.class === cls).length} Students · 2 Sections
      </p>
      <div className="space-y-2">
        {sectionStats.map(({ section, total, present }) => (
          <div key={section} className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Section {section}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
                {present !== null && (
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${Math.round((present / total) * 100)}%` }}
                  />
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {present !== null ? `${Math.round((present / total) * 100)}%` : 'Not taken'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-navy-700 border border-slate-100 dark:border-navy-600 rounded-xl shadow-lg px-3 py-2">
        <p className="text-xs font-semibold text-navy-900 dark:text-white">{label}</p>
        <p className="text-xs text-brand-blue font-bold">{payload[0].value}% Attendance</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { students, attendanceRecords, setSelectedClass, setSelectedSection } = useApp();
  const navigate = useNavigate();

  const todayStats = useMemo(() => getTodayStats(students, attendanceRecords), [students, attendanceRecords]);
  const weeklyData = useMemo(() => getWeeklyData(students, attendanceRecords), [students, attendanceRecords]);
  const lowAttendance = useMemo(() => getLowAttendanceStudents(students, attendanceRecords), [students, attendanceRecords]);

  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const ds = d.toISOString().split('T')[0];
    let p = 0, t = 0;
    students.forEach(s => {
      const key = `${ds}_${s.class}_${s.section}`;
      const record = attendanceRecords[key];
      if (record?.attendance?.[s.id]) {
        t++;
        if (record.attendance[s.id] !== 'absent') p++;
      }
    });
    return t > 0 ? Math.round((p / t) * 100) : 0;
  }, [students, attendanceRecords]);

  const trend = todayStats.percentage - yesterday;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={todayStats.total}
          sub="Across all classes"
          color="text-brand-blue"
          bg="bg-brand-blue-soft"
        />
        <StatCard
          icon={UserCheck}
          label="Present Today"
          value={todayStats.present}
          sub={`+${todayStats.late} Late`}
          trend={4.2}
          color="text-green-600"
          bg="bg-green-50"
        />
        <StatCard
          icon={UserX}
          label="Absent Today"
          value={todayStats.absent}
          sub="Across all classes"
          trend={-1.8}
          color="text-red-600"
          bg="bg-red-50"
        />
        <StatCard
          icon={TrendingUp}
          label="Attendance Rate"
          value={`${todayStats.percentage}%`}
          sub="Today's overall rate"
          trend={trend}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      {/* Classes + Chart row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Classes */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy-900 dark:text-white">Classes</h2>
            <button
              onClick={() => navigate('/classes')}
              className="text-xs text-brand-blue font-medium hover:underline flex items-center gap-1"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {['8', '9', '10'].map(cls => (
              <ClassCard
                key={cls}
                cls={cls}
                students={students}
                records={attendanceRecords}
                onSelect={(c, s) => { setSelectedClass(c); setSelectedSection(s); }}
              />
            ))}
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-navy-900 dark:text-white">Weekly Attendance</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last 5 working days</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-blue" />
              <span className="text-xs text-slate-500">Attendance %</span>
            </div>
          </div>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[60, 100]}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#eff6ff', radius: 4 }} />
                <Bar dataKey="percentage" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data available yet</div>
          )}
        </div>
      </div>

      {/* Low Attendance + Today's summary */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Low attendance */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold text-navy-900 dark:text-white">Low Attendance Alert</h2>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
              Below 75%
            </span>
          </div>
          {lowAttendance.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <UserCheck size={20} className="text-green-600" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">All students have good attendance!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowAttendance.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                  <div>
                    <p className="text-xs font-semibold text-navy-900 dark:text-white">{s.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Class {s.class}-{s.section}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600">{s.percentage}%</span>
                </div>
              ))}
              {lowAttendance.length > 5 && (
                <button onClick={() => navigate('/reports')} className="w-full text-xs text-center text-brand-blue hover:underline pt-1 font-medium">
                  +{lowAttendance.length - 5} more students
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-sm font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-brand-blue" /> Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/attendance')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-brand-blue text-white hover:bg-brand-blue-light transition-all group"
            >
              <div className="text-left">
                <p className="text-sm font-semibold">Take Today's Attendance</p>
                <p className="text-xs text-blue-100">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/students')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-navy-700 hover:bg-slate-100 dark:hover:bg-navy-600 transition-all group border border-slate-100 dark:border-navy-600"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-navy-900 dark:text-white">Manage Students</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add, edit or view students</p>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-navy-700 hover:bg-slate-100 dark:hover:bg-navy-600 transition-all group border border-slate-100 dark:border-navy-600"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-navy-900 dark:text-white">View Reports</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Analytics & attendance charts</p>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
