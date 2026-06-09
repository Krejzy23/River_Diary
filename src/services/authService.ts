import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "../config/firebase";

function getAuthInstance() {
  if (!auth) {
    throw new Error("Firebase Auth neni nakonfigurovany.");
  }

  return auth;
}

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(getAuthInstance(), email.trim(), password);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getAuthInstance(), email.trim(), password);
}

export async function sendResetPasswordEmail(email: string) {
  return sendPasswordResetEmail(getAuthInstance(), email.trim());
}

export async function signOutCurrentUser() {
  return signOut(getAuthInstance());
}
