import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardCheck, Users, History, BarChart3,
  BookOpen, Settings, LogOut, GraduationCap, ChevronLeft, ChevronRight, X, Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/attendance', label: 'Take Attendance', icon: ClipboardCheck },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/history', label: 'Attendance History', icon: History },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/classes', label: 'Classes', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ collapsed, onClose }) {
  const { logout, user } = useAuth();
  const { settings } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-100 dark:border-navy-700 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-brand-blue flex items-center justify-center flex-shrink-0">
          <GraduationCap size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy-900 dark:text-white leading-tight truncate">Attendify</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate">{settings.schoolName || 'Smart Attendance'}</p>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-500">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className={`px-3 py-4 border-t border-slate-100 dark:border-navy-700`}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-slate-50 dark:bg-navy-700">
            <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {(settings.teacherName || user?.name || 'T').split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-navy-900 dark:text-white truncate">{settings.teacherName || user?.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.role || 'Teacher'}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`nav-item w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

// Desktop Sidebar
export function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`hidden lg:flex flex-col bg-white dark:bg-navy-800 border-r border-slate-100 dark:border-navy-700 shadow-sidebar transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="relative flex flex-col h-full">
        <SidebarContent collapsed={collapsed} />
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
        >
          {collapsed ? <ChevronRight size={12} className="text-slate-500" /> : <ChevronLeft size={12} className="text-slate-500" />}
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
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-navy-800 shadow-2xl animate-slide-in-right">
            <SidebarContent onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
