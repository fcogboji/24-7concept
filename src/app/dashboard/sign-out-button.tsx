"use client";

import { useClerk } from "@clerk/nextjs";

export function SignOutButton() {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/" })}
      className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 touch-manipulation hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200"
    >
      Log out
    </button>
  );
}
