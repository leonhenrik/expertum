"use client";

import type { DisciplineGraph } from "@/lib/types";

export function NetworkStats({ graph }: { graph: DisciplineGraph }) {
  if (graph.nodes.length < 2) return null;

  const sorted = [...graph.nodes].sort((a, b) => b.score - a.score);
  const n = sorted.length;
  const maxScore = sorted[0].score;

  // Freeman in-degree centralization: Σ(max - score_i) / (n-1)²
  // 0 = perfectly equal, 1 = all votes funnelled to one node
  const freemaC = sorted.reduce((s, node) => s + (maxScore - node.score), 0) / ((n - 1) ** 2);
  const centralizationPct = Math.min(100, Math.round(freemaC * 100));

  // Label thresholds
  const centralizationLabel =
    centralizationPct < 20 ? "Distributed" :
    centralizationPct < 45 ? "Moderately centralised" :
    centralizationPct < 70 ? "Centralised" :
    "Highly centralised";

  const gaugeColor =
    centralizationPct < 20 ? "bg-emerald-500" :
    centralizationPct < 45 ? "bg-yellow-400" :
    centralizationPct < 70 ? "bg-orange-500" :
    "bg-red-500";

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Chart 1: Expert leaderboard */}
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-semibold mb-3">Expert ranking</p>
        <div className="space-y-2">
          {sorted.slice(0, 12).map((node, i) => (
            <div key={node.id} className="flex items-center gap-2 text-xs">
              <span className="w-4 text-right text-muted-foreground shrink-0">{i + 1}</span>
              <span className="w-28 truncate shrink-0">{node.name}</span>
              <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                <div
                  className="h-full rounded transition-all"
                  style={{
                    width: `${(node.score / maxScore) * 100}%`,
                    background: node.registered
                      ? `hsl(222 47% ${55 - (node.score / maxScore) * 30}%)`
                      : `hsl(215 16% 65%)`,
                  }}
                />
              </div>
              <span className="w-5 text-right text-muted-foreground shrink-0">{node.score}</span>
            </div>
          ))}
        </div>
        {sorted.length > 12 && (
          <p className="text-xs text-muted-foreground mt-2">+{sorted.length - 12} more</p>
        )}
      </div>

      {/* Chart 2: Centralization */}
      <div className="rounded-lg border bg-card p-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold mb-1">Network centralization</p>
          <p className="text-xs text-muted-foreground">
            How concentrated expertise is — 0% means everyone is equally trusted, 100% means all votes flow to one person.
          </p>
        </div>

        {/* Gauge */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Distributed</span>
            <span>Centralised</span>
          </div>
          <div className="relative h-4 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${gaugeColor}`}
              style={{ width: `${centralizationPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{centralizationLabel}</span>
            <span className="text-sm font-bold">{centralizationPct}%</span>
          </div>
        </div>

        {/* Score distribution histogram */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Score distribution</p>
          <div className="flex items-end gap-0.5 h-16">
            {sorted.map((node) => (
              <div
                key={node.id}
                title={`${node.name}: ${node.score}`}
                className="flex-1 rounded-t transition-all"
                style={{
                  height: `${(node.score / maxScore) * 100}%`,
                  background: node.registered ? "hsl(222 47% 35%)" : "hsl(215 16% 60%)",
                  minWidth: 2,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Top expert</span>
            <span>All participants →</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3 space-y-0.5">
          <div className="flex justify-between">
            <span>Participants</span>
            <span className="font-medium text-foreground">{n}</span>
          </div>
          <div className="flex justify-between">
            <span>Top score</span>
            <span className="font-medium text-foreground">{maxScore}</span>
          </div>
          <div className="flex justify-between">
            <span>Top expert</span>
            <span className="font-medium text-foreground">{sorted[0].name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
