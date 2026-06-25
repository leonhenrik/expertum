"use client";

import * as React from "react";
import { LogOut, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export function SignUp({ users }: { users: User[] }) {
  const { user, setUser } = useCurrentUser();
  const [mode, setMode] = React.useState<"existing" | "new">("new");
  const [newName, setNewName] = React.useState("");
  const [existingId, setExistingId] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const unregistered = users.filter((u) => !u.registered);

  if (user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Signed in</CardTitle>
          <CardDescription>
            You are participating as{" "}
            <span className="font-semibold text-foreground">{user.name}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setUser(null)}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Switch user
          </Button>
        </CardContent>
      </Card>
    );
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      if (mode === "new") {
        const res = await signUpNewUserAction(newName);
        if (res.ok) setUser(res.data);
        else setError(res.error);
      } else {
        if (!existingId) {
          setError("Select an existing user.");
          return;
        }
        const res = await signUpExistingUserAction(existingId);
        if (res.ok) setUser(res.data);
        else setError(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sign up</CardTitle>
        <CardDescription>
          Join as a new person, or claim an account that someone already
          nominated.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "new" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("new")}
          >
            New person
          </Button>
          <Button
            type="button"
            variant={mode === "existing" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("existing")}
            disabled={unregistered.length === 0}
          >
            Claim nominated account
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
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Choose an existing (nominated) person</Label>
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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSubmit} disabled={pending} className="gap-2">
          <UserPlus className="h-4 w-4" />
          {pending ? "Signing up..." : "Sign up"}
        </Button>
      </CardContent>
    </Card>
  );
}
