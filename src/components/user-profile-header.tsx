"use client";

import * as React from "react";
import { LogOut, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/components/current-user";
import { signUpExistingUserAction, signUpNewUserAction } from "@/app/actions";
import type { User } from "@/lib/types";

export function UserProfileHeader({ users }: { users: User[] }) {
  const { user, setUser } = useCurrentUser();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );
  const exactMatch = users.find(
    (u) => u.name.toLowerCase() === search.trim().toLowerCase()
  );
  const selected = users.find((u) => u.id === selectedId);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSignIn() {
    setError(null);
    startTransition(async () => {
      if (selectedId) {
        const res = await signUpExistingUserAction(selectedId);
        if (res.ok) { setUser(res.data); reset(); }
        else setError(res.error);
      } else if (search.trim()) {
        const res = await signUpNewUserAction(search.trim());
        if (res.ok) { setUser(res.data); reset(); }
        else setError(res.error);
      } else {
        setError("Type your name or select an existing person.");
      }
    });
  }

  function reset() {
    setOpen(false);
    setDropdownOpen(false);
    setSearch("");
    setSelectedId(null);
    setError(null);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => { setOpen((o) => !o); setDropdownOpen(false); }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
        title={user ? `Signed in as ${user.name}` : "Sign in"}
      >
        {user ? (
          <span className="text-sm font-semibold">{user.name.charAt(0)}</span>
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-64 border border-input bg-background rounded-md shadow-lg p-4 space-y-3">
          {user ? (
            <>
              <div className="border-b pb-3">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="font-semibold">{user.name}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => { setUser(null); setOpen(false); }}>
                <LogOut className="h-4 w-4" />
                Switch user
              </Button>
            </>
          ) : (
            <>
              <div className="relative">
                <Input
                  ref={inputRef}
                  placeholder="Your name…"
                  value={selected ? selected.name : search}
                  autoFocus
                  onChange={(e) => {
                    setSelectedId(null);
                    setSearch(e.target.value);
                    setDropdownOpen(true);
                    setError(null);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleSignIn(); }
                    if (e.key === "Escape") setDropdownOpen(false);
                  }}
                />
                {dropdownOpen && (filtered.length > 0 || (search.trim() && !exactMatch)) && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-input bg-background rounded-md shadow-md overflow-hidden">
                    {filtered.length > 0 && (
                      <div className="max-h-40 overflow-y-auto">
                        {filtered.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setSelectedId(u.id);
                              setSearch("");
                              setDropdownOpen(false);
                              setError(null);
                            }}
                          >
                            {u.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {search.trim() && !exactMatch && (
                      <>
                        {filtered.length > 0 && <div className="border-t border-input" />}
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-muted-foreground"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setSelectedId(null); setDropdownOpen(false); }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add "{search.trim()}" as new user
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <Button onClick={handleSignIn} disabled={pending} size="sm" className="w-full">
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
