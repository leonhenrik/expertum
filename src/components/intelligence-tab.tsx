"use client";

import * as React from "react";
import { AlertTriangle, Link2, TrendingDown, Users } from "lucide-react";
import { NetworkStats } from "@/components/network-stats";
import type { Discipline, DisciplineGraph, User } from "@/lib/types";

// ── Insight computation ──────────────────────────────────────────────────────

function computeInsights(graph: DisciplineGraph) {
  const n = graph.nodes.length;
  if (n < 2) return null;

  const sorted = [...graph.nodes].sort((a, b) => b.score - a.score);

  // Build adjacency maps (source/target are strings from API)
  const outgoing = new Map<string, string>();
  const incomingCount = new Map<string, number>();
  for (const e of graph.edges) {
    const src = e.source as string;
    const tgt = e.target as string;
    outgoing.set(src, tgt);
    incomingCount.set(tgt, (incomingCount.get(tgt) ?? 0) + 1);
  }

  // ── Key-person risk ──────────────────────────────────────────────────────
  // A node is fragile if it absorbs votes from others AND has outgoing edges
  // (i.e. it's a relay). If it leaves, those absorbed votes are stranded.
  const spofs = sorted
    .filter((node) => {
      const absorbed = node.score - 1;
      const isRelay = outgoing.has(node.id);
      return absorbed > 0 && isRelay;
    })
    .map((node) => ({
      node,
      absorbed: node.score - 1,
      riskPct: Math.round(((node.score - 1) / n) * 100),
    }))
    .filter((s) => s.absorbed > 0)
    .slice(0, 6);

  // ── Longest chains ───────────────────────────────────────────────────────
  const chainLength = (startId: string): { length: number; chain: string[] } => {
    const chain: string[] = [];
    const visited = new Set<string>();
    let cur = startId;
    while (cur && !visited.has(cur)) {
      visited.add(cur);
      chain.push(cur);
      cur = outgoing.get(cur) ?? "";
    }
    return { length: chain.length, chain };
  };

  const hasIncoming = new Set(graph.edges.map((e) => e.target as string));
  const roots = graph.nodes.filter((node) => !hasIncoming.has(node.id));
  const chains = roots
    .map((root) => chainLength(root.id))
    .filter((c) => c.length > 1)
    .sort((a, b) => b.length - a.length)
    .slice(0, 4);

  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));

  // ── Concentration ────────────────────────────────────────────────────────
  const top20n = Math.max(1, Math.ceil(n * 0.2));
  const totalWeight = sorted.reduce((s, node) => s + node.score, 0);
  const top20weight = sorted.slice(0, top20n).reduce((s, node) => s + node.score, 0);
  const concentration = Math.round((top20weight / totalWeight) * 100);

  // ── Isolated nodes (no nominations in/out) ───────────────────────────────
  const connected = new Set([
    ...graph.edges.map((e) => e.source as string),
    ...graph.edges.map((e) => e.target as string),
  ]);
  const isolated = graph.nodes.filter((node) => !connected.has(node.id));

  return { spofs, chains, nodeById, concentration, top20n, isolated };
}

// ── Component ────────────────────────────────────────────────────────────────

const MAX_DEPTH_LIMIT = 8;

export function IntelligenceTab({
  disciplines,
  users,
}: {
  disciplines: Discipline[];
  users: User[];
}) {
  const [graph, setGraph] = React.useState<DisciplineGraph | null>(null);
  const [loading, setLoading] = React.useState(false);
  // 0 = unlimited
  const [maxDepth, setMaxDepth] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = maxDepth > 0 ? `/api/graph?maxDepth=${maxDepth}` : "/api/graph";
    fetch(url)
      .then((r) => r.json())
      .then((data: DisciplineGraph) => { if (!cancelled) setGraph(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [maxDepth]);

  const insights = graph ? computeInsights(graph) : null;

  return (
    <div className="space-y-6">
      {/* ── Transitivity slider ──────────────────────────────────────── */}
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-semibold">Vote transitivity depth</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              How many hops a vote can travel before it stops propagating.
            </p>
          </div>
          <span className="text-lg font-bold w-20 text-right">
            {maxDepth === 0 ? "Unlimited" : `${maxDepth} step${maxDepth !== 1 ? "s" : ""}`}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={MAX_DEPTH_LIMIT}
          value={maxDepth}
          onChange={(e) => setMaxDepth(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Unlimited</span>
          {Array.from({ length: MAX_DEPTH_LIMIT }, (_, i) => i + 1).map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {insights && (
        <>
          {/* ── Key-person risk ────────────────────────────────────────── */}
          <section className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <h2 className="font-semibold text-sm">Key-person risk</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              These people act as relays — votes flow <em>through</em> them. If they leave
              the network, everyone who nominated them (directly or transitively) loses their
              voice.
            </p>
            {insights.spofs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No relay nodes detected.</p>
            ) : (
              <div className="space-y-2.5">
                {insights.spofs.map(({ node, absorbed, riskPct }) => (
                  <div key={node.id} className="flex items-center gap-3 text-sm">
                    <div className="w-36 truncate font-medium">{node.name}</div>
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange-400"
                        style={{ width: `${riskPct}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground w-28 text-right">
                      {absorbed} vote{absorbed !== 1 ? "s" : ""} at risk ({riskPct}%)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Longest chains ─────────────────────────────────────────── */}
          <section className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="h-4 w-4 text-blue-500" />
              <h2 className="font-semibold text-sm">Longest trust chains</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Each chain shows a sequence of nominations — A defers to B, B defers to C, etc.
              Long chains indicate highly transitive trust but also deep dependency.
            </p>
            {insights.chains.length === 0 ? (
              <p className="text-sm text-muted-foreground">No chains detected.</p>
            ) : (
              <div className="space-y-3">
                {insights.chains.map((c, i) => (
                  <div key={i} className="space-y-1">
                    <div className="text-xs text-muted-foreground">Chain {i + 1} · {c.length} steps</div>
                    <div className="flex flex-wrap items-center gap-1">
                      {c.chain.map((id, j) => {
                        const node = insights.nodeById.get(id);
                        return (
                          <React.Fragment key={id}>
                            <span className="px-2 py-0.5 rounded bg-secondary text-xs font-medium">
                              {node?.name ?? id}
                            </span>
                            {j < c.chain.length - 1 && (
                              <span className="text-muted-foreground text-xs">→</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Concentration & isolated ───────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <section className="rounded-lg border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-purple-500" />
                <h2 className="font-semibold text-sm">Vote concentration</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                The top {insights.top20n} node{insights.top20n !== 1 ? "s" : ""} (top 20%) hold{" "}
                <span className="font-semibold text-foreground">{insights.concentration}%</span> of
                all vote weight. High concentration means expertise is recognised in few people.
              </p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{ width: `${insights.concentration}%` }}
                />
              </div>
            </section>

            <section className="rounded-lg border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-slate-500" />
                <h2 className="font-semibold text-sm">Isolated participants</h2>
              </div>
              {insights.isolated.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Everyone is connected — no isolated participants.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-3">
                    These users exist in the system but have no nominations in or out.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {insights.isolated.map((node) => (
                      <span
                        key={node.id}
                        className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground"
                      >
                        {node.name}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>

          {/* ── Moved charts ───────────────────────────────────────────── */}
          <NetworkStats graph={graph!} />
        </>
      )}
    </div>
  );
}
