import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Download, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calcStudentAttendancePercentage } from '../../utils/attendanceCalc';
import Modal from '../ui/Modal';
import StudentProfileModal from './StudentProfileModal';
import AddEditStudentModal from './AddEditStudentModal';
import Papa from 'papaparse';

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

export default function StudentList() {
  const { students, saveStudents, attendanceRecords, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [profileStudent, setProfileStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

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

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const newStudents = results.data
          .filter(row => row.Name)
          .map((row, i) => ({
            id: `STU${String(Date.now() + i).slice(-6)}`,
            rollNumber: row['Roll No'] || String(i + 1).padStart(2, '0'),
            name: row.Name || '',
            class: row.Class || '8',
            section: row.Section || 'A',
            parentName: row.Parent || '',
            contact: row.Contact || '',
            status: 'active',
          }));
        saveStudents([...students, ...newStudents]);
        addToast(`${newStudents.length} students imported successfully.`, 'success');
      },
    });
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
        <div className="flex items-center gap-2">
          <label className="btn-secondary cursor-pointer">
            <Upload size={15} />
            <span className="hidden sm:inline">Import CSV</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={15} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            <Plus size={15} /> Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input-field w-auto">
            <option value="all">All Classes</option>
            {['8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="input-field w-auto">
            <option value="all">All Sections</option>
            {['A','B'].map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
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
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map(student => {
                  const stats = calcStudentAttendancePercentage(student.id, attendanceRecords);
                  const pct = stats.percentage;
                  const pctColor = pct >= 85 ? 'text-green-600' : pct >= 75 ? 'text-amber-600' : 'text-red-600';
                  const pctBg = pct >= 85 ? 'bg-green-100' : pct >= 75 ? 'bg-amber-100' : 'bg-red-100';
                  return (
                    <tr key={student.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                          {student.rollNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
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
                        <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-md">
                          {student.class}-{student.section}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-xs text-slate-600 dark:text-slate-400">{student.parentName}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-xs text-slate-600 dark:text-slate-400">{student.contact}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {stats.total > 0 ? (
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${pctBg} ${pctColor}`}>
                            {pct}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No data</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setProfileStudent(student)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-colors"
                            title="View Profile"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => setEditStudent(student)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(student)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
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
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {filtered.length} of {students.length} students
          </p>
        </div>
      </div>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        student={deleteTarget}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
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
