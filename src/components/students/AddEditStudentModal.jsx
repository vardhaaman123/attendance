import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
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
        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Class</label>
            <select className="input-field" value={form.class} onChange={e => set('class', e.target.value)}>
              {['8', '9', '10'].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Section</label>
            <select className="input-field" value={form.section} onChange={e => set('section', e.target.value)}>
              {['A', 'B'].map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
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
            Contact Number *
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
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
          <input
            className="input-field"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="student@school.edu"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">
            {student ? 'Save Changes' : 'Add Student'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
