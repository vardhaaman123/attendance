import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import CustomSelect from '../ui/CustomSelect';
import { useApp } from '../../context/AppContext';

const defaultForm = {
  name: '',
  email: '',
  class: '10',
  section: 'A',
  subject: '',
  contact: '',
  status: 'active',
  password: 'teacher123',
};

export default function AddEditTeacherModal({ open, teacher, onClose }) {
  const { teachers, addTeacher, updateTeacher, addToast, students } = useApp();
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (teacher) {
      setForm({ ...defaultForm, ...teacher });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
  }, [teacher, open]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    } else {
      // Check duplicate email (excluding current teacher if editing)
      const existing = teachers.find(
        t => t.email.toLowerCase().trim() === form.email.toLowerCase().trim() && t.id !== teacher?.id
      );
      if (existing) {
        errs.email = 'A teacher with this email already exists';
      }
    }
    if (!form.class) errs.class = 'Class is required';
    if (!form.section) errs.section = 'Division / Section is required';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (teacher) {
      updateTeacher(teacher.id, {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        class: String(form.class).trim(),
        section: form.section.trim().toUpperCase(),
        password: form.password ? form.password.trim() : (teacher.password || 'teacher123'),
      });
      addToast(`Teacher ${form.name} updated successfully.`, 'success');
    } else {
      addTeacher({
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        class: String(form.class).trim(),
        section: form.section.trim().toUpperCase(),
        password: form.password ? form.password.trim() : 'teacher123',
      });
      addToast(`Teacher ${form.name} registered successfully.`, 'success');
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={teacher ? 'Edit Teacher Details' : 'Add New Teacher'}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Full Name *
          </label>
          <input
            className={`input-field ${errors.name ? 'border-red-400 focus:border-red-500' : ''}`}
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Mrs. Priya Sharma"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Email Address *
          </label>
          <input
            type="email"
            className={`input-field ${errors.email ? 'border-red-400 focus:border-red-500' : ''}`}
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="priya.sharma@school.edu"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          <p className="text-[11px] text-slate-400 mt-1">
            Teacher will use this email and assigned division to sign in.
          </p>
        </div>

        {/* Class and Division / Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Assigned Class *
            </label>
            <input
              list="teacher-class-options"
              className={`input-field ${errors.class ? 'border-red-400' : ''}`}
              value={form.class}
              onChange={e => set('class', e.target.value)}
              placeholder="e.g. 10"
            />
            <datalist id="teacher-class-options">
              {Array.from(new Set([...(students || []).map(s => s.class), '8', '9', '10'])).sort((a,b)=>a.localeCompare(b, undefined, {numeric: true})).map(c => <option key={c} value={c} />)}
            </datalist>
            {errors.class && <p className="text-xs text-red-500 mt-1">{errors.class}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Division / Section *
            </label>
            <input
              list="teacher-section-options"
              className={`input-field ${errors.section ? 'border-red-400' : ''}`}
              value={form.section}
              onChange={e => set('section', e.target.value)}
              placeholder="e.g. A"
            />
            <datalist id="teacher-section-options">
              {Array.from(new Set([...(students || []).map(s => s.section), 'A', 'B'])).sort().map(s => <option key={s} value={s} />)}
            </datalist>
            {errors.section && <p className="text-xs text-red-500 mt-1">{errors.section}</p>}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Subject (Optional)
          </label>
          <input
            className="input-field"
            value={form.subject}
            onChange={e => set('subject', e.target.value)}
            placeholder="e.g. Mathematics, Science, English"
          />
        </div>

        {/* Contact */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Contact Number (Optional)
          </label>
          <input
            className="input-field"
            value={form.contact}
            onChange={e => set('contact', e.target.value)}
            placeholder="e.g. 9876543210"
          />
        </div>

        {/* Teacher Login Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Teacher Login Password
          </label>
          <input
            className="input-field font-mono"
            type="text"
            value={form.password || ''}
            onChange={e => set('password', e.target.value)}
            placeholder="teacher123"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Teacher uses this to log in to their portal. Default: <span className="font-mono text-brand-blue">teacher123</span>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
          <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto justify-center">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="btn-primary w-full sm:w-auto justify-center">
            {teacher ? 'Update Teacher' : 'Add Teacher'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
