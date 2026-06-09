import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";

import { auth } from "../config/firebase";
import {
  registerWithEmail,
  sendResetPasswordEmail,
  signInWithEmail,
  signOutCurrentUser,
} from "../services/authService";

type AuthContextValue = {
  clearError: () => void;
  error: string | null;
  isLoading: boolean;
  register: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getAuthErrorMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "Tenhle e-mail uz ma ucet.";
    case "auth/invalid-email":
      return "Zadej platny e-mail.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "E-mail nebo heslo nesedi.";
    case "auth/weak-password":
      return "Heslo musi mit alespon 6 znaku.";
    case "auth/network-request-failed":
      return "Nepodarilo se pripojit k siti.";
    default:
      return "Pri prihlaseni nastala chyba. Zkus to prosim znovu.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setError(null);

    try {
      await registerWithEmail(email, password);
    } catch (registerError) {
      const message = getAuthErrorMessage(registerError);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);

    try {
      await signInWithEmail(email, password);
    } catch (signInError) {
      const message = getAuthErrorMessage(signInError);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);

    try {
      await sendResetPasswordEmail(email);
    } catch (resetError) {
      const message = getAuthErrorMessage(resetError);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    await signOutCurrentUser();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      clearError,
      error,
      isLoading,
      register,
      resetPassword,
      signIn,
      signOut,
      user,
    }),
    [clearError, error, isLoading, register, resetPassword, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
