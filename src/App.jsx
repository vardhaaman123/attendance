import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { useEffect } from 'react';
import { initializeSeedData } from './data/seedData';

import ErrorBoundary from './components/ui/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import RoleSelectorPage from './components/auth/RoleSelectorPage';
import LoginPage from './components/auth/LoginPage';
import TeacherLoginPage from './components/auth/TeacherLoginPage';
import StudentLoginPage from './components/auth/StudentLoginPage';

// Student pages
import StudentDashboard from './components/student-dashboard/StudentDashboard';
import StudentProfile from './components/student-dashboard/StudentProfile';
import StudentMarks from './components/student-dashboard/StudentMarks';
import StudentPassword from './components/student-dashboard/StudentPassword';



// Staff pages
import Dashboard from './components/dashboard/Dashboard';
import TakeAttendance from './components/attendance/TakeAttendance';
import AttendanceHistory from './components/attendance/AttendanceHistory';
import StudentList from './components/students/StudentList';
import Reports from './components/reports/Reports';
import Marks from './components/marks/Marks';
import Messages from './components/messages/Messages';
import Settings from './components/settings/Settings';
import TeacherList from './components/teachers/TeacherList';
import TeacherPassword from './components/teachers/TeacherPassword';



function SeedInitializer({ children }) {
  useEffect(() => {
    // initializeSeedData is async — it uploads seed data to Firestore if empty
    initializeSeedData().catch((err) =>
      console.error('[SeedInitializer] Failed to seed Firestore:', err)
    );
  }, []);
  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06080E] relative overflow-hidden select-none">
      <div className="absolute w-96 h-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="relative px-7 py-6 rounded-3xl bg-[#0B0F1A]/85 backdrop-blur-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-400 rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-300 tracking-wide">Loading Attendify...</p>
      </div>
    </div>
  );
}

// Any logged-in user (admin, teacher, or student)
function PrivateRoute({ children }) {
  const { role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!role) return <Navigate to="/" replace />;
  return children;
}

// Admin-only
function AdminRoute({ children }) {
  const { role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// Teacher-only (attendance recording is restricted strictly to teachers; admins redirected to /history)
function TeacherRoute({ children }) {
  const { role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (role === 'admin') return <Navigate to="/history" replace />;
  if (role !== 'teacher') return <Navigate to="/student-dashboard" replace />;
  return children;
}

// Staff-only (admin or teacher): students are redirected to their dashboard
function StaffRoute({ children }) {
  const { role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (role === 'student') return <Navigate to="/student-dashboard" replace />;
  return children;
}

// Redirect already-logged-in users away from login pages
function GuestRoute({ children }) {
  const { role, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (role) return <Navigate to={role === 'student' ? '/student-dashboard' : '/dashboard'} replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SeedInitializer>
            <AppProvider>
              <BrowserRouter>
                <Routes>
                  {/* ── Public: Role selector ── */}
                  <Route path="/" element={<GuestRoute><RoleSelectorPage /></GuestRoute>} />

                  {/* ── Login routes ── */}
                  <Route path="/student-login" element={<GuestRoute><StudentLoginPage /></GuestRoute>} />
                  <Route path="/teacher-login" element={<GuestRoute><TeacherLoginPage /></GuestRoute>} />
                  <Route path="/admin-login"   element={<GuestRoute><LoginPage /></GuestRoute>} />
                  <Route path="/login"         element={<GuestRoute><LoginPage /></GuestRoute>} />

                  {/* ── All roles share the same AppLayout ── */}
                  <Route
                    path="/"
                    element={<PrivateRoute><AppLayout /></PrivateRoute>}
                  >
                    {/* Student-only pages */}
                    <Route path="student-dashboard" element={<StudentDashboard />} />
                    <Route path="my-profile"        element={<StudentProfile />} />
                    <Route path="my-marks"          element={<StudentMarks />} />
                    <Route path="my-password"       element={<StudentPassword />} />


                    {/* Shared pages accessible to all authenticated users (Student, Teacher, Admin) */}
                    <Route path="messages"          element={<Messages />} />

                    {/* Teacher + Admin pages (blocked for students) */}
                    <Route path="dashboard"  element={<StaffRoute><Dashboard /></StaffRoute>} />
                    <Route path="attendance" element={<TeacherRoute><TakeAttendance /></TeacherRoute>} />
                    <Route path="students"   element={<StaffRoute><StudentList /></StaffRoute>} />
                    <Route path="history"           element={<StaffRoute><AttendanceHistory /></StaffRoute>} />
                    <Route path="reports"           element={<StaffRoute><Reports /></StaffRoute>} />
                    <Route path="marks"             element={<StaffRoute><Marks /></StaffRoute>} />
                    <Route path="teacher-password"  element={<StaffRoute><TeacherPassword /></StaffRoute>} />

                    {/* Admin-only */}
                    <Route path="teachers" element={<AdminRoute><TeacherList /></AdminRoute>} />
                    <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </AppProvider>
          </SeedInitializer>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
