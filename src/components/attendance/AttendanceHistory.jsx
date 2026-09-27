import { useState, useMemo } from 'react';
import { Calendar, ChevronRight, Edit3, X, Check, Save, AlertCircle, ChevronLeft, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { calcAttendanceStats } from '../../utils/attendanceCalc';
import CustomSelect from '../ui/CustomSelect';

function AttendanceEditModal({ record, students, onSave, onClose }) {
  const [attendance, setAttendance] = useState({ ...record.attendance });
  const classStudents = students.filter(s => s.class === record.class && s.section === record.section)
    .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }));

  const stats = calcAttendanceStats(classStudents, { attendance });

  const setStatus = (id, status) => setAttendance(prev => ({ ...prev, [id]: status }));
  const markAll = (status) => {
    const u = {};
    classStudents.forEach(s => { u[s.id] = status; });
    setAttendance(u);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[#0E1422] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/15 overflow-hidden backdrop-blur-2xl animate-slide-up">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-white/10 flex-shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">Edit Attendance</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">Class {record.class}-{record.section} · {new Date(record.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-white/[0.02] flex-shrink-0">
          <div className="flex gap-2">
            <button onClick={() => markAll('present')} className="btn-success text-xs py-1.5 px-3">All Present</button>
            <button onClick={() => markAll('absent')} className="btn-danger text-xs py-1.5 px-3">All Absent</button>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.present}P</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">{stats.absent}A</span>
            <span className="font-bold text-slate-900 dark:text-white">{stats.percentage}%</span>
          </div>
        </div>

        <div className="overflow-y-auto max-h-96 divide-y divide-slate-100 dark:divide-white/5">
          {classStudents.map(s => {
            const st = attendance[s.id] || 'present';
            return (
              <div key={s.id} className="flex items-center justify-between px-6 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono w-6">{s.rollNumber}</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
                </div>
                <div className="flex gap-1.5">
                  {['present', 'absent'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatus(s.id, status)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        st === status
                          ? status === 'present' ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : status === 'absent' ? 'bg-rose-500/15 border-rose-500/50 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                          : 'bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/25 hover:bg-white/5'
                      }`}
                    >
                      {status === 'present' ? (
                        <Check size={13} strokeWidth={2.5} />
                      ) : (
                        <X size={13} strokeWidth={2.5} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(attendance)} className="btn-primary">
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttendanceHistory() {
  const { students, attendanceRecords, saveAttendanceRecord, addToast } = useApp();
  const { role, user } = useAuth();
  const [classFilter, setClassFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [editRecord, setEditRecord] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const canEditRecord = (record) => {
    if (role === 'admin' || role === 'teacher') return true;
    return false;
  };

  const sortedRecords = useMemo(() => {
    return Object.entries(attendanceRecords)
      .filter(([, r]) => {
        if (classFilter !== 'all' && r.class !== classFilter) return false;
        if (sectionFilter !== 'all' && r.section !== sectionFilter) return false;
        return true;
      })
      .sort(([, a], [, b]) => new Date(b.date) - new Date(a.date));
  }, [attendanceRecords, classFilter, sectionFilter]);

  const paginated = sortedRecords.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(sortedRecords.length / PER_PAGE);

  const handleSaveEdit = (attendance) => {
    const key = `${editRecord.date}_${editRecord.class}_${editRecord.section}`;
    saveAttendanceRecord(key, { ...editRecord, attendance, savedAt: new Date().toISOString() });
    addToast('Attendance updated successfully.', 'success');
    setEditRecord(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-30">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-navy-900 dark:text-white">Attendance History</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sortedRecords.length} records found</p>
        </div>
        <div className="flex gap-2 relative z-30">
          <CustomSelect
            value={classFilter}
            onChange={e => { setClassFilter(e.target.value); setPage(1); }}
            className="input-field w-auto"
          >
            <option value="all">All Classes</option>
            {['8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
          </CustomSelect>
          <CustomSelect
            value={sectionFilter}
            onChange={e => { setSectionFilter(e.target.value); setPage(1); }}
            className="input-field w-auto"
          >
            <option value="all">All Sections</option>
            {['A','B'].map(s => <option key={s} value={s}>Section {s}</option>)}
          </CustomSelect>
        </div>
      </div>

      {sortedRecords.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No attendance records found.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Take attendance to see history here.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map(([key, record]) => {
              const classStudents = students.filter(s => s.class === record.class && s.section === record.section);
              const stats = calcAttendanceStats(classStudents, record);
              const date = new Date(record.date + 'T00:00:00');
              const isToday = record.date === new Date().toISOString().split('T')[0];

              return (
                <div key={key} className="rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200/80 dark:border-white/10 p-3.5 sm:p-5 backdrop-blur-xl shadow-sm dark:shadow-[0_4px_25px_rgba(0,0,0,0.3)] hover:shadow-md dark:hover:border-white/20 transition-all duration-300 group">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex flex-col items-center justify-center flex-shrink-0">
                        <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 leading-none">{date.getDate()}</p>
                        <p className="text-[9px] text-blue-600/70 dark:text-blue-400/80 font-semibold uppercase mt-0.5">{date.toLocaleDateString('en-IN', { month: 'short' })}</p>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Class {record.class}-{record.section}</p>
                          {isToday && <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded-full">Today</span>}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/[0.04]">
                      <div className="flex gap-2.5 text-xs">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" /><span className="text-slate-600 dark:text-slate-400 font-medium">{stats.present}P</span></span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" /><span className="text-slate-600 dark:text-slate-400 font-medium">{stats.absent}A</span></span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold border ${
                          stats.percentage >= 90 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.15)]' :
                          stats.percentage >= 75 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]' :
                          'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                        }`}>
                          {stats.percentage}%
                        </div>
                        {canEditRecord(record) ? (
                          <button
                            onClick={() => setEditRecord(record)}
                            className="flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 dark:hover:bg-blue-500/10 transition-all cursor-pointer active:scale-95"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                        ) : role === 'teacher' ? (
                          <span
                            className="flex items-center gap-1.5 min-h-[34px] px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] cursor-not-allowed"
                            title={`Only Class ${record.class}-${record.section} teacher can edit this record.`}
                          >
                            <Lock size={12} /> Read-only
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          stats.percentage >= 90 ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                          stats.percentage >= 75 ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                          'bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                        }`}
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                disabled={page === 1}
                className="btn-secondary py-2 px-3 disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p+1))}
                disabled={page === totalPages}
                className="btn-secondary py-2 px-3 disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}

      {editRecord && (
        <AttendanceEditModal
          record={editRecord}
          students={students}
          onSave={handleSaveEdit}
          onClose={() => setEditRecord(null)}
        />
      )}
    </div>
  );
}
