import { useState } from 'react';
import { Save, School, User, Moon, Sun, Bell, Trash2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { settings, saveSettings, addToast, saveStudents, saveAttendanceRecord } = useApp();
  const { dark, toggleDark } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    schoolName: settings.schoolName || 'Delhi Public School',
    teacherName: settings.teacherName || 'Mrs. Anjali Sharma',
    notifications: settings.notifications !== false,
    enableAutoAlerts: settings.enableAutoAlerts || false,
    emailjsServiceId: settings.emailjsServiceId || '',
    emailjsTemplateId: settings.emailjsTemplateId || '',
    emailjsPublicKey: settings.emailjsPublicKey || '',
    teacherPassword: settings.teacherPassword || 'teacher123',
  });

  const [showReset, setShowReset] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    saveSettings({ ...settings, ...form });
    addToast('Settings saved successfully.', 'success');
  };

  const handleResetData = () => {
    localStorage.removeItem('attendify_students');
    localStorage.removeItem('attendify_teachers');
    localStorage.removeItem('attendify_attendance');
    localStorage.removeItem('attendify_settings');
    localStorage.removeItem('attendify_user');
    localStorage.removeItem('attendify_teacher_session');
    addToast('All data has been reset. Refreshing...', 'info');
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure your institution profile, alert automations, and visual preferences.</p>
      </div>

      {/* School info */}
      <div className="rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 backdrop-blur-xl shadow-sm dark:shadow-[0_4px_25px_rgba(0,0,0,0.3)] space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)]">
            <School size={16} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">School Information</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">School Name</label>
            <input
              className="input-field"
              value={form.schoolName}
              onChange={e => set('schoolName', e.target.value)}
              placeholder="Delhi Public School"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Default Teacher / Admin Name</label>
            <input
              className="input-field"
              value={form.teacherName}
              onChange={e => set('teacherName', e.target.value)}
              placeholder="Mrs. Anjali Sharma"
            />
          </div>
        </div>

        <div className="p-4 bg-blue-50/50 dark:bg-blue-500/[0.06] border border-blue-200/60 dark:border-blue-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-950 dark:text-blue-200">Teacher Account Management</p>
            <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
              Teachers log in with their Name, Email, Class & Division. You can add, edit, and assign teachers in the dedicated Teachers section.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/teachers')}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 shrink-0 self-start sm:self-auto min-h-[36px]"
          >
            Go to Teachers <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Automated Alerts (EmailJS) */}
      <div className="rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 backdrop-blur-xl shadow-sm dark:shadow-[0_4px_25px_rgba(0,0,0,0.3)] space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 dark:text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
            <Bell size={16} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Automated Absent Alerts</h2>
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Auto-Send Email & SMS</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automatically notify parents when a student is marked absent.</p>
          </div>
          <button
            onClick={() => set('enableAutoAlerts', !form.enableAutoAlerts)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${form.enableAutoAlerts ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]' : 'bg-slate-200 dark:bg-white/10'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${form.enableAutoAlerts ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {form.enableAutoAlerts && (
          <div className="space-y-4 animate-slide-up">
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 p-3.5 rounded-xl">
              To send automated emails, create a free account at <a href="https://emailjs.com" target="_blank" rel="noreferrer" className="text-blue-500 underline font-semibold">emailjs.com</a>. SMS notification uses simulated parent delivery.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">EmailJS Service ID</label>
              <input
                className="input-field"
                value={form.emailjsServiceId}
                onChange={e => set('emailjsServiceId', e.target.value)}
                placeholder="service_xxxxx"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">EmailJS Template ID</label>
              <input
                className="input-field"
                value={form.emailjsTemplateId}
                onChange={e => set('emailjsTemplateId', e.target.value)}
                placeholder="template_xxxxx"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">EmailJS Public Key</label>
              <input
                className="input-field"
                value={form.emailjsPublicKey}
                onChange={e => set('emailjsPublicKey', e.target.value)}
                placeholder="public_key_xxxxx"
              />
            </div>
          </div>
        )}
      </div>

      {/* Appearance & Notifications */}
      <div className="rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 backdrop-blur-xl shadow-sm dark:shadow-[0_4px_25px_rgba(0,0,0,0.3)] space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            {dark ? <Moon size={16} /> : <Sun size={16} />}
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Appearance & Notifications</h2>
        </div>

        <div className="space-y-4 divide-y divide-slate-100 dark:divide-white/5">
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Dark Obsidian Theme</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Switch between light mode and dark obsidian glass</p>
            </div>
            <button
              onClick={toggleDark}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${dark ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]' : 'bg-slate-200 dark:bg-white/10'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${dark ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Toast Notifications</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Show confirmation popups for user actions</p>
            </div>
            <button
              onClick={() => set('notifications', !form.notifications)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${form.notifications ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]' : 'bg-slate-200 dark:bg-white/10'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${form.notifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button onClick={handleSave} className="btn-primary w-full sm:w-auto">
        <Save size={15} /> Save All Changes
      </button>

      {/* Danger zone */}
      <div className="rounded-2xl bg-white dark:bg-[#0B0F19]/80 border border-rose-200/70 dark:border-rose-500/20 p-5 sm:p-6 backdrop-blur-xl shadow-sm dark:shadow-[0_4px_25px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
            <AlertTriangle size={16} />
          </div>
          <h2 className="text-sm font-bold text-rose-600 dark:text-rose-400">Danger Zone</h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Reset All Application Data</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Clear all students, teachers, attendance logs, and custom preferences back to defaults.</p>
          </div>
          {!showReset ? (
            <button onClick={() => setShowReset(true)} className="btn-danger shrink-0">
              <Trash2 size={14} /> Reset Data
            </button>
          ) : (
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setShowReset(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleResetData} className="btn-danger text-xs">Confirm Reset</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
