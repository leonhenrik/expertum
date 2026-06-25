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
import { Button } from "@/components/ui/button";
import { GraphView } from "@/components/graph-view";
import type { Discipline, DisciplineGraph, User } from "@/lib/types";
import { X } from "lucide-react";

export function VisualizeTab({ disciplines, users }: { disciplines: Discipline[]; users: User[] }) {
  const [userSearch, setUserSearch] = React.useState<string>("");
  const [focusedUserId, setFocusedUserId] = React.useState<string | null>(null);
  const [graph, setGraph] = React.useState<DisciplineGraph | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Filter users based on search input
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Fetch graph data (always all disciplines)
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch("/api/graph")
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
  }, []);

  const selectUser = (userId: string) => {
    setFocusedUserId(userId);
    setUserSearch("");
  };

  const clearFocus = () => {
    setFocusedUserId(null);
    setUserSearch("");
  };

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
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Search users</Label>
            <Input
              placeholder="Find a person…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Display filtered users */}
          {userSearch && filteredUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => selectUser(u.id)}
                  className="px-3 py-1 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  {u.name}
                </button>
              ))}
            </div>
          )}

          {focusedUserId && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFocus}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear focus
            </Button>
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
