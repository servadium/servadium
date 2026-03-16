/**
 * useAuth Hook — manages Firebase auth state and syncs with Zustand session store.
 * Listens for auth state changes and keeps firebaseToken in memory only.
 */

"use client";

import { useEffect, useState, useCallback } from "react";

import {
  getAuth,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getIdToken,
  onAuthStateChanged,
  type FirebaseUser,
} from "@/lib/firebase";
import { useSessionStore } from "@/store/session";

interface UseAuthReturn {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setFirebaseToken = useSessionStore((s) => s.setFirebaseToken);
  const setCurrentUser = useSessionStore((s) => s.setCurrentUser);
  const resetAll = useSessionStore((s) => s.resetAll);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);

      if (firebaseUser) {
        const token = await getIdToken();
        setFirebaseToken(token);
        setCurrentUser({
          id: firebaseUser.uid,
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          name: firebaseUser.displayName ?? firebaseUser.email ?? "User",
          avatar_url: firebaseUser.photoURL,
          created_at: new Date().toISOString(),
        });
      } else {
        setFirebaseToken(null);
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [setFirebaseToken, setCurrentUser]);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setIsLoading(true);
      try {
        await signInWithEmail(email, password);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Email sign-in failed",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const registerWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setIsLoading(true);
      try {
        await signUpWithEmail(email, password);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Registration failed",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await signOut();
      resetAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-out failed");
    }
  }, [resetAll]);

  return {
    user,
    isLoading,
    error,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
  };
}
