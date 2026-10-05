import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  GraduationCap,
  Users,
  Download,
  Upload,
  Layers,
  Mail,
  Eye,
  MoreVertical,
  Key,
  RefreshCw,
  CheckSquare,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import CustomSelect from '../ui/CustomSelect';
import AddEditTeacherModal from './AddEditTeacherModal';
import TeacherProfileModal from './TeacherProfileModal';
import TeacherCredentialSlipModal from './TeacherCredentialSlipModal';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

function ConfirmDeleteTeacherModal({ open, teacher, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Teacher" maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to remove teacher{' '}
          <span className="font-bold text-slate-900 dark:text-white">{teacher?.name}</span>?
          This teacher will no longer be able to log in to take attendance for{' '}
          <span className="font-semibold text-brand-blue">Class {teacher?.class}-{teacher?.section}</span>.
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className="btn-danger">Delete Teacher</button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteAllSelectorModal({
  open,
  teachers = [],
  students = [],
  onConfirm,
  onClose,
  isDeleting,
}) {
  const [targetType, setTargetType] = useState('teachers'); // 'teachers' | 'students' | 'both'
  const [mode, setMode] = useState('all'); // 'all' | 'specific'
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState(new Set());

  useEffect(() => {
    if (!open) {
      setMode('all');
      setStudentSearch('');
      setStudentClassFilter('all');
      setSelectedStudentIds(new Set());
      setTeacherSearch('');
      setSelectedTeacherIds(new Set());
    }
  }, [open]);

  const teachersCount = teachers?.length || 0;
  const studentsCount = students?.length || 0;

  const options = [
    {
      id: 'teachers',
      title: 'Teachers',
      count: teachersCount,
      label: `${teachersCount} ${teachersCount === 1 ? 'Teacher' : 'Teachers'}`,
      description: `This will delete teachers and revoke their login credentials. Student records will remain untouched.`,
      icon: GraduationCap,
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      id: 'students',
      title: 'Students',
      count: studentsCount,
      label: `${studentsCount} ${studentsCount === 1 ? 'Student' : 'Students'}`,
      description: `This will delete students and remove their attendance records. Teachers will remain untouched.`,
      icon: Users,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'both',
      title: 'Both (All)',
      count: teachersCount + studentsCount,
      label: `${teachersCount + studentsCount} Total Records`,
      description: `This will permanently delete all ${teachersCount} teachers, all ${studentsCount} students, and all attendance records.`,
      icon: Layers,
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
  ];

  const selectedOption = options.find((o) => o.id === targetType) || options[0];

  // Student filtering & selection
  const filteredStudents = useMemo(() => {
    let list = students || [];
    if (studentSearch) {
      const q = studentSearch.toLowerCase();
      list = list.filter(
        (s) =>
          String(s.name || '').toLowerCase().includes(q) ||
          String(s.rollNumber || '').toLowerCase().includes(q) ||
          String(s.email || '').toLowerCase().includes(q)
      );
    }
    if (studentClassFilter !== 'all') {
      list = list.filter((s) => String(s.class) === String(studentClassFilter));
    }
    return list;
  }, [students, studentSearch, studentClassFilter]);

  const uniqueClasses = useMemo(() => {
    const cls = new Set((students || []).map((s) => String(s.class)).filter(Boolean));
    return Array.from(cls).sort((a, b) => Number(a) - Number(b));
  }, [students]);

  const handleToggleStudent = (id) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllFilteredStudentsSelected = useMemo(() => {
    const ids = filteredStudents.map((s) => s.id || s._docId).filter(Boolean);
    return ids.length > 0 && ids.every((id) => selectedStudentIds.has(id));
  }, [filteredStudents, selectedStudentIds]);

  const handleToggleSelectAllStudents = () => {
    const ids = filteredStudents.map((s) => s.id || s._docId).filter(Boolean);
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (isAllFilteredStudentsSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Teacher filtering & selection
  const filteredTeachers = useMemo(() => {
    let list = teachers || [];
    if (teacherSearch) {
      const q = teacherSearch.toLowerCase();
      list = list.filter(
        (t) =>
          String(t.name || '').toLowerCase().includes(q) ||
          String(t.email || '').toLowerCase().includes(q) ||
          String(t.subject || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [teachers, teacherSearch]);

  const isAllFilteredTeachersSelected = useMemo(() => {
    const ids = filteredTeachers.map((t) => t.id || t._docId).filter(Boolean);
    return ids.length > 0 && ids.every((id) => selectedTeacherIds.has(id));
  }, [filteredTeachers, selectedTeacherIds]);

  const handleToggleSelectAllTeachers = () => {
    const ids = filteredTeachers.map((t) => t.id || t._docId).filter(Boolean);
    setSelectedTeacherIds((prev) => {
      const next = new Set(prev);
      if (isAllFilteredTeachersSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (targetType === 'both') {
      onConfirm({ targetType: 'both', mode: 'all' });
    } else if (targetType === 'students') {
      if (mode === 'specific') {
        onConfirm({
          targetType: 'students',
          mode: 'specific',
          selectedIds: Array.from(selectedStudentIds),
        });
      } else {
        onConfirm({ targetType: 'students', mode: 'all' });
      }
    } else if (targetType === 'teachers') {
      if (mode === 'specific') {
        onConfirm({
          targetType: 'teachers',
          mode: 'specific',
          selectedIds: Array.from(selectedTeacherIds),
        });
      } else {
        onConfirm({ targetType: 'teachers', mode: 'all' });
      }
    }
  };

  let actionButtonLabel = '';
  let isActionDisabled = isDeleting;

  if (targetType === 'both') {
    actionButtonLabel = `Delete All Records (${teachersCount + studentsCount})`;
    isActionDisabled = isDeleting || (teachersCount === 0 && studentsCount === 0);
  } else if (targetType === 'students') {
    if (mode === 'specific') {
      actionButtonLabel = `Delete Selected Students (${selectedStudentIds.size})`;
      isActionDisabled = isDeleting || selectedStudentIds.size === 0;
    } else {
      actionButtonLabel = `Delete All Students (${studentsCount})`;
      isActionDisabled = isDeleting || studentsCount === 0;
    }
  } else if (targetType === 'teachers') {
    if (mode === 'specific') {
      actionButtonLabel = `Delete Selected Teachers (${selectedTeacherIds.size})`;
      isActionDisabled = isDeleting || selectedTeacherIds.size === 0;
    } else {
      actionButtonLabel = `Delete All Teachers (${teachersCount})`;
      isActionDisabled = isDeleting || teachersCount === 0;
    }
  }

  let warningText = selectedOption.description;
  if (targetType === 'students' && mode === 'specific') {
    warningText = `This will permanently delete the ${selectedStudentIds.size} selected student(s) and remove their individual attendance records. Other students will remain untouched.`;
  } else if (targetType === 'teachers' && mode === 'specific') {
    warningText = `This will permanently delete the ${selectedTeacherIds.size} selected teacher(s) and revoke their login credentials. Other teachers will remain untouched.`;
  }

  return (
    <Modal open={open} onClose={onClose} title="Delete Records" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Select what you want to delete:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = targetType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTargetType(opt.id);
                    setMode('all');
                  }}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30'
                      : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-200 dark:bg-white/10 text-slate-400'}`}>
                      <Icon size={16} />
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${opt.badgeColor}`}>
                      {opt.count}
                    </span>
                  </div>
                  <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-rose-500 dark:text-rose-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {opt.title}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-mode selector if targetType is 'students' or 'teachers' */}
        {targetType !== 'both' && (
          <div className="p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 flex gap-1.5">
            <button
              type="button"
              onClick={() => setMode('all')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'all'
                  ? 'bg-white dark:bg-dark-card text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Delete All {targetType === 'students' ? 'Students' : 'Teachers'}
            </button>
            <button
              type="button"
              onClick={() => setMode('specific')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'specific'
                  ? 'bg-white dark:bg-dark-card text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CheckSquare size={13} />
              Select Specific {targetType === 'students' ? 'Students' : 'Teachers'}
              {(targetType === 'students' ? selectedStudentIds.size : selectedTeacherIds.size) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                  {targetType === 'students' ? selectedStudentIds.size : selectedTeacherIds.size}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Specific Students Checklist UI */}
        {targetType === 'students' && mode === 'specific' && (
          <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02]">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student by name, roll no..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              {uniqueClasses.length > 1 && (
                <select
                  value={studentClassFilter}
                  onChange={(e) => setStudentClassFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-card text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="all">All Classes</option>
                  {uniqueClasses.map((cls) => (
                    <option key={cls} value={cls}>Class {cls}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={handleToggleSelectAllStudents}
                disabled={filteredStudents.length === 0}
                className="font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                {isAllFilteredStudentsSelected ? 'Deselect All Filtered' : `Select All Filtered (${filteredStudents.length})`}
              </button>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {selectedStudentIds.size} selected
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-card">
              {filteredStudents.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No students found matching your criteria.
                </div>
              ) : (
                filteredStudents.map((s) => {
                  const sId = s.id || s._docId;
                  const isChecked = selectedStudentIds.has(sId);
                  return (
                    <div
                      key={sId}
                      onClick={() => handleToggleStudent(sId)}
                      className={`flex items-center justify-between p-2.5 cursor-pointer text-xs transition-colors ${
                        isChecked
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-rose-500 border-rose-500 text-white'
                              : 'border-slate-300 dark:border-white/20 bg-white dark:bg-white/5'
                          }`}
                        >
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate text-slate-800 dark:text-slate-200">
                            {s.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            Roll: #{s.rollNumber || 'N/A'} {s.email ? `• ${s.email}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0 ml-2">
                        Class {s.class}-{s.section || 'A'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Specific Teachers Checklist UI */}
        {targetType === 'teachers' && mode === 'specific' && (
          <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02]">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search teacher by name, subject, email..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={handleToggleSelectAllTeachers}
                disabled={filteredTeachers.length === 0}
                className="font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                {isAllFilteredTeachersSelected ? 'Deselect All Filtered' : `Select All Filtered (${filteredTeachers.length})`}
              </button>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {selectedTeacherIds.size} selected
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-card">
              {filteredTeachers.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No teachers found matching your criteria.
                </div>
              ) : (
                filteredTeachers.map((t) => {
                  const tId = t.id || t._docId;
                  const isChecked = selectedTeacherIds.has(tId);
                  return (
                    <div
                      key={tId}
                      onClick={() => handleToggleTeacher(tId)}
                      className={`flex items-center justify-between p-2.5 cursor-pointer text-xs transition-colors ${
                        isChecked
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-rose-500 border-rose-500 text-white'
                              : 'border-slate-300 dark:border-white/20 bg-white dark:bg-white/5'
                          }`}
                        >
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate text-slate-800 dark:text-slate-200">
                            {t.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {t.email || t.contact || 'No email'} {t.subject ? `• ${t.subject}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0 ml-2">
                        Class {t.class}-{t.section || 'All'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-300 text-xs flex items-start gap-2.5">
          <Trash2 size={16} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-600 dark:text-red-200">Warning: Permanent Deletion</p>
            <p className="leading-relaxed">
              {warningText}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          This action cannot be undone. Are you sure you want to proceed?
        </p>

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} disabled={isDeleting} className="btn-secondary cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isActionDisabled}
            className="btn-danger flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 size={14} />
            {isDeleting ? 'Deleting...' : actionButtonLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function TeacherList() {
  const {
    teachers,
    deleteTeacher,
    deleteAllTeachers,
    deleteMultipleTeachers,
    deleteMultipleStudents,
    deleteClass,
    addToast,
    students,
    saveTeachers,
    refreshTeachers,
    recentlyUpdatedTeacherId,
  } = useApp();
  const { user, activeCollegeId } = useAuth();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [viewTeacher, setViewTeacher] = useState(null);
  const [slipTeacher, setSlipTeacher] = useState(null);
  const [activeMenuTeacher, setActiveMenuTeacher] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleToggleMenu = (e, teacher) => {
    e.stopPropagation();
    if (activeMenuTeacher?.id === teacher.id) {
      setActiveMenuTeacher(null);
      setMenuPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const fitsBelow = rect.bottom + 210 <= window.innerHeight;
      setActiveMenuTeacher(teacher);
      setMenuPosition({
        top: fitsBelow ? rect.bottom + 6 : Math.max(10, rect.top - 210),
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
  };

  useEffect(() => {
    const handleScrollOrResize = () => {
      if (activeMenuTeacher) {
        setActiveMenuTeacher(null);
        setMenuPosition(null);
      }
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activeMenuTeacher]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshTeachers) {
        await refreshTeachers();
      }
      addToast('Teacher data refreshed live from cloud.', 'success');
    } catch {
      addToast('Could not refresh teachers. Please check connection.', 'error');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Auto-fetch teachers if empty on mount without waiting for full page reload
  useEffect(() => {
    if (teachers.length === 0 && refreshTeachers) {
      refreshTeachers();
    }
  }, [teachers.length, refreshTeachers]);

  const filtered = useMemo(() => {
    let list = teachers || [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        String(t.name || '').toLowerCase().includes(q) ||
        String(t.email || '').toLowerCase().includes(q) ||
        String(t.subject || '').toLowerCase().includes(q) ||
        String(t.contact || '').includes(q)
      );
    }
    if (classFilter !== 'all') list = list.filter(t => String(t.class) === String(classFilter));
    if (sectionFilter !== 'all') list = list.filter(t => String(t.section || '').toUpperCase() === String(sectionFilter).toUpperCase());
    return [...list].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [teachers, search, classFilter, sectionFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTeacher(deleteTarget.id || deleteTarget._docId);
      addToast(`Teacher ${deleteTarget.name} has been removed.`, 'info');
    } catch (err) {
      console.error('Failed to delete teacher:', err);
      addToast('Failed to delete teacher. Please try again.', 'error');
    }
    setDeleteTarget(null);
  };

  const handleDeleteAll = async (payload) => {
    const targetType = typeof payload === 'object' ? payload.targetType : payload;
    const mode = typeof payload === 'object' ? payload.mode : 'all';
    const selectedIds = typeof payload === 'object' ? payload.selectedIds : [];

    setIsDeletingAll(true);
    try {
      if (targetType === 'teachers') {
        if (mode === 'specific' && selectedIds && selectedIds.length > 0) {
          if (deleteMultipleTeachers) await deleteMultipleTeachers(selectedIds);
          addToast(`${selectedIds.length} teacher${selectedIds.length === 1 ? '' : 's'} removed successfully.`, 'info');
        } else {
          if (deleteAllTeachers) await deleteAllTeachers();
          addToast('All teachers have been removed successfully.', 'info');
        }
      } else if (targetType === 'students') {
        if (mode === 'specific' && selectedIds && selectedIds.length > 0) {
          if (deleteMultipleStudents) await deleteMultipleStudents(selectedIds);
          addToast(`${selectedIds.length} student${selectedIds.length === 1 ? '' : 's'} removed successfully.`, 'info');
        } else {
          if (deleteClass) await deleteClass('all');
          addToast('All students and attendance records have been removed successfully.', 'info');
        }
      } else if (targetType === 'both') {
        const promises = [];
        if (deleteAllTeachers) promises.push(deleteAllTeachers());
        if (deleteClass) promises.push(deleteClass('all'));
        await Promise.all(promises);
        addToast('All teachers and students have been removed successfully.', 'info');
      }
      setDeleteAllOpen(false);
    } catch (err) {
      console.error('Failed to delete records:', err);
      addToast('Failed to delete selected records. Please try again.', 'error');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleExportCSV = () => {
    const data = filtered.map(t => ({
      'Teacher ID': t.id,
      'Name': t.name,
      'Email': t.email,
      'Class': t.class,
      'Division / Section': t.section,
      'Subject': t.subject || 'N/A',
      'Contact': t.contact || 'N/A',
      'Status': t.status || 'active',
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teachers.csv';
    a.click();
    URL.revokeObjectURL(url);
    addToast('Teachers list exported as CSV.', 'success');
  };

  const handleImportExcel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          addToast('The uploaded sheet is empty.', 'error');
          return;
        }

        // Helper to find a value by checking multiple potential column headers
        const getVal = (row, keys) => {
          for (const k of keys) {
            if (row[k] !== undefined && String(row[k]).trim() !== '') {
              return String(row[k]).trim();
            }
            const matchedKey = Object.keys(row).find(
              rk => rk.trim().toLowerCase() === k.toLowerCase()
            );
            if (matchedKey && row[matchedKey] !== undefined && String(row[matchedKey]).trim() !== '') {
              return String(row[matchedKey]).trim();
            }
          }
          return '';
        };

        const existingEmails = new Set(
          teachers.map(t => (t.email || '').trim().toLowerCase())
        );

        const newTeachers = [];
        let duplicateCount = 0;

        jsonData.forEach((row, idx) => {
          const name = getVal(row, ['Name', 'Teacher Name', 'Full Name', 'Faculty Name', 'Teacher']);
          if (!name) return;

          let email = getVal(row, ['Email', 'Email Address', 'Gmail', 'Mail']);
          if (!email) {
            const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.');
            email = `${cleanName}@school.edu`;
          }

          if (existingEmails.has(email.toLowerCase())) {
            duplicateCount++;
            return;
          }
          existingEmails.add(email.toLowerCase());

          const teacherClass = getVal(row, ['Class', 'Grade', 'Standard']) || '10';
          const section = (getVal(row, ['Section', 'Division', 'Sec']) || 'A').toUpperCase();
          const subject = getVal(row, ['Subject', 'Teaching Subject', 'Course']) || 'General';
          const contact = getVal(row, ['Contact', 'Phone', 'Mobile', 'Mobile Number', 'Phone Number']) || '';
          const status = (getVal(row, ['Status']) || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';

          const effectiveCollege = user?.collegeId || activeCollegeId || 'dps_main';

          newTeachers.push({
            id: `TCH_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
            name,
            email,
            class: teacherClass,
            section,
            subject,
            contact,
            status,
            createdAt: new Date().toISOString(),
            collegeId: effectiveCollege,
            password: getVal(row, ['Password', 'Pass', 'Pin']) || 'teacher123',
          });
        });

        if (newTeachers.length === 0) {
          if (duplicateCount > 0) {
            addToast(`No new teachers imported (${duplicateCount} duplicate email(s) found).`, 'warning');
          } else {
            addToast('No valid teacher records found. Ensure sheet has headers like Name, Email, Class, Section, Subject.', 'error');
          }
          return;
        }

        await saveTeachers([...teachers, ...newTeachers]);
        const msg = duplicateCount > 0
          ? `${newTeachers.length} teachers imported successfully (${duplicateCount} duplicate skipped).`
          : `${newTeachers.length} teachers imported successfully from Excel.`;
        addToast(msg, 'success');
      } catch (err) {
        console.error('Import error:', err);
        addToast('Failed to parse Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-3.5 sm:space-y-6 animate-fade-in">
      {/* ── UNIFIED HEADER: Title & Action Options in One Row ── */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 pb-0.5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate tracking-tight">Teachers</h1>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden xs:inline">Live Sync</span> Active
          </span>
          <span className="hidden md:inline text-xs text-slate-500 dark:text-slate-400 font-medium">
            • {teachers.length} faculty members
          </span>
        </div>

        {/* Action Option Buttons (Adjusted Size, Expandable on Hover) */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Live Refresh */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="group relative inline-flex items-center justify-center h-8 sm:h-8.5 px-2 sm:px-2.5 hover:px-3 rounded-xl bg-white/80 dark:bg-[#111726]/80 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-xs backdrop-blur-xl transition-all duration-300 ease-out cursor-pointer active:scale-95 overflow-hidden disabled:opacity-50"
            title="Live Refresh"
            aria-label="Live Refresh"
          >
            <RefreshCw size={14} className={`flex-shrink-0 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400 group-hover:text-blue-400 transition-colors'}`} />
            <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden text-xs font-semibold">
              {isRefreshing ? 'Refreshing...' : 'Live Refresh'}
            </span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="group relative inline-flex items-center justify-center h-8 sm:h-8.5 px-2 sm:px-2.5 hover:px-3 rounded-xl bg-white/80 dark:bg-[#111726]/80 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-xs backdrop-blur-xl transition-all duration-300 ease-out cursor-pointer active:scale-95 overflow-hidden"
            title="Export CSV"
            aria-label="Export CSV"
          >
            <Download size={14} className="flex-shrink-0 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden text-xs font-semibold">
              Export CSV
            </span>
          </button>

          {/* Import Excel */}
          <label
            className="group relative inline-flex items-center justify-center h-8 sm:h-8.5 px-2 sm:px-2.5 hover:px-3 rounded-xl bg-white/80 dark:bg-[#111726]/80 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-xs backdrop-blur-xl transition-all duration-300 ease-out cursor-pointer active:scale-95 overflow-hidden"
            title="Import Excel"
            aria-label="Import Excel"
          >
            <Upload size={14} className="flex-shrink-0 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden text-xs font-semibold">
              Import Excel
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImportExcel}
            />
          </label>

          {/* Delete All */}
          <button
            type="button"
            onClick={() => setDeleteAllOpen(true)}
            disabled={(teachers?.length || 0) === 0 && (students?.length || 0) === 0}
            className="group relative inline-flex items-center justify-center h-8 sm:h-8.5 px-2 sm:px-2.5 hover:px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 hover:text-rose-300 shadow-xs backdrop-blur-xl transition-all duration-300 ease-out cursor-pointer active:scale-95 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
            title="Delete All"
            aria-label="Delete All"
          >
            <Trash2 size={14} className="flex-shrink-0 text-rose-400" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden text-xs font-semibold">
              Delete All
            </span>
          </button>

          {/* Add Teacher */}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="group relative inline-flex items-center justify-center h-8 sm:h-8.5 px-2 sm:px-2.5 hover:px-3 rounded-xl bg-blue-600 hover:bg-blue-500 border border-blue-400/30 text-white shadow-[0_0_15px_rgba(59,130,246,0.35)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 ease-out cursor-pointer active:scale-95 overflow-hidden"
            title="Add Teacher"
            aria-label="Add Teacher"
          >
            <Plus size={14} className="flex-shrink-0 text-white" />
            <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-out whitespace-nowrap overflow-hidden text-xs font-semibold">
              Add Teacher
            </span>
          </button>
        </div>
      </div>

      {/* Filters: Search Bar & Class / Section Filters */}
      <div className="rounded-2xl bg-white dark:bg-[#0B0F1A]/80 border border-slate-200/80 dark:border-white/10 p-2 sm:p-3 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.3)] relative z-30">
        <div className="flex items-center gap-1.5 sm:gap-2.5 w-full">
          {/* Search Bar - fills available space */}
          <div className="flex-1 min-w-0 relative">
            <Search size={15} className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-8 sm:pl-10 py-2 sm:py-2.5 text-xs sm:text-sm w-full truncate"
            />
          </div>

          {/* Dropdown Selectors - compact, content-fitting */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <CustomSelect
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="input-field w-auto py-2 sm:py-2.5 px-2.5 sm:px-3.5 text-xs sm:text-sm whitespace-nowrap"
            >
              <option value="all">Classes</option>
              {Array.from(new Set([...(students || []).map(s => s.class), '8', '9', '10'])).sort((a,b)=>a.localeCompare(b, undefined, {numeric: true})).map(c => <option key={c} value={c}>Class {c}</option>)}
            </CustomSelect>

            <CustomSelect
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              className="input-field w-auto py-2 sm:py-2.5 px-2.5 sm:px-3.5 text-xs sm:text-sm whitespace-nowrap"
              align="right"
            >
              <option value="all">Section</option>
              {Array.from(new Set([...(students || []).map(s => s.section), 'A', 'B'])).sort().map(s => <option key={s} value={s}>Section {s}</option>)}
            </CustomSelect>
          </div>
        </div>
      </div>

      {/* Desktop Table (hidden on mobile, visible on md+) */}
      <div className="hidden md:block rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#111726]/80 border-b border-slate-100 dark:border-white/10">
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Teacher</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Class & Division</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 hidden md:table-cell">Subject</th>
                <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Status</th>
                <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
                    No teachers found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map(teacher => {
                  const isRecentlyUpdated = recentlyUpdatedTeacherId === teacher.id;

                  return (
                    <tr
                      key={teacher.id}
                      className={`border-b border-slate-100 dark:border-white/[0.06] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all duration-300 ${
                        isRecentlyUpdated
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/[0.12] ring-1 ring-emerald-500/30'
                          : ''
                      }`}
                    >
                      {/* Teacher name + initials avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-xs"
                            style={{ background: `hsl(${(teacher.name.charCodeAt(0) * 53) % 360}, 65%, 48%)` }}
                          >
                            {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{teacher.name}</p>
                              {isRecentlyUpdated && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse whitespace-nowrap">
                                  Updated!
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">{teacher.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Mail size={13} className="text-slate-500 flex-shrink-0" />
                          <span className="break-all">{teacher.email}</span>
                        </div>
                      </td>

                      {/* Class & Division badge */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Class {teacher.class}-{teacher.section}
                        </span>
                      </td>

                      {/* Subject */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {teacher.subject || 'General'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      </td>

                      {/* Actions - Three-Dots Button */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleMenu(e, teacher)}
                          className={`w-8 h-8 rounded-full inline-flex items-center justify-center transition-all cursor-pointer ${
                            activeMenuTeacher?.id === teacher.id
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/40'
                              : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title="Options"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Showing {filtered.length} of {teachers.length} teachers</span>
          <span>Only School Admin has permission to add or modify teachers</span>
        </div>
      </div>

      {/* Mobile Teacher Cards (visible on < md, zero horizontal scroll) */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
            No teachers found matching your filters.
          </div>
        ) : (
          filtered.map(teacher => {
            const isRecentlyUpdated = recentlyUpdatedTeacherId === teacher.id;

            return (
              <div
                key={teacher.id}
                className={`rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 p-3 sm:p-4 shadow-sm dark:shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl relative transition-all ${
                  isRecentlyUpdated ? 'ring-2 ring-emerald-500/50 bg-emerald-500/[0.04]' : ''
                }`}
              >
                {/* Single compact row: Avatar + Name + ID on left, Active Badge + 3-dots Menu on right */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-xs"
                      style={{ background: `hsl(${(teacher.name.charCodeAt(0) * 53) % 360}, 65%, 48%)` }}
                    >
                      {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{teacher.name}</p>
                        {isRecentlyUpdated && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 animate-pulse">
                            Updated!
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">{teacher.id}</p>
                    </div>
                  </div>

                  {/* Right side: Status Badge + 3-dots Kebab Menu */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>

                    {/* Kebab 3-dots menu button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleMenu(e, teacher)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        activeMenuTeacher?.id === teacher.id
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/40'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Options"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div className="px-2 py-2 text-center text-xs text-slate-500 dark:text-slate-400">
          Showing {filtered.length} of {teachers.length} teachers
        </div>
      </div>

      {/* Floating 3-dots Dropdown Menu (Fixed coordinates to prevent table overflow clipping) */}
      {activeMenuTeacher && menuPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setActiveMenuTeacher(null);
              setMenuPosition(null);
            }}
          />
          <div
            style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
            className="fixed w-52 bg-white dark:bg-[#111726] border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl py-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-white/[0.08] mb-1">
              <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                {activeMenuTeacher.name}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                Class {activeMenuTeacher.class}-{activeMenuTeacher.section} • {activeMenuTeacher.subject || 'All Subjects'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const t = activeMenuTeacher;
                setActiveMenuTeacher(null);
                setMenuPosition(null);
                setSlipTeacher(t);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Key size={14} className="text-emerald-500 dark:text-emerald-400" />
              <span>Credentials Slip</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const t = activeMenuTeacher;
                setActiveMenuTeacher(null);
                setMenuPosition(null);
                setViewTeacher(t);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-500/10 hover:text-blue-500 dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Eye size={14} className="text-blue-500 dark:text-blue-400" />
              <span>View Details</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const t = activeMenuTeacher;
                setActiveMenuTeacher(null);
                setMenuPosition(null);
                const fresh = (teachers || []).find(
                  x => (x.id && (x.id === t.id || x._docId === t.id)) || (x.email && x.email === t.email)
                ) || t;
                setEditTeacher(fresh);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Edit2 size={14} className="text-amber-500 dark:text-amber-400" />
              <span>Edit Details</span>
            </button>
            <div className="my-1 border-t border-slate-100 dark:border-white/[0.08]" />
            <button
              type="button"
              onClick={() => {
                const t = activeMenuTeacher;
                setActiveMenuTeacher(null);
                setMenuPosition(null);
                setDeleteTarget(t);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Trash2 size={14} className="text-rose-500 dark:text-rose-400" />
              <span>Delete Teacher</span>
            </button>
          </div>
        </>
      )}

      <ConfirmDeleteTeacherModal
        open={!!deleteTarget}
        teacher={deleteTarget}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <AddEditTeacherModal
        open={addOpen || !!editTeacher}
        teacher={
          editTeacher
            ? (teachers || []).find(
                t =>
                  (t.id && (t.id === editTeacher.id || t._docId === editTeacher.id)) ||
                  (t.email && t.email === editTeacher.email)
              ) || editTeacher
            : null
        }
        onClose={() => {
          setAddOpen(false);
          setEditTeacher(null);
        }}
      />

      <TeacherProfileModal
        open={!!viewTeacher}
        teacher={
          viewTeacher
            ? (teachers || []).find(
                t =>
                  (t.id && (t.id === viewTeacher.id || t._docId === viewTeacher.id)) ||
                  (t.email && t.email === viewTeacher.email)
              ) || viewTeacher
            : null
        }
        onClose={() => setViewTeacher(null)}
        onEdit={(t) => setEditTeacher(t)}
      />

      <TeacherCredentialSlipModal
        open={!!slipTeacher}
        teacher={
          slipTeacher
            ? (teachers || []).find(
                t =>
                  (t.id && (t.id === slipTeacher.id || t._docId === slipTeacher.id)) ||
                  (t.email && t.email === slipTeacher.email)
              ) || slipTeacher
            : null
        }
        onClose={() => setSlipTeacher(null)}
      />

      <DeleteAllSelectorModal
        open={deleteAllOpen}
        teachers={teachers || []}
        students={students || []}
        onConfirm={handleDeleteAll}
        onClose={() => !isDeletingAll && setDeleteAllOpen(false)}
        isDeleting={isDeletingAll}
      />
    </div>
  );
}
