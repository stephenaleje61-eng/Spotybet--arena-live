import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import {
  firebaseAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  formatFirebaseAuthError,
} from '../firebase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  isVerifyingEmail: boolean;
  isAdmin: boolean;
  isFirebaseActive: boolean;
  onlineCount: number;
  login: (email: string, password: string) => Promise<void>;
  register: (body: {
    email: string;
    password: string;
    username: string;
    displayName?: string;
    favoriteTeam?: string;
  }) => Promise<{ verificationCodeHint?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<User | null>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerification: () => Promise<string | undefined>;
  updateProfile: (data: {
    displayName?: string;
    bio?: string;
    favoriteTeam?: string;
    avatarColor?: string;
  }) => Promise<void>;
  authModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  verifyModalOpen: boolean;
  openVerifyModal: () => void;
  closeVerifyModal: () => void;
  verificationHint: string | null;
  setVerificationHint: (hint: string | null) => void;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'safepicks_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Optimistically restore cached user profile to prevent any UI flicker
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verificationHint, setVerificationHint] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const saveUserSession = useCallback((newUser: User | null) => {
    setUser(newUser);
    try {
      if (newUser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch {
      // storage quota / security silent
    }
  }, []);

  // Validate and restore session from storage & backend
  const checkAuth = useCallback(async (): Promise<User | null> => {
    const token = api.getToken();
    if (!token) {
      saveUserSession(null);
      setIsLoading(false);
      return null;
    }

    try {
      const res = await api.getMe();
      if (res && res.user) {
        saveUserSession(res.user);
        return res.user;
      } else {
        api.setToken(null);
        saveUserSession(null);
        return null;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      // Only discard the session if specifically unauthorized
      if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('Invalid session')) {
        api.setToken(null);
        saveUserSession(null);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [saveUserSession]);

  const refreshSession = useCallback(async () => {
    return checkAuth();
  }, [checkAuth]);

  // Synchronize authentication status across multiple browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'safepicks_token' || e.key === USER_STORAGE_KEY) {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuth]);

  // Firebase auth state listener if Firebase credentials are active
  useEffect(() => {
    if (firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, async fbUser => {
        if (fbUser) {
          try {
            const res = await api.getMe();
            if (res && res.user) {
              saveUserSession(res.user);
            }
          } catch {
            // silent
          }
        } else if (!api.getToken()) {
          saveUserSession(null);
        }
      });
      return () => unsubscribe();
    }
  }, [saveUserSession]);

  // Validate session immediately on application mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Periodic heartbeat presence tracking
  useEffect(() => {
    let isMounted = true;
    const runHeartbeat = async () => {
      try {
        const res = await api.heartbeat();
        if (isMounted && res.onlineUsers) {
          setOnlineCount(res.onlineUsers);
        }
      } catch {
        // silent
      }
    };

    runHeartbeat();
    const interval = setInterval(runHeartbeat, 25000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // Robust login function with comprehensive Firebase error handling and state updates
  const login = async (email: string, password: string) => {
    setAuthError(null);
    setIsAuthenticating(true);

    try {
      const cleanEmail = email.trim();

      // 1. If Firebase Auth client is present, sign in via Firebase Auth
      if (firebaseAuth) {
        try {
          await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
        } catch (fbErr: any) {
          const code = fbErr?.code;
          // If user exists in backend DB (e.g. seeded admin account), fallback to backend auth
          // and auto-sync to Firebase
          if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
            try {
              const res = await api.login({ email: cleanEmail, password });
              // Attempt synchronizing account to Firebase Auth
              try {
                await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
              } catch {
                // Account might already exist or Firebase config read-only
              }
              api.setToken(res.token);
              saveUserSession(res.user);
              setAuthModalOpen(false);
              setAuthError(null);
              return;
            } catch {
              const formatted = formatFirebaseAuthError(fbErr);
              setAuthError(formatted);
              throw new Error(formatted);
            }
          }

          const formatted = formatFirebaseAuthError(fbErr);
          setAuthError(formatted);
          throw new Error(formatted);
        }
      }

      // 2. Authenticate session with database backend
      const res = await api.login({ email: cleanEmail, password });
      api.setToken(res.token);
      saveUserSession(res.user);
      setAuthModalOpen(false);
      setAuthError(null);
    } catch (err: unknown) {
      const msg = formatFirebaseAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Robust registration function with comprehensive error handling and state updates
  const register = async (body: {
    email: string;
    password: string;
    username: string;
    displayName?: string;
    favoriteTeam?: string;
  }) => {
    setAuthError(null);
    setIsAuthenticating(true);

    try {
      const cleanEmail = body.email.trim();
      const cleanUsername = body.username.trim();

      if (firebaseAuth) {
        try {
          await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, body.password);
        } catch (fbErr) {
          const formatted = formatFirebaseAuthError(fbErr);
          setAuthError(formatted);
          throw new Error(formatted);
        }
      }

      const res = await api.register({
        ...body,
        email: cleanEmail,
        username: cleanUsername,
      });

      api.setToken(res.token);
      saveUserSession(res.user);
      setAuthModalOpen(false);
      if (res.verificationCodeHint) {
        setVerificationHint(res.verificationCodeHint);
        setVerifyModalOpen(true);
      }
      return { verificationCodeHint: res.verificationCodeHint };
    } catch (err: unknown) {
      const msg = formatFirebaseAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Logout with complete session cleanup
  const logout = async () => {
    try {
      if (firebaseAuth) {
        await firebaseSignOut(firebaseAuth).catch(() => {});
      }
      await api.logout();
    } finally {
      saveUserSession(null);
      api.setToken(null);
      clearAuthError();
    }
  };

  // Email verification with loading and error states
  const verifyEmail = async (code: string) => {
    setIsVerifyingEmail(true);
    setAuthError(null);
    try {
      const res = await api.verifyEmail(code);
      saveUserSession(res.user);
      setVerifyModalOpen(false);
      setVerificationHint(null);
    } catch (err: unknown) {
      const msg = formatFirebaseAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const resendVerification = async () => {
    try {
      const res = await api.resendVerification();
      if (res.verificationCodeHint) {
        setVerificationHint(res.verificationCodeHint);
      }
      return res.verificationCodeHint;
    } catch (err: unknown) {
      const msg = formatFirebaseAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const updateProfile = async (data: {
    displayName?: string;
    bio?: string;
    favoriteTeam?: string;
    avatarColor?: string;
  }) => {
    try {
      const res = await api.updateProfile(data);
      saveUserSession(res.user);
    } catch (err: unknown) {
      const msg = formatFirebaseAuthError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setAuthError(null);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthError(null);
  };

  const openVerifyModal = () => {
    setAuthError(null);
    setVerifyModalOpen(true);
  };

  const closeVerifyModal = () => {
    setVerifyModalOpen(false);
    setAuthError(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticating,
        isVerifyingEmail,
        isAdmin,
        isFirebaseActive: Boolean(firebaseAuth),
        onlineCount,
        login,
        register,
        logout,
        refreshSession,
        verifyEmail,
        resendVerification,
        updateProfile,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        verifyModalOpen,
        openVerifyModal,
        closeVerifyModal,
        verificationHint,
        setVerificationHint,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
