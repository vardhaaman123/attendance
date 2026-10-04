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

  const roleLabel = role === 'admin' ? '🛡️ Admin' : role === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student';
  const roleColor = role === 'admin' ? 'bg-violet-500' : role === 'teacher' ? 'bg-blue-500' : 'bg-emerald-500';

  return (
    <div className="flex flex-col h-full select-none">
      {/* Logo / User Avatar */}
      <div className="h-16 flex items-center px-3.5 border-b border-slate-100 dark:border-white/10 flex-shrink-0">
        <button
          type="button"
          onClick={onToggle}
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.35)] border border-blue-400/40 flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200 group"
          title={collapsed ? "Show navigation menu" : "Collapse navigation menu"}
          aria-label={collapsed ? "Show navigation menu" : "Collapse navigation menu"}
        >
          <span className="text-white text-sm font-bold select-none group-hover:scale-110 transition-transform duration-200">
            {avatarLetter}
          </span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          collapsed
            ? 'max-h-0 opacity-0 py-0 pointer-events-none'
            : 'max-h-8 opacity-100 px-3.5 pt-2'
        }`}
      >
        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white shadow-sm whitespace-nowrap ${roleColor}`}>
          {roleLabel}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isMessages = to === '/messages';
          const hasUnread = isMessages && unreadMessagesCount > 0;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center h-10 px-2.5 rounded-xl text-[13.5px] font-medium transition-colors duration-200 cursor-pointer relative overflow-hidden ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-semibold dark:border dark:border-blue-500/30 dark:shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                }`
              }
              title={collapsed ? `${label}${hasUnread ? ` (${unreadMessagesCount} unread)` : ''}` : undefined}
            >
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center relative">
                <Icon size={19} className="transition-transform duration-200 group-hover:scale-105" />
                {collapsed && hasUnread && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0B0F19] shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
                )}
              </div>

              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  collapsed
                    ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                    : 'max-w-[130px] opacity-100 translate-x-0 ml-2.5'
                } flex-1 truncate`}
              >
                {label}
              </span>

              {!collapsed && hasUnread && (
                <span
                  className={`w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse flex-shrink-0 ml-auto transition-opacity duration-300 ${
                    collapsed ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="flex-shrink-0 px-2.5 py-2.5">
        <button
          onClick={handleLogout}
          className="group w-full flex items-center h-10 px-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 cursor-pointer overflow-hidden"
          title={collapsed ? 'Logout' : undefined}
        >
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
            <LogOut size={19} className="transition-transform duration-200 group-hover:scale-105" />
          </div>
          <span
            className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
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

// Desktop Sidebar
export function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`hidden lg:flex flex-col bg-white dark:bg-[#0B0F19]/95 backdrop-blur-xl border-r border-slate-100 dark:border-white/10 shadow-sidebar transition-[width,min-width,max-width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[width] flex-shrink-0 h-full relative z-30 no-print select-none ${
        collapsed ? 'w-16 min-w-[64px] max-w-[64px]' : 'w-[208px] min-w-[208px] max-w-[208px]'
      }`}
    >
      <div className="relative flex flex-col h-full w-full overflow-hidden">
        <SidebarContent collapsed={collapsed} onToggle={onToggle} />
      </div>
    </aside>
  );
}

// Mobile Drawer
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-[#0B0F19] border-r border-slate-100 dark:border-white/10 shadow-2xl animate-slide-in-right">
            <SidebarContent onClose={onClose} onToggle={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
