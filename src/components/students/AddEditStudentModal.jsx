import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import CustomSelect from '../ui/CustomSelect';
import { useApp } from '../../context/AppContext';

const empty = {
  rollNumber: '',
  name: '',
  class: '8',
  section: 'A',
  parentName: '',
  contact: '',
  email: '',
  status: 'active',
};

export default function AddEditStudentModal({ open, student, onClose }) {
  const { students, saveStudents, addToast } = useApp();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (student) setForm({ ...empty, ...student });
    else setForm(empty);
    setErrors({});
  }, [student, open]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.rollNumber.trim()) e.rollNumber = 'Roll number is required';
    if (!form.contact.trim()) e.contact = 'Contact is required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    if (student) {
      const updated = students.map(s => s.id === student.id ? { ...s, ...form } : s);
      saveStudents(updated);
      addToast(`${form.name} updated successfully.`, 'success');
    } else {
      const newStudent = {
        ...form,
        id: `STU${String(Date.now()).slice(-6)}`,
        email: form.email || `${form.name.toLowerCase().replace(/\s+/g, '.')}@school.edu`,
      };
      saveStudents([...students, newStudent]);
      addToast(`${form.name} added successfully.`, 'success');
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={student ? 'Edit Student' : 'Add New Student'}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Roll Number *
            </label>
            <input
              className={`input-field ${errors.rollNumber ? 'border-red-400' : ''}`}
              value={form.rollNumber}
              onChange={e => set('rollNumber', e.target.value)}
              placeholder="01"
            />
            {errors.rollNumber && <p className="text-xs text-red-500 mt-1">{errors.rollNumber}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Full Name *
            </label>
            <input
              className={`input-field ${errors.name ? 'border-red-400' : ''}`}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Student Name"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Class</label>
            <input
              list="class-options"
              className="input-field"
              value={form.class}
              onChange={e => set('class', e.target.value)}
              placeholder="e.g. 11"
            />
            <datalist id="class-options">
              {Array.from(new Set([...students.map(s => s.class), '8', '9', '10'])).sort().map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Section / Division</label>
            <input
              list="section-options"
              className="input-field"
              value={form.section}
              onChange={e => set('section', e.target.value)}
              placeholder="e.g. C"
            />
            <datalist id="section-options">
              {Array.from(new Set([...students.map(s => s.section), 'A', 'B'])).sort().map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Parent / Guardian Name
          </label>
          <input
            className="input-field"
            value={form.parentName}
            onChange={e => set('parentName', e.target.value)}
            placeholder="Parent Name"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Parent's Contact Number *
          </label>
          <input
            className={`input-field ${errors.contact ? 'border-red-400' : ''}`}
            value={form.contact}
            onChange={e => set('contact', e.target.value)}
            placeholder="9876543210"
          />
          {errors.contact && <p className="text-xs text-red-500 mt-1">{errors.contact}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Parent's Email</label>
          <input
            className="input-field"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="parent@email.com"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Student Login Password</label>
          <input
            className="input-field"
            type="text"
            value={form.password || ''}
            onChange={e => set('password', e.target.value)}
            placeholder="1234"
          />
          <p className="text-[10px] text-slate-400 mt-1">Student uses this to log in to their portal. Default: <span className="font-mono text-brand-blue">1234</span></p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary w-full sm:w-auto justify-center">Cancel</button>
          <button onClick={handleSave} className="btn-primary w-full sm:w-auto justify-center">
            {student ? 'Save Changes' : 'Add Student'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
