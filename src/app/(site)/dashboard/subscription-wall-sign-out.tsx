"use client";

import { useClerk } from "@clerk/nextjs";

export function SubscriptionWallSignOut() {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      onClick={() => void signOut({ redirectUrl: "/" })}
      className="text-sm font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline"
    >
      Sign out
    </button>
  );
}
