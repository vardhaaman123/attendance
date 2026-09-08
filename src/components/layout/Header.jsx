import { useState, useEffect } from 'react';
import { Menu, Bell, Sun, Moon, Search } from 'lucide-react';
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function Header({ onMenuOpen }) {
  const { user } = useAuth();
  const { dark, toggleDark } = useTheme();
  const { settings } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);

  const firstName = (settings.teacherName || user?.name || 'Teacher').split(' ')[0];
  const notifications = [
    { id: 1, msg: 'Attendance for Class 10-A saved successfully.', time: '2m ago', read: false },
    { id: 2, msg: '5 students have attendance below 75%.', time: '1h ago', read: false },
    { id: 3, msg: 'Class 9-B attendance not taken today.', time: '3h ago', read: true },
  ];
  const unread = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white dark:bg-navy-800 border-b border-slate-100 dark:border-navy-700 px-4 sm:px-6 py-3 flex items-center gap-4">
      {/* Mobile menu */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-400"
      >
        <Menu size={20} />
      </button>

      {/* Greeting */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm sm:text-base font-semibold text-navy-900 dark:text-white truncate">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
          Manage your students' attendance quickly and efficiently.
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <Clock />

        {/* Dark mode */}
        <button
          onClick={toggleDark}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-500 dark:text-slate-400 transition-colors"
          title={dark ? 'Light Mode' : 'Dark Mode'}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-slate-100 dark:border-navy-700 z-20 overflow-hidden animate-slide-up">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-navy-700">
                  <p className="text-sm font-semibold text-navy-900 dark:text-white">Notifications</p>
                </div>
                {notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-slate-50 dark:border-navy-700 last:border-0 ${!n.read ? 'bg-brand-blue-soft dark:bg-brand-blue/5' : ''}`}>
                    <p className="text-xs text-navy-900 dark:text-slate-200 font-medium">{n.msg}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0 cursor-pointer">
          <span className="text-white text-xs font-bold">
            {(settings.teacherName || user?.name || 'T').split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
        </div>
      </div>
    </header>
  );
}
