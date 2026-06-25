"use client";

import * as React from "react";
import { Award, Plus } from "lucide-react";

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
import { useCurrentUser } from "@/components/current-user";
import { addDisciplineAction, nominateAction } from "@/app/actions";
import type { Discipline, Nomination, User } from "@/lib/types";

export function NominateTab({
  users,
  disciplines,
  nominations,
}: {
  users: User[];
  disciplines: Discipline[];
  nominations: Nomination[];
}) {
  const { user } = useCurrentUser();
  const [disciplineId, setDisciplineId] = React.useState("");
  const [disciplineSearch, setDisciplineSearch] = React.useState("");
  const [disciplineOpen, setDisciplineOpen] = React.useState(false);
  const [nomineeId, setNomineeId] = React.useState("");
  const [nomineeSearch, setNomineeSearch] = React.useState("");
  const [nomineeOpen, setNomineeOpen] = React.useState(false);

  // When discipline changes, auto-fill existing nomination if any
  const existingNomination = React.useMemo(() =>
    user ? (nominations.find((n) => n.disciplineId === disciplineId && n.nominatorId === user.id) ?? null) : null,
    [nominations, disciplineId, user]
  );
  const isUpdate = !!existingNomination;

  // Auto-fill nominee field when discipline changes
  React.useEffect(() => {
    if (existingNomination) {
      const nominee = users.find((u) => u.id === existingNomination.nomineeId);
      if (nominee) {
        setNomineeId(nominee.id);
        setNomineeSearch(nominee.name);
        return;
      }
    }
    setNomineeId("");
    setNomineeSearch("");
  }, [existingNomination, users]);

  const [message, setMessage] = React.useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [pending, startTransition] = React.useTransition();

  const filteredDisciplines = disciplines.filter((d) =>
    d.name.toLowerCase().includes(disciplineSearch.toLowerCase())
  );
  const exactMatch = disciplines.some(
    (d) => d.name.toLowerCase() === disciplineSearch.toLowerCase()
  );

  const disciplineDropdownRef = React.useRef<HTMLDivElement>(null);
  const nomineeDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        disciplineDropdownRef.current &&
        !disciplineDropdownRef.current.contains(e.target as Node)
      ) {
        setDisciplineOpen(false);
      }
      if (
        nomineeDropdownRef.current &&
        !nomineeDropdownRef.current.contains(e.target as Node)
      ) {
        setNomineeOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Sign up first</CardTitle>
          <CardDescription>
            You need to sign up before you can nominate someone.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const otherUsers = users.filter((u) => u.id !== user.id);

  const filteredNominees = otherUsers.filter((u) =>
    u.name.toLowerCase().includes(nomineeSearch.toLowerCase())
  );
  const exactNomineeMatch = otherUsers.some(
    (u) => u.name.toLowerCase() === nomineeSearch.toLowerCase()
  );

  function handleAddDiscipline() {
    setMessage(null);
    startTransition(async () => {
      const res = await addDisciplineAction(disciplineSearch);
      if (res.ok) {
        setDisciplineId(res.data.id);
        setDisciplineSearch("");
        setDisciplineOpen(false);
        setMessage({ type: "ok", text: `Added "${res.data.name}".` });
      } else {
        setMessage({ type: "error", text: res.error });
      }
    });
  }

  function handleNominate() {
    setMessage(null);
    if (!disciplineId) {
      setMessage({ type: "error", text: "Choose a discipline." });
      return;
    }
    if (!nomineeId && !nomineeSearch.trim()) {
      setMessage({ type: "error", text: "Choose a nominee." });
      return;
    }
    startTransition(async () => {
      const res = await nominateAction({
        disciplineId,
        nominatorId: user!.id,
        nomineeId: nomineeId || undefined,
        nomineeName: nomineeId ? undefined : nomineeSearch,
      });
      if (res.ok) {
        setMessage({
          type: "ok",
          text: "Nomination recorded. Your votes now flow to them.",
        });
        setNomineeId("");
        setNomineeSearch("");
      } else {
        setMessage({ type: "error", text: res.error });
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Nominate your expert</CardTitle>
          <CardDescription>
            Pick a discipline and name the person you would approach for a question about it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="space-y-2 relative flex-1" ref={disciplineDropdownRef}>
              <div className="relative">
                <Input
                  placeholder="Search or add a discipline"
                  value={disciplineSearch}
                  onChange={(e) => {
                    setDisciplineSearch(e.target.value);
                    setDisciplineOpen(true);
                  }}
                  onFocus={() => setDisciplineOpen(true)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      disciplineSearch.trim() &&
                      !exactMatch
                    ) {
                      e.preventDefault();
                      handleAddDiscipline();
                    }
                  }}
                />
                {disciplineOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-input bg-background rounded-md shadow-md overflow-hidden">
                    {filteredDisciplines.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto">
                        {filteredDisciplines.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:bg-accent focus:text-accent-foreground"
                            onClick={() => {
                              setDisciplineId(d.id);
                              setDisciplineSearch(d.name);
                              setDisciplineOpen(false);
                            }}
                          >
                            {d.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {disciplineSearch.trim() && !exactMatch && (
                      <>
                        {filteredDisciplines.length > 0 && (
                          <div className="border-t border-input"></div>
                        )}
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:bg-accent focus:text-accent-foreground flex items-center gap-2"
                          onClick={() => handleAddDiscipline()}
                          disabled={pending}
                        >
                          <Plus className="h-4 w-4" />
                          <span>
                            {pending ? "Adding..." : `Add "${disciplineSearch}" as discipline`}
                          </span>
                        </button>
                      </>
                    )}
                    {filteredDisciplines.length === 0 &&
                      (!disciplineSearch.trim() ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Type to search or create
                        </div>
                      ) : null)}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 relative flex-1" ref={nomineeDropdownRef}>
              <div className="relative">
                <Input
                  placeholder="Search or add a person"
                  value={nomineeSearch}
                  onChange={(e) => {
                    setNomineeSearch(e.target.value);
                    setNomineeOpen(true);
                  }}
                  onFocus={() => setNomineeOpen(true)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      nomineeSearch.trim() &&
                      !exactNomineeMatch
                    ) {
                      e.preventDefault();
                      handleNominate();
                    }
                  }}
                />
                {nomineeOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-input bg-background rounded-md shadow-md overflow-hidden">
                    {filteredNominees.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto">
                        {filteredNominees.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:bg-accent focus:text-accent-foreground"
                            onClick={() => {
                              setNomineeId(u.id);
                              setNomineeSearch(u.name);
                              setNomineeOpen(false);
                            }}
                          >
                            {u.name}
                            {!u.registered ? " (nominated)" : ""}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {nomineeSearch.trim() && !exactNomineeMatch && (
                      <>
                        {filteredNominees.length > 0 && (
                          <div className="border-t border-input"></div>
                        )}
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:bg-accent focus:text-accent-foreground flex items-center gap-2"
                          onClick={() => {
                            setNomineeId("");
                          }}
                          disabled={pending}
                        >
                          <Plus className="h-4 w-4" />
                          <span>
                            {pending
                              ? "Adding..."
                              : `Add "${nomineeSearch}" as person`}
                          </span>
                        </button>
                      </>
                    )}
                    {filteredNominees.length === 0 &&
                      (!nomineeSearch.trim() ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Type to search or create
                        </div>
                      ) : null)}
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleNominate} disabled={pending} className="gap-2">
              <Award className="h-4 w-4" />
              {pending ? "Saving..." : isUpdate ? "Update" : "Submit"}
            </Button>
          </div>

          {message && (
            <p
              className={
                message.type === "ok"
                  ? "text-sm text-emerald-600"
                  : "text-sm text-destructive"
              }
            >
              {message.text}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
