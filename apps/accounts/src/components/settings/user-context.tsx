"use client";

import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

interface UserContextValue {
  user: User;
  updateUser: (patch: Partial<User>) => void;
}

export const UserContext = createContext<UserContextValue | null>(null);

/** Returns the authenticated user and an updater from the nearest SettingsLayout. */
export function useSettingsUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useSettingsUser must be used within SettingsLayout");
  return ctx;
}
