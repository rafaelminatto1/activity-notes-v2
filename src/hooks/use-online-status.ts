"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { onSnapshotsInSync } from "firebase/firestore";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for Firestore sync events
    let unsubSync: (() => void) | undefined;
    if (db) {
      unsubSync = onSnapshotsInSync(db, () => {
        // This fires when all snapshots are in sync with the backend
        setIsSyncing(false);
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (unsubSync) unsubSync();
    };
  }, []);

  return { isOnline, isSyncing, setIsSyncing };
}
