import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // You can fetch more user details from Firestore here if needed
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUser.displayName || currentUser.email.split('@')[0],
          role: 'Teacher',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password, remember) => {
    try {
      // Set session persistence based on "remember me" checkbox
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      
      // Attempt login with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      return { success: true };
    } catch (error) {
      console.error("Firebase Auth Error:", error);
      let msg = "Failed to sign in.";
      
      // Provide friendly error messages
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          msg = "Invalid email or password.";
          break;
        case 'auth/too-many-requests':
          msg = "Too many failed attempts. Try again later.";
          break;
        case 'auth/invalid-email':
          msg = "Please enter a valid email address.";
          break;
        case 'auth/network-request-failed':
          msg = "Network error. Please check your connection.";
          break;
      }
      
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
