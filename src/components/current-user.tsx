"use client";

import * as React from "react";
import type { User } from "@/lib/types";

type CurrentUserContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const CurrentUserContext = React.createContext<CurrentUserContextValue | null>(
  null
);

const STORAGE_KEY = "expertum.currentUser";

export function CurrentUserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUserState] = React.useState<User | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUserState(JSON.parse(raw) as User);
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  const setUser = React.useCallback((next: User | null) => {
    setUserState(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage failures
    }
  }, []);

  const value = React.useMemo(
    () => ({ user, setUser }),
    [user, setUser]
  );

  // Avoid hydration mismatch: render nothing user-dependent until hydrated.
  if (!hydrated) {
    return (
      <CurrentUserContext.Provider value={{ user: null, setUser }}>
        {children}
      </CurrentUserContext.Provider>
    );
  }

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = React.useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }
  return ctx;
}
