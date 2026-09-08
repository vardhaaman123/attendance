import { useState } from 'react';
import { Save, School, User, Moon, Sun, Bell, Trash2, AlertTriangle } from 'lucide-react';
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
  });

  const [showReset, setShowReset] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    saveSettings({ ...settings, ...form });
    addToast('Settings saved successfully.', 'success');
  };

  const handleResetData = () => {
    localStorage.removeItem('attendify_students');
    localStorage.removeItem('attendify_attendance');
    localStorage.removeItem('attendify_settings');
    localStorage.removeItem('attendify_user');
    addToast('All data has been reset. Refreshing...', 'info');
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-navy-900 dark:text-white">Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your school and application preferences.</p>
      </div>

      {/* School info */}
      <div className="card space-y-5">
        <h2 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
          <School size={16} className="text-brand-blue" /> School Information
        </h2>
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
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Teacher Name</label>
          <input
            className="input-field"
            value={form.teacherName}
            onChange={e => set('teacherName', e.target.value)}
            placeholder="Mrs. Anjali Sharma"
          />
        </div>
      </div>

      {/* Appearance */}
      <div className="card space-y-5">
        <h2 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
          {dark ? <Moon size={16} className="text-brand-blue" /> : <Sun size={16} className="text-brand-blue" />}
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-navy-900 dark:text-white">Dark Mode</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Switch between light and dark theme</p>
          </div>
          <button
            onClick={toggleDark}
            className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${dark ? 'bg-brand-blue' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${dark ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card space-y-5">
        <h2 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
          <Bell size={16} className="text-brand-blue" /> Notifications
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-navy-900 dark:text-white">Enable Notifications</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Show toast notifications for actions</p>
          </div>
          <button
            onClick={() => set('notifications', !form.notifications)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${form.notifications ? 'bg-brand-blue' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${form.notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} className="btn-primary">
        <Save size={15} /> Save Settings
      </button>

      {/* Danger zone */}
      <div className="card border border-red-100 dark:border-red-900/30 space-y-4">
        <h2 className="text-sm font-bold text-red-600 flex items-center gap-2">
          <AlertTriangle size={16} /> Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-navy-900 dark:text-white">Reset All Data</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Clear all students, attendance records and settings. This cannot be undone.</p>
          </div>
          {!showReset ? (
            <button onClick={() => setShowReset(true)} className="btn-danger shrink-0">
              <Trash2 size={14} /> Reset
            </button>
          ) : (
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setShowReset(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleResetData} className="btn-danger">Confirm Reset</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
