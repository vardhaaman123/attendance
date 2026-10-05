import { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardCheck, Users, History,
  BookOpen, Settings, LogOut,
  X, CalendarDays, UserCircle, UserCheck, MessageSquare, KeyRound,
  BarChart2
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getUserIdentities, getUnreadMessagesCountForUser } from '../../utils/messageUtils';

// Admin has full access including Teachers and Settings
const adminNav = [
  { to: '/dashboard',  label: 'Dashboard',          icon: LayoutDashboard },
  { to: '/attendance', label: 'Take Attendance',    icon: ClipboardCheck  },
  { to: '/teachers',   label: 'Teachers',           icon: UserCheck       },
  { to: '/students',   label: 'Students',           icon: Users           },
  { to: '/history',    label: 'Attendance History', icon: History         },
  { to: '/reports',    label: 'Reports',            icon: BarChart2       },
  { to: '/marks',      label: 'Marks',              icon: BookOpen        },
  { to: '/messages',   label: 'Messages',           icon: MessageSquare   },
  { to: '/settings',   label: 'Settings',           icon: Settings        },
];

// Teachers can take attendance, see history, marks, classes, enrolled students, and dashboard
const teacherNav = [
  { to: '/dashboard',        label: 'Dashboard',          icon: LayoutDashboard },
  { to: '/attendance',       label: 'Take Attendance',    icon: ClipboardCheck  },
  { to: '/students',         label: 'My Students',        icon: Users           },
  { to: '/history',          label: 'Attendance History', icon: History         },
  { to: '/reports',          label: 'Reports',            icon: BarChart2       },
  { to: '/marks',            label: 'Marks',              icon: BookOpen        },
  { to: '/messages',         label: 'Messages',           icon: MessageSquare   },
  { to: '/teacher-password', label: 'Password',           icon: KeyRound        },
];

// Student sees only their own data and messages
const studentNav = [
  { to: '/student-dashboard', label: 'My Attendance',  icon: CalendarDays },
  { to: '/my-marks',          label: 'My Marks',       icon: BookOpen     },
  { to: '/messages',          label: 'Messages',       icon: MessageSquare },
  { to: '/my-password',       label: 'Password',       icon: KeyRound     },
  { to: '/my-profile',        label: 'My Profile',     icon: UserCircle   },
];

function SidebarContent({ collapsed, onClose, onToggle }) {
  const { logout, user, role, currentStudent } = useAuth();
  const { settings, messages, teachers, students } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : studentNav;

  const unreadMessagesCount = useMemo(() => {
    const identities = getUserIdentities({ role, user, currentStudent, teachers, students });
    return getUnreadMessagesCountForUser(messages, identities, students);
  }, [role, user, currentStudent, teachers, students, messages]);

  const avatarLetter = useMemo(() => {
    const raw = (user?.principleName || user?.name || user?.collegeName || settings.collegeName || 'V');
    return raw.trim().charAt(0).toUpperCase() || 'V';
  }, [user, settings]);

  const roleLabel = role === 'admin' ? 'Admin' : role === 'teacher' ? 'Teacher' : 'Student';
  const roleBadgeStyle = role === 'admin'
    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
    : role === 'teacher'
    ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

  const roleDotStyle = role === 'admin'
    ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
    : role === 'teacher'
    ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
    : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]';

  return (
    <div className="flex flex-col h-full select-none">
      {/* Top Header / Avatar */}
      <div className="h-16 flex items-center px-3.5 border-b border-white/[0.08] flex-shrink-0">
        <button
          type="button"
          onClick={onToggle}
          className="w-10 h-10 rounded-2xl bg-gradient-to-b from-white/[0.12] to-white/[0.04] p-[1px] shadow-[0_2px_12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] border border-white/15 flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 group backdrop-blur-xl"
          title={collapsed ? "Show navigation menu" : "Collapse navigation menu"}
          aria-label={collapsed ? "Show navigation menu" : "Collapse navigation menu"}
        >
          <div className="w-full h-full rounded-[14px] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-inner">
            <span className="text-white text-sm font-bold select-none group-hover:scale-110 transition-transform duration-200">
              {avatarLetter}
            </span>
          </div>
        </button>

        {!collapsed && (
          <div className="ml-3 truncate">
            <p className="text-xs font-semibold text-white truncate tracking-tight">
              {user?.collegeName || settings.collegeName || 'Attendify'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              School Management
            </p>
          </div>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white border border-white/10 cursor-pointer transition-all"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Role badge: Liquid Glass pill */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          collapsed
            ? 'max-h-0 opacity-0 py-0 pointer-events-none'
            : 'max-h-10 opacity-100 px-3 pt-2.5 pb-1'
        }`}
      >
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md shadow-sm ${roleBadgeStyle}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${roleDotStyle} animate-pulse`} />
          <span className="tracking-wide uppercase text-[9.5px] font-bold">{roleLabel}</span>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-2.5 py-2.5 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isMessages = to === '/messages';
          const hasUnread = isMessages && unreadMessagesCount > 0;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center h-10 px-3 rounded-xl sm:rounded-2xl text-[13.5px] font-medium transition-all duration-200 cursor-pointer relative overflow-hidden ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/30 shadow-[0_2px_12px_rgba(59,130,246,0.25),inset_0_1px_0_rgba(255,255,255,0.12)]'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white border border-transparent hover:border-white/10'
                }`
              }
              title={collapsed ? `${label}${hasUnread ? ` (${unreadMessagesCount} unread)` : ''}` : undefined}
            >
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center relative">
                <Icon size={18} className="transition-transform duration-200 group-hover:scale-110" />
                {collapsed && hasUnread && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0B0F1A] shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
                )}
              </div>

              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  collapsed
                    ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                    : 'max-w-[130px] opacity-100 translate-x-0 ml-2.5'
                } flex-1 truncate`}
              >
                {label}
              </span>

              {!collapsed && hasUnread && (
                <span
                  className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse flex-shrink-0 ml-auto"
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="flex-shrink-0 px-2.5 py-3 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="group w-full flex items-center h-10 px-3 rounded-xl sm:rounded-2xl text-rose-400/90 hover:bg-rose-500/10 hover:text-rose-300 border border-transparent hover:border-rose-500/20 transition-all duration-200 cursor-pointer overflow-hidden backdrop-blur-md"
          title={collapsed ? 'Logout' : undefined}
        >
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
            <LogOut size={18} className="transition-transform duration-200 group-hover:scale-110" />
          </div>
          <span
            className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              collapsed
                ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                : 'max-w-[130px] opacity-100 translate-x-0 ml-2.5'
            } text-[13.5px] font-medium flex-1`}
          >
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}

// Desktop Sidebar (Liquid Glass Material)
export function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`hidden lg:flex flex-col bg-[#0B0F1A]/75 backdrop-blur-2xl border-r border-white/10 shadow-[4px_0_32px_rgba(0,0,0,0.5)] transition-[width,min-width,max-width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width] flex-shrink-0 h-full relative z-30 no-print select-none ${
        collapsed ? 'w-16 min-w-[64px] max-w-[64px]' : 'w-[216px] min-w-[216px] max-w-[216px]'
      }`}
    >
      <div className="relative flex flex-col h-full w-full overflow-hidden">
        <SidebarContent collapsed={collapsed} onToggle={onToggle} />
      </div>
    </aside>
  );
}

// Mobile Drawer (Liquid Glass Modal Surface)
export function MobileDrawer({ open, onClose }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 no-print">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-[#0B0F1A]/90 backdrop-blur-2xl border-r border-white/10 shadow-2xl animate-slide-in-right">
            <SidebarContent onClose={onClose} onToggle={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
