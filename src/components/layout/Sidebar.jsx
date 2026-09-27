import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardCheck, Users, History,
  BookOpen, Settings, LogOut, GraduationCap, ChevronLeft, ChevronRight,
  X, CalendarDays, UserCircle, ShieldCheck, UserCheck, MessageSquare, KeyRound,
  BarChart2
} from 'lucide-react';


import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

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

// Teachers can take attendance, see history, marks, classes, and dashboard
const teacherNav = [
  { to: '/dashboard',        label: 'Dashboard',          icon: LayoutDashboard },
  { to: '/attendance',       label: 'Take Attendance',    icon: ClipboardCheck  },
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



function SidebarContent({ collapsed, onClose }) {
  const { logout, user, role, currentStudent } = useAuth();
  const { settings } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : studentNav;

  const displayName = role === 'student'
    ? currentStudent?.name
    : role === 'admin'
      ? (settings?.teacherName || user?.name || 'Admin')
      : (user?.name || 'Teacher');

  const roleLabel = role === 'admin' ? '🛡️ Admin' : role === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student';
  const roleColor = role === 'admin' ? 'bg-violet-500' : role === 'teacher' ? 'bg-blue-500' : 'bg-emerald-500';

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`h-[70px] flex items-center gap-3 px-4 border-b border-slate-100 dark:border-white/10 flex-shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-[44px] h-[44px] rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-400/30 flex items-center justify-center flex-shrink-0">
          <GraduationCap size={24} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy-900 dark:text-white leading-tight truncate">Attendify</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate">{settings.schoolName || 'Smart Attendance'}</p>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-500 dark:text-slate-400">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 pt-2.5">
          <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white shadow-sm ${roleColor}`}>{roleLabel}</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-slate-100 dark:border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-1.5 mb-1.5 rounded-xl bg-slate-50 dark:bg-[#111726]/80 border border-slate-100 dark:border-white/[0.08] h-[60px]">
            <div className={`w-[40px] h-[40px] rounded-full ${roleColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <span className="text-white text-xs font-bold">
                {(displayName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-navy-900 dark:text-white truncate">{displayName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate capitalize">
                {role === 'teacher' && user?.class ? `Class ${user.class}-${user.section} Teacher` : role}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`nav-item w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

// Desktop Sidebar
export function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`hidden lg:flex flex-col bg-white dark:bg-[#0B0F19]/95 backdrop-blur-xl border-r border-slate-100 dark:border-white/10 shadow-sidebar transition-all duration-300 flex-shrink-0 h-full relative z-30 no-print ${collapsed ? 'w-16' : 'w-[250px] min-w-[250px] max-w-[250px]'}`}>
      <div className="relative flex flex-col h-full w-full">
        <SidebarContent collapsed={collapsed} />
        <button
          onClick={onToggle}
          className="absolute -right-3 top-[52px] w-6 h-6 bg-white dark:bg-[#111726] border border-slate-200 dark:border-white/20 rounded-full flex items-center justify-center shadow-md hover:shadow-lg text-slate-500 dark:text-slate-300 hover:text-white transition-all z-40 cursor-pointer"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
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
            <SidebarContent onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
