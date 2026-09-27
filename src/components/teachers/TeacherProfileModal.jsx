import { Phone, Mail, BookOpen, Award, Edit2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { useApp } from '../../context/AppContext';

export default function TeacherProfileModal({ open, teacher, onClose, onEdit }) {
  const { students } = useApp();

  if (!teacher) return null;

  const initials = teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const avatarHue = (teacher.name.charCodeAt(0) * 53) % 360;

  const assignedStudents = (students || []).filter(
    s => String(s.class) === String(teacher.class) && String(s.section).toUpperCase() === String(teacher.section).toUpperCase()
  );

  return (
    <Modal open={open} onClose={onClose} title="Teacher Details" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Header with Avatar, Name, ID, and Status */}
        <div className="flex items-center gap-3.5 p-3.5 sm:p-4 bg-slate-50 dark:bg-[#111726] border border-slate-200/80 dark:border-white/10 rounded-2xl">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-md"
            style={{ background: `hsl(${avatarHue}, 65%, 48%)` }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{teacher.name}</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{teacher.id}</p>
          </div>
        </div>

        {/* Assigned Class & Subject Info Pills */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
            <span className="text-[10px] font-semibold uppercase text-blue-400 block">Assigned Class</span>
            <span className="text-sm sm:text-base font-bold text-blue-300 block mt-0.5">
              Class {teacher.class}-{teacher.section}
            </span>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
            <span className="text-[10px] font-semibold uppercase text-purple-400 block">Subject</span>
            <span className="text-sm sm:text-base font-bold text-purple-300 block mt-0.5 truncate">
              {teacher.subject || 'General'}
            </span>
          </div>
        </div>

        {/* Detailed Info List */}
        <div className="space-y-2 pt-1">
          {[
            [Mail, 'Email Address', teacher.email],
            [Phone, 'Contact Number', teacher.contact || 'Not provided'],
            [BookOpen, 'Assigned Division', `Class ${teacher.class} - Section ${teacher.section}`],
            [Award, 'Students in Assigned Class', `${assignedStudents.length} Students`],
          ].map(([Icon, label, val]) => (
            <div key={label} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-400">
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">{label}</p>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 break-all">{val || '—'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs"
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(teacher);
              }}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Edit2 size={13} />
              <span>Edit Teacher</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
