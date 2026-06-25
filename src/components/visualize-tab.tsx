"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GraphView } from "@/components/graph-view";
import type { Discipline, DisciplineGraph, User } from "@/lib/types";
import { Check, ChevronDown, X } from "lucide-react";

export function VisualizeTab({ disciplines, users }: { disciplines: Discipline[]; users: User[] }) {
  const [userSearch, setUserSearch] = React.useState<string>("");
  const [focusedUserId, setFocusedUserId] = React.useState<string | null>(null);
  const [selectedDisciplineIds, setSelectedDisciplineIds] = React.useState<string[]>([]);
  const [disciplineDropdownOpen, setDisciplineDropdownOpen] = React.useState(false);
  const [graph, setGraph] = React.useState<DisciplineGraph | null>(null);
  const [loading, setLoading] = React.useState(false);
  const disciplineDropdownRef = React.useRef<HTMLDivElement>(null);

  // Filter users based on search input
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (disciplineDropdownRef.current && !disciplineDropdownRef.current.contains(e.target as Node)) {
        setDisciplineDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  // Fetch graph when discipline filter changes
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const url =
      selectedDisciplineIds.length > 0
        ? `/api/graph?disciplineIds=${encodeURIComponent(selectedDisciplineIds.join(","))}`
        : "/api/graph";

    fetch(url)
      .then((r) => r.json())
      .then((data: DisciplineGraph) => {
        if (!cancelled) setGraph(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDisciplineIds]);

  const toggleDiscipline = (id: string) => {
    setSelectedDisciplineIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const selectUser = (userId: string) => {
    setFocusedUserId(userId);
    setUserSearch("");
  };

  const disciplineLabel =
    selectedDisciplineIds.length === 0
      ? "All disciplines"
      : selectedDisciplineIds.length === 1
      ? disciplines.find((d) => d.id === selectedDisciplineIds[0])?.name ?? "1 selected"
      : `${selectedDisciplineIds.length} disciplines`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Knowledge graph</CardTitle>
        <CardDescription>
          Each arc points from a nominator to the person they consider better.
          Bigger, darker nodes are the emerging centers of expertise.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          {/* User search */}
          <div className="space-y-2 flex-1 relative">
            <Input
              placeholder="Find a person…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            {userSearch && filteredUsers.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-input bg-background rounded-md shadow-md overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={() => selectUser(u.id)}
                    >
                      {u.name}
                      {focusedUserId === u.id && <span className="ml-2 text-xs text-muted-foreground">(focused)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Discipline filter dropdown */}
          <div className="space-y-2 relative" ref={disciplineDropdownRef}>
            <button
              type="button"
              onClick={() => setDisciplineDropdownOpen((o) => !o)}
              className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background text-sm hover:bg-accent hover:text-accent-foreground min-w-[160px] justify-between"
            >
              <span>{disciplineLabel}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
            {disciplineDropdownOpen && (
              <div className="absolute top-full right-0 z-50 mt-1 border border-input bg-background rounded-md shadow-md overflow-hidden min-w-[180px]">
                <div className="max-h-64 overflow-y-auto">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                    onClick={() => setSelectedDisciplineIds([])}
                  >
                    <Check className={`h-4 w-4 ${selectedDisciplineIds.length === 0 ? "opacity-100" : "opacity-0"}`} />
                    All disciplines
                  </button>
                  <div className="border-t border-input" />
                  {disciplines.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                      onClick={() => toggleDiscipline(d.id)}
                    >
                      <Check className={`h-4 w-4 ${selectedDisciplineIds.includes(d.id) ? "opacity-100" : "opacity-0"}`} />
                      {d.name}
                    </button>
                  ))}
                </div>
                {selectedDisciplineIds.length > 0 && (
                  <>
                    <div className="border-t border-input" />
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 text-muted-foreground"
                      onClick={() => { setSelectedDisciplineIds([]); setDisciplineDropdownOpen(false); }}
                    >
                      <X className="h-4 w-4" />
                      Clear filter
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Clear user focus button */}
          {focusedUserId && (
            <button
              type="button"
              onClick={() => setFocusedUserId(null)}
              className="flex items-center gap-1.5 h-10 px-3 rounded-md border border-input bg-background text-sm hover:bg-accent hover:text-accent-foreground mb-0 self-end"
            >
              <X className="h-4 w-4" />
              Unfocus
            </button>
          )}
        </div>

        {loading && (
          <p className="text-sm text-muted-foreground">Loading graph…</p>
        )}

        {graph && <GraphView graph={graph} focusedNodeId={focusedUserId} />}
      </CardContent>
    </Card>
  );
}
