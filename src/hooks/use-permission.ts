"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { subscribeToMemberRole, hasPermission } from "@/lib/firebase/permissions";
import type { WorkspaceRole, ResourceType, PermissionAction } from "@/types/permission";

export function usePermission(workspaceId: string | null | undefined) {
  const { user } = useAuth();
  const [role, setRole] = useState<WorkspaceRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !workspaceId) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToMemberRole(workspaceId, user.uid, (memberRole) => {
      setRole(memberRole);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, workspaceId]);

  const can = (resource: ResourceType, action: PermissionAction) => {
    return hasPermission(role, resource, action);
  };

  return {
    role,
    isLoading,
    can,
    // Helpers for common checks
    isAdmin: role?.id === "admin",
    isEditor: role?.id === "editor" || role?.id === "admin",
  };
}
