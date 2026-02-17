"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { type User } from "firebase/auth";
import { onAuthChange } from "@/lib/firebase/auth";
import { createUserProfile, getUserProfile } from "@/lib/firebase/firestore";
import { setAnalyticsUser } from "@/lib/firebase/analytics";
import type { UserProfile } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userProfile: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  refreshProfile: async () => {},
});

const DEFAULT_SETTINGS: UserProfile["settings"] = {
  theme: "system",
  colorPalette: "default",
  density: "normal",
  editorFont: "sans",
  defaultView: "list",
  fontSize: "medium",
  contentWidth: "medium",
  aiEnabled: true,
  aiPreferredModel: "flash",
  aiResponseLanguage: "pt-BR",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch {
      // Silencioso — perfil pode não existir ainda
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setError(null);

      if (firebaseUser) {
        try {
          let profile = await getUserProfile(firebaseUser.uid);

          if (!profile) {
            await createUserProfile(firebaseUser.uid, {
              displayName: firebaseUser.displayName || "",
              email: firebaseUser.email || "",
              avatarUrl: firebaseUser.photoURL || "",
              plan: "free",
              settings: DEFAULT_SETTINGS,
              favoriteIds: [],
              favoriteTemplateIds: [],
              recentDocIds: [],
            });
            profile = await getUserProfile(firebaseUser.uid);
          }

          setUserProfile(profile);

          // Track user in analytics
          setAnalyticsUser(firebaseUser.uid, {
            plan: profile?.plan || "free",
          });
        } catch (err) {
          console.error("Erro ao carregar perfil:", err);
          setError("Falha ao carregar perfil do usuário.");
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        isAuthenticated: !!user,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  }
  return context;
}
