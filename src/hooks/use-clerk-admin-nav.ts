"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useMemo } from "react";

function metadataGrantsAdmin(meta: unknown): boolean {
  if (!meta || typeof meta !== "object") return false;
  const m = meta as Record<string, unknown>;
  const role = m.role;
  if (typeof role === "string" && role.trim().toLowerCase() === "admin") return true;
  if (Array.isArray(m.roles)) {
    return m.roles.some((x) => typeof x === "string" && x.trim().toLowerCase() === "admin");
  }
  return false;
}

export function useClerkAdminNav(): boolean {
  const { user, isLoaded: userLoaded } = useUser();
  const { sessionClaims, isLoaded: authLoaded } = useAuth();

  return useMemo(() => {
    if (!userLoaded || !authLoaded) return false;
    if (user && metadataGrantsAdmin(user.publicMetadata)) return true;
    const claims = sessionClaims as Record<string, unknown> | undefined;
    if (claims) {
      if (metadataGrantsAdmin(claims.public_metadata)) return true;
      if (metadataGrantsAdmin(claims.metadata)) return true;
    }
    return false;
  }, [user, userLoaded, authLoaded, sessionClaims]);
}
