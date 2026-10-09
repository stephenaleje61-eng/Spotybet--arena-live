import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';

/**
 * Robustly parses and formats any Firebase error into a clear, actionable user message.
 */
export function formatFirebaseAuthError(error: unknown): string {
  if (!error) return 'An unexpected authentication error occurred. Please try again.';

  let code = '';
  let rawMessage = '';

  if (typeof error === 'string') {
    rawMessage = error;
  } else if (typeof error === 'object') {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.code === 'string') {
      code = errObj.code;
    }
    if (typeof errObj.message === 'string') {
      rawMessage = errObj.message;
    }
    if (typeof errObj.error === 'string') {
      rawMessage = errObj.error;
    }
  }

  // Extract auth/ code if present in the message string
  if (!code && rawMessage) {
    const match = rawMessage.match(/\((auth\/[^)]+)\)/) || rawMessage.match(/(auth\/[a-z0-9-]+)/i);
    if (match) {
      code = match[1].toLowerCase();
    }
  }

  // Specific Firebase Auth error code mappings
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please verify your credentials and try again.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please register an account first.';
    case 'auth/invalid-email':
      return 'The email address is improperly formatted. Please enter a valid email (e.g. name@example.com).';
    case 'auth/email-already-in-use':
      return 'An account is already registered with this email. Please log in or request a password reset.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This user account has been suspended. Please contact administrator support.';
    case 'auth/too-many-requests':
      return 'Too many consecutive failed login attempts. Access is temporarily locked for security. Please wait a few moments and try again.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connectivity and try again.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is currently disabled in the authentication configuration.';
    case 'auth/requires-recent-login':
      return 'This sensitive operation requires a fresh login. Please log in again.';
    case 'auth/invalid-verification-code':
      return 'The confirmation code entered is invalid or expired. Please check and try again.';
    case 'auth/popup-closed-by-user':
      return 'The login popup was closed before completion. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'The login operation was cancelled.';
    case 'auth/internal-error':
      return 'Internal authentication service error. Please try again in a moment.';
    default:
      // If server returned a direct human message
      if (rawMessage && !rawMessage.includes('Firebase: Error') && !rawMessage.startsWith('Error:')) {
        return rawMessage;
      }
      if (code) {
        return `Authentication failed (${code.replace('auth/', '')}). Please check your input and try again.`;
      }
      return rawMessage ? rawMessage.replace(/^Error:\s*/, '') : 'Authentication failed. Please check your credentials.';
  }
}

// Safely obtain Firebase App and Auth if configured
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

try {
  const apiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY || (window as any)?.__FIREBASE_CONFIG__?.apiKey;
  const projectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || (window as any)?.__FIREBASE_CONFIG__?.projectId;

  if (apiKey && projectId) {
    if (getApps().length === 0) {
      firebaseApp = initializeApp({
        apiKey,
        authDomain: `${projectId}.firebaseapp.com`,
        projectId,
        storageBucket: `${projectId}.appspot.com`,
        messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
        appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
      });
    } else {
      firebaseApp = getApps()[0];
    }
    firebaseAuth = getAuth(firebaseApp);
  }
} catch (e) {
  console.warn('Firebase client initialization note:', e);
}

export {
  firebaseApp,
  firebaseAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
};
export type { FirebaseUser };
