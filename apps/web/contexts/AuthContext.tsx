"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  ActionCodeSettings,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { upsertUserProfile } from "@/lib/firestore";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  sendEmailLink: (email: string) => Promise<void>;
  completeEmailLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EMAIL_LINK_SETTINGS: ActionCodeSettings = {
  url: typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : "http://localhost:3000/auth/callback",
  handleCodeInApp: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // Upsert user profile in Firestore
        try {
          await upsertUserProfile(firebaseUser.uid, {
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
        } catch (err) {
          console.warn("Failed to upsert user profile:", err);
        }
      }
    });

    // Handle email link sign-in on page load
    if (
      typeof window !== "undefined" &&
      isSignInWithEmailLink(firebaseAuth, window.location.href)
    ) {
      const email = window.localStorage.getItem("emailForSignIn");
      if (email) {
        signInWithEmailLink(firebaseAuth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem("emailForSignIn");
          })
          .catch((err) => {
            console.error("Email link sign-in failed:", err);
          });
      }
    }

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuth, provider);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
      throw err;
    }
  };

  const sendEmailLink = async (email: string) => {
    setError(null);
    try {
      // Update the ACTION_CODE_SETTINGS URL dynamically
      const settings: ActionCodeSettings = {
        ...EMAIL_LINK_SETTINGS,
        url: `${window.location.origin}/auth/callback`,
      };
      await sendSignInLinkToEmail(firebaseAuth, email, settings);
      window.localStorage.setItem("emailForSignIn", email);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send email link";
      setError(message);
      throw err;
    }
  };

  const completeEmailLink = async (email: string) => {
    setError(null);
    try {
      await signInWithEmailLink(firebaseAuth, email, window.location.href);
      window.localStorage.removeItem("emailForSignIn");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
      throw err;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(firebaseAuth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        sendEmailLink,
        completeEmailLink,
        signOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
