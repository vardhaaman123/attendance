import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { useEffect } from 'react';
import { initializeSeedData } from './data/seedData';

import AppLayout from './components/layout/AppLayout';
import LoginPage from './components/auth/LoginPage';
import Dashboard from './components/dashboard/Dashboard';
import TakeAttendance from './components/attendance/TakeAttendance';
import AttendanceHistory from './components/attendance/AttendanceHistory';
import StudentList from './components/students/StudentList';
import Reports from './components/reports/Reports';
import Classes from './components/classes/Classes';
import Settings from './components/settings/Settings';

function SeedInitializer({ children }) {
  useEffect(() => {
    initializeSeedData();
  }, []);
  return children;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Loading Attendify...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SeedInitializer>
          <AppProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="attendance" element={<TakeAttendance />} />
                  <Route path="history" element={<AttendanceHistory />} />
                  <Route path="students" element={<StudentList />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="classes" element={<Classes />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </AppProvider>
        </SeedInitializer>
      </AuthProvider>
    </ThemeProvider>
  );
}
