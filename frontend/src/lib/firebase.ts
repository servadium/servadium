/**
 * Firebase Configuration — lazy client-side initialization.
 * Only initializes when getAuth() is first called on the client.
 * All config from NEXT_PUBLIC_ env vars — never hardcoded.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth as firebaseGetAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from "firebase/auth";

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

function getApp(): FirebaseApp {
  if (_app) return _app;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  if (getApps().length === 0) {
    _app = initializeApp(config);
  } else {
    _app = getApps()[0];
  }
  return _app;
}

function getAuth(): Auth {
  if (_auth) return _auth;
  _auth = firebaseGetAuth(getApp());
  return _auth;
}

const googleProvider = new GoogleAuthProvider();

// ─── Auth Functions ──────────────────────────────────────

async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(getAuth(), googleProvider);
  return result.user;
}

async function signInWithEmail(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(getAuth(), email, password);
  return result.user;
}

async function signUpWithEmail(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(getAuth(), email, password);
  return result.user;
}

async function signOut(): Promise<void> {
  await firebaseSignOut(getAuth());
}

async function getIdToken(): Promise<string | null> {
  const user = getAuth().currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export {
  getAuth,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getIdToken,
  onAuthStateChanged,
  type FirebaseUser,
};
