import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as fbUpdatePassword,
  updateEmail as fbUpdateEmail,
} from 'firebase/auth';
import {
  saveSettings as fsSaveSettings,
  fetchSettings,
  getAdminByEmail,
  saveAdmin,
  setActiveSchoolId,
  getActiveSchoolId,
  getUserLookup,
  saveUserLookup,
  deleteUserLookup,
  fetchCollection,
  saveSession,
  getSession,
  deleteSession,
} from '../services/firestoreService';
import { validatePasswordRules } from '../components/ui/PasswordRequirements';

const AuthContext = createContext({});

// -- Session token lives in sessionStorage (disappears when browser closes)
// The actual session DATA lives in Firestore and is cached locally for instant startup.
const SESSION_TOKEN_KEY = '_attendify_sk';
const AUTH_CACHE_KEY = '_attendify_auth_session';

function getCachedAuth() {
  try {
    if (typeof window !== 'undefined') {
      const raw = sessionStorage.getItem(AUTH_CACHE_KEY) || localStorage.getItem(AUTH_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.role) return parsed;
      }
    }
  } catch (_) {}
  return null;
}

function persistAuthSession(payload) {
  try {
    if (typeof window !== 'undefined') {
      if (payload) {
        const str = JSON.stringify(payload);
        sessionStorage.setItem(AUTH_CACHE_KEY, str);
        localStorage.setItem(AUTH_CACHE_KEY, str);
      } else {
        sessionStorage.removeItem(AUTH_CACHE_KEY);
        localStorage.removeItem(AUTH_CACHE_KEY);
      }
    }
  } catch (_) {}
}

function getOrCreateSessionKey() {
  let key = sessionStorage.getItem(SESSION_TOKEN_KEY) || localStorage.getItem(SESSION_TOKEN_KEY);
  if (!key) {
    key = `sk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_TOKEN_KEY, key);
    localStorage.setItem(SESSION_TOKEN_KEY, key);
  }
  return key;
}

export function AuthProvider({ children }) {
  const initialCache = getCachedAuth();
  const [user, setUser]               = useState(() => initialCache?.user || null);
  const [role, setRole]               = useState(() => initialCache?.role || null);
  const [currentStudent, setCurrentStudent] = useState(() => initialCache?.currentStudent || null);
  const [activeCollegeId, setActiveCollegeId] = useState(() => initialCache?.collegeId || 'dps_main');

  // Instant fast startup:
  // - If cached session exists: loading is FALSE immediately (0ms wait, no spinner flash)
  // - If no session key exists (new/guest visitor): loading is FALSE immediately (0ms wait)
  // - Only if an unhydrated session key is stored without cache do we briefly verify
  const [loading, setLoading]         = useState(() => {
    if (initialCache) return false;
    if (typeof window !== 'undefined') {
      const hasKey = sessionStorage.getItem(SESSION_TOKEN_KEY) || localStorage.getItem(SESSION_TOKEN_KEY);
      if (!hasKey) return false;
    }
    return true;
  });

  useEffect(() => {
    setActiveSchoolId(activeCollegeId || 'dps_main');
  }, [activeCollegeId]);

  useEffect(() => {
    let unsub = () => {};

    const restoreSession = async () => {
      // ONLY query Firestore if a session key actually existed previously!
      const existingKey = sessionStorage.getItem(SESSION_TOKEN_KEY) || localStorage.getItem(SESSION_TOKEN_KEY);
      if (!existingKey) return false;

      try {
        const session = await getSession(existingKey);
        if (session && session.role) {
          const { role: savedRole, collegeId, _savedAt, ...rest } = session;
          const effectiveCollegeId = collegeId || 'dps_main';
          setActiveCollegeId(effectiveCollegeId);
          setActiveSchoolId(effectiveCollegeId);
          if (savedRole === 'student') {
            setRole('student');
            setCurrentStudent(rest);
            persistAuthSession({ role: 'student', collegeId: effectiveCollegeId, currentStudent: rest, user: null });
            setLoading(false);
            return true;
          }
          if (savedRole === 'teacher') {
            setRole('teacher');
            setUser(rest);
            persistAuthSession({ role: 'teacher', collegeId: effectiveCollegeId, user: rest, currentStudent: null });
            setLoading(false);
            return true;
          }
        }
      } catch (e) {
        console.warn('[AuthContext] Could not restore Firestore session:', e);
      }
      return false;
    };

    const initAuth = async () => {
      const restored = await restoreSession();
      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const sessionKey = getOrCreateSessionKey();
          let extra = {};
          try { const d = await getAdminByEmail(firebaseUser.email); if (d) extra = d; } catch (e) {}
          if (!extra.collegeName) {
            try { const s = await fetchSettings(); if (s?.collegeName || s?.schoolName) extra.collegeName = s.collegeName || s.schoolName; } catch (e) {}
          }
          const cleanEmail = (firebaseUser.email || '').trim().toLowerCase();
          let effectiveCollegeId = firebaseUser.uid || 'dps_main';
          try {
            // 1. Check users_lookup first — gives the canonical collegeId used when data was saved
            const lookup = await getUserLookup(cleanEmail);
            if (lookup?.collegeId) {
              effectiveCollegeId = lookup.collegeId;
            } else {
              // 2. Fallback: check if admin exists under dps_main
              const dpsAdmin = await getAdminByEmail(cleanEmail, 'dps_main');
              effectiveCollegeId = dpsAdmin ? 'dps_main' : (firebaseUser.uid || 'dps_main');
            }
          } catch (e) { effectiveCollegeId = firebaseUser.uid || 'dps_main'; }

          const u = {
            id: 'admin', uid: firebaseUser.uid, email: firebaseUser.email,
            name: firebaseUser.displayName || extra.principleName || 'Administrator',
            principleName: firebaseUser.displayName || extra.principleName || '',
            collegeName: extra.collegeName || '',
            collegeId: effectiveCollegeId,
            photoURL: firebaseUser.photoURL, role: 'Admin',
          };
          setActiveCollegeId(effectiveCollegeId);
          setActiveSchoolId(effectiveCollegeId);
          setUser(u);
          setRole('admin');
          persistAuthSession({ role: 'admin', collegeId: effectiveCollegeId, user: u, currentStudent: null });
          saveSession(sessionKey, { role: 'admin', collegeId: effectiveCollegeId, ...u }).catch(() => {});
        } else {
          if (!restored && !initialCache) {
            setUser(null);
            setRole(null);
            setCurrentStudent(null);
            persistAuthSession(null);
          }
        }
        setLoading(false);
      });
    };

    initAuth();
    return () => unsub();
  }, []);

  const login = async (email, password, remember) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const sessionKey = getOrCreateSessionKey();
    if (!cleanEmail) return { success: false, error: 'Email address is required.' };
    if (!password)   return { success: false, error: 'Password is required to sign in.' };

    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      let extra = {};
      try { const d = await getAdminByEmail(cleanEmail); if (d) extra = d; } catch (e) {}
      if (!extra.collegeName) {
        try { const s = await fetchSettings(); if (s?.collegeName || s?.schoolName) extra.collegeName = s.collegeName || s.schoolName; } catch (e) {}
      }
      if (!extra.collegeName && cleanEmail.includes('adaepublic')) extra.collegeName = 'ADAE Public College';
      let effectiveCollegeId = userCredential.user.uid || 'dps_main';
      try {
        // 1. Check users_lookup for canonical collegeId
        const lookup = await getUserLookup(cleanEmail);
        if (lookup?.collegeId) {
          effectiveCollegeId = lookup.collegeId;
        } else {
          // 2. Fallback: check dps_main
          const dpsAdmin = await getAdminByEmail(cleanEmail, 'dps_main');
          effectiveCollegeId = dpsAdmin ? 'dps_main' : userCredential.user.uid;
        }
      } catch (e) { effectiveCollegeId = userCredential.user.uid || 'dps_main'; }

      setActiveCollegeId(effectiveCollegeId);
      setActiveSchoolId(effectiveCollegeId);
      const u = {
        id: 'admin', uid: userCredential.user.uid, email: userCredential.user.email,
        name: userCredential.user.displayName || extra.principleName || 'Administrator',
        principleName: userCredential.user.displayName || extra.principleName || '',
        collegeName: extra.collegeName || '', collegeId: effectiveCollegeId,
        photoURL: userCredential.user.photoURL, role: 'Admin',
      };
      saveUserLookup(cleanEmail, { identifier: cleanEmail, role: 'admin', collegeId: effectiveCollegeId, collegeName: extra.collegeName || '', name: u.name, password }).catch(() => {});
      setUser(u); setRole('admin');
      persistAuthSession({ role: 'admin', collegeId: effectiveCollegeId, user: u, currentStudent: null });
      await saveSession(sessionKey, { role: 'admin', collegeId: effectiveCollegeId, ...u });
      return { success: true, user: u };
    } catch (fbError) {
      console.warn('Firebase signIn attempt:', fbError.code);
      try {
        const adminDoc = await getAdminByEmail(cleanEmail);
        if (adminDoc && adminDoc.password === password) {
          const effectiveCollegeId = 'dps_main';
          setActiveCollegeId(effectiveCollegeId);
          setActiveSchoolId(effectiveCollegeId);
          const u = { id: 'admin', uid: `admin_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`, email: cleanEmail, name: adminDoc.principleName || adminDoc.name || 'Administrator', collegeName: adminDoc.collegeName || '', collegeId: effectiveCollegeId, role: 'Admin' };
          setUser(u); setRole('admin');
          persistAuthSession({ role: 'admin', collegeId: effectiveCollegeId, user: u, currentStudent: null });
          await saveSession(sessionKey, { role: 'admin', collegeId: effectiveCollegeId, ...u });
          return { success: true, user: u };
        }
      } catch (fsErr) { console.warn('Firestore admin verification error:', fsErr); }
      let msg = 'Failed to sign in.';
      if (['auth/invalid-credential','auth/user-not-found','auth/wrong-password'].includes(fbError.code)) msg = 'Invalid email or password. Please verify your credentials or create an admin account.';
      else if (fbError.code === 'auth/too-many-requests') msg = 'Too many failed attempts. Please wait a few minutes before trying again.';
      else if (fbError.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      else if (fbError.code === 'auth/network-request-failed') msg = 'Network connection error. Please check your internet connection.';
      return { success: false, error: msg };
    }
  };

  const createAdminAccount = async ({ collegeName, principleName, email, password }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const sessionKey = getOrCreateSessionKey();
    if (!cleanEmail || !password) return { success: false, error: 'Email and password are required.' };
    const pwCheck = validatePasswordRules(password);
    if (!pwCheck.allSatisfied) {
      return { success: false, error: `Password must satisfy all requirements: missing ${pwCheck.firstMissing?.label?.toLowerCase() || 'requirements'}.` };
    }
    const adminProfile = { email: cleanEmail, principleName: (principleName||'').trim(), collegeName: (collegeName||'').trim(), password, role: 'Admin', createdAt: new Date().toISOString() };
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (principleName) { try { await updateProfile(userCredential.user, { displayName: principleName.trim() }); } catch (e) {} }
    } catch (fbError) {
      if (fbError.code === 'auth/admin-restricted-operation' || fbError.code === 'auth/operation-not-allowed') return { success: false, error: 'Firebase Auth blocked account creation. Enable sign-up in Firebase Console > Authentication > Settings.' };
      if (fbError.code === 'auth/email-already-in-use') return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
      if (fbError.code === 'auth/weak-password') return { success: false, error: 'Password should be at least 6 characters.' };
      if (fbError.code === 'auth/invalid-email') return { success: false, error: 'Please enter a valid email address.' };
      return { success: false, error: fbError.message || 'Failed to create user in Firebase Authentication.' };
    }
    const collegeId = userCredential.user.uid;
    try {
      await saveAdmin(cleanEmail, adminProfile, collegeId);
      await saveAdmin(cleanEmail, adminProfile, 'dps_main');
      const sp = { schoolName: (collegeName||'').trim(), collegeName: (collegeName||'').trim(), teacherName: (principleName||'').trim(), principleName: (principleName||'').trim(), adminEmail: cleanEmail, notifications: true };
      await fsSaveSettings(sp, collegeId); await fsSaveSettings(sp, 'dps_main');
      await saveUserLookup(cleanEmail, { identifier: cleanEmail, role: 'admin', collegeId, collegeName: (collegeName||'').trim(), name: (principleName||'').trim(), password });
    } catch (e) { console.warn('Failed to save to Firestore:', e); }
    setActiveCollegeId(collegeId); setActiveSchoolId(collegeId);
    const u = { id: 'admin', uid: userCredential.user.uid, email: cleanEmail, name: (principleName||'').trim()||'Administrator', principleName: (principleName||'').trim(), collegeName: (collegeName||'').trim(), collegeId, role: 'Admin' };
    setUser(u); setRole('admin');
    persistAuthSession({ role: 'admin', collegeId, user: u, currentStudent: null });
    await saveSession(sessionKey, { role: 'admin', collegeId, ...u });
    return { success: true, user: u };
  };

  const loginWithGoogle = async () => ({ success: false, error: 'Google sign-in has been disabled. Please use Email and Password.' });

  const teacherLogin = async (teacherInput, teachersList = [], optionalPassword = null) => {
    let cleanEmail = '';
    let pwdToCheck = optionalPassword;
    const sessionKey = getOrCreateSessionKey();
    if (typeof teacherInput === 'string') { cleanEmail = teacherInput.trim().toLowerCase(); }
    else if (teacherInput && typeof teacherInput === 'object') { cleanEmail = (teacherInput.email||'').trim().toLowerCase(); if (!pwdToCheck && teacherInput.password) pwdToCheck = teacherInput.password; }

    let lookup = null;
    if (cleanEmail) { try { lookup = await getUserLookup(cleanEmail); } catch (e) {} }
    const effectiveCollegeId = lookup?.collegeId || (typeof teacherInput === 'object' && teacherInput.collegeId) || activeCollegeId || 'dps_main';

    if (lookup && lookup.role === 'teacher') {
      if (pwdToCheck && lookup.password && lookup.password !== pwdToCheck) return { success: false, error: 'Incorrect password. Please try again.' };
      const teacherObj = { id: lookup.entityId||lookup.id||`TCH_${Date.now()}`, name: lookup.name||'Teacher', email: cleanEmail, class: lookup.class||'', section: lookup.section||'', subject: lookup.subject||'', contact: lookup.contact||'', role: 'Teacher', collegeId: effectiveCollegeId, collegeName: lookup.collegeName||'', password: lookup.password };
      setActiveCollegeId(effectiveCollegeId); setActiveSchoolId(effectiveCollegeId); setRole('teacher'); setUser(teacherObj);
      persistAuthSession({ role: 'teacher', collegeId: effectiveCollegeId, user: teacherObj, currentStudent: null });
      await saveSession(sessionKey, { role: 'teacher', collegeId: effectiveCollegeId, ...teacherObj });
      return { success: true, teacher: teacherObj, collegeId: effectiveCollegeId };
    }

    let sourceList = Array.isArray(teachersList) && teachersList.length > 0 ? teachersList : [];
    if (sourceList.length === 0) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const cached = window.localStorage.getItem('_attendify_teachers_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) sourceList = parsed;
          }
        }
      } catch (_) {}
    }
    let matched = null;
    if (typeof teacherInput === 'object' && teacherInput.id) matched = sourceList.find(t => t.id === teacherInput.id);
    if (!matched && cleanEmail) matched = sourceList.find(t => (t.email||'').trim().toLowerCase() === cleanEmail);
    if (!matched && typeof teacherInput === 'object' && teacherInput.name) matched = sourceList.find(t => (t.name||'').trim().toLowerCase() === (teacherInput.name||'').trim().toLowerCase());
    if (!matched && typeof teacherInput === 'object' && teacherInput.email) matched = teacherInput;

    if (matched) {
      const collegeId = matched.collegeId || activeCollegeId || 'dps_main';
      const teacherObj = { id: matched.id, name: matched.name, email: matched.email, class: matched.class, section: matched.section, subject: matched.subject||'', contact: matched.contact||'', role: 'Teacher', collegeId, password: matched.password };
      setActiveCollegeId(collegeId); setActiveSchoolId(collegeId); setRole('teacher'); setUser(teacherObj);
      persistAuthSession({ role: 'teacher', collegeId, user: teacherObj, currentStudent: null });
      await saveSession(sessionKey, { role: 'teacher', collegeId, ...teacherObj });
      saveUserLookup(matched.email, { identifier: matched.email, role: 'teacher', collegeId, entityId: matched.id, name: matched.name, class: matched.class, section: matched.section, subject: matched.subject||'', contact: matched.contact||'', password: pwdToCheck || matched.password || 'teacher123' }).catch(console.warn);
      return { success: true, teacher: teacherObj, collegeId };
    }
    return { success: false, error: 'Invalid credentials. No registered teacher found with this email.' };
  };

  const studentLogin = async (identifier, password, studentsList = []) => {
    const cleanId = (identifier || '').trim().toLowerCase();
    const sessionKey = getOrCreateSessionKey();
    if (!cleanId || !password) return { success: false, error: 'Email/Roll number and password are required.' };

    let lookup = null;
    try { lookup = await getUserLookup(cleanId); } catch (e) {}
    if (!lookup && !cleanId.includes('@')) {
      const stripped = cleanId.replace(/^0+/, '');
      if (stripped && stripped !== cleanId) {
        try { lookup = await getUserLookup(stripped); } catch (e) {}
      }
    }

    if (lookup && lookup.role === 'student') {
      if (password !== (lookup.password || '1234')) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }
      const effectiveCollegeId = lookup.collegeId || 'dps_main';
      const matchedFromList = (Array.isArray(studentsList) ? studentsList : []).find(s =>
        (lookup.entityId && (s.id === lookup.entityId || s._docId === lookup.entityId)) ||
        (lookup.rollNumber && s.rollNumber && String(s.rollNumber).trim().toLowerCase() === String(lookup.rollNumber).trim().toLowerCase()) ||
        (lookup.email && s.email && s.email.trim().toLowerCase() === lookup.email.trim().toLowerCase()) ||
        (s.parentEmail && lookup.email && s.parentEmail.trim().toLowerCase() === lookup.email.trim().toLowerCase())
      );
      const resolvedId = matchedFromList?.id || matchedFromList?._docId || lookup.entityId || lookup.id || cleanId;
      const studentObj = {
        ...matchedFromList,
        id: resolvedId,
        entityId: resolvedId,
        rollNumber: lookup.rollNumber || matchedFromList?.rollNumber || cleanId,
        name: lookup.name || matchedFromList?.name || 'Student',
        email: lookup.email || matchedFromList?.email || (cleanId.includes('@') ? cleanId : ''),
        class: lookup.class || matchedFromList?.class || '10',
        section: lookup.section || matchedFromList?.section || 'A',
        collegeId: effectiveCollegeId,
        collegeName: lookup.collegeName || matchedFromList?.collegeName || '',
        status: 'active',
        password: lookup.password || matchedFromList?.password || '1234',
      };
      setActiveCollegeId(effectiveCollegeId);
      setActiveSchoolId(effectiveCollegeId);
      setRole('student');
      setCurrentStudent(studentObj);
      persistAuthSession({ role: 'student', collegeId: effectiveCollegeId, user: null, currentStudent: studentObj });
      await saveSession(sessionKey, { role: 'student', collegeId: effectiveCollegeId, ...studentObj });
      return { success: true, student: studentObj, collegeId: effectiveCollegeId };
    }

    let sourceList = Array.isArray(studentsList) && studentsList.length > 0 ? [...studentsList] : [];
    if (sourceList.length === 0) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const cached = window.localStorage.getItem('_attendify_students_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) sourceList = parsed;
          }
        }
      } catch (_) {}
    }
    if (sourceList.length === 0) {
      try {
        const fallback = await fetchCollection('students', activeCollegeId || 'dps_main');
        if (Array.isArray(fallback) && fallback.length > 0) sourceList = fallback;
      } catch (_) {}
    }

    const matchedStudent = sourceList.find(s => {
      const emailMatches = s.email && s.email.toLowerCase().trim() === cleanId;
      const parentEmailMatches = s.parentEmail && s.parentEmail.toLowerCase().trim() === cleanId;
      const rollMatches = s.rollNumber && (
        String(s.rollNumber).toLowerCase().trim() === cleanId ||
        String(s.rollNumber).replace(/^0+/, '').toLowerCase() === cleanId.replace(/^0+/, '')
      );
      return emailMatches || parentEmailMatches || rollMatches;
    });

    if (matchedStudent) {
      if ((matchedStudent.password || '1234') !== password) {
        return { success: false, error: 'Incorrect password. Please check your password.' };
      }
      const collegeId = matchedStudent.collegeId || activeCollegeId || 'dps_main';
      setActiveCollegeId(collegeId);
      setActiveSchoolId(collegeId);
      setRole('student');
      setCurrentStudent(matchedStudent);
      persistAuthSession({ role: 'student', collegeId, user: null, currentStudent: matchedStudent });
      await saveSession(sessionKey, { role: 'student', collegeId, ...matchedStudent });
      const lookupBase = {
        role: 'student',
        collegeId,
        entityId: matchedStudent.id || matchedStudent._docId,
        id: matchedStudent.id || matchedStudent._docId,
        name: matchedStudent.name,
        rollNumber: matchedStudent.rollNumber,
        class: matchedStudent.class,
        section: matchedStudent.section,
        password: matchedStudent.password || '1234',
        email: matchedStudent.email || matchedStudent.parentEmail || '',
        parentEmail: matchedStudent.parentEmail || matchedStudent.email || '',
      };
      if (matchedStudent.email) saveUserLookup(matchedStudent.email, { identifier: matchedStudent.email.trim().toLowerCase(), ...lookupBase }).catch(console.warn);
      if (matchedStudent.parentEmail && matchedStudent.parentEmail !== matchedStudent.email) saveUserLookup(matchedStudent.parentEmail, { identifier: matchedStudent.parentEmail.trim().toLowerCase(), ...lookupBase }).catch(console.warn);
      if (matchedStudent.rollNumber) {
        saveUserLookup(String(matchedStudent.rollNumber).trim(), { identifier: String(matchedStudent.rollNumber).trim().toLowerCase(), ...lookupBase }).catch(console.warn);
      }
      return { success: true, student: matchedStudent, collegeId };
    }

    return {
      success: false,
      error: 'Invalid email or password. Please verify your credentials or ensure the student record was saved in the admin portal.'
    };
  };

  const logout = async () => {
    const sessionKey = sessionStorage.getItem(SESSION_TOKEN_KEY) || localStorage.getItem(SESSION_TOKEN_KEY);
    try { await firebaseSignOut(auth); } catch (e) {}
    if (sessionKey) {
      await deleteSession(sessionKey).catch(() => {});
    }
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    persistAuthSession(null);
    setUser(null); setRole(null); setCurrentStudent(null);
    setActiveCollegeId('dps_main'); setActiveSchoolId('dps_main');
  };

  const verifyAdminPassword = async (enteredPassword) => {
    if (!enteredPassword) return { success: false, error: 'Password is required.' };
    const cleanEmail = (user?.email || auth?.currentUser?.email || '').trim().toLowerCase();
    if (!cleanEmail) return { success: false, error: 'No active admin email found.' };

    // 1. Try Firebase Auth reauthentication if currentUser is available
    if (auth.currentUser && auth.currentUser.email && auth.currentUser.email.toLowerCase() === cleanEmail) {
      try {
        const cred = EmailAuthProvider.credential(cleanEmail, enteredPassword);
        await reauthenticateWithCredential(auth.currentUser, cred);
        return { success: true };
      } catch (fbErr) {
        console.warn('[verifyAdminPassword] Firebase Auth reauth:', fbErr?.code);
        if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
          return { success: false, error: 'Incorrect administrator password.' };
        }
      }
    }

    // 2. Check Firestore users_lookup
    try {
      const lookup = await getUserLookup(cleanEmail);
      if (lookup && lookup.password) {
        if (lookup.password === enteredPassword) {
          return { success: true };
        } else {
          return { success: false, error: 'Incorrect administrator password.' };
        }
      }
    } catch (e) {
      console.warn('[verifyAdminPassword] users_lookup check failed:', e);
    }

    // 3. Check Firestore admins collection
    try {
      const adminDoc = await getAdminByEmail(cleanEmail, activeCollegeId);
      if (adminDoc && adminDoc.password) {
        if (adminDoc.password === enteredPassword) {
          return { success: true };
        } else {
          return { success: false, error: 'Incorrect administrator password.' };
        }
      }
      const dpsAdmin = await getAdminByEmail(cleanEmail, 'dps_main');
      if (dpsAdmin && dpsAdmin.password) {
        if (dpsAdmin.password === enteredPassword) {
          return { success: true };
        } else {
          return { success: false, error: 'Incorrect administrator password.' };
        }
      }
    } catch (e) {
      console.warn('[verifyAdminPassword] adminDoc check failed:', e);
    }

    return { success: false, error: 'Incorrect administrator password.' };
  };

  const changeAdminPassword = async (currentPassword, newPassword) => {
    if (!currentPassword) return { success: false, error: 'Current password is required.' };
    if (!newPassword) return { success: false, error: 'New password is required.' };
    const pwCheck = validatePasswordRules(newPassword);
    if (!pwCheck.allSatisfied) {
      return { success: false, error: `New password must satisfy all requirements: missing ${pwCheck.firstMissing?.label?.toLowerCase() || 'requirements'}.` };
    }
    if (newPassword === currentPassword) return { success: false, error: 'New password must be different from current password.' };

    const cleanEmail = (user?.email || auth?.currentUser?.email || '').trim().toLowerCase();
    if (!cleanEmail) return { success: false, error: 'No active administrator email found.' };

    // 1. Verify current password
    const verifyRes = await verifyAdminPassword(currentPassword);
    if (!verifyRes?.success) {
      return { success: false, error: verifyRes?.error || 'Current password is incorrect.' };
    }

    // 2. Update Firebase Auth password if currentUser is logged in
    if (auth.currentUser && auth.currentUser.email && auth.currentUser.email.toLowerCase() === cleanEmail) {
      try {
        const cred = EmailAuthProvider.credential(cleanEmail, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, cred);
        await fbUpdatePassword(auth.currentUser, newPassword);
      } catch (fbErr) {
        console.warn('[changeAdminPassword] Firebase Auth updatePassword error:', fbErr?.code, fbErr?.message);
        if (fbErr.code === 'auth/weak-password') {
          return { success: false, error: 'Password should be at least 6 characters.' };
        }
      }
    }

    // 3. Update Firestore admins collection (both current college and dps_main for fallback)
    try {
      const existingAdmin = (await getAdminByEmail(cleanEmail, activeCollegeId)) || (await getAdminByEmail(cleanEmail, 'dps_main')) || {};
      const updatedAdmin = { ...existingAdmin, password: newPassword, updatedAt: new Date().toISOString() };
      await saveAdmin(cleanEmail, updatedAdmin, activeCollegeId);
      await saveAdmin(cleanEmail, updatedAdmin, 'dps_main');
    } catch (e) {
      console.warn('[changeAdminPassword] saveAdmin error:', e);
    }

    // 4. Update Firestore users_lookup
    try {
      const existingLookup = (await getUserLookup(cleanEmail)) || {};
      await saveUserLookup(cleanEmail, {
        ...existingLookup,
        identifier: cleanEmail,
        role: 'admin',
        collegeId: activeCollegeId || existingLookup.collegeId || 'dps_main',
        password: newPassword,
      });
    } catch (e) {
      console.warn('[changeAdminPassword] saveUserLookup error:', e);
    }

    // 5. Update Firestore session
    try {
      const sessionKey = getOrCreateSessionKey();
      const currentSess = (await getSession(sessionKey)) || {};
      await saveSession(sessionKey, {
        ...currentSess,
        password: newPassword,
      });
    } catch (e) {
      console.warn('[changeAdminPassword] saveSession error:', e);
    }

    // 6. Update local user state
    setUser((prev) => (prev ? { ...prev, password: newPassword } : prev));

    return { success: true };
  };

  const updateAdminProfile = async ({ collegeName, principleName, email, password }) => {
    if (!password) return { success: false, error: 'Administrator password is required to save changes.' };

    // 1. Verify password first
    const verifyRes = await verifyAdminPassword(password);
    if (!verifyRes?.success) {
      return { success: false, error: verifyRes?.error || 'Incorrect administrator password.' };
    }

    const currentEmail = (user?.email || auth?.currentUser?.email || '').trim().toLowerCase();
    const newEmail = (email || currentEmail).trim().toLowerCase();
    const newCollege = (collegeName || '').trim();
    const newPrincipal = (principleName || '').trim();

    if (!newCollege) return { success: false, error: 'College Name is required.' };
    if (!newPrincipal) return { success: false, error: 'Principle Name is required.' };
    if (!newEmail) return { success: false, error: 'Admin Email ID is required.' };

    // 2. If email changed, update Firebase Auth email
    if (newEmail !== currentEmail) {
      if (auth.currentUser && auth.currentUser.email && auth.currentUser.email.toLowerCase() === currentEmail) {
        try {
          const cred = EmailAuthProvider.credential(currentEmail, password);
          await reauthenticateWithCredential(auth.currentUser, cred);
          await fbUpdateEmail(auth.currentUser, newEmail);
        } catch (fbErr) {
          console.warn('[updateAdminProfile] fbUpdateEmail error:', fbErr?.code, fbErr?.message);
          if (fbErr.code === 'auth/email-already-in-use') {
            return { success: false, error: 'This email is already in use by another account.' };
          }
          if (fbErr.code === 'auth/invalid-email') {
            return { success: false, error: 'Please enter a valid email address.' };
          }
        }
      }
    }

    // 3. Update displayName in Firebase Auth
    if (newPrincipal && auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: newPrincipal });
      } catch (e) {}
    }

    // 4. Update Firestore admins collection
    try {
      const existingAdmin = (await getAdminByEmail(currentEmail, activeCollegeId)) || (await getAdminByEmail(currentEmail, 'dps_main')) || {};
      const updatedAdmin = {
        ...existingAdmin,
        collegeName: newCollege,
        principleName: newPrincipal,
        name: newPrincipal,
        email: newEmail,
        updatedAt: new Date().toISOString(),
      };
      await saveAdmin(newEmail, updatedAdmin, activeCollegeId);
      await saveAdmin(newEmail, updatedAdmin, 'dps_main');
    } catch (e) {
      console.warn('[updateAdminProfile] saveAdmin error:', e);
    }

    // 5. Update Firestore users_lookup
    try {
      const existingLookup = (await getUserLookup(currentEmail)) || {};
      const updatedLookup = {
        ...existingLookup,
        identifier: newEmail,
        collegeName: newCollege,
        name: newPrincipal,
        collegeId: activeCollegeId || existingLookup.collegeId || 'dps_main',
      };
      if (newEmail !== currentEmail) {
        await deleteUserLookup(currentEmail);
      }
      await saveUserLookup(newEmail, updatedLookup);
    } catch (e) {
      console.warn('[updateAdminProfile] saveUserLookup error:', e);
    }

    // 6. Update Firestore settings
    try {
      const settingsPayload = {
        schoolName: newCollege,
        collegeName: newCollege,
        principleName: newPrincipal,
        teacherName: newPrincipal,
        adminEmail: newEmail,
      };
      await fsSaveSettings(settingsPayload, activeCollegeId);
      await fsSaveSettings(settingsPayload, 'dps_main');
    } catch (e) {
      console.warn('[updateAdminProfile] saveSettings error:', e);
    }

    // 7. Update active session in Firestore
    const updatedUserObj = {
      ...user,
      email: newEmail,
      name: newPrincipal,
      principleName: newPrincipal,
      collegeName: newCollege,
    };
    try {
      const sessionKey = getOrCreateSessionKey();
      const currentSess = (await getSession(sessionKey)) || {};
      await saveSession(sessionKey, {
        ...currentSess,
        ...updatedUserObj,
      });
    } catch (e) {
      console.warn('[updateAdminProfile] saveSession error:', e);
    }

    // 8. Update in-memory user
    setUser(updatedUserObj);

    return { success: true, user: updatedUserObj };
  };

  return (
    <AuthContext.Provider value={{ user, setUser, role, currentStudent, setCurrentStudent, loading, activeCollegeId, setActiveCollegeId, login, loginWithGoogle, createAdminAccount, teacherLogin, studentLogin, logout, verifyAdminPassword, changeAdminPassword, updateAdminProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
