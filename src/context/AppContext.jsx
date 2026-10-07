import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { filterValidExams } from '../utils/marksUtils';
import { getTeacherScope } from '../utils/teacherScope';
import {
  saveDoc,
  deleteDoc as fsDeleteDoc,
  saveSettings as fsSaveSettings,
  subscribeCollection,
  subscribeSettings,
  batchSaveCollection,
  batchDeleteCollection,
  saveUserLookup,
  deleteUserLookup,
  getUserLookup,
  fetchCollection,
  fetchSettings,
  getActiveSchoolId,
  broadcastLiveEvent,
  listenLiveEvents,
} from '../services/firestoreService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { activeCollegeId, role, user } = useAuth();
  const [students, setStudents] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = window.localStorage.getItem('_attendify_students_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (_) {}
    return [];
  });

  const [teachers, setTeachers] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = window.localStorage.getItem('_attendify_teachers_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (_) {}
    return [];
  });

  // Keep localStorage cache and users lookup synchronized with latest students
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && Array.isArray(students) && students.length > 0) {
        window.localStorage.setItem('_attendify_students_cache', JSON.stringify(students));
        const raw = window.localStorage.getItem('_attendify_users_lookup');
        const map = raw ? JSON.parse(raw) : {};
        students.forEach((s) => {
          const payload = {
            role: 'student',
            collegeId: s.collegeId || 'dps_main',
            entityId: s.id || s._docId,
            id: s.id || s._docId,
            name: s.name,
            rollNumber: s.rollNumber,
            class: s.class,
            section: s.section,
            password: s.password || '1234',
            email: s.email || s.parentEmail || '',
            parentEmail: s.parentEmail || s.email || '',
            updatedAt: new Date().toISOString(),
          };
          if (s.email) map[s.email.trim().toLowerCase()] = { identifier: s.email.trim().toLowerCase(), ...payload };
          if (s.parentEmail) map[s.parentEmail.trim().toLowerCase()] = { identifier: s.parentEmail.trim().toLowerCase(), ...payload };
          if (s.rollNumber) {
            const rawRoll = String(s.rollNumber).trim().toLowerCase();
            map[rawRoll] = { identifier: rawRoll, ...payload };
            const stripped = rawRoll.replace(/^0+/, '');
            if (stripped) map[stripped] = { identifier: stripped, ...payload };
          }
        });
        window.localStorage.setItem('_attendify_users_lookup', JSON.stringify(map));
      }
    } catch (_) {}
  }, [students]);

  // Keep localStorage cache and users lookup synchronized with latest teachers
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && Array.isArray(teachers) && teachers.length > 0) {
        window.localStorage.setItem('_attendify_teachers_cache', JSON.stringify(teachers));
        const raw = window.localStorage.getItem('_attendify_users_lookup');
        const map = raw ? JSON.parse(raw) : {};
        teachers.forEach((t) => {
          if (t.email) {
            const cleanEmail = t.email.trim().toLowerCase();
            map[cleanEmail] = {
              identifier: cleanEmail,
              role: 'teacher',
              collegeId: t.collegeId || 'dps_main',
              entityId: t.id || t._docId,
              id: t.id || t._docId,
              name: t.name,
              class: t.class,
              section: t.section,
              subject: t.subject || '',
              contact: t.contact || '',
              password: t.password || 'teacher123',
              updatedAt: new Date().toISOString(),
            };
          }
        });
        window.localStorage.setItem('_attendify_users_lookup', JSON.stringify(map));
      }
    } catch (_) {}
  }, [teachers]);

  const [messages, setMessages] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = window.localStorage.getItem('_attendify_messages_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (_) {}
    return [];
  });

  // Keep localStorage cache synchronized with latest messages
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && Array.isArray(messages) && messages.length > 0) {
        window.localStorage.setItem('_attendify_messages_cache', JSON.stringify(messages));
      }
    } catch (_) {}
  }, [messages]);

  const [exams, setExams] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = window.localStorage.getItem('_attendify_attendance_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      }
    } catch (_) {}
    return {};
  });

  // Keep localStorage cache synchronized with latest attendance records
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && attendanceRecords && typeof attendanceRecords === 'object' && Object.keys(attendanceRecords).length > 0) {
        window.localStorage.setItem('_attendify_attendance_cache', JSON.stringify(attendanceRecords));
      }
    } catch (_) {}
  }, [attendanceRecords]);
  const [settings, setSettings] = useState({
    schoolName: '',
    collegeName: '',
    teacherName: '',
    principleName: '',
    adminEmail: '',
    notifications: true,
  });
  const [toasts, setToasts] = useState([]);
  const [selectedClass, setSelectedClass] = useState('10');
  const [selectedSection, setSelectedSection] = useState('A');

  // Enforce teacher assigned scope for selected class and section
  useEffect(() => {
    if (role === 'teacher' && user) {
      const scope = getTeacherScope(user, role);
      if (scope.isRestricted) {
        if (scope.allowedClasses.length > 0 && !scope.isClassAllowed(selectedClass)) {
          setSelectedClass(scope.defaultClass);
        }
        if (scope.allowedSections.length > 0 && !scope.isSectionAllowed(selectedSection)) {
          setSelectedSection(scope.defaultSection);
        }
      }
    }
  }, [role, user, selectedClass, selectedSection]);
  const [firestoreReady, setFirestoreReady] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (
          window.localStorage.getItem('_attendify_students_cache') ||
          window.localStorage.getItem('_attendify_teachers_cache') ||
          window.localStorage.getItem('_attendify_attendance_cache')
        ) {
          return true;
        }
      }
    } catch (_) {}
    return false;
  });

  // Fast safety fallback: ensure firestoreReady resolves smoothly within 350ms on any network
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setFirestoreReady(true);
    }, 350);
    return () => clearTimeout(safetyTimer);
  }, []);
  const [recentlyUpdatedTeacherId, setRecentlyUpdatedTeacherId] = useState(null);
  const [recentlyUpdatedStudentId, setRecentlyUpdatedStudentId] = useState(null);
  const [lastLiveSyncTime, setLastLiveSyncTime] = useState(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // ── Toast system (UI only) ──
  const addToast = useCallback((messageOrObj, type = 'success') => {
    let msg = messageOrObj;
    let toastType = type;
    if (typeof messageOrObj === 'object' && messageOrObj !== null) {
      msg = messageOrObj.message || messageOrObj.text || JSON.stringify(messageOrObj);
      if (messageOrObj.type) toastType = messageOrObj.type;
    }
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message: String(msg ?? ''), type: toastType }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Dynamic tenant resolver helper
  const getTargetCollege = useCallback(() => {
    return activeCollegeId || user?.collegeId || getActiveSchoolId() || 'dps_main';
  }, [activeCollegeId, user?.collegeId]);

  // ── Manual & automatic safe refresh for teachers ──
  const refreshTeachers = useCallback(async () => {
    try {
      const targetCollege = getTargetCollege();
      let freshTeachers = await fetchCollection('teachers', targetCollege);
      if ((!freshTeachers || freshTeachers.length === 0) && targetCollege !== 'dps_main') {
        freshTeachers = await fetchCollection('teachers', 'dps_main');
      }
      if (!freshTeachers || freshTeachers.length === 0) {
        try {
          const cached = window.localStorage.getItem('_attendify_teachers_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) freshTeachers = parsed;
          }
        } catch (_) {}
      }
      if (freshTeachers && freshTeachers.length > 0) {
        setTeachers(freshTeachers);
        setLastLiveSyncTime(new Date());
        return freshTeachers;
      }
    } catch (e) {
      console.warn('[AppContext] refreshTeachers error:', e);
    }
    return [];
  }, [getTargetCollege]);

  // ── Manual & automatic safe refresh for students ──
  const refreshStudents = useCallback(async () => {
    try {
      const targetCollege = getTargetCollege();
      let freshStudents = await fetchCollection('students', targetCollege);
      if ((!freshStudents || freshStudents.length === 0) && targetCollege !== 'dps_main') {
        freshStudents = await fetchCollection('students', 'dps_main');
      }
      if (!freshStudents || freshStudents.length === 0) {
        try {
          const cached = window.localStorage.getItem('_attendify_students_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) freshStudents = parsed;
          }
        } catch (_) {}
      }
      if (freshStudents && freshStudents.length > 0) {
        setStudents(freshStudents);
        setLastLiveSyncTime(new Date());
        return freshStudents;
      }
    } catch (e) {
      console.warn('[AppContext] refreshStudents error:', e);
    }
    return [];
  }, [getTargetCollege]);

  // ── Manual & automatic safe refresh for attendance records ──
  const refreshAttendance = useCallback(async () => {
    try {
      const targetCollege = getTargetCollege();
      let freshAttendance = await fetchCollection('attendance', targetCollege);
      if ((!freshAttendance || freshAttendance.length === 0) && targetCollege !== 'dps_main') {
        freshAttendance = await fetchCollection('attendance', 'dps_main');
      }
      if (freshAttendance && freshAttendance.length > 0) {
        const obj = {};
        freshAttendance.forEach((item) => {
          const key = item.id || item._docId;
          const { id, _docId, ...rest } = item;
          let date = rest.date;
          let cls = rest.class;
          let sec = rest.section;
          if ((!date || !cls || !sec) && typeof key === 'string' && key.includes('_')) {
            const parts = key.split('_');
            if (parts.length >= 3) {
              date = date || parts[0];
              cls = cls || parts[1];
              sec = sec || parts[2];
            }
          }
          obj[key] = { id: key, ...rest, date, class: cls, section: sec };
        });
        setAttendanceRecords(obj);
        return obj;
      }
    } catch (e) {
      console.warn('[AppContext] refreshAttendance error:', e);
    }
    return {};
  }, [getTargetCollege]);

  // ── Real-time Firestore listeners scoped to active college tenant ──
  useEffect(() => {
    let readyCount = 0;
    const TOTAL = 5; // teachers, students, attendance, marks, messages
    const markReady = () => {
      readyCount++;
      if (readyCount >= TOTAL) setFirestoreReady(true);
    };

    const targetCollege = getTargetCollege();
    let isMounted = true;
    let teachersHydrated = false;
    let studentsHydrated = false;
    let attendanceHydrated = false;
    let marksHydrated = false;
    let messagesHydrated = false;

    const unsubTeachers = subscribeCollection('teachers', async (data) => {
      if (!isMounted) return;
      if (data === null) {
        // Listener error / offline: retain current teachers and check cache if empty
        setTeachers((prev) => {
          if (prev && prev.length > 0) return prev;
          try {
            const cached = window.localStorage.getItem('_attendify_teachers_cache');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
          } catch (_) {}
          return prev;
        });
        markReady();
        return;
      }

      let currentData = data;
      if ((!currentData || currentData.length === 0) && !teachersHydrated) {
        teachersHydrated = true;
        try {
          const altCollege = targetCollege !== 'dps_main' ? 'dps_main' : (activeCollegeId && activeCollegeId !== 'dps_main' ? activeCollegeId : null);
          if (altCollege) {
            const fallback = await fetchCollection('teachers', altCollege);
            if (fallback && fallback.length > 0) {
              currentData = fallback;
              batchSaveCollection('teachers', fallback, 'id', targetCollege).catch(() => {});
            }
          }
        } catch (_) {}
      }

      if (!currentData || currentData.length === 0) {
        try {
          const cached = window.localStorage.getItem('_attendify_teachers_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              currentData = parsed;
              batchSaveCollection('teachers', parsed, 'id', targetCollege).catch(() => {});
            }
          }
        } catch (_) {}
      }

      if (currentData) {
        setTeachers(currentData);
      }
      markReady();
    }, targetCollege);

    const unsubStudents = subscribeCollection('students', async (data) => {
      if (!isMounted) return;
      if (data === null) {
        // Listener error / offline: retain current students and check cache if empty
        setStudents((prev) => {
          if (prev && prev.length > 0) return prev;
          try {
            const cached = window.localStorage.getItem('_attendify_students_cache');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
          } catch (_) {}
          return prev;
        });
        markReady();
        return;
      }

      let currentData = data;
      if ((!currentData || currentData.length === 0) && !studentsHydrated) {
        studentsHydrated = true;
        try {
          const altCollege = targetCollege !== 'dps_main' ? 'dps_main' : (activeCollegeId && activeCollegeId !== 'dps_main' ? activeCollegeId : null);
          if (altCollege) {
            const fallback = await fetchCollection('students', altCollege);
            if (fallback && fallback.length > 0) {
              currentData = fallback;
              batchSaveCollection('students', fallback, 'id', targetCollege).catch(() => {});
            }
          }
        } catch (_) {}
      }

      if (!currentData || currentData.length === 0) {
        try {
          const cached = window.localStorage.getItem('_attendify_students_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              currentData = parsed;
              batchSaveCollection('students', parsed, 'id', targetCollege).catch(() => {});
            }
          }
        } catch (_) {}
      }

      if (currentData) {
        setStudents(currentData);
      }
      markReady();
    }, targetCollege);

    const unsubAttendance = subscribeCollection('attendance', async (data) => {
      if (!isMounted) return;
      let currentData = data;
      if ((!currentData || currentData.length === 0) && targetCollege !== 'dps_main' && !attendanceHydrated) {
        attendanceHydrated = true;
        try {
          const fallback = await fetchCollection('attendance', 'dps_main');
          if (fallback && fallback.length > 0) {
            currentData = fallback;
            batchSaveCollection('attendance', fallback, 'id', targetCollege).catch(() => {});
          }
        } catch (_) {}
      }
      // Convert array back to keyed object { [recordKey]: recordData }
      const obj = {};
      (currentData || []).forEach((item) => {
        const key = item.id || item._docId;
        // eslint-disable-next-line no-unused-vars
        const { id, _docId, ...rest } = item;
        let date = rest.date;
        let cls = rest.class;
        let sec = rest.section;
        if ((!date || !cls || !sec) && typeof key === 'string' && key.includes('_')) {
          const parts = key.split('_');
          if (parts.length >= 3) {
            date = date || parts[0];
            cls = cls || parts[1];
            sec = sec || parts[2];
          }
        }
        obj[key] = { id: key, ...rest, date, class: cls, section: sec };
      });
      setAttendanceRecords(obj);
      markReady();
    }, targetCollege);

    const unsubMarks = subscribeCollection('marks', async (data) => {
      if (!isMounted) return;
      let currentData = data;
      if ((!currentData || currentData.length === 0) && targetCollege !== 'dps_main' && !marksHydrated) {
        marksHydrated = true;
        try {
          const fallback = await fetchCollection('marks', 'dps_main');
          if (fallback && fallback.length > 0) {
            currentData = fallback;
            batchSaveCollection('marks', fallback, 'id', targetCollege).catch(() => {});
          }
        } catch (_) {}
      }
      const valid = filterValidExams(currentData);
      setExams(valid || []);
      markReady();
    }, targetCollege);

    const unsubMessages = subscribeCollection('messages', async (data) => {
      if (!isMounted) return;
      let currentData = data;
      if ((!currentData || currentData.length === 0) && targetCollege !== 'dps_main' && !messagesHydrated) {
        messagesHydrated = true;
        try {
          const fallback = await fetchCollection('messages', 'dps_main');
          if (fallback && fallback.length > 0) {
            currentData = fallback;
            batchSaveCollection('messages', fallback, 'id', targetCollege).catch(() => {});
          }
        } catch (_) {}
      }
      setMessages((prev) => {
        if (!currentData || currentData.length === 0) {
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              const cached = window.localStorage.getItem('_attendify_messages_cache');
              if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
              }
            }
          } catch (_) {}
          return prev;
        }
        const map = new Map();
        (currentData || []).forEach((m) => {
          const id = m.id || m._docId;
          if (id) map.set(id, m);
        });
        prev.forEach((m) => {
          const id = m.id || m._docId;
          if (id && !map.has(id)) {
            map.set(id, m);
          }
        });
        const merged = Array.from(map.values());
        try {
          if (typeof window !== 'undefined' && window.localStorage && merged.length > 0) {
            window.localStorage.setItem('_attendify_messages_cache', JSON.stringify(merged));
          }
        } catch (_) {}
        return merged;
      });
      markReady();
    }, targetCollege);

    const unsubSettings = subscribeSettings(async (data) => {
      if (!isMounted) return;
      if ((!data || !data.schoolName) && targetCollege !== 'dps_main') {
        try {
          const fallback = await fetchSettings('dps_main');
          if (fallback && fallback.schoolName) {
            fsSaveSettings(fallback, targetCollege).catch(() => {});
            setSettings((prev) => ({ ...prev, ...fallback }));
            return;
          }
        } catch (_) {}
      }
      setSettings((prev) => ({ ...prev, ...data }));
    }, targetCollege);

    return () => {
      isMounted = false;
      unsubTeachers();
      unsubStudents();
      unsubAttendance();
      unsubMarks();
      unsubMessages();
      unsubSettings();
    };
  }, [activeCollegeId, user?.uid, user?.email, user?.collegeId, role, getTargetCollege]);

  // ── Real-time Cross-Tab & Device Live Event Sync ──
  useEffect(() => {
    const unsubLive = listenLiveEvents((event) => {
      if (!event || !event.type) return;

      if (event.type === 'TEACHER_PASSWORD_UPDATED' || event.type === 'TEACHER_DATA_UPDATED') {
        const { teacherId, email, name, password, collegeId } = event.payload || {};
        const targetCollege = getTargetCollege();

        // Cross-college filter: ignore if collegeId is specified and does not match active college
        if (collegeId && targetCollege && collegeId !== targetCollege) {
          return;
        }

        const cleanEmail = (email || '').trim().toLowerCase();
        const idStr = teacherId ? String(teacherId).trim() : '';

        setTeachers((prev) => {
          let found = false;
          const next = prev.map((t) => {
            const tId = t.id || t._docId;
            const matchesId = idStr && (tId === idStr || String(t.id) === idStr);
            const matchesEmail = cleanEmail && t.email && t.email.trim().toLowerCase() === cleanEmail;

            if (matchesId || matchesEmail) {
              found = true;
              return {
                ...t,
                ...(password ? { password } : {}),
                ...(event.payload?.teacherData || {}),
                _liveUpdatedAt: Date.now(),
              };
            }
            return t;
          });

          // If not found in current local list, fetch fresh list from Firestore
          if (!found) {
            refreshTeachers().catch(() => {});
          }
          return next;
        });

        if (idStr) {
          setRecentlyUpdatedTeacherId(idStr);
          setTimeout(() => {
            setRecentlyUpdatedTeacherId((curr) => (curr === idStr ? null : curr));
          }, 6000);
        }

        setLastLiveSyncTime(new Date());

        // Notify user if admin
        const isUserAdmin = role === 'admin' || role === 'Admin';
        if (isUserAdmin) {
          const teacherLabel = name || email || 'Teacher';
          addToast(`Live sync: ${teacherLabel}'s password was updated.`, 'info');
        }
      }

      if (event.type === 'STUDENT_PASSWORD_UPDATED' || event.type === 'STUDENT_DATA_UPDATED') {
        const { studentId, rollNumber, email, name, password, collegeId } = event.payload || {};
        const targetCollege = getTargetCollege();

        // Cross-college filter: ignore if collegeId is specified and does not match active college
        if (collegeId && targetCollege && collegeId !== targetCollege) {
          return;
        }

        const cleanRoll = rollNumber ? String(rollNumber).trim().toLowerCase() : '';
        const cleanEmail = (email || '').trim().toLowerCase();
        const idStr = studentId ? String(studentId).trim() : '';

        setStudents((prev) => {
          let found = false;
          const next = prev.map((s) => {
            const sId = s.id || s._docId;
            const matchesId = idStr && (sId === idStr || String(s.id) === idStr);
            const matchesRoll = cleanRoll && s.rollNumber && String(s.rollNumber).trim().toLowerCase() === cleanRoll;
            const matchesEmail = cleanEmail && s.email && s.email.trim().toLowerCase() === cleanEmail;

            if (matchesId || matchesRoll || matchesEmail) {
              found = true;
              return {
                ...s,
                ...(password ? { password } : {}),
                ...(event.payload?.studentData || {}),
                _liveUpdatedAt: Date.now(),
              };
            }
            return s;
          });

          // If not found in current local list, fetch fresh list from Firestore
          if (!found) {
            refreshStudents().catch(() => {});
          }
          return next;
        });

        const pulseId = idStr || cleanRoll;
        if (pulseId) {
          setRecentlyUpdatedStudentId(pulseId);
          setTimeout(() => {
            setRecentlyUpdatedStudentId((curr) => (curr === pulseId ? null : curr));
          }, 6000);
        }

        setLastLiveSyncTime(new Date());

        // Notify user if admin or teacher
        const isUserAdminOrTeacher = role === 'admin' || role === 'Admin' || role === 'teacher' || role === 'Teacher';
        if (isUserAdminOrTeacher) {
          const studentLabel = name || rollNumber || email || 'Student';
          addToast(`Live sync: ${studentLabel}'s password was updated.`, 'info');
        }
      }

      // ── REALTIME MESSAGE SYNC ──
      if (event.type === 'MESSAGE_SENT') {
        const { message } = event.payload || {};
        if (message && message.id) {
          setMessages((prev) => {
            if (prev.some((m) => (m.id || m._docId) === (message.id || message._docId))) {
              return prev;
            }
            const next = [...prev, message];
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem('_attendify_messages_cache', JSON.stringify(next));
              }
            } catch (_) {}
            return next;
          });
        }
      }

      if (event.type === 'CACHE_SYNC' || event.type === 'CACHE_POLL') {
        const incoming = event.payload?.messages;
        if (Array.isArray(incoming) && incoming.length > 0) {
          setMessages((prev) => {
            const prevIds = new Set(prev.map((m) => m.id || m._docId));
            const hasNew = incoming.some((m) => !prevIds.has(m.id || m._docId));
            // Check if any message attributes (e.g. reactions or readBy) changed
            let hasChanged = hasNew;
            if (!hasChanged && prev.length === incoming.length) {
              return prev;
            }
            const map = new Map();
            prev.forEach((m) => {
              const id = m.id || m._docId;
              if (id) map.set(id, m);
            });
            incoming.forEach((m) => {
              const id = m.id || m._docId;
              if (id) {
                if (map.has(id)) {
                  map.set(id, { ...map.get(id), ...m });
                } else {
                  map.set(id, m);
                }
              }
            });
            return Array.from(map.values());
          });
        }
      }

      if (event.type === 'MESSAGE_DELETED') {
        const { msgId } = event.payload || {};
        if (msgId) {
          setMessages((prev) => prev.filter((m) => (m.id || m._docId) !== msgId));
        }
      }

      if (event.type === 'MESSAGE_REACTION') {
        const { msgId, reactions } = event.payload || {};
        if (msgId && reactions) {
          setMessages((prev) =>
            prev.map((m) => ((m.id || m._docId) === msgId ? { ...m, reactions } : m))
          );
        }
      }

      if (event.type === 'MESSAGES_READ') {
        const { msgIds, userId } = event.payload || {};
        if (Array.isArray(msgIds) && userId) {
          setMessages((prev) =>
            prev.map((m) => {
              if (msgIds.includes(m.id || m._docId)) {
                const readBy = Array.isArray(m.readBy) ? m.readBy : [];
                if (!readBy.includes(userId)) {
                  return { ...m, readBy: [...readBy, userId] };
                }
              }
              return m;
            })
          );
        }
      }
    });

    return () => {
      unsubLive();
    };
  }, [getTargetCollege, refreshTeachers, refreshStudents, role, addToast]);

  // ── Persist exams ──
  const saveExams = useCallback(async (updated) => {
    const targetCollege = getTargetCollege();
    const valid = filterValidExams(updated);
    setExams(valid);

    // Track deletions: if any exam currently in state is NOT in updated, delete it from Firestore
    const newIds = new Set(valid.map((e) => e.id || e._docId));
    const toDeleteIds = exams
      .map((e) => e.id || e._docId)
      .filter((id) => id && !newIds.has(id));

    if (toDeleteIds.length > 0) {
      await batchDeleteCollection('marks', toDeleteIds, targetCollege);
    }

    // Save/update all valid exams
    for (const exam of valid) {
      const id = exam.id || exam._docId;
      if (id) {
        await saveDoc('marks', String(id), { ...exam, collegeId: targetCollege }, targetCollege);
      }
    }
  }, [exams, getTargetCollege]);

  const deleteExam = useCallback(async (examId) => {
    const targetCollege = getTargetCollege();
    setExams((prev) => prev.filter((e) => (e.id || e._docId) !== examId));
    await fsDeleteDoc('marks', String(examId), targetCollege);
  }, [getTargetCollege]);

  const clearAllExams = useCallback(async () => {
    const targetCollege = getTargetCollege();
    const ids = exams.map((e) => e.id || e._docId).filter(Boolean);
    setExams([]);
    if (ids.length > 0) {
      await batchDeleteCollection('marks', ids, targetCollege);
    }
  }, [exams, getTargetCollege]);

  // ── Persist students (bulk replace) ──
  const saveStudents = useCallback(async (updated) => {
    const targetCollege = getTargetCollege();
    setStudents(updated);
    await batchSaveCollection('students', updated, 'id', targetCollege);
    // Index each student in users_lookup
    for (const s of updated) {
      const studentId = s.id || s._docId;
      const lookupPayload = {
        role: 'student',
        collegeId: targetCollege,
        entityId: studentId,
        id: studentId,
        name: s.name,
        rollNumber: s.rollNumber,
        class: s.class,
        section: s.section,
        password: s.password || '1234',
      };
      if (s.email) {
        saveUserLookup(s.email, { identifier: s.email.trim().toLowerCase(), ...lookupPayload }).catch(console.warn);
      }
      if (s.parentEmail && s.parentEmail !== s.email) {
        saveUserLookup(s.parentEmail, { identifier: s.parentEmail.trim().toLowerCase(), ...lookupPayload }).catch(console.warn);
      }
      if (s.rollNumber) {
        const rawRoll = String(s.rollNumber).trim();
        saveUserLookup(rawRoll, { identifier: rawRoll.toLowerCase(), ...lookupPayload }).catch(console.warn);
        const stripped = rawRoll.replace(/^0+/, '');
        if (stripped && stripped !== rawRoll) {
          saveUserLookup(stripped, { identifier: stripped.toLowerCase(), ...lookupPayload }).catch(console.warn);
        }
      }
    }
  }, [getTargetCollege]);

  // ── Add single student ──
  const addStudent = useCallback(async (studentData) => {
    const targetCollege = getTargetCollege();
    const newStudent = {
      id: `STU_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      collegeId: targetCollege,
      status: 'active',
      password: studentData.password || '1234',
      ...studentData,
    };
    if (!newStudent.email) {
      newStudent.email = `${(newStudent.name || 'student').toLowerCase().replace(/\s+/g, '.')}@school.edu`;
    }
    setStudents((prev) => [...prev.filter((s) => s.id !== newStudent.id), newStudent]);
    await saveDoc('students', newStudent.id, newStudent, targetCollege);

    // Save to users_lookup for email, parentEmail, and rollNumber
    const lookupPayload = {
      role: 'student',
      collegeId: targetCollege,
      entityId: newStudent.id,
      id: newStudent.id,
      name: newStudent.name,
      rollNumber: newStudent.rollNumber,
      class: newStudent.class,
      section: newStudent.section,
      password: newStudent.password || '1234',
      email: newStudent.email || newStudent.parentEmail || '',
      parentEmail: newStudent.parentEmail || newStudent.email || '',
    };
    const lookupPromises = [];
    if (newStudent.email) {
      lookupPromises.push(saveUserLookup(newStudent.email, { identifier: newStudent.email.trim().toLowerCase(), ...lookupPayload }));
    }
    if (newStudent.parentEmail && newStudent.parentEmail !== newStudent.email) {
      lookupPromises.push(saveUserLookup(newStudent.parentEmail, { identifier: newStudent.parentEmail.trim().toLowerCase(), ...lookupPayload }));
    }
    if (newStudent.rollNumber) {
      const rawRoll = String(newStudent.rollNumber).trim();
      lookupPromises.push(saveUserLookup(rawRoll, { identifier: rawRoll.toLowerCase(), ...lookupPayload }));
      const stripped = rawRoll.replace(/^0+/, '');
      if (stripped && stripped !== rawRoll) {
        lookupPromises.push(saveUserLookup(stripped, { identifier: stripped.toLowerCase(), ...lookupPayload }));
      }
    }
    if (lookupPromises.length > 0) {
      await Promise.allSettled(lookupPromises);
    }
    return newStudent;
  }, [getTargetCollege]);

  // ── Update single student ──
  const updateStudent = useCallback(async (id, studentData) => {
    const targetCollege = studentData?.collegeId || getTargetCollege() || 'dps_main';

    const idStr = id ? String(id).trim() : '';
    const rollStr = studentData?.rollNumber ? String(studentData.rollNumber).trim().toLowerCase() : '';
    const emailStr = studentData?.email ? String(studentData.email).trim().toLowerCase() : '';
    const parentEmailStr = studentData?.parentEmail ? String(studentData.parentEmail).trim().toLowerCase() : '';

    const existing = students.find((s) => {
      const sId = s.id || s._docId;
      if (idStr && (sId === idStr || String(s.rollNumber).trim().toLowerCase() === idStr.toLowerCase() || (s.email && s.email.trim().toLowerCase() === idStr.toLowerCase()))) return true;
      if (studentData?.id && (sId === studentData.id || s._docId === studentData.id)) return true;
      if (studentData?.entityId && (sId === studentData.entityId || s._docId === studentData.entityId)) return true;
      if (rollStr && s.rollNumber && String(s.rollNumber).trim().toLowerCase() === rollStr) return true;
      if (emailStr && s.email && s.email.trim().toLowerCase() === emailStr) return true;
      if (emailStr && s.parentEmail && s.parentEmail.trim().toLowerCase() === emailStr) return true;
      if (parentEmailStr && s.parentEmail && s.parentEmail.trim().toLowerCase() === parentEmailStr) return true;
      return false;
    }) || {};

    const resolvedDocId = existing?.id || existing?._docId || studentData?.id || studentData?.entityId || idStr;
    const updated = {
      ...existing,
      ...studentData,
      id: resolvedDocId,
      collegeId: targetCollege,
    };

    setStudents((prev) => {
      const idx = prev.findIndex((s) => (s.id || s._docId) === resolvedDocId);
      if (idx >= 0) {
        return prev.map((s, i) => (i === idx ? updated : s));
      }
      return [...prev, updated];
    });

    await saveDoc('students', resolvedDocId, updated, targetCollege);
    if (targetCollege !== 'dps_main') {
      await saveDoc('students', resolvedDocId, updated, 'dps_main').catch(() => {});
    }

    const lookupPayload = {
      role: 'student',
      collegeId: targetCollege,
      entityId: resolvedDocId,
      id: resolvedDocId,
      name: updated.name,
      rollNumber: updated.rollNumber,
      class: updated.class,
      section: updated.section,
      password: updated.password || '1234',
      email: updated.email || updated.parentEmail || '',
      parentEmail: updated.parentEmail || updated.email || '',
    };

    const lookupPromises = [];
    if (updated.email) {
      lookupPromises.push(saveUserLookup(updated.email, { identifier: updated.email.trim().toLowerCase(), ...lookupPayload }));
    }
    if (updated.parentEmail && updated.parentEmail !== updated.email) {
      lookupPromises.push(saveUserLookup(updated.parentEmail, { identifier: updated.parentEmail.trim().toLowerCase(), ...lookupPayload }));
    }
    if (updated.rollNumber) {
      const rawRoll = String(updated.rollNumber).trim();
      lookupPromises.push(saveUserLookup(rawRoll, { identifier: rawRoll.toLowerCase(), ...lookupPayload }));
      const stripped = rawRoll.replace(/^0+/, '');
      if (stripped && stripped !== rawRoll) {
        lookupPromises.push(saveUserLookup(stripped, { identifier: stripped.toLowerCase(), ...lookupPayload }));
      }
    }
    if (lookupPromises.length > 0) {
      await Promise.allSettled(lookupPromises);
    }

    broadcastLiveEvent('STUDENT_PASSWORD_UPDATED', {
      studentId: resolvedDocId,
      rollNumber: updated.rollNumber,
      email: updated.email,
      name: updated.name,
      password: updated.password,
      collegeId: targetCollege,
      studentData: updated,
    });
    setRecentlyUpdatedStudentId(resolvedDocId);
    setTimeout(() => {
      setRecentlyUpdatedStudentId((curr) => (curr === resolvedDocId ? null : curr));
    }, 6000);

    return updated;
  }, [students, getTargetCollege]);

  // ── Delete single student ──
  const deleteStudent = useCallback(async (id) => {
    const targetCollege = getTargetCollege();
    const target = students.find((s) => s.id === id || s._docId === id);
    setStudents((prev) => prev.filter((s) => s.id !== id && s._docId !== id));
    await fsDeleteDoc('students', id, targetCollege);
    if (target?.email) deleteUserLookup(target.email).catch(console.warn);
    if (target?.parentEmail) deleteUserLookup(target.parentEmail).catch(console.warn);
    if (target?.rollNumber) {
      const rawRoll = String(target.rollNumber).trim();
      deleteUserLookup(rawRoll).catch(console.warn);
      const stripped = rawRoll.replace(/^0+/, '');
      if (stripped) deleteUserLookup(stripped).catch(console.warn);
    }
  }, [students, getTargetCollege]);

  // ── Delete multiple specific students ──
  const deleteMultipleStudents = useCallback(async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const targetCollege = getTargetCollege();
    const idSet = new Set(ids.map(String));
    const toDelete = students.filter((s) => idSet.has(String(s.id)) || idSet.has(String(s._docId)));
    setStudents((prev) => prev.filter((s) => !idSet.has(String(s.id)) && !idSet.has(String(s._docId))));

    const docIds = toDelete.map((s) => s.id || s._docId).filter(Boolean);
    if (docIds.length > 0) {
      await batchDeleteCollection('students', docIds, targetCollege);
    }

    toDelete.forEach((s) => {
      if (s.email) deleteUserLookup(s.email).catch(() => {});
      if (s.parentEmail) deleteUserLookup(s.parentEmail).catch(() => {});
      if (s.rollNumber) {
        const rawRoll = String(s.rollNumber).trim();
        deleteUserLookup(rawRoll).catch(() => {});
        const stripped = rawRoll.replace(/^0+/, '');
        if (stripped) deleteUserLookup(stripped).catch(() => {});
      }
    });

    const studentKeys = new Set(toDelete.flatMap((s) => [
      String(s.id),
      String(s._docId),
      String(s.entityId),
      String(s.rollNumber),
    ].filter(Boolean)));

    setAttendanceRecords((prev) => {
      let modified = false;
      const nextRecords = {};
      Object.entries(prev || {}).forEach(([recKey, rec]) => {
        if (!rec?.attendance) {
          nextRecords[recKey] = rec;
          return;
        }
        let recModified = false;
        const nextAtt = { ...rec.attendance };
        studentKeys.forEach((k) => {
          if (nextAtt[k] !== undefined) {
            delete nextAtt[k];
            recModified = true;
          }
        });
        if (recModified) {
          modified = true;
          nextRecords[recKey] = { ...rec, attendance: nextAtt };
        } else {
          nextRecords[recKey] = rec;
        }
      });
      return modified ? nextRecords : prev;
    });
  }, [students, getTargetCollege]);

  // ── Persist teachers (bulk replace) ──
  const saveTeachers = useCallback(async (updated) => {
    const targetCollege = getTargetCollege();
    setTeachers(updated);
    await batchSaveCollection('teachers', updated, 'id', targetCollege);
    // Index each teacher in users_lookup
    for (const t of updated) {
      const docId = t.id || t._docId;
      if (t.email) {
        const cleanEmail = t.email.trim().toLowerCase();
        saveUserLookup(cleanEmail, {
          identifier: cleanEmail,
          role: 'teacher',
          collegeId: targetCollege,
          entityId: docId,
          id: docId,
          name: t.name,
          class: t.class,
          section: t.section,
          subject: t.subject || '',
          contact: t.contact || '',
          password: t.password || 'teacher123',
        }).catch(console.warn);
      }
    }
  }, [getTargetCollege]);

  const addTeacher = useCallback(async (teacherData) => {
    const targetCollege = getTargetCollege();
    const newTeacher = {
      id: `TCH_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: 'active',
      createdAt: new Date().toISOString(),
      collegeId: targetCollege,
      ...teacherData,
    };
    setTeachers((prev) => [newTeacher, ...prev.filter((t) => t.id !== newTeacher.id)]);
    await saveDoc('teachers', newTeacher.id, newTeacher, targetCollege);

    // Also register in users_lookup
    if (newTeacher.email) {
      const cleanEmail = newTeacher.email.trim().toLowerCase();
      await saveUserLookup(cleanEmail, {
        identifier: cleanEmail,
        role: 'teacher',
        collegeId: targetCollege,
        entityId: newTeacher.id,
        id: newTeacher.id,
        name: newTeacher.name,
        class: newTeacher.class,
        section: newTeacher.section,
        subject: newTeacher.subject || '',
        contact: newTeacher.contact || '',
        password: newTeacher.password || 'teacher123',
      }).catch(console.warn);
    }
    return newTeacher;
  }, [getTargetCollege]);

  const addMessage = useCallback(async (msgData) => {
    const targetCollege = getTargetCollege();
    const newMsg = {
      id: `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      reactions: {},
      collegeId: targetCollege,
      readBy: [],
      ...msgData,
    };
    // Optimistic local state update
    setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));

    // Sync to localStorage immediately for zero-latency local / cross-tab access
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('_attendify_messages_cache');
        const list = raw ? JSON.parse(raw) : [];
        if (!list.some(m => (m.id || m._docId) === newMsg.id)) {
          list.push(newMsg);
          window.localStorage.setItem('_attendify_messages_cache', JSON.stringify(list));
        }
      }
    } catch (_) {}

    // Broadcast in real-time across tabs/windows
    broadcastLiveEvent('MESSAGE_SENT', {
      message: newMsg,
      collegeId: targetCollege,
    });

    await saveDoc('messages', newMsg.id, newMsg, targetCollege);
    return newMsg;
  }, [getTargetCollege]);

  const deleteMessage = useCallback(async (msgId) => {
    const targetCollege = getTargetCollege();
    setMessages((prev) => prev.filter((m) => (m.id || m._docId) !== msgId));

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('_attendify_messages_cache');
        if (raw) {
          const list = JSON.parse(raw);
          const filtered = list.filter((m) => (m.id || m._docId) !== msgId);
          window.localStorage.setItem('_attendify_messages_cache', JSON.stringify(filtered));
        }
      }
    } catch (_) {}

    broadcastLiveEvent('MESSAGE_DELETED', {
      msgId,
      collegeId: targetCollege,
    });

    try {
      await fsDeleteDoc('messages', msgId, targetCollege);
    } catch (err) {
      console.warn('Failed to delete message doc from Firestore:', err);
    }
  }, [getTargetCollege]);

  const deleteMessagesForMe = useCallback(async (msgIds, userId) => {
    if (!msgIds || (Array.isArray(msgIds) && msgIds.length === 0) || !userId) return;
    const targetCollege = getTargetCollege();
    const idList = Array.isArray(msgIds) ? msgIds : [msgIds];

    // Optimistic update in state
    setMessages((prev) =>
      prev.map((msg) => {
        const id = msg.id || msg._docId;
        if (idList.includes(id)) {
          const deletedFor = Array.isArray(msg.deletedFor) ? msg.deletedFor : [];
          if (!deletedFor.includes(userId)) {
            return { ...msg, deletedFor: [...deletedFor, userId] };
          }
        }
        return msg;
      })
    );

    // Save to local storage cache index
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `_attendify_deleted_for_me_${userId}`;
        const raw = window.localStorage.getItem(key);
        const set = new Set(raw ? JSON.parse(raw) : []);
        idList.forEach((id) => set.add(id));
        window.localStorage.setItem(key, JSON.stringify(Array.from(set)));

        const cacheRaw = window.localStorage.getItem('_attendify_messages_cache');
        if (cacheRaw) {
          const list = JSON.parse(cacheRaw);
          const next = list.map((msg) => {
            const id = msg.id || msg._docId;
            if (idList.includes(id)) {
              const deletedFor = Array.isArray(msg.deletedFor) ? msg.deletedFor : [];
              if (!deletedFor.includes(userId)) {
                return { ...msg, deletedFor: [...deletedFor, userId] };
              }
            }
            return msg;
          });
          window.localStorage.setItem('_attendify_messages_cache', JSON.stringify(next));
        }
      }
    } catch (_) {}

    // Save updated deletedFor field to Firestore
    try {
      for (const msgId of idList) {
        const msg = messagesRef.current.find((m) => (m.id || m._docId) === msgId);
        if (!msg) continue;
        const deletedFor = Array.isArray(msg.deletedFor) ? msg.deletedFor : [];
        if (!deletedFor.includes(userId)) {
          await saveDoc('messages', msgId, { ...msg, deletedFor: [...deletedFor, userId] }, targetCollege);
        }
      }
    } catch (e) {
      console.warn('deleteMessagesForMe save error:', e);
    }
  }, [getTargetCollege]);

  const reactToMessage = useCallback(async (msgId, emoji) => {
    const targetCollege = getTargetCollege();
    const msg = messagesRef.current.find((m) => (m.id || m._docId) === msgId);
    if (!msg) return;
    const currentReactions = msg.reactions || {};
    const count = (currentReactions[emoji] || 0) + 1;
    const updated = {
      ...msg,
      reactions: { ...currentReactions, [emoji]: count },
    };
    setMessages((prev) => prev.map((m) => ((m.id || m._docId) === msgId ? updated : m)));

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('_attendify_messages_cache');
        if (raw) {
          const list = JSON.parse(raw);
          const next = list.map((m) => ((m.id || m._docId) === msgId ? updated : m));
          window.localStorage.setItem('_attendify_messages_cache', JSON.stringify(next));
        }
      }
    } catch (_) {}

    broadcastLiveEvent('MESSAGE_REACTION', {
      msgId,
      reactions: updated.reactions,
      collegeId: targetCollege,
    });

    await saveDoc('messages', msgId, updated, targetCollege);
  }, [getTargetCollege]);

  const markMessagesAsRead = useCallback(async (msgIds, userId) => {
    if (!msgIds || msgIds.length === 0 || !userId) return;
    const targetCollege = getTargetCollege();
    // Optimistic update
    setMessages((prev) =>
      prev.map((msg) => {
        const id = msg.id || msg._docId;
        if (msgIds.includes(id)) {
          const readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
          if (!readBy.includes(userId)) {
            return { ...msg, readBy: [...readBy, userId] };
          }
        }
        return msg;
      })
    );

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('_attendify_messages_cache');
        if (raw) {
          const list = JSON.parse(raw);
          const next = list.map((msg) => {
            const id = msg.id || msg._docId;
            if (msgIds.includes(id)) {
              const readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
              if (!readBy.includes(userId)) {
                return { ...msg, readBy: [...readBy, userId] };
              }
            }
            return msg;
          });
          window.localStorage.setItem('_attendify_messages_cache', JSON.stringify(next));
        }
      }
    } catch (_) {}

    broadcastLiveEvent('MESSAGES_READ', {
      msgIds,
      userId,
      collegeId: targetCollege,
    });

    try {
      for (const msgId of msgIds) {
        const msg = messagesRef.current.find((m) => (m.id || m._docId) === msgId);
        if (!msg) continue;
        const readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
        if (!readBy.includes(userId)) {
          await saveDoc('messages', msgId, { ...msg, readBy: [...readBy, userId] }, targetCollege);
        }
      }
    } catch (e) {
      console.warn('markMessagesAsRead save error:', e);
    }
  }, [getTargetCollege]);

  const updateTeacher = useCallback(async (id, teacherData) => {
    const targetCollege = teacherData?.collegeId || getTargetCollege() || 'dps_main';

    const idStr = id ? String(id).trim() : '';
    const emailStr = teacherData?.email ? String(teacherData.email).trim().toLowerCase() : '';
    const nameStr = teacherData?.name ? String(teacherData.name).trim().toLowerCase() : '';

    const existing = teachers.find((t) => {
      const tId = t.id || t._docId;
      if (idStr && (tId === idStr || (t.email && t.email.trim().toLowerCase() === idStr.toLowerCase()))) return true;
      if (teacherData?.id && (tId === teacherData.id || t._docId === teacherData.id)) return true;
      if (teacherData?.entityId && (tId === teacherData.entityId || t._docId === teacherData.entityId)) return true;
      if (emailStr && t.email && t.email.trim().toLowerCase() === emailStr) return true;
      if (nameStr && t.name && t.name.trim().toLowerCase() === nameStr) return true;
      return false;
    }) || {};

    const resolvedDocId = existing?.id || existing?._docId || teacherData?.id || teacherData?.entityId || idStr;
    const updated = { ...existing, ...teacherData, id: resolvedDocId, collegeId: targetCollege };

    setTeachers((prev) => {
      const idx = prev.findIndex((t) => (t.id || t._docId) === resolvedDocId || (emailStr && t.email && t.email.trim().toLowerCase() === emailStr));
      if (idx >= 0) return prev.map((t, i) => (i === idx ? updated : t));
      return [...prev, updated];
    });

    await saveDoc('teachers', resolvedDocId, updated, targetCollege);
    if (targetCollege !== 'dps_main') {
      await saveDoc('teachers', resolvedDocId, updated, 'dps_main').catch(() => {});
    }

    if (updated.email) {
      const cleanEmail = updated.email.trim().toLowerCase();
      try {
        const lookup = await getUserLookup(cleanEmail);
        if (lookup?.collegeId && lookup.collegeId !== targetCollege && lookup.collegeId !== 'dps_main') {
          await saveDoc('teachers', resolvedDocId, updated, lookup.collegeId).catch(() => {});
        }
      } catch (_) {}

      await saveUserLookup(cleanEmail, {
        identifier: cleanEmail,
        role: 'teacher',
        collegeId: targetCollege,
        entityId: resolvedDocId,
        id: resolvedDocId,
        name: updated.name,
        class: updated.class,
        section: updated.section,
        subject: updated.subject || '',
        contact: updated.contact || '',
        password: updated.password || 'teacher123',
      }).catch(console.warn);
    }

    broadcastLiveEvent('TEACHER_PASSWORD_UPDATED', {
      teacherId: resolvedDocId,
      email: updated.email,
      name: updated.name,
      password: updated.password,
      collegeId: targetCollege,
      teacherData: updated,
    });
    setRecentlyUpdatedTeacherId(resolvedDocId);
    setTimeout(() => {
      setRecentlyUpdatedTeacherId((curr) => (curr === resolvedDocId ? null : curr));
    }, 6000);

    return updated;
  }, [teachers, getTargetCollege]);

  const deleteTeacher = useCallback(async (id) => {
    const targetCollege = getTargetCollege();
    const target = teachers.find((t) => t.id === id || t._docId === id);
    setTeachers((prev) => prev.filter((t) => t.id !== id && t._docId !== id));
    await fsDeleteDoc('teachers', id, targetCollege);
    if (target?.email) {
      deleteUserLookup(target.email).catch(console.warn);
    }
  }, [teachers, getTargetCollege]);

  const deleteAllTeachers = useCallback(async () => {
    const targetCollege = getTargetCollege();
    const toDelete = [...teachers];
    setTeachers([]);
    const teacherIds = toDelete.map((t) => t.id || t._docId).filter(Boolean);
    if (teacherIds.length > 0) {
      await batchDeleteCollection('teachers', teacherIds, targetCollege);
    }
    toDelete.forEach((t) => {
      if (t.email) deleteUserLookup(t.email).catch(() => {});
    });
  }, [teachers, getTargetCollege]);

  const deleteMultipleTeachers = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return 0;
    const targetCollege = getTargetCollege();
    const idSet = new Set(ids.map(String));
    const toDeleteTeachers = teachers.filter((t) => idSet.has(String(t.id)) || idSet.has(String(t._docId)));
    setTeachers((prev) => prev.filter((t) => !idSet.has(String(t.id)) && !idSet.has(String(t._docId))));

    const teacherDocIds = toDeleteTeachers.map((t) => t.id || t._docId).filter(Boolean);
    if (teacherDocIds.length > 0) {
      await batchDeleteCollection('teachers', teacherDocIds, targetCollege);
    }
    toDeleteTeachers.forEach((t) => {
      if (t.email) deleteUserLookup(t.email).catch(() => {});
    });
    return teacherDocIds.length;
  }, [teachers, getTargetCollege]);

  const deleteClass = useCallback(async (targetClass) => {
    const targetCollege = getTargetCollege();
    let toDeleteStudents;
    if (targetClass === 'all') {
      toDeleteStudents = students;
      setStudents([]);
    } else {
      toDeleteStudents = students.filter((s) => String(s.class) === String(targetClass));
      setStudents((prev) => prev.filter((s) => String(s.class) !== String(targetClass)));
    }
    const studentIds = toDeleteStudents.map((s) => s.id || s._docId);
    await batchDeleteCollection('students', studentIds, targetCollege);

    // Delete lookups
    toDeleteStudents.forEach((s) => {
      if (s.email) deleteUserLookup(s.email).catch(() => {});
      if (s.parentEmail) deleteUserLookup(s.parentEmail).catch(() => {});
      if (s.rollNumber) {
        const rawRoll = String(s.rollNumber).trim();
        deleteUserLookup(rawRoll).catch(() => {});
        const stripped = rawRoll.replace(/^0+/, '');
        if (stripped) deleteUserLookup(stripped).catch(() => {});
      }
    });

    // Delete matching attendance records
    const attendanceIds = Object.entries(attendanceRecords)
      .filter(([, rec]) => targetClass === 'all' || String(rec.class) === String(targetClass))
      .map(([key]) => key);
    
    setAttendanceRecords((prev) => {
      const copy = { ...prev };
      attendanceIds.forEach((k) => delete copy[k]);
      return copy;
    });

    await batchDeleteCollection('attendance', attendanceIds, targetCollege);

    return studentIds.length;
  }, [students, attendanceRecords, getTargetCollege]);

  // ── Persist attendance ──
  const saveAttendanceRecord = useCallback(async (key, record) => {
    const targetCollege = getTargetCollege();
    const cleanRecord = { id: key, collegeId: targetCollege, ...record };
    setAttendanceRecords((prev) => ({ ...prev, [key]: cleanRecord }));
    await saveDoc('attendance', key, cleanRecord, targetCollege);
  }, [getTargetCollege]);

  const deleteAttendanceRecord = useCallback(async (key) => {
    const targetCollege = getTargetCollege();
    setAttendanceRecords((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    await fsDeleteDoc('attendance', key, targetCollege);
  }, [getTargetCollege]);

  // ── Persist settings ──
  const saveSettings = useCallback(async (updated) => {
    const targetCollege = getTargetCollege();
    setSettings(updated);
    await fsSaveSettings(updated, targetCollege);
  }, [getTargetCollege]);

  // ── Reset all school data from Firestore & local caches ──
  const resetAllSchoolData = useCallback(async () => {
    try {
      const targetCollege = getTargetCollege();
      const studentIds = students.map((s) => s.id || s._docId).filter(Boolean);
      if (studentIds.length > 0) {
        await batchDeleteCollection('students', studentIds, targetCollege);
        students.forEach((s) => {
          if (s.email) deleteUserLookup(s.email).catch(() => {});
          if (s.parentEmail) deleteUserLookup(s.parentEmail).catch(() => {});
          if (s.rollNumber) {
            const rawRoll = String(s.rollNumber).trim();
            deleteUserLookup(rawRoll).catch(() => {});
            const stripped = rawRoll.replace(/^0+/, '');
            if (stripped) deleteUserLookup(stripped).catch(() => {});
          }
        });
      }

      const teacherIds = teachers.map((t) => t.id || t._docId).filter(Boolean);
      if (teacherIds.length > 0) {
        await batchDeleteCollection('teachers', teacherIds, targetCollege);
        teachers.forEach((t) => {
          if (t.email) deleteUserLookup(t.email).catch(() => {});
        });
      }

      const attendanceKeys = Object.keys(attendanceRecords);
      if (attendanceKeys.length > 0) await batchDeleteCollection('attendance', attendanceKeys, targetCollege);

      const examIds = exams.map((e) => e.id || e._docId).filter(Boolean);
      if (examIds.length > 0) await batchDeleteCollection('marks', examIds, targetCollege);

      const msgIds = messages.map((m) => m.id || m._docId).filter(Boolean);
      if (msgIds.length > 0) await batchDeleteCollection('messages', msgIds, targetCollege);

      const defaultSettings = {
        schoolName: '',
        collegeName: '',
        teacherName: '',
        principleName: '',
        notifications: true,
      };
      await fsSaveSettings(defaultSettings, targetCollege);
      setSettings(defaultSettings);

      return true;
    } catch (err) {
      console.error('[AppContext] Failed to reset school data:', err);
      return false;
    }
  }, [students, teachers, attendanceRecords, exams, messages, getTargetCollege]);

  return (
    <AppContext.Provider value={{
      students, saveStudents, addStudent, updateStudent, deleteStudent, deleteMultipleStudents, deleteClass, refreshStudents,
      recentlyUpdatedStudentId,
      teachers, saveTeachers, addTeacher, updateTeacher, deleteTeacher, deleteAllTeachers, deleteMultipleTeachers, refreshTeachers,
      recentlyUpdatedTeacherId, lastLiveSyncTime,
      messages, addMessage, deleteMessage, deleteMessagesForMe, reactToMessage, markMessagesAsRead,
      exams, saveExams, deleteExam, clearAllExams,
      attendanceRecords, saveAttendanceRecord, deleteAttendanceRecord, refreshAttendance,
      settings, saveSettings, resetAllSchoolData,
      toasts, addToast, removeToast,
      selectedClass, setSelectedClass,
      selectedSection, setSelectedSection,
      firestoreReady,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);


