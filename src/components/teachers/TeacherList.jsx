import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  GraduationCap,
  Download,
  Upload,
  BookOpen,
  Layers,
  Mail,
  Eye,
  MoreVertical,
  BookMarked,
  Key,
  RefreshCw,
  CheckSquare,
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

function ConfirmDeleteSelectedTeachersModal({ open, count, onConfirm, onClose, isDeleting }) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Selected Teachers" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-300 text-xs flex items-start gap-2.5">
          <Trash2 size={16} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-600 dark:text-red-200">Warning: Permanent Deletion</p>
            <p className="leading-relaxed">
              Are you sure you want to delete <strong>{count} selected {count === 1 ? 'teacher' : 'teachers'}</strong>?
              Their login credentials and portal access will be permanently removed.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          This action cannot be undone. Are you sure you want to proceed?
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} disabled={isDeleting} className="btn-secondary">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={isDeleting || count === 0}
            className="btn-danger flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={14} />
            {isDeleting ? 'Deleting...' : `Delete ${count} ${count === 1 ? 'Teacher' : 'Teachers'}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmDeleteAllTeachersModal({ open, totalCount, onConfirm, onClose, isDeleting }) {
  return (
    <Modal open={open} onClose={onClose} title="Delete All Teachers" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-300 text-xs flex items-start gap-2.5">
          <Trash2 size={18} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-red-600 dark:text-red-200">Danger: Wipe All Faculty Accounts</p>
            <p className="leading-relaxed">
              This will permanently delete <strong>ALL {totalCount} teachers</strong> registered in the institution.
              All teacher logins will be immediately revoked.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Please confirm you want to remove all faculty accounts. This action cannot be reversed.
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} disabled={isDeleting} className="btn-secondary">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={isDeleting || totalCount === 0}
            className="btn-danger flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={14} />
            {isDeleting ? 'Deleting All...' : `Delete All Teachers (${totalCount})`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function TeacherList() {
  const { teachers, deleteTeacher, deleteTeachers, deleteAllTeachers, addToast, students, saveTeachers, refreshTeachers, recentlyUpdatedTeacherId } = useApp();
  const { user, activeCollegeId } = useAuth();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTeacher, setEditTeacher] = useState(null);
  const [viewTeacher, setViewTeacher] = useState(null);
  const [slipTeacher, setSlipTeacher] = useState(null);
  const [activeMenuTeacher, setActiveMenuTeacher] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleSelectTeacher = (id) => {
    setSelectedTeacherIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const filteredIds = filtered.map(t => t.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedTeacherIds.includes(id));
    if (allSelected) {
      setSelectedTeacherIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedTeacherIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedTeacherIds.length === 0) return;
    setIsDeleting(true);
    try {
      const count = await deleteTeachers(selectedTeacherIds);
      addToast(`Successfully deleted ${count} ${count === 1 ? 'teacher' : 'teachers'}.`, 'info');
      setSelectedTeacherIds([]);
      setBulkDeleteModalOpen(false);
    } catch {
      addToast('Failed to delete selected teachers.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const count = await deleteAllTeachers();
      addToast(`All ${count} teachers have been deleted.`, 'info');
      setSelectedTeacherIds([]);
      setDeleteAllModalOpen(false);
    } catch {
      addToast('Failed to delete teachers.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

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
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q) ||
        (t.contact || '').includes(q)
      );
    }
    if (classFilter !== 'all') list = list.filter(t => String(t.class) === classFilter);
    if (sectionFilter !== 'all') list = list.filter(t => t.section.toUpperCase() === sectionFilter.toUpperCase());
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [teachers, search, classFilter, sectionFilter]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteTeacher(deleteTarget.id);
    addToast(`Teacher ${deleteTarget.name} has been removed.`, 'info');
    setDeleteTarget(null);
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
    reader.onload = (evt) => {
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

        saveTeachers([...teachers, ...newTeachers]);
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
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Teachers</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {teachers.length} faculty members assigned across classes • Updates in real-time
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="btn-secondary flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh teacher data live from Firestore"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'} />
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Live Refresh'}</span>
          </button>
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={15} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <label className="btn-secondary cursor-pointer">
            <Upload size={15} />
            <span className="hidden sm:inline">Import Excel</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImportExcel}
            />
          </label>
          <button
            type="button"
            onClick={() => setDeleteAllModalOpen(true)}
            disabled={teachers.length === 0}
            className="btn-secondary text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border-rose-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete all teachers"
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">Delete All</span>
          </button>
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            <Plus size={15} /> Add Teacher
          </button>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedTeacherIds.length > 0 && (
        <div className="rounded-2xl p-3 sm:p-4 bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 animate-slide-up shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
              <CheckSquare size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {selectedTeacherIds.length} {selectedTeacherIds.length === 1 ? 'Teacher' : 'Teachers'} Selected
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-300/80 hidden sm:block">
                Apply bulk actions to selected faculty members
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setSelectedTeacherIds([])}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setBulkDeleteModalOpen(true)}
              className="btn-danger py-1.5 px-3.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Trash2 size={14} />
              Delete Selected ({selectedTeacherIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Summary stats - Responsive 2-col on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {/* Total Teachers */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 p-2.5 sm:p-5 backdrop-blur-xl shadow-xs sm:shadow-[0_4px_25px_rgba(0,0,0,0.3)] flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <GraduationCap size={16} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">{teachers.length}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold truncate mt-0.5">Teachers</p>
          </div>
        </div>

        {/* Classes Assigned */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 p-2.5 sm:p-5 backdrop-blur-xl shadow-xs sm:shadow-[0_4px_25px_rgba(0,0,0,0.3)] flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <BookOpen size={16} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              {new Set(teachers.map(t => t.class)).size}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold truncate mt-0.5">Classes</p>
          </div>
        </div>

        {/* Divisions Covered */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 p-2.5 sm:p-5 backdrop-blur-xl shadow-xs sm:shadow-[0_4px_25px_rgba(0,0,0,0.3)] flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Layers size={16} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              {new Set(teachers.map(t => `${t.class}-${t.section}`)).size}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold truncate mt-0.5">Divisions</p>
          </div>
        </div>

        {/* Subjects Taught */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 p-2.5 sm:p-5 backdrop-blur-xl shadow-xs sm:shadow-[0_4px_25px_rgba(0,0,0,0.3)] flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <BookMarked size={16} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              {new Set(teachers.map(t => t.subject).filter(Boolean)).size}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold truncate mt-0.5">Subjects</p>
          </div>
        </div>
      </div>

      {/* Filters - Compact on mobile with side-by-side selects */}
      <div className="rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 p-2.5 sm:p-4 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.3)] relative z-30">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search teacher by name, email, subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10 py-2 sm:py-2.5 text-xs sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <CustomSelect
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="input-field w-full sm:w-auto py-2 sm:py-2.5 text-xs sm:text-sm"
            >
              <option value="all">All Classes</option>
              {Array.from(new Set([...(students || []).map(s => s.class), '8', '9', '10'])).sort((a,b)=>a.localeCompare(b, undefined, {numeric: true})).map(c => <option key={c} value={c}>Class {c}</option>)}
            </CustomSelect>
            <CustomSelect
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              className="input-field w-full sm:w-auto py-2 sm:py-2.5 text-xs sm:text-sm"
            >
              <option value="all">All Sections</option>
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
                <th className="w-10 px-3.5 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every(t => selectedTeacherIds.includes(t.id))}
                    ref={el => {
                      if (el) {
                        const someSelected = filtered.some(t => selectedTeacherIds.includes(t.id));
                        const allSelected = filtered.length > 0 && filtered.every(t => selectedTeacherIds.includes(t.id));
                        el.indeterminate = someSelected && !allSelected;
                      }
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-purple-600 focus:ring-purple-500/30 cursor-pointer accent-purple-600"
                    title="Select all filtered teachers"
                  />
                </th>
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
                  <td colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
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
                        selectedTeacherIds.includes(teacher.id)
                          ? 'bg-purple-500/[0.08] dark:bg-purple-500/[0.12]'
                          : isRecentlyUpdated
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/[0.12] ring-1 ring-emerald-500/30'
                          : ''
                      }`}
                    >
                      <td className="w-10 px-3.5 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedTeacherIds.includes(teacher.id)}
                          onChange={() => handleToggleSelectTeacher(teacher.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-purple-600 focus:ring-purple-500/30 cursor-pointer accent-purple-600"
                        />
                      </td>
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
                  selectedTeacherIds.includes(teacher.id)
                    ? 'ring-2 ring-purple-500/60 bg-purple-500/[0.06] dark:bg-purple-500/[0.08]'
                    : isRecentlyUpdated
                    ? 'ring-2 ring-emerald-500/50 bg-emerald-500/[0.04]'
                    : ''
                }`}
              >
                {/* Single compact row: Avatar + Name + ID on left, Active Badge + 3-dots Menu on right */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedTeacherIds.includes(teacher.id)}
                      onChange={() => handleToggleSelectTeacher(teacher.id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-purple-600 focus:ring-purple-500/30 cursor-pointer accent-purple-600 flex-shrink-0"
                    />
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

      <ConfirmDeleteSelectedTeachersModal
        open={bulkDeleteModalOpen}
        count={selectedTeacherIds.length}
        onConfirm={handleConfirmBulkDelete}
        onClose={() => setBulkDeleteModalOpen(false)}
        isDeleting={isDeleting}
      />

      <ConfirmDeleteAllTeachersModal
        open={deleteAllModalOpen}
        totalCount={teachers.length}
        onConfirm={handleConfirmDeleteAll}
        onClose={() => setDeleteAllModalOpen(false)}
        isDeleting={isDeleting}
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
    </div>
  );
}
