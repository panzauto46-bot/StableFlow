import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, loginWithEmail, registerWithEmail, logoutUser, initializeUserData, getUserData } from '../config/firebase';
import { UserData, UserSession, mockUserData } from '../models/User';

// Session storage keys
const SESSION_KEY = 'stableflow_session';
const USER_DATA_KEY = 'stableflow_user_data';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  userData: UserData | null;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  demoLogin: () => void;
}

export const useAuth = (): AuthState & AuthActions => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      const savedSession = localStorage.getItem(SESSION_KEY);
      const savedUserData = localStorage.getItem(USER_DATA_KEY);

      if (savedSession && savedUserData) {
        try {
          const session: UserSession = JSON.parse(savedSession);
          const data: UserData = JSON.parse(savedUserData);
          
          if (session.isLoggedIn) {
            setIsAuthenticated(true);
            setUserData(data);
          }
        } catch (e) {
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(USER_DATA_KEY);
        }
      }
      setIsLoading(false);
    };

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthenticated(true);
        
        // Fetch user data from database
        const data = await getUserData(firebaseUser.uid);
        if (data) {
          const userDataObj: UserData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            balance: data.balance || 0,
            createdAt: data.createdAt || new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            isVerified: firebaseUser.emailVerified,
            accountType: data.accountType || 'PERSONAL'
          };
          setUserData(userDataObj);
          saveSession(userDataObj);
        }
      } else {
        // Check for demo session
        checkSession();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveSession = (data: UserData) => {
    const session: UserSession = {
      isLoggedIn: true,
      user: data,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    const result = await loginWithEmail(email, password);
    
    if (result.success && result.user) {
      const data = await getUserData(result.user.uid);
      if (data) {
        const userDataObj: UserData = {
          uid: result.user.uid,
          email: result.user.email || email,
          displayName: result.user.displayName || '',
          balance: data.balance || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          isVerified: result.user.emailVerified,
          accountType: data.accountType || 'PERSONAL'
        };
        setUserData(userDataObj);
        saveSession(userDataObj);
      }
      setIsAuthenticated(true);
      setIsLoading(false);
      return { success: true };
    } else {
      setError(result.error || 'Login gagal');
      setIsLoading(false);
      return { success: false, error: result.error };
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    const result = await registerWithEmail(email, password);
    
    if (result.success && result.user) {
      // Initialize user data in database
      await initializeUserData(result.user.uid, email);
      
      const userDataObj: UserData = {
        uid: result.user.uid,
        email: email,
        balance: 1000.00, // Initial balance
        createdAt: new Date().toISOString(),
        isVerified: false,
        accountType: 'PERSONAL'
      };
      
      setUserData(userDataObj);
      saveSession(userDataObj);
      setIsAuthenticated(true);
      setIsLoading(false);
      return { success: true };
    } else {
      setError(result.error || 'Registrasi gagal');
      setIsLoading(false);
      return { success: false, error: result.error };
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await logoutUser();
    clearSession();
    setUser(null);
    setUserData(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Demo login for testing without Firebase
  const demoLogin = useCallback(() => {
    setIsLoading(true);
    const demoUser = { ...mockUserData, lastLoginAt: new Date().toISOString() };
    setUserData(demoUser);
    saveSession(demoUser);
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    isAuthenticated,
    user,
    userData,
    error,
    login,
    register,
    logout,
    clearError,
    demoLogin
  };
};

export default useAuth;
