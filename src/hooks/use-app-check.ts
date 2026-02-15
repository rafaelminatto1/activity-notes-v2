/**
 * Firebase App Check Hook
 * Hook React para usar Firebase App Check
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { initializeAppCheck, getAppCheckToken } from "@/lib/firebase/app-check";
import { toast } from "sonner";

export function useAppCheck() {
  const [initialized, setInitialized] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const setupAppCheck = async () => {
      try {
        await initializeAppCheck();
        setInitialized(true);
        console.log("[AppCheck] Initialized successfully");
      } catch (error) {
        console.error("[AppCheck] Initialization failed:", error);
        toast.error("Erro ao inicializar App Check");
      }
    };

    setupAppCheck();
  }, []);

  const refresh = useCallback(async (force = false): Promise<string | null> => {
    try {
      const newToken = await getAppCheckToken(force);
      setToken(newToken);
      return newToken;
    } catch (error) {
      console.error("[AppCheck] Failed to get token:", error);
      toast.error("Erro ao obter token do App Check");
      return null;
    }
  }, []);

  return {
    initialized,
    token,
    refresh,
  };
}

export default useAppCheck;
