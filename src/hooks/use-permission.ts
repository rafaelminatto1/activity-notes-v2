"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { subscribeToMemberRole, hasPermission } from "@/lib/firebase/permissions";
import type { WorkspaceRole, ResourceType, PermissionAction } from "@/types/permission";

export function usePermission(workspaceId: string | null | undefined) {
  const { user } = useAuth();
  const [role, setRole] = useState<WorkspaceRole | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const currentKey = user && workspaceId ? `${workspaceId}:${user.uid}` : null;

  useEffect(() => {
    if (!currentKey || !workspaceId || !user) return;

    const unsubscribe = subscribeToMemberRole(workspaceId, user.uid, (memberRole) => {
      setRole(memberRole);
      setLoadedKey(currentKey);
    });

    return () => unsubscribe();
  }, [currentKey, workspaceId, user]);

  const roleForContext = loadedKey === currentKey ? role : null;
  const isLoading = Boolean(currentKey && loadedKey !== currentKey);

  const can = (resource: ResourceType, action: PermissionAction) => {
    return hasPermission(roleForContext, resource, action);
  };

  return {
    role: roleForContext,
    isLoading,
    can,
    // Helpers for common checks
    isAdmin: roleForContext?.id === "admin",
    isEditor: roleForContext?.id === "editor" || roleForContext?.id === "admin",
  };
}
