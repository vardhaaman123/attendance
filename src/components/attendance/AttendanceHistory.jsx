import { useState, useMemo } from 'react';
import { Calendar, ChevronRight, Edit3, X, Save, AlertCircle, ChevronLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calcAttendanceStats } from '../../utils/attendanceCalc';

function AttendanceEditModal({ record, students, onSave, onClose }) {
  const [attendance, setAttendance] = useState({ ...record.attendance });
  const classStudents = students.filter(s => s.class === record.class && s.section === record.section)
    .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

  const stats = calcAttendanceStats(classStudents, { attendance });

  const setStatus = (id, status) => setAttendance(prev => ({ ...prev, [id]: status }));
  const markAll = (status) => {
    const u = {};
    classStudents.forEach(s => { u[s.id] = status; });
    setAttendance(u);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-navy-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-navy-700 overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-navy-700">
          <div>
            <h2 className="text-sm font-bold text-navy-900 dark:text-white">Edit Attendance</h2>
            <p className="text-xs text-slate-500">Class {record.class}-{record.section} · {new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 dark:border-navy-700 flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => markAll('present')} className="btn-success text-xs py-1.5 px-3">All Present</button>
            <button onClick={() => markAll('absent')} className="btn-danger text-xs py-1.5 px-3">All Absent</button>
          </div>
          <div className="flex gap-3 text-xs text-slate-500">
            <span className="text-green-600 font-semibold">{stats.present}P</span>
            <span className="text-red-600 font-semibold">{stats.absent}A</span>
            <span className="text-amber-600 font-semibold">{stats.late}L</span>
            <span className="font-bold text-navy-900 dark:text-white">{stats.percentage}%</span>
          </div>
        </div>

        <div className="overflow-y-auto max-h-96">
          {classStudents.map(s => {
            const st = attendance[s.id] || 'present';
            return (
              <div key={s.id} className="flex items-center justify-between px-6 py-2.5 border-b border-slate-50 dark:border-navy-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-navy-700/30">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-6">{s.rollNumber}</span>
                  <p className="text-sm font-medium text-navy-900 dark:text-white">{s.name}</p>
                </div>
                <div className="flex gap-1.5">
                  {['present', 'absent', 'late'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatus(s.id, status)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border-2 transition-all ${
                        st === status
                          ? status === 'present' ? 'bg-green-100 border-green-400 text-green-700'
                          : status === 'absent' ? 'bg-red-100 border-red-400 text-red-700'
                          : 'bg-amber-100 border-amber-400 text-amber-700'
                          : 'border-slate-200 dark:border-navy-600 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {status.charAt(0).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-navy-700 flex justify-end gap-3">
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
  const [classFilter, setClassFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [editRecord, setEditRecord] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

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
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-navy-900 dark:text-white">Attendance History</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sortedRecords.length} records found</p>
        </div>
        <div className="flex gap-2">
          <select value={classFilter} onChange={e => { setClassFilter(e.target.value); setPage(1); }} className="input-field w-auto">
            <option value="all">All Classes</option>
            {['8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select value={sectionFilter} onChange={e => { setSectionFilter(e.target.value); setPage(1); }} className="input-field w-auto">
            <option value="all">All Sections</option>
            {['A','B'].map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
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
              const date = new Date(record.date);
              const isToday = record.date === new Date().toISOString().split('T')[0];

              return (
                <div key={key} className="card hover:shadow-card-hover transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-brand-blue-soft dark:bg-brand-blue/10 flex flex-col items-center justify-center flex-shrink-0">
                        <p className="text-lg font-bold text-brand-blue leading-none">{date.getDate()}</p>
                        <p className="text-[9px] text-brand-blue/70 font-semibold uppercase">{date.toLocaleDateString('en-IN', { month: 'short' })}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-navy-900 dark:text-white">Class {record.class}-{record.section}</p>
                          {isToday && <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">Today</span>}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="hidden sm:flex gap-3 text-xs">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-slate-500">{stats.present}P</span></span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-slate-500">{stats.absent}A</span></span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-slate-500">{stats.late}L</span></span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-sm font-bold ${
                        stats.percentage >= 90 ? 'bg-green-100 text-green-700' :
                        stats.percentage >= 75 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {stats.percentage}%
                      </div>
                      <button
                        onClick={() => setEditRecord(record)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-navy-600 text-slate-600 dark:text-slate-400 hover:border-brand-blue hover:text-brand-blue transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${stats.percentage}%` }} />
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
