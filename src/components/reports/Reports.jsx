import { useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getWeeklyData, getMonthlyData, getClassComparison, getLowAttendanceStudents
} from '../../utils/attendanceCalc';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, Radar
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-navy-700 border border-slate-100 dark:border-navy-600 rounded-xl shadow-lg px-3 py-2">
        <p className="text-xs font-semibold text-navy-900 dark:text-white">{label}</p>
        {payload.map(p => (
          <p key={p.name} className="text-xs font-bold" style={{ color: p.color }}>
            {p.name}: {p.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const { students, attendanceRecords } = useApp();

  const weeklyData = useMemo(() => getWeeklyData(students, attendanceRecords), [students, attendanceRecords]);
  const monthlyData = useMemo(() => getMonthlyData(students, attendanceRecords), [students, attendanceRecords]);
  const classComparison = useMemo(() => getClassComparison(students, attendanceRecords), [students, attendanceRecords]);
  const lowAttendance = useMemo(() => getLowAttendanceStudents(students, attendanceRecords), [students, attendanceRecords]);

  const avgWeekly = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((a, b) => a + b.percentage, 0) / weeklyData.length)
    : 0;

  const avgMonthly = monthlyData.length > 0
    ? Math.round(monthlyData.reduce((a, b) => a + b.percentage, 0) / monthlyData.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-navy-900 dark:text-white">Reports & Analytics</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Comprehensive attendance analytics and insights.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Weekly Avg', value: `${avgWeekly}%`, sub: 'This week', color: 'text-brand-blue', bg: 'bg-brand-blue-soft' },
          { label: 'Monthly Avg', value: `${avgMonthly}%`, sub: 'Last 6 months', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Low Attendance', value: lowAttendance.length, sub: 'Below 75%', color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Total Records', value: Object.keys(attendanceRecords).length, sub: 'All time', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className="card animate-slide-up">
            <p className={`text-2xl font-bold ${color} mb-0.5`}>{value}</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-xs text-slate-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Weekly */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">Weekly Attendance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last 5 working days</p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${avgWeekly >= 85 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {avgWeekly >= 85 ? <TrendingUp size={12} className="inline mr-0.5" /> : <TrendingDown size={12} className="inline mr-0.5" />}
              {avgWeekly}% avg
            </span>
          </div>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#eff6ff', radius: 4 }} />
                <Bar dataKey="percentage" name="Attendance" fill="#2563EB" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Monthly trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">Monthly Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last 6 months</p>
            </div>
          </div>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="percentage" name="Attendance" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: '#2563EB', r: 4, strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Class comparison + Low attendance */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Class comparison */}
        <div className="card">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-1">Class Comparison</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Overall attendance by class</p>
          {classComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={classComparison} layout="vertical" barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="class" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#eff6ff' }} />
                <Bar dataKey="percentage" name="Attendance" radius={[0, 5, 5, 0]}>
                  {classComparison.map((entry, i) => (
                    <rect key={i} fill={['#2563EB', '#16A34A', '#F59E0B'][i % 3]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          )}

          {/* Manual bars since recharts Cell needs import */}
          <div className="mt-2 space-y-3">
            {classComparison.map((c, i) => {
              const colors = ['#2563EB', '#16A34A', '#F59E0B'];
              const pct = c.percentage;
              return (
                <div key={c.class} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-navy-900 dark:text-white w-16">{c.class}</span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: colors[i % 3] }} />
                  </div>
                  <span className="text-xs font-bold text-navy-900 dark:text-white w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low attendance */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold text-navy-900 dark:text-white">Low Attendance Students</h3>
            </div>
            <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
              {lowAttendance.length} students
            </span>
          </div>

          {lowAttendance.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">All students above 75%!</p>
              <p className="text-xs text-slate-400 mt-1">No low attendance alerts.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {lowAttendance.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-red-100 dark:border-red-900/20 bg-red-50 dark:bg-red-900/5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: `hsl(${(s.rollNumber?.charCodeAt(0)||65) * 47 % 360}, 60%, 55%)` }}>
                    {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-navy-900 dark:text-white truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-500">Class {s.class}-{s.section}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-red-600">{s.percentage}%</p>
                    <p className="text-[10px] text-slate-400">{s.absent}A / {s.total}D</p>
                  </div>
                  <div className="w-16">
                    <div className="h-1.5 bg-red-100 dark:bg-red-900/20 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${s.percentage}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
