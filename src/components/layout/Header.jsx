import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getUserIdentities, isMessageTargetingMe, isMessageUnreadForUser } from '../../utils/messageUtils';

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
  const { user, role, currentStudent } = useAuth();
  const { messages = [], teachers = [], students = [] } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  const identities = useMemo(() => {
    return getUserIdentities({ role, user, currentStudent, teachers, students });
  }, [role, user, currentStudent, teachers, students]);

  const notifications = useMemo(() => {
    return (messages || [])
      .filter((m) => isMessageTargetingMe(m, identities, students))
      .map((m) => {
        const isUnread = isMessageUnreadForUser(m, identities, students);
        const prefix = m.senderName ? `${m.senderName}: ` : '';
        const body = m.text || (m.attachment ? `[Attachment: ${m.attachment.name || 'File'}]` : 'Announcement');
        return {
          id: m.id,
          msg: `${prefix}${body}`,
          time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          unread: isUnread,
          isTeacher: (m.senderRole || '').toLowerCase() === 'teacher',
          timestamp: m.timestamp,
        };
      })
      .sort((a, b) => {
        if (role === 'student') {
          if (a.isTeacher && !b.isTeacher) return -1;
          if (!a.isTeacher && b.isTeacher) return 1;
        }
        if (a.unread && !b.unread) return -1;
        if (!a.unread && b.unread) return 1;
        return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
      })
      .slice(0, 7);
  }, [messages, identities, students, role]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => n.unread).length;
  }, [notifications]);

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

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            className="relative w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-500 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center active:scale-95"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-[min(calc(100vw-1.5rem),320px)] bg-white dark:bg-[#0E1422] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/15 z-20 overflow-hidden animate-slide-up backdrop-blur-xl">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                  <p className="text-sm font-semibold text-navy-900 dark:text-white">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setNotifOpen(false);
                          navigate('/messages');
                        }}
                        className={`px-4 py-3 border-b border-slate-50 dark:border-white/[0.06] last:border-0 cursor-pointer hover:bg-white/[0.04] transition-all flex items-start gap-2.5 ${
                          n.unread ? 'bg-emerald-500/[0.06] dark:bg-emerald-500/10' : ''
                        }`}
                      >
                        {n.unread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)] animate-pulse flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-navy-900 dark:text-slate-200 font-medium break-words leading-relaxed">{n.msg}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-slate-100 dark:border-white/10 bg-white/[0.02]">
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/messages');
                    }}
                    className="w-full py-1.5 text-center text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Open Messages Center →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
