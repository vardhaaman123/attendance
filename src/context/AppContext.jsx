import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { filterValidExams } from '../utils/marksUtils';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [exams, setExams] = useState([]);
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
      const t = JSON.parse(localStorage.getItem('attendify_teachers') || '[]');
      setTeachers(t);
    } catch {}
    try {
      const m = JSON.parse(localStorage.getItem('attendify_messages') || '[]');
      const now = Date.now();
      const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
      const validMessages = m.filter(msg => (now - new Date(msg.timestamp).getTime()) < FORTY_EIGHT_HOURS);
      
      if (validMessages.length !== m.length) {
        localStorage.setItem('attendify_messages', JSON.stringify(validMessages));
      }
      setMessages(validMessages);
    } catch {}
    try {
      const storedMarks = JSON.parse(localStorage.getItem('attendify_marks') || '[]');
      const validMarks = filterValidExams(storedMarks);
      if (validMarks.length !== storedMarks.length) {
        localStorage.setItem('attendify_marks', JSON.stringify(validMarks));
      }
      setExams(validMarks);
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

  // Cross-tab real-time sync: when admin/teacher updates data in one tab,
  // all other open tabs (student/teacher portals) auto-refresh instantly.
  useEffect(() => {
    const handleStorageChange = (e) => {
      try {
        if (e.key === 'attendify_students') {
          setStudents(JSON.parse(e.newValue || '[]'));
        } else if (e.key === 'attendify_teachers') {
          setTeachers(JSON.parse(e.newValue || '[]'));
        } else if (e.key === 'attendify_messages') {
          const m = JSON.parse(e.newValue || '[]');
          const now = Date.now();
          const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
          const validMessages = m.filter(msg => (now - new Date(msg.timestamp).getTime()) < FORTY_EIGHT_HOURS);
          setMessages(validMessages);
        } else if (e.key === 'attendify_marks') {
          const stored = JSON.parse(e.newValue || '[]');
          setExams(filterValidExams(stored));
        } else if (e.key === 'attendify_attendance') {
          setAttendanceRecords(JSON.parse(e.newValue || '{}'));
        } else if (e.key === 'attendify_settings') {
          setSettings(prev => ({ ...prev, ...JSON.parse(e.newValue || '{}') }));
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Recurring auto-deletion check for expired marks (>1 week) & messages (>48 hours)
  useEffect(() => {
    const runExpiryCheck = () => {
      try {
        const storedMarks = JSON.parse(localStorage.getItem('attendify_marks') || '[]');
        const validMarks = filterValidExams(storedMarks);
        if (validMarks.length !== storedMarks.length) {
          localStorage.setItem('attendify_marks', JSON.stringify(validMarks));
          setExams(validMarks);
        }
      } catch {}

      try {
        const m = JSON.parse(localStorage.getItem('attendify_messages') || '[]');
        const now = Date.now();
        const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
        const validMessages = m.filter(msg => (now - new Date(msg.timestamp).getTime()) < FORTY_EIGHT_HOURS);
        if (validMessages.length !== m.length) {
          localStorage.setItem('attendify_messages', JSON.stringify(validMessages));
          setMessages(validMessages);
        }
      } catch {}
    };

    const interval = setInterval(runExpiryCheck, 60000);
    window.addEventListener('focus', runExpiryCheck);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', runExpiryCheck);
    };
  }, []);

  // Persist exams with 1-week auto-deletion filter
  const saveExams = useCallback((updated) => {
    const valid = filterValidExams(updated);
    setExams(valid);
    localStorage.setItem('attendify_marks', JSON.stringify(valid));
  }, []);

  // Persist students
  const saveStudents = useCallback((updated) => {
    setStudents(updated);
    localStorage.setItem('attendify_students', JSON.stringify(updated));
  }, []);

  // Persist teachers
  const saveTeachers = useCallback((updated) => {
    setTeachers(updated);
    localStorage.setItem('attendify_teachers', JSON.stringify(updated));
  }, []);

  const addTeacher = useCallback((teacherData) => {
    setTeachers(prev => {
      const newTeacher = {
        id: `TCH${String(Date.now()).slice(-4)}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        ...teacherData,
      };
      const updated = [newTeacher, ...prev];
      localStorage.setItem('attendify_teachers', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addMessage = useCallback((msgData) => {
    setMessages(prev => {
      const newMsg = {
        id: `MSG${Date.now()}`,
        timestamp: new Date().toISOString(),
        reactions: {},
        ...msgData,
      };
      const updated = [...prev, newMsg];
      localStorage.setItem('attendify_messages', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteMessage = useCallback((msgId) => {
    setMessages(prev => {
      const updated = prev.filter(m => m.id !== msgId);
      localStorage.setItem('attendify_messages', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const reactToMessage = useCallback((msgId, emoji) => {
    setMessages(prev => {
      const updated = prev.map(m => {
        if (m.id !== msgId) return m;
        const currentReactions = m.reactions || {};
        const count = (currentReactions[emoji] || 0) + 1;
        return {
          ...m,
          reactions: { ...currentReactions, [emoji]: count },
        };
      });
      localStorage.setItem('attendify_messages', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markMessagesAsRead = useCallback((msgIds, userId) => {
    if (!msgIds || msgIds.length === 0) return;
    
    setMessages(prev => {
      let changed = false;
      const updated = prev.map(m => {
        if (msgIds.includes(m.id)) {
          const readBy = Array.isArray(m.readBy) ? m.readBy : [];
          if (!readBy.includes(userId)) {
            changed = true;
            return { ...m, readBy: [...readBy, userId] };
          }
        }
        return m;
      });

      if (changed) {
        localStorage.setItem('attendify_messages', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, []);

  const updateTeacher = useCallback((id, teacherData) => {
    setTeachers(prev => {
      const updated = prev.map(t => (t.id === id ? { ...t, ...teacherData } : t));
      localStorage.setItem('attendify_teachers', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteTeacher = useCallback((id) => {
    setTeachers(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem('attendify_teachers', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteClass = useCallback((targetClass) => {
    let deletedCount = 0;
    setStudents(prev => {
      let updated;
      if (targetClass === 'all') {
        deletedCount = prev.length;
        updated = [];
      } else {
        const remaining = prev.filter(s => String(s.class) !== String(targetClass));
        deletedCount = prev.length - remaining.length;
        updated = remaining;
      }
      localStorage.setItem('attendify_students', JSON.stringify(updated));
      return updated;
    });

    setAttendanceRecords(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (targetClass === 'all' || updated[key]?.class === String(targetClass)) {
          delete updated[key];
        }
      });
      localStorage.setItem('attendify_attendance', JSON.stringify(updated));
      return updated;
    });

    return deletedCount;
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
      students, saveStudents, deleteClass,
      teachers, saveTeachers, addTeacher, updateTeacher, deleteTeacher,
      messages, addMessage, deleteMessage, reactToMessage, markMessagesAsRead,
      exams, saveExams,
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
