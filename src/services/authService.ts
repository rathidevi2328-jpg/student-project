import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USERS } from './seedService';

export const authService = {
  /**
   * Signs in a user using Firebase Auth if configured, or demo accounts if in local mode
   */
  async login(email: string, password: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. If Firebase is configured and auth is initialized, attempt Firebase Auth
    if (isFirebaseConfigured && auth && db) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const uid = userCredential.user.uid;

        // Fetch user document from Firestore: users/{userId}
        const userDocRef = doc(db, 'users', uid);
        const snap = await getDoc(userDocRef);

        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          return data;
        }

        // Fallback default profile if not in Firestore
        return {
          uid,
          name: userCredential.user.displayName || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: cleanEmail.includes('admin') ? 'admin' : cleanEmail.includes('faculty') ? 'faculty' : 'student',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        };
      } catch (err: any) {
        // If Firebase error occurs, throw friendly error
        console.error('Firebase Auth Error:', err);
        throw new Error(this.getFriendlyAuthError(err.code || err.message));
      }
    }

    // 2. Local / Seed Mode Login (works out of the box for testing)
    const matchedUser = INITIAL_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
    if (matchedUser) {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      return matchedUser;
    }

    // Generic demo user if not in initial list
    let role: UserRole = 'student';
    if (cleanEmail.includes('admin')) role = 'admin';
    else if (cleanEmail.includes('faculty') || cleanEmail.includes('prof')) role = 'faculty';

    return {
      uid: `user-${Date.now()}`,
      name: cleanEmail.split('@')[0].toUpperCase(),
      email: cleanEmail,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };
  },

  /**
   * Sends password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
      } catch (err: any) {
        throw new Error(this.getFriendlyAuthError(err.code || err.message));
      }
    } else {
      // Simulation mode
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  },

  /**
   * Signs out the user
   */
  async logout(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    localStorage.removeItem('smartattend_active_session');
  },

  /**
   * Helper to map Firebase auth error codes to friendly strings
   */
  getFriendlyAuthError(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials.';
      case 'auth/invalid-email':
        return 'Please enter a valid academic email address.';
      case 'auth/user-disabled':
        return 'This account has been deactivated. Please contact the college administrator.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please wait a few moments and try again.';
      case 'auth/network-request-failed':
        return 'Network connection error. Please check your internet connection.';
      default:
        return 'Authentication failed. Please verify your details.';
    }
  },
};
