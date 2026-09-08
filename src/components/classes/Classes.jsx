import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, ChevronRight, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calcAttendanceStats } from '../../utils/attendanceCalc';

export default function Classes() {
  const { students, attendanceRecords, setSelectedClass, setSelectedSection } = useApp();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const classData = useMemo(() => {
    return ['8', '9', '10'].map(cls => {
      const sections = ['A', 'B'].map(section => {
        const classStudents = students.filter(s => s.class === cls && s.section === section);
        const key = `${today}_${cls}_${section}`;
        const record = attendanceRecords[key];
        const todayStats = calcAttendanceStats(classStudents, record);

        // Overall attendance
        let totalPresent = 0, totalDays = 0;
        classStudents.forEach(s => {
          Object.values(attendanceRecords).forEach(r => {
            if (r.class === cls && r.section === section && r.attendance?.[s.id]) {
              totalDays++;
              if (r.attendance[s.id] !== 'absent') totalPresent++;
            }
          });
        });
        const overallPct = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;

        return { section, students: classStudents, todayStats, overallPct };
      });
      return { cls, sections };
    });
  }, [students, attendanceRecords, today]);

  const colors = { '8': 'bg-blue-50 text-brand-blue', '9': 'bg-green-50 text-green-600', '10': 'bg-purple-50 text-purple-600' };
  const borderColors = { '8': 'border-blue-200', '9': 'border-green-200', '10': 'border-purple-200' };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-navy-900 dark:text-white">Classes</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Overview of all classes and sections.</p>
      </div>

      {classData.map(({ cls, sections }) => (
        <div key={cls} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl ${colors[cls]} flex items-center justify-center`}>
              <BookOpen size={15} />
            </div>
            <h2 className="text-base font-bold text-navy-900 dark:text-white">Class {cls}</h2>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">{students.filter(s => s.class === cls).length} students</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {sections.map(({ section, students: sStudents, todayStats, overallPct }) => (
              <div
                key={section}
                className={`card border-l-4 ${borderColors[cls]} hover:shadow-card-hover transition-all duration-300 cursor-pointer group`}
                onClick={() => {
                  setSelectedClass(cls);
                  setSelectedSection(section);
                  navigate('/attendance');
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-base font-bold text-navy-900 dark:text-white">Section {section}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Users size={11} /> {sStudents.length} Students
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-brand-blue group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="space-y-3">
                  {/* Today */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Today</span>
                      <span className={`text-xs font-bold ${
                        todayStats.percentage >= 85 ? 'text-green-600' :
                        todayStats.percentage >= 70 ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        {todayStats.total > 0 && todayStats.present + todayStats.absent + todayStats.late > 0
                          ? `${todayStats.percentage}%`
                          : 'Not taken'}
                      </span>
                    </div>
                    {todayStats.total > 0 && todayStats.present + todayStats.absent + todayStats.late > 0 && (
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${todayStats.percentage}%` }} />
                      </div>
                    )}
                  </div>

                  {/* Overall */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Overall</span>
                      <span className={`text-xs font-bold ${overallPct >= 85 ? 'text-green-600' : overallPct >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                        {overallPct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${overallPct}%`, background: overallPct >= 85 ? '#16A34A' : overallPct >= 70 ? '#F59E0B' : '#DC2626' }} />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-green-500" />{todayStats.present}P</span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-red-500" />{todayStats.absent}A</span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-amber-500" />{todayStats.late}L</span>
                  </div>
                </div>

                <button className="w-full mt-4 py-2 rounded-xl text-xs font-semibold text-brand-blue bg-brand-blue-soft hover:bg-blue-100 transition-colors">
                  Take Attendance →
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
