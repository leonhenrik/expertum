"use client";

import * as React from "react";
import { LogOut, Plus, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/components/current-user";
import {
  signUpExistingUserAction,
  signUpNewUserAction,
} from "@/app/actions";
import type { User } from "@/lib/types";

export function UserProfileHeader({ users }: { users: User[] }) {
  const { user, setUser } = useCurrentUser();
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"existing" | "new">("new");
  const [newName, setNewName] = React.useState("");
  const [existingId, setExistingId] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const unregistered = users.filter((u) => !u.registered);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      if (mode === "new") {
        const res = await signUpNewUserAction(newName);
        if (res.ok) {
          setUser(res.data);
          setNewName("");
          setOpen(false);
        } else setError(res.error);
      } else {
        if (!existingId) {
          setError("Select an existing user.");
          return;
        }
        const res = await signUpExistingUserAction(existingId);
        if (res.ok) {
          setUser(res.data);
          setExistingId("");
          setOpen(false);
        } else setError(res.error);
      }
    });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
        title={user ? `Signed in as ${user.name}` : "Click to sign in"}
      >
        {user ? (
          <span className="text-sm font-semibold">{user.name.charAt(0)}</span>
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 border border-input bg-background rounded-md shadow-lg p-4 space-y-4">
          {user ? (
            <>
              <div className="border-b pb-3">
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="font-semibold">{user.name}</p>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  setUser(null);
                  setOpen(false);
                }}
              >
                <LogOut className="h-4 w-4" />
                Switch user
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={mode === "new" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setMode("new");
                      setError(null);
                    }}
                  >
                    New person
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "existing" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setMode("existing");
                      setError(null);
                    }}
                    disabled={unregistered.length === 0}
                  >
                    Claim account
                  </Button>
                </div>

                {mode === "new" ? (
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Your name</Label>
                    <Input
                      id="signup-name"
                      placeholder="e.g. Ada Lovelace"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Choose existing person</Label>
                    <Select value={existingId} onValueChange={setExistingId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a person" />
                      </SelectTrigger>
                      <SelectContent>
                        {unregistered.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={pending}
                  className="w-full gap-2"
                  size="sm"
                >
                  <UserPlus className="h-4 w-4" />
                  {pending ? "Signing up..." : "Sign up"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
