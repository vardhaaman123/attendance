import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, MobileDrawer } from './Sidebar';
import Header from './Header';
import ToastContainer from '../ui/ToastContainer';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-navy-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* Mobile Drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
