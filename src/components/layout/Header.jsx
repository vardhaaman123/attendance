import { useState, useEffect } from 'react';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="hidden sm:flex flex-col items-end">
      <span className="text-xs font-semibold text-navy-900 dark:text-white">{timeStr}</span>
      <span className="text-[10px] text-slate-500 dark:text-slate-400">{dateStr}</span>
    </div>
  );
}

export default function Header({ onMenuOpen }) {
  const { user, role } = useAuth();
  const { dark, toggleDark } = useTheme();
  const { settings } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);

  const displayName = role === 'admin' 
    ? (settings?.teacherName || user?.name || 'Administrator') 
    : (user?.name || 'Teacher');

  const notifications = [
    { id: 1, msg: 'Attendance for Class 10-A saved successfully.', time: '2m ago', read: false },
    { id: 2, msg: '5 students have attendance below 75%.', time: '1h ago', read: false },
    { id: 3, msg: 'Class 9-B attendance not taken today.', time: '3h ago', read: true },
  ];
  const unread = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 w-full max-w-full bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-xl border-b border-slate-100 dark:border-white/10 px-2.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 no-print flex-shrink-0 z-20">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onMenuOpen}
        className="lg:hidden w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center flex-shrink-0 active:scale-95"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* Right side */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        <Clock />

        {/* Dark mode */}
        <button
          type="button"
          onClick={toggleDark}
          className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-500 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center active:scale-95"
          title={dark ? 'Light Mode' : 'Dark Mode'}
          aria-label="Toggle theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen(o => !o)}
            className="relative w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-500 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center active:scale-95"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-[min(calc(100vw-1.5rem),320px)] bg-white dark:bg-[#0E1422] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/15 z-20 overflow-hidden animate-slide-up backdrop-blur-xl">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10">
                  <p className="text-sm font-semibold text-navy-900 dark:text-white">Notifications</p>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b border-slate-50 dark:border-white/[0.06] last:border-0 ${!n.read ? 'bg-blue-50/50 dark:bg-blue-500/10' : ''}`}>
                      <p className="text-xs text-navy-900 dark:text-slate-200 font-medium break-words">{n.msg}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.3)] border border-blue-400/30 flex items-center justify-center flex-shrink-0 cursor-pointer">
          <span className="text-white text-xs font-bold">
            {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
