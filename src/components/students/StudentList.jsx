import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Download, Upload, MoreVertical, Key, Sparkles, RefreshCw, CheckSquare, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { calcStudentAttendancePercentage } from '../../utils/attendanceCalc';
import Modal from '../ui/Modal';
import CustomSelect from '../ui/CustomSelect';
import StudentProfileModal from './StudentProfileModal';
import AddEditStudentModal from './AddEditStudentModal';
import CredentialSlipModal from './CredentialSlipModal';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

function ConfirmDeleteModal({ open, student, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Student">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete{' '}
          <span className="font-bold text-slate-900 dark:text-white">{student?.name}</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className="btn-danger">Delete Student</button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmDeleteSelectedModal({ open, selectedStudents, onConfirm, onClose, isDeleting }) {
  return (
    <Modal open={open} onClose={onClose} title={`Delete ${selectedStudents.length} Selected Students`} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-300 text-xs flex items-start gap-2.5">
          <Trash2 size={16} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-600 dark:text-red-200">Warning: Permanent Deletion</p>
            <p className="leading-relaxed">
              This will permanently delete the <strong>{selectedStudents.length} selected students</strong> and their attendance records. Their login credentials will also be revoked.
            </p>
          </div>
        </div>

        <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
          {selectedStudents.map((s) => (
            <div key={s.id || s._docId} className="p-2.5 flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{s.name}</p>
                <p className="text-[10px] text-slate-400">Class {s.class}-{s.section} · Roll #{s.rollNumber}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                #{s.rollNumber}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          This action cannot be undone. Are you sure you want to proceed?
        </p>

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} disabled={isDeleting} className="btn-secondary cursor-pointer">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting || selectedStudents.length === 0}
            className="btn-danger flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={14} />
            {isDeleting ? 'Deleting...' : `Delete ${selectedStudents.length} Students`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteClassModal({ open, selectedClass, availableClasses, students, onConfirm, onClose }) {
  const [target, setTarget] = useState(selectedClass || 'all');

  useEffect(() => {
    if (open) {
      if (selectedClass && selectedClass !== 'all' && availableClasses.includes(selectedClass)) {
        setTarget(selectedClass);
      } else if (availableClasses.length > 0) {
        setTarget(availableClasses[0]);
      } else {
        setTarget('all');
      }
    }
  }, [open, selectedClass, availableClasses]);

  const targetCount = useMemo(() => {
    if (target === 'all') return students.length;
    return students.filter(s => String(s.class) === String(target)).length;
  }, [target, students]);

  const isAll = target === 'all';

  return (
    <Modal open={open} onClose={onClose} title={isAll ? "Delete All Classes & Students" : `Delete Class ${target}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Class to Delete:
          </label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="input-field w-full bg-slate-50 dark:bg-[#111726] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
          >
            {availableClasses.map(c => {
              const count = students.filter(s => String(s.class) === String(c)).length;
              return (
                <option key={c} value={c}>
                  Class {c} ({count} {count === 1 ? 'student' : 'students'})
                </option>
              );
            })}
            <option value="all">
              ⚠️ All Classes ({students.length} total students)
            </option>
          </select>
        </div>

        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-300 text-xs flex items-start gap-2.5">
          <Trash2 size={16} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-600 dark:text-red-200">Warning: Permanent Deletion</p>
            <p className="leading-relaxed">
              {isAll ? (
                <>This will permanently delete <strong>all {targetCount} students</strong> across all classes and remove all their attendance records.</>
              ) : (
                <>This will automatically delete <strong>Class {target}</strong> and all <strong>{targetCount} enrolled students</strong>, including their attendance records.</>
              )}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          This action cannot be undone. Are you sure you want to proceed?
        </p>

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => onConfirm(target)}
            disabled={targetCount === 0}
            className="btn-danger flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 size={14} />
            {isAll ? `Delete All Students (${targetCount})` : `Delete Class ${target} (${targetCount})`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function StudentList() {
  const { students, saveStudents, deleteStudent, deleteMultipleStudents, deleteClass, attendanceRecords, addToast, refreshStudents, recentlyUpdatedStudentId } = useApp();
  const { role, user, activeCollegeId } = useAuth();
  const isTeacher = role === 'teacher';
  const teacherClass = isTeacher && user?.class ? String(user.class) : null;
  const teacherSection = isTeacher && user?.section ? String(user.section).toUpperCase() : null;

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState(() => (teacherClass || 'all'));
  const [sectionFilter, setSectionFilter] = useState(() => (teacherSection || 'all'));
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [deleteSelectedModalOpen, setDeleteSelectedModalOpen] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [deleteClassModalOpen, setDeleteClassModalOpen] = useState(false);
  const [profileStudent, setProfileStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [slipStudent, setSlipStudent] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [activeMenuStudent, setActiveMenuStudent] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleToggleMenu = (e, student) => {
    e.stopPropagation();
    if (activeMenuStudent?.id === student.id) {
      setActiveMenuStudent(null);
      setMenuPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const fitsBelow = rect.bottom + 210 <= window.innerHeight;
      setActiveMenuStudent(student);
      setMenuPosition({
        top: fitsBelow ? rect.bottom + 6 : Math.max(10, rect.top - 210),
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
  };

  useEffect(() => {
    const handleScrollOrResize = () => {
      if (activeMenuStudent) {
        setActiveMenuStudent(null);
        setMenuPosition(null);
      }
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activeMenuStudent]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshStudents) {
        await refreshStudents();
      }
      addToast('Student data refreshed live from cloud.', 'success');
    } catch {
      addToast('Could not refresh students. Please check connection.', 'error');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Auto-fetch students if empty on mount without waiting for full page reload
  useEffect(() => {
    if (students.length === 0 && refreshStudents) {
      refreshStudents();
    }
  }, [students.length, refreshStudents]);

  // On initial mount, default teacher's filter to their assigned class once
  const initialTeacherFilterSet = useRef(false);
  useEffect(() => {
    if (isTeacher && !initialTeacherFilterSet.current) {
      initialTeacherFilterSet.current = true;
      if (teacherClass) setClassFilter(teacherClass);
      if (teacherSection) setSectionFilter(teacherSection);
    }
  }, [isTeacher, teacherClass, teacherSection]);

  const availableClasses = useMemo(() => {
    const set = new Set(students.map(s => s.class).filter(Boolean));
    if (teacherClass) set.add(teacherClass);
    ['8', '9', '10'].forEach(c => set.add(c));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students, teacherClass]);

  const availableSections = useMemo(() => {
    const set = new Set(students.map(s => s.section).filter(Boolean));
    if (teacherSection) set.add(teacherSection);
    ['A', 'B'].forEach(s => set.add(s));
    return Array.from(set).sort();
  }, [students, teacherSection]);

  const filtered = useMemo(() => {
    let list = students;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        String(s.name || '').toLowerCase().includes(q) ||
        String(s.rollNumber || '').includes(q) ||
        String(s.parentName || '').toLowerCase().includes(q)
      );
    }
    if (classFilter !== 'all') list = list.filter(s => String(s.class) === String(classFilter));
    if (sectionFilter !== 'all') list = list.filter(s => String(s.section).toUpperCase() === String(sectionFilter).toUpperCase());
    return [...list].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [students, search, classFilter, sectionFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteStudent(deleteTarget.id || deleteTarget._docId);
    addToast(`${deleteTarget.name} has been removed.`, 'info');
    setDeleteTarget(null);
  };

  const handleConfirmDeleteClass = async (targetClass) => {
    const count = await deleteClass(targetClass);
    if (targetClass === 'all') {
      addToast(`All classes and ${count} students have been deleted.`, 'info');
      setClassFilter('all');
    } else {
      addToast(`Class ${targetClass} and ${count} students have been deleted.`, 'info');
      if (classFilter === targetClass) {
        setClassFilter('all');
      }
    }
    setDeleteClassModalOpen(false);
  };

  const isAllSelected = !isTeacher && filtered.length > 0 && filtered.every(s => selectedStudentIds.includes(s.id || s._docId));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredIds = new Set(filtered.map(s => s.id || s._docId));
      setSelectedStudentIds(prev => prev.filter(id => !filteredIds.has(id)));
    } else {
      const allIds = new Set([...selectedStudentIds, ...filtered.map(s => s.id || s._docId)]);
      setSelectedStudentIds(Array.from(allIds));
    }
  };

  const handleToggleSelectStudent = (id) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectedStudentsObjects = useMemo(() => {
    const set = new Set(selectedStudentIds);
    return students.filter(s => set.has(s.id) || set.has(s._docId));
  }, [students, selectedStudentIds]);

  const handleDeleteSelected = async () => {
    setIsDeletingSelected(true);
    try {
      if (deleteMultipleStudents) {
        await deleteMultipleStudents(selectedStudentIds);
      }
      addToast(`${selectedStudentIds.length} students deleted successfully.`, 'info');
      setSelectedStudentIds([]);
      setIsDeleteMode(false);
      setDeleteSelectedModalOpen(false);
    } catch (err) {
      console.error('Failed to delete selected students:', err);
      addToast('Failed to delete selected students.', 'error');
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const handleExportCSV = () => {
    const data = filtered.map(s => ({
      'Roll No': s.rollNumber,
      'Name': s.name,
      'Class': s.class,
      'Section': s.section,
      'Parent': s.parentName,
      'Contact': s.contact,
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students.csv'; a.click();
    URL.revokeObjectURL(url);
    addToast('Student list exported as CSV.', 'success');
  };

  const handleImportSheet = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rows || rows.length === 0) {
          addToast('The uploaded sheet is empty.', 'error');
          return;
        }

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

        const effectiveCollege = user?.collegeId || activeCollegeId || 'dps_main';
        const defaultClass = isTeacher && teacherClass ? teacherClass : (classFilter !== 'all' ? classFilter : '8');
        const defaultSec = isTeacher && teacherSection ? teacherSection : (sectionFilter !== 'all' ? sectionFilter : 'A');

        const newStudents = rows
          .map((row, i) => {
            const name = getVal(row, ['Name', 'Student Name', 'Full Name']);
            if (!name) return null;
            return {
              id: `STU_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
              rollNumber: getVal(row, ['Roll No', 'Roll Number', 'RollNo', 'Roll']) || String(i + 1).padStart(2, '0'),
              name,
              class: getVal(row, ['Class', 'Grade', 'Standard']) || defaultClass,
              section: (getVal(row, ['Section', 'Division', 'Sec']) || defaultSec).toUpperCase(),
              parentName: getVal(row, ['Parent', 'Parent Name', 'Father Name', 'Guardian']) || '',
              contact: getVal(row, ['Contact', 'Phone', 'Mobile', 'Mobile Number']) || '',
              email: getVal(row, ['Email', 'Email Address', 'Gmail']) || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@school.edu`,
              status: 'active',
              password: getVal(row, ['Password', 'Pass', 'Pin']) || '1234',
              collegeId: effectiveCollege,
              createdAt: new Date().toISOString(),
            };
          })
          .filter(Boolean);

        if (newStudents.length === 0) {
          addToast('No valid student rows found in the sheet.', 'error');
          return;
        }

        await saveStudents([...students, ...newStudents]);
        addToast(`${newStudents.length} students imported successfully.`, 'success');
      } catch (err) {
        console.error('Import error:', err);
        addToast('Failed to parse sheet. Please ensure it is a valid .xlsx, .xls, or .csv file.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const liveProfileStudent = useMemo(() => {
    if (!profileStudent) return null;
    return (students || []).find(s => (s.id && (s.id === profileStudent.id || s._docId === profileStudent.id)) || (s.rollNumber && s.rollNumber === profileStudent.rollNumber)) || profileStudent;
  }, [profileStudent, students]);

  const liveEditStudent = useMemo(() => {
    if (!editStudent) return null;
    return (students || []).find(s => (s.id && (s.id === editStudent.id || s._docId === editStudent.id)) || (s.rollNumber && s.rollNumber === editStudent.rollNumber)) || editStudent;
  }, [editStudent, students]);

  const liveSlipStudent = useMemo(() => {
    if (!slipStudent) return null;
    return (students || []).find(s => (s.id && (s.id === slipStudent.id || s._docId === slipStudent.id)) || (s.rollNumber && s.rollNumber === slipStudent.rollNumber)) || slipStudent;
  }, [slipStudent, students]);

  return (
    <div className={`max-w-7xl mx-auto space-y-5 animate-fade-in ${!isTeacher && isDeleteMode ? "pb-24 sm:pb-28" : ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {isTeacher ? 'My Students' : 'Students'}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync Active
            </span>
            {isTeacher && teacherClass && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                Assigned: Class {teacherClass}-{teacherSection}
              </span>
            )}
            {isTeacher && classFilter === 'all' && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Viewing All Classes
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Showing {filtered.length} of {students.length} students enrolled in college
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="btn-secondary flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            title="Refresh student data live from cloud"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-400' : ''} />
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Live Refresh'}</span>
          </button>
          <label className="btn-secondary cursor-pointer">
            <Upload size={15} />
            <span className="hidden sm:inline">Import Sheet</span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportSheet} />
          </label>
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={15} />
            <span className="hidden sm:inline">Export</span>
          </button>
          {!isTeacher && (
            <button
              type="button"
              onClick={() => {
                if (isDeleteMode) {
                  setIsDeleteMode(false);
                  setSelectedStudentIds([]);
                } else {
                  setIsDeleteMode(true);
                }
              }}
              className={`btn-secondary cursor-pointer transition-all ${
                isDeleteMode
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-sm shadow-rose-500/20 ring-1 ring-rose-500/30 font-semibold'
                  : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/20'
              }`}
              title={isDeleteMode ? 'Cancel delete mode' : 'Select and delete specific students'}
              aria-label={isDeleteMode ? 'Cancel delete mode' : 'Delete students'}
            >
              {isDeleteMode ? <X size={15} /> : <Trash2 size={15} />}
            </button>
          )}
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            <Plus size={15} /> {isTeacher ? 'Enroll Student' : 'Add Student'}
          </button>
        </div>
      </div>

      {/* Quick Class Switcher for Teachers */}
      {isTeacher && teacherClass && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => { setClassFilter(teacherClass); setSectionFilter(teacherSection || 'all'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              classFilter === teacherClass
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-[#111726] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:text-white'
            }`}
          >
            ★ My Class ({teacherClass}-{teacherSection}) (
            {students.filter(s => String(s.class) === String(teacherClass)).length})
          </button>
          <button
            type="button"
            onClick={() => { setClassFilter('all'); setSectionFilter('all'); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              classFilter === 'all'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                : 'bg-white dark:bg-[#111726] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:text-white'
            }`}
          >
            All College Students ({students.length})
          </button>
        </div>
      )}

      {/* Helper Banner for Teacher if their assigned class has 0 students while other classes have students */}
      {isTeacher && classFilter === teacherClass && filtered.length === 0 && students.length > 0 && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="font-semibold text-white">
                No students currently enrolled in your assigned Class {teacherClass}-{teacherSection}.
              </p>
              <p className="text-slate-400 mt-0.5">
                There {students.length === 1 ? 'is 1 student' : `are ${students.length} students`} enrolled in other college classes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { setClassFilter('all'); setSectionFilter('all'); }}
              className="btn-primary text-xs py-1.5 px-3.5 flex-1 sm:flex-none justify-center cursor-pointer whitespace-nowrap"
            >
              View All Students ({students.length})
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 p-3.5 sm:p-4 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.3)] relative z-30">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, roll number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <CustomSelect
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="input-field w-full sm:w-auto"
            >
              <option value="all">All Classes ({students.length})</option>
              {availableClasses.map(c => {
                const count = students.filter(s => String(s.class) === String(c)).length;
                return (
                  <option key={c} value={c}>
                    Class {c} ({count}) {isTeacher && c === teacherClass ? '★ (My Class)' : ''}
                  </option>
                );
              })}
            </CustomSelect>
            <CustomSelect
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              className="input-field w-full sm:w-auto"
            >
              <option value="all">All Sections</option>
              {availableSections.map(s => <option key={s} value={s}>Section {s}</option>)}
            </CustomSelect>
          </div>
          {!isTeacher && classFilter !== 'all' && (
            <button
              onClick={() => setDeleteClassModalOpen(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              title={`Delete Class ${classFilter} and all its students`}
            >
              <Trash2 size={13} />
              <span>Delete Class {classFilter}</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Bottom Bulk Selection Action Dock (Apple-style) */}
      {!isTeacher && isDeleteMode && (
        <div className="fixed bottom-4 sm:bottom-6 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl z-50 p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-[#0B0F1A]/92 border border-rose-500/35 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(244,63,94,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-3xl animate-slide-up flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5 truncate">
              <CheckSquare size={16} className="text-rose-400 flex-shrink-0" />
              {selectedStudentIds.length === 0
                ? 'Select students to delete'
                : `${selectedStudentIds.length} ${selectedStudentIds.length === 1 ? 'student' : 'students'} selected`}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-xs text-rose-300 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer select-none"
            >
              {isAllSelected ? 'Deselect All' : `Select All (${filtered.length})`}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDeleteMode(false);
                setSelectedStudentIds([]);
              }}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer select-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setDeleteSelectedModalOpen(true)}
              disabled={selectedStudentIds.length === 0}
              className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed select-none"
            >
              <Trash2 size={13} />
              Delete ({selectedStudentIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table (hidden on mobile, visible on md+) */}
      <div className="hidden md:block rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#111726]/80 border-b border-slate-100 dark:border-white/10">
                {!isTeacher && isDeleteMode && (
                  <th className="w-10 px-4 py-3 text-center animate-fade-in">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-brand-blue focus:ring-brand-blue/30 cursor-pointer accent-blue-500"
                      title={isAllSelected ? "Deselect all" : "Select all"}
                    />
                  </th>
                )}
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Roll No</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Student</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 hidden md:table-cell">Class</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 hidden lg:table-cell">Parent</th>
                <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Attendance</th>
                <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={!isTeacher && isDeleteMode ? 7 : 6} className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map(student => {
                  const sId = student.id || student._docId;
                  const isSelected = selectedStudentIds.includes(sId);
                  const isRecentlyUpdated = recentlyUpdatedStudentId && (
                    recentlyUpdatedStudentId === student.id ||
                    recentlyUpdatedStudentId === student._docId ||
                    recentlyUpdatedStudentId === String(student.rollNumber).toLowerCase()
                  );
                  const stats = calcStudentAttendancePercentage(student, attendanceRecords);
                  const pct = stats.percentage;
                  const pctClass = pct >= 85 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : pct >= 75 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30';
                  return (
                    <tr
                      key={student.id}
                      onClick={!isTeacher && isDeleteMode ? () => handleToggleSelectStudent(sId) : undefined}
                      className={`border-b border-slate-100 dark:border-white/[0.06] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all ${
                        !isTeacher && isDeleteMode ? 'cursor-pointer' : ''
                      } ${
                        isSelected ? 'bg-blue-500/[0.07] dark:bg-blue-500/[0.12]' : ''
                      } ${
                        isRecentlyUpdated ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] ring-1 ring-emerald-500/40' : ''
                      }`}
                    >
                      {!isTeacher && isDeleteMode && (
                        <td className="w-10 px-4 py-3 text-center animate-fade-in" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectStudent(sId)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-brand-blue focus:ring-brand-blue/30 cursor-pointer accent-blue-500"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#111726] border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-md">
                          {student.rollNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-xs"
                            style={{ background: `hsl(${(student.rollNumber.charCodeAt(0) * 47) % 360}, 60%, 55%)` }}>
                            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{student.name}</p>
                              {isRecentlyUpdated && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                  Live Synced
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold px-2 py-0.5 rounded-md">
                          {student.class}-{student.section}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-xs text-slate-600 dark:text-slate-300">{student.parentName}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {stats.total > 0 ? (
                          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${pctClass}`}>
                            {pct}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      {/* Actions - Three-Dots Button */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleMenu(e, student)}
                          className={`w-8 h-8 rounded-full inline-flex items-center justify-center transition-all cursor-pointer ${
                            activeMenuStudent?.id === student.id
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
        <div className="px-4 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#111726]/80">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {filtered.length} of {students.length} students
          </p>
        </div>
      </div>

      {/* Mobile Student Cards (visible on < md, zero horizontal scroll) */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
            No students found.
          </div>
        ) : (
          filtered.map(student => {
            const sId = student.id || student._docId;
            const isSelected = selectedStudentIds.includes(sId);
            const isRecentlyUpdated = recentlyUpdatedStudentId && (
              recentlyUpdatedStudentId === student.id ||
              recentlyUpdatedStudentId === student._docId ||
              recentlyUpdatedStudentId === String(student.rollNumber).toLowerCase()
            );
            const stats = calcStudentAttendancePercentage(student, attendanceRecords);
            const pct = stats.percentage;
            const pctClass = pct >= 85 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : pct >= 75 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30';

            return (
              <div
                key={student.id}
                className={`rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 p-3.5 sm:p-4 shadow-sm dark:shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl relative transition-all ${
                  isSelected ? 'ring-2 ring-blue-500/50 bg-blue-500/[0.04]' : ''
                } ${
                  isRecentlyUpdated ? 'ring-2 ring-emerald-500/50 bg-emerald-500/[0.04]' : ''
                }`}
              >
                {/* Header row: Avatar, Name, Roll No, Class-Section, Attendance %, 3-dots Menu */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {!isTeacher && isDeleteMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectStudent(sId)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-brand-blue focus:ring-brand-blue/30 cursor-pointer accent-blue-500 flex-shrink-0 animate-fade-in"
                      />
                    )}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-xs"
                      style={{ background: `hsl(${(student.rollNumber.charCodeAt(0) * 47) % 360}, 60%, 55%)` }}
                    >
                      {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 dark:text-white break-words leading-tight">{student.name}</p>
                        {isRecentlyUpdated && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                            Live Synced
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#111726] border border-slate-200 dark:border-white/10 px-1.5 py-0.5 rounded font-mono">
                          Roll #{student.rollNumber}
                        </span>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold px-1.5 py-0.5 rounded">
                          Class {student.class}-{student.section}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Attendance Badge & 3-dots Kebab Menu */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {stats.total > 0 ? (
                      <span className={`inline-block text-xs font-extrabold px-2.5 py-1 rounded-full border ${pctClass}`}>
                        {pct}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">—</span>
                    )}

                    {/* Kebab 3-dots menu button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleMenu(e, student)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        activeMenuStudent?.id === student.id
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
          Showing {filtered.length} of {students.length} students
        </div>
      </div>

      {/* Floating 3-dots Dropdown Menu (Fixed coordinates to prevent table overflow clipping) */}
      {activeMenuStudent && menuPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setActiveMenuStudent(null);
              setMenuPosition(null);
            }}
          />
          <div
            style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
            className="fixed w-52 bg-white dark:bg-[#111726] border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl py-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-white/[0.08] mb-1">
              <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                {activeMenuStudent.name}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                Roll #{activeMenuStudent.rollNumber} • Class {activeMenuStudent.class}-{activeMenuStudent.section}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const s = activeMenuStudent;
                setActiveMenuStudent(null);
                setMenuPosition(null);
                setSlipStudent(s);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Key size={14} className="text-emerald-500 dark:text-emerald-400" />
              <span>Login Slip</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const s = activeMenuStudent;
                setActiveMenuStudent(null);
                setMenuPosition(null);
                setProfileStudent(s);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-500/10 hover:text-blue-500 dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Eye size={14} className="text-blue-500 dark:text-blue-400" />
              <span>View Profile</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const s = activeMenuStudent;
                setActiveMenuStudent(null);
                setMenuPosition(null);
                const fresh = (students || []).find(
                  x => (x.id && (x.id === s.id || x._docId === s.id)) || (x.rollNumber && x.rollNumber === s.rollNumber)
                ) || s;
                setEditStudent(fresh);
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
                const s = activeMenuStudent;
                setActiveMenuStudent(null);
                setMenuPosition(null);
                setDeleteTarget(s);
              }}
              className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Trash2 size={14} className="text-rose-500 dark:text-rose-400" />
              <span>Delete Student</span>
            </button>
          </div>
        </>
      )}

      <ConfirmDeleteSelectedModal
        open={deleteSelectedModalOpen}
        selectedStudents={selectedStudentsObjects}
        onConfirm={handleDeleteSelected}
        onClose={() => !isDeletingSelected && setDeleteSelectedModalOpen(false)}
        isDeleting={isDeletingSelected}
      />
      <ConfirmDeleteModal
        open={!!deleteTarget}
        student={deleteTarget}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
      <DeleteClassModal
        open={deleteClassModalOpen}
        selectedClass={classFilter}
        availableClasses={availableClasses}
        students={students}
        onConfirm={handleConfirmDeleteClass}
        onClose={() => setDeleteClassModalOpen(false)}
      />
      <StudentProfileModal
        open={!!profileStudent}
        student={liveProfileStudent}
        onClose={() => setProfileStudent(null)}
      />
      <AddEditStudentModal
        open={addOpen || !!editStudent}
        student={liveEditStudent}
        onClose={() => { setAddOpen(false); setEditStudent(null); }}
        onStudentSaved={(savedStudent) => {
          setSlipStudent(savedStudent);
        }}
      />
      <CredentialSlipModal
        open={!!slipStudent}
        student={liveSlipStudent}
        onClose={() => setSlipStudent(null)}
      />
    </div>
  );
}
