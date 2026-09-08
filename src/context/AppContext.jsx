import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [settings, setSettings] = useState({ schoolName: 'Delhi Public School', teacherName: 'Mrs. Anjali Sharma', notifications: true });
  const [toasts, setToasts] = useState([]);
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');

  // Load from localStorage
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('attendify_students') || '[]');
      setStudents(s);
    } catch {}
    try {
      const r = JSON.parse(localStorage.getItem('attendify_attendance') || '{}');
      setAttendanceRecords(r);
    } catch {}
    try {
      const cfg = JSON.parse(localStorage.getItem('attendify_settings') || '{}');
      setSettings(prev => ({ ...prev, ...cfg }));
    } catch {}
  }, []);

  // Persist students
  const saveStudents = useCallback((updated) => {
    setStudents(updated);
    localStorage.setItem('attendify_students', JSON.stringify(updated));
  }, []);

  // Persist attendance
  const saveAttendanceRecord = useCallback((key, record) => {
    setAttendanceRecords(prev => {
      const updated = { ...prev, [key]: record };
      localStorage.setItem('attendify_attendance', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteAttendanceRecord = useCallback((key) => {
    setAttendanceRecords(prev => {
      const updated = { ...prev };
      delete updated[key];
      localStorage.setItem('attendify_attendance', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Persist settings
  const saveSettings = useCallback((updated) => {
    setSettings(updated);
    localStorage.setItem('attendify_settings', JSON.stringify(updated));
  }, []);

  // Toast system
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      students, saveStudents,
      attendanceRecords, saveAttendanceRecord, deleteAttendanceRecord,
      settings, saveSettings,
      toasts, addToast, removeToast,
      selectedClass, setSelectedClass,
      selectedSection, setSelectedSection,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
