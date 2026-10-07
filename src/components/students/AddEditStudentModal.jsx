import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getUserLookup } from '../../services/firestoreService';
import { Eye, EyeOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import PasswordRequirements, { validatePasswordRules } from '../ui/PasswordRequirements';
import { getTeacherScope } from '../../utils/teacherScope';

const empty = {
  rollNumber: '',
  name: '',
  class: '8',
  section: 'A',
  parentName: '',
  contact: '',
  email: '',
  password: '1234',
  status: 'active',
};

export default function AddEditStudentModal({ open, student, onClose, onStudentSaved }) {
  const { students, teachers = [], addStudent, updateStudent, addToast } = useApp();
  const { role, user } = useAuth();
  const isTeacher = role === 'teacher';
  const teacherScope = getTeacherScope(user, role);

  const classSuggestions = isTeacher && teacherScope.allowedClasses.length > 0
    ? teacherScope.allowedClasses
    : Array.from(
        new Set([...students.map(s => s.class), ...teachers.map(t => t.class), '8', '9', '10'])
      ).filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const sectionSuggestions = isTeacher && teacherScope.allowedSections.length > 0
    ? teacherScope.allowedSections
    : Array.from(
        new Set([...students.map(s => s.section), ...teachers.map(t => t.section), 'A', 'B', 'C'])
      ).filter(Boolean).sort();

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const liveStudent = student
    ? (students || []).find(
        (s) =>
          (s.id && (s.id === student.id || s._docId === student.id)) ||
          (student.rollNumber && s.rollNumber && String(s.rollNumber).trim().toLowerCase() === String(student.rollNumber).trim().toLowerCase()) ||
          (student.email && s.email && s.email.trim().toLowerCase() === student.email.trim().toLowerCase())
      ) || student
    : null;

  useEffect(() => {
    if (liveStudent) {
      setForm({ ...empty, ...liveStudent });
      // Live query to ensure the absolute latest password is shown
      const ident = liveStudent.email || liveStudent.rollNumber;
      if (ident) {
        getUserLookup(ident)
          .then((lookup) => {
            if (lookup?.password) {
              setForm((prev) => ({ ...prev, password: lookup.password }));
            }
          })
          .catch(() => {});
      }
    } else {
      setForm({
        ...empty,
        class: isTeacher && teacherScope.defaultClass ? teacherScope.defaultClass : (teachers[0]?.class ? String(teachers[0].class) : '8'),
        section: isTeacher && teacherScope.defaultSection ? teacherScope.defaultSection : (teachers[0]?.section ? String(teachers[0].section).toUpperCase() : 'A'),
      });
    }
    setErrors({});
  }, [student, liveStudent?.id, liveStudent?.password, open, isTeacher, user, teachers, teacherScope.defaultClass, teacherScope.defaultSection]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.rollNumber.trim()) e.rollNumber = 'Roll number is required';
    else {
      // Check for duplicate roll number (exclude current student when editing)
      const duplicate = students.find(s => {
        const sId = s.id || s._docId;
        const isCurrentStudent = student && (sId === (student.id || student._docId));
        return !isCurrentStudent && String(s.rollNumber).trim().toLowerCase() === String(form.rollNumber).trim().toLowerCase();
      });
      if (duplicate) e.rollNumber = `Roll number "${form.rollNumber}" is already assigned to ${duplicate.name}`;
    }
    if (!form.contact.trim()) e.contact = 'Contact is required';

    // Password conditions check
    const trimmedPw = (form.password || '').trim();
    if (!trimmedPw) {
      e.password = 'Password cannot be empty. Use 1234 for initial PIN or enter a secure password.';
    } else if (trimmedPw !== '1234') {
      const pwCheck = validatePasswordRules(trimmedPw);
      if (!pwCheck.allSatisfied) {
        e.password = `Password rejected: Must satisfy all security conditions (${pwCheck.firstMissing?.label?.toLowerCase() || 'missing requirements'}).`;
      }
    }

    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      if (e.password) {
        addToast(e.password, 'error');
      }
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      rollNumber: String(form.rollNumber).trim(),
      class: String(form.class).trim(),
      section: String(form.section).trim().toUpperCase(),
      contact: form.contact.trim(),
      parentName: (form.parentName || '').trim(),
      email: (form.email || '').trim().toLowerCase(),
      parentEmail: (form.email || form.parentEmail || '').trim().toLowerCase(),
      password: (form.password || '1234').trim(),
      enrolledBy: isTeacher ? 'TEACHER' : 'ADMIN',
      enrolledById: user?.id || user?.uid || '',
    };

    if (student) {
      await updateStudent(student.id || student._docId, payload);
      addToast(`${payload.name} updated successfully.`, 'success');
      onClose();
      if (onStudentSaved) onStudentSaved({ ...student, ...payload });
    } else {
      const created = await addStudent(payload);
      addToast(`${payload.name} enrolled successfully!`, 'success');
      onClose();
      if (onStudentSaved) onStudentSaved(created);
    }
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
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Class</span>
              {isTeacher && teacherScope.allowedClasses.length > 0 && (
                <span className="text-[10px] text-blue-400 font-medium">Assigned: Class {teacherScope.allowedClasses.join(', ')}</span>
              )}
            </label>
            <input
              list="class-options"
              className="input-field"
              value={form.class}
              onChange={e => set('class', e.target.value)}
              placeholder="e.g. 10"
            />
            <datalist id="class-options">
              {classSuggestions.map(c => <option key={c} value={c}>Class {c}</option>)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Section / Division</span>
              {isTeacher && teacherScope.allowedSections.length > 0 && (
                <span className="text-[10px] text-blue-400 font-medium">Assigned: {teacherScope.allowedSections.join(', ')}</span>
              )}
            </label>
            <input
              list="section-options"
              className="input-field"
              value={form.section}
              onChange={e => set('section', e.target.value)}
              placeholder="e.g. A"
            />
            <datalist id="section-options">
              {sectionSuggestions.map(s => <option key={s} value={s}>Section {s}</option>)}
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Student Login Password
            </label>
            {form.password?.trim() === '1234' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                Default PIN (1234)
              </span>
            ) : form.password ? (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                  validatePasswordRules(form.password).allSatisfied
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                }`}
              >
                {validatePasswordRules(form.password).allSatisfied ? (
                  <>
                    <ShieldCheck size={11} className="text-emerald-500" />
                    <span>Password Allowed</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={11} className="text-red-500" />
                    <span>Password Rejected</span>
                  </>
                )}
              </span>
            ) : null}
          </div>

          <div className="relative">
            <input
              className={`input-field pr-10 font-mono transition-colors ${
                errors.password
                  ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/30'
                  : form.password && form.password.trim() !== '1234'
                  ? validatePasswordRules(form.password).allSatisfied
                    ? 'border-emerald-500 focus:border-emerald-500 ring-1 ring-emerald-500/20'
                    : 'border-red-400/80 focus:border-red-500 ring-1 ring-red-500/20'
                  : ''
              }`}
              type={showPassword ? 'text' : 'password'}
              value={form.password || ''}
              onChange={e => set('password', e.target.value)}
              placeholder="1234"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {errors.password && (
            <p className="text-xs text-red-500 font-medium mt-1.5 flex items-center gap-1.5">
              <ShieldAlert size={13} className="shrink-0 text-red-500" />
              <span>{errors.password}</span>
            </p>
          )}

          {form.password?.trim() === '1234' ? (
            <p className="text-[11px] text-slate-400 mt-1.5">
              Initial student PIN is <span className="font-mono text-brand-blue font-semibold">1234</span>. The student will be prompted to set a secure password upon first login, or you can enter a secure custom password above.
            </p>
          ) : (
            <div className="mt-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10">
              <PasswordRequirements password={form.password || ''} showHeader={true} />
            </div>
          )}
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
