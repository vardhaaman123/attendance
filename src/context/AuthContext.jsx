import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';

export const ALLOWED_ADMIN_EMAIL = 'ainapure290@gmail.com';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [role, setRole]               = useState(null); // 'admin' | 'teacher' | 'student'
  const [currentStudent, setCurrentStudent] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    // Restore non-Firebase sessions (teacher / student)
    const savedRole    = localStorage.getItem('attendify_role');
    const savedStudent = localStorage.getItem('attendify_student_session');

    if (savedRole === 'student' && savedStudent) {
      setRole('student');
      setCurrentStudent(JSON.parse(savedStudent));
      setLoading(false);
      return () => {};
    }

    if (savedRole === 'teacher') {
      const savedTeacher = localStorage.getItem('attendify_teacher_session');
      setRole('teacher');
      setUser(savedTeacher ? JSON.parse(savedTeacher) : { name: 'Teacher' });
      setLoading(false);
      return () => {};
    }

    // Firebase admin session listener - strictly locked to ALLOWED_ADMIN_EMAIL
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userEmail = (firebaseUser.email || '').trim().toLowerCase();

        // Strict security enforcement: Only ALLOWED_ADMIN_EMAIL is permitted
        if (userEmail !== ALLOWED_ADMIN_EMAIL) {
          console.warn(`[Security Alert] Unauthorized login attempt: ${userEmail}. Signing out.`);
          try {
            await firebaseSignOut(auth);
          } catch (e) {
            console.error('Forced sign-out failed:', e);
          }
          setUser(null);
          setRole(null);
          localStorage.removeItem('attendify_role');
          localStorage.removeItem('attendify_local_admin');
          setLoading(false);
          return;
        }

        const u = {
          uid:      firebaseUser.uid,
          email:    firebaseUser.email,
          name:     firebaseUser.displayName || 'Vardhaman (Admin)',
          photoURL: firebaseUser.photoURL,
          role:     'Admin',
        };
        setUser(u);
        setRole('admin');
        localStorage.setItem('attendify_role', 'admin');
      } else {
        if (localStorage.getItem('attendify_role') === 'admin') {
          setUser(null);
          setRole(null);
          localStorage.removeItem('attendify_role');
          localStorage.removeItem('attendify_local_admin');
        }
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  // ── Admin: Firebase email/password ──
  const login = async (email, password, remember) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Strict email whitelist check: Only ALLOWED_ADMIN_EMAIL
    if (cleanEmail !== ALLOWED_ADMIN_EMAIL) {
      return {
        success: false,
        error: `Access Denied: Only ${ALLOWED_ADMIN_EMAIL} is authorized to sign in.`,
      };
    }

    if (!password) {
      return {
        success: false,
        error: 'Password is required to sign in.',
      };
    }

    // 2. Strict Firebase Authentication (No bypasses, no auto-registration of unknown users)
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, ALLOWED_ADMIN_EMAIL, password);

      const verifiedEmail = (userCredential.user?.email || '').trim().toLowerCase();
      if (verifiedEmail !== ALLOWED_ADMIN_EMAIL) {
        await firebaseSignOut(auth);
        return {
          success: false,
          error: `Access Denied: Account ${verifiedEmail} is not authorized.`,
        };
      }

      localStorage.setItem('attendify_role', 'admin');
      return { success: true };
    } catch (error) {
      console.warn('Firebase signIn attempt:', error.code);

      let msg = 'Failed to sign in.';
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        msg = `Invalid password for ${ALLOWED_ADMIN_EMAIL}. If your account uses Google Sign-In, please click "Sign in with Google" below.`;
      } else if (error.code === 'auth/too-many-requests') {
        msg = 'Too many failed attempts. Please wait a few minutes before trying again.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (error.code === 'auth/network-request-failed') {
        msg = 'Network connection error. Please check your internet connection.';
      }
      return { success: false, error: msg };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        login_hint: ALLOWED_ADMIN_EMAIL,
      });

      const result = await signInWithPopup(auth, provider);
      const signedInEmail = (result.user?.email || '').trim().toLowerCase();

      // Strict security check: verify that the chosen Google account is ALLOWED_ADMIN_EMAIL
      if (signedInEmail !== ALLOWED_ADMIN_EMAIL) {
        console.warn(`[Security Alert] Google account ${signedInEmail} rejected. Only ${ALLOWED_ADMIN_EMAIL} is allowed.`);
        await firebaseSignOut(auth);
        setUser(null);
        setRole(null);
        localStorage.removeItem('attendify_role');
        localStorage.removeItem('attendify_local_admin');
        return {
          success: false,
          error: `Access Denied: The Google account (${signedInEmail}) is not authorized. Only ${ALLOWED_ADMIN_EMAIL} can log in.`,
        };
      }

      localStorage.setItem('attendify_role', 'admin');
      return { success: true };
    } catch (error) {
      console.warn('Google sign-in:', error.code);
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in popup was closed before completion.' };
      }
      if (error.code === 'auth/network-request-failed') {
        return { success: false, error: 'Network error connecting to Google Authentication.' };
      }
      return { success: false, error: error.message || 'Google sign-in failed.' };
    }
  };

  // ── Teacher: login using name, email, class, and division/section ──
  const teacherLogin = ({ name, email, class: cls, section }, teachersList = []) => {
    const cleanName = (name || '').trim().toLowerCase();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanClass = String(cls || '').trim();
    const cleanSection = (section || '').trim().toUpperCase();

    const sourceList = (teachersList && teachersList.length > 0)
      ? teachersList
      : JSON.parse(localStorage.getItem('attendify_teachers') || '[]');

    const matched = sourceList.find(t =>
      (t.name || '').trim().toLowerCase() === cleanName &&
      (t.email || '').trim().toLowerCase() === cleanEmail &&
      String(t.class || '').trim() === cleanClass &&
      (t.section || '').trim().toUpperCase() === cleanSection
    );

    if (matched) {
      const teacherObj = {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        class: matched.class,
        section: matched.section,
        subject: matched.subject || '',
        contact: matched.contact || '',
        role: 'Teacher',
      };
      setRole('teacher');
      setUser(teacherObj);
      localStorage.setItem('attendify_role', 'teacher');
      localStorage.setItem('attendify_teacher_session', JSON.stringify(teacherObj));
      return { success: true, teacher: teacherObj };
    }

    return {
      success: false,
      error: 'Invalid credentials. No teacher found matching this name, email, class, and division.',
    };
  };

  // ── Student: roll number + name + password ──
  const studentLogin = (rollNumber, name, password, students) => {
    const student = students.find(
      (s) =>
        s.rollNumber.trim() === rollNumber.trim() &&
        s.name.toLowerCase().trim() === name.toLowerCase().trim() &&
        (s.password || '1234') === password
    );
    if (student) {
      setRole('student');
      setCurrentStudent(student);
      localStorage.setItem('attendify_role', 'student');
      localStorage.setItem('attendify_student_session', JSON.stringify(student));
      return { success: true, student };
    }
    return { success: false, error: 'Invalid roll number, name, or password.' };
  };

  const logout = async () => {
    if (role === 'admin') {
      try { await firebaseSignOut(auth); } catch (e) { console.error(e); }
    }
    setUser(null);
    setRole(null);
    setCurrentStudent(null);
    localStorage.removeItem('attendify_role');
    localStorage.removeItem('attendify_student_session');
    localStorage.removeItem('attendify_teacher_session');
    localStorage.removeItem('attendify_local_admin');
  };

  return (
    <AuthContext.Provider value={{
      user, role, currentStudent, loading,
      login, loginWithGoogle, teacherLogin, studentLogin, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
