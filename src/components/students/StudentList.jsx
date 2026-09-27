import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Download, Upload, MoreVertical } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calcStudentAttendancePercentage } from '../../utils/attendanceCalc';
import Modal from '../ui/Modal';
import CustomSelect from '../ui/CustomSelect';
import StudentProfileModal from './StudentProfileModal';
import AddEditStudentModal from './AddEditStudentModal';
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
  const { students, saveStudents, deleteClass, attendanceRecords, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteClassModalOpen, setDeleteClassModalOpen] = useState(false);
  const [profileStudent, setProfileStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [activeMenuStudentId, setActiveMenuStudentId] = useState(null);

  const availableClasses = useMemo(() => {
    const list = Array.from(new Set(students.map(s => s.class).filter(Boolean)));
    if (list.length > 0) {
      return list.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }
    return ['8', '9', '10'];
  }, [students]);

  const filtered = useMemo(() => {
    let list = students;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.includes(q) ||
        (s.parentName || '').toLowerCase().includes(q)
      );
    }
    if (classFilter !== 'all') list = list.filter(s => s.class === classFilter);
    if (sectionFilter !== 'all') list = list.filter(s => s.section === sectionFilter);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [students, search, classFilter, sectionFilter]);

  const handleDelete = () => {
    const updated = students.filter(s => s.id !== deleteTarget.id);
    saveStudents(updated);
    addToast(`${deleteTarget.name} has been removed.`, 'info');
    setDeleteTarget(null);
  };

  const handleConfirmDeleteClass = (targetClass) => {
    const count = deleteClass(targetClass);
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
    reader.onload = (evt) => {
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

        const newStudents = rows
          .map((row, i) => {
            const name = getVal(row, ['Name', 'Student Name', 'Full Name']);
            if (!name) return null;
            return {
              id: `STU${String(Date.now() + i).slice(-6)}`,
              rollNumber: getVal(row, ['Roll No', 'Roll Number', 'RollNo', 'Roll']) || String(i + 1).padStart(2, '0'),
              name,
              class: getVal(row, ['Class', 'Grade']) || '8',
              section: (getVal(row, ['Section', 'Division', 'Sec']) || 'A').toUpperCase(),
              parentName: getVal(row, ['Parent', 'Parent Name', 'Father Name', 'Guardian']) || '',
              contact: getVal(row, ['Contact', 'Phone', 'Mobile', 'Mobile Number']) || '',
              email: getVal(row, ['Email', 'Email Address', 'Gmail']) || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@school.edu`,
              status: 'active',
            };
          })
          .filter(Boolean);

        if (newStudents.length === 0) {
          addToast('No valid student rows found in the sheet.', 'error');
          return;
        }

        saveStudents([...students, ...newStudents]);
        addToast(`${newStudents.length} students imported successfully.`, 'success');
      } catch (err) {
        console.error('Import error:', err);
        addToast('Failed to parse sheet. Please ensure it is a valid .xlsx, .xls, or .csv file.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Students</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {students.length} students across all classes
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="btn-secondary cursor-pointer">
            <Upload size={15} />
            <span className="hidden sm:inline">Import Sheet</span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportSheet} />
          </label>
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={15} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setDeleteClassModalOpen(true)}
            className="btn-secondary text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/20 cursor-pointer"
            title="Delete a class or all classes"
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">Delete Class</span>
          </button>
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            <Plus size={15} /> Add Student
          </button>
        </div>
      </div>

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
              <option value="all">All Classes</option>
              {availableClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
            </CustomSelect>
            <CustomSelect
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              className="input-field w-full sm:w-auto"
            >
              <option value="all">All Sections</option>
              {Array.from(new Set([...students.map(s => s.section), 'A', 'B'])).sort().map(s => <option key={s} value={s}>Section {s}</option>)}
            </CustomSelect>
          </div>
          {classFilter !== 'all' && (
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

      {/* Desktop Table (hidden on mobile, visible on md+) */}
      <div className="hidden md:block rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#111726]/80 border-b border-slate-100 dark:border-white/10">
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Roll No</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Student</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 hidden md:table-cell">Class</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 hidden lg:table-cell">Parent</th>
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 hidden lg:table-cell">Contact</th>
                <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Attendance</th>
                <th className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map(student => {
                  const stats = calcStudentAttendancePercentage(student.id, attendanceRecords);
                  const pct = stats.percentage;
                  const pctClass = pct >= 85 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : pct >= 75 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30';
                  return (
                    <tr key={student.id} className="border-b border-slate-100 dark:border-white/[0.06] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
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
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{student.name}</p>
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
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-xs text-slate-600 dark:text-slate-300">{student.contact}</p>
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
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setProfileStudent(student)}
                            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                            title="View Profile"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setEditStudent(student)}
                            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                            title="Edit Student"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(student)}
                            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Student"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
            const stats = calcStudentAttendancePercentage(student.id, attendanceRecords);
            const pct = stats.percentage;
            const pctClass = pct >= 85 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : pct >= 75 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30';

            return (
              <div
                key={student.id}
                className={`rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-white/10 p-3.5 sm:p-4 shadow-sm dark:shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl relative transition-all ${
                  activeMenuStudentId === student.id ? 'z-30' : 'z-0'
                }`}
              >
                {/* Header row: Avatar, Name, Roll No, Class-Section, Attendance %, 3-dots Menu */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-xs"
                      style={{ background: `hsl(${(student.rollNumber.charCodeAt(0) * 47) % 360}, 60%, 55%)` }}
                    >
                      {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white break-words leading-tight">{student.name}</p>
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
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuStudentId(activeMenuStudentId === student.id ? null : student.id)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          activeMenuStudentId === student.id
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                        }`}
                        title="Options"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuStudentId === student.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveMenuStudentId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-[#111726] border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl py-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuStudentId(null);
                                setProfileStudent(student);
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-500/10 hover:text-blue-500 dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Eye size={14} className="text-blue-500 dark:text-blue-400" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuStudentId(null);
                                setEditStudent(student);
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-500/10 hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Edit2 size={13} className="text-amber-500 dark:text-amber-400" />
                              <span>Edit</span>
                            </button>
                            <div className="my-1 border-t border-slate-100 dark:border-white/[0.08]" />
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuStudentId(null);
                                setDeleteTarget(student);
                              }}
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} className="text-rose-500 dark:text-rose-400" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
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
        student={profileStudent}
        onClose={() => setProfileStudent(null)}
      />
      <AddEditStudentModal
        open={addOpen || !!editStudent}
        student={editStudent}
        onClose={() => { setAddOpen(false); setEditStudent(null); }}
      />
    </div>
  );
}
