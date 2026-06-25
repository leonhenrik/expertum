"use client";

import * as React from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

import type { DisciplineGraph } from "@/lib/types";

type SimNode = SimulationNodeDatum & {
  id: string;
  name: string;
  registered: boolean;
  score: number;
};

type SimLink = SimulationLinkDatum<SimNode> & {
  weight: number;
};

const WIDTH = 760;
const HEIGHT = 520;

export function GraphView({ graph, focusedNodeId }: { graph: DisciplineGraph; focusedNodeId?: string | null }) {
  const [nodes, setNodes] = React.useState<SimNode[]>([]);
  const [links, setLinks] = React.useState<SimLink[]>([]);
  const [transform, setTransform] = React.useState<{ x: number; y: number; scale: number }>({ x: 0, y: 0, scale: 1 });
  const svgRef = React.useRef<SVGSVGElement>(null);
  const simRef = React.useRef<Simulation<SimNode, SimLink> | null>(null);

  React.useEffect(() => {
    const simNodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
    const simLinks: SimLink[] = graph.edges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    }));

    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(140)
          .strength(0.4)
      )
      .force("charge", forceManyBody().strength(-420))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        "collide",
        forceCollide<SimNode>().radius((d) => radiusFor(d.score) + 10)
      );

    simulation.on("tick", () => {
      setNodes([...simNodes]);
      setLinks([...simLinks]);
    });

    simRef.current = simulation;
    return () => {
      simulation.stop();
    };
  }, [graph]);

  // Handle smooth centering on focused node
  React.useEffect(() => {
    if (!focusedNodeId || nodes.length === 0) {
      // Reset to full view
      setTransform({ x: 0, y: 0, scale: 1 });
      return;
    }

    const focusedNode = nodes.find((n) => n.id === focusedNodeId);
    if (!focusedNode || focusedNode.x == null || focusedNode.y == null) {
      return;
    }

    // Calculate zoom to focus on node (2.5x zoom centered on node)
    const scale = 2.5;
    const x = focusedNode.x;
    const y = focusedNode.y;
    
    // Calculate pan to center the node in the viewport
    const panX = WIDTH / 2 - x * scale;
    const panY = HEIGHT / 2 - y * scale;

    setTransform({ x: panX, y: panY, scale });
  }, [focusedNodeId, nodes]);

  if (graph.nodes.length === 0) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
        No nominations in this discipline yet.
      </div>
    );
  }

  const maxScore = Math.max(...graph.nodes.map((n) => n.score), 1);

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Knowledge graph"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(215 16% 47%)" />
          </marker>
        </defs>

        {links.map((link, i) => {
          const s = link.source as SimNode;
          const t = link.target as SimNode;
          if (
            s.x == null ||
            s.y == null ||
            t.x == null ||
            t.y == null
          ) {
            return null;
          }
          // Stop the line at the edge of the target circle so the arrow shows.
          const tr = radiusFor(t.score);
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const len = Math.hypot(dx, dy) || 1;
          const ex = t.x - (dx / len) * (tr + 8);
          const ey = t.y - (dy / len) * (tr + 8);
          const midX = (s.x + ex) / 2;
          const midY = (s.y + ey) / 2;
          return (
            <g key={i}>
              <line
                x1={s.x}
                y1={s.y}
                x2={ex}
                y2={ey}
                stroke="hsl(215 16% 47%)"
                strokeOpacity={0.55}
                strokeWidth={1 + Math.log2(link.weight + 1) * 2}
                markerEnd="url(#arrow)"
              />
              <text
                x={midX}
                y={midY - 4}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={10}
              >
                {link.weight}
              </text>
            </g>
          );
        })}

        {nodes.map((node) => {
          if (node.x == null || node.y == null) return null;
          const r = radiusFor(node.score);
          const intensity = 0.25 + 0.6 * (node.score / maxScore);
          return (
            <g key={node.id} transform={`translate(${node.x},${node.y})`}>
              <circle
                r={r}
                fill={`hsl(222 47% 30% / ${intensity})`}
                stroke={
                  node.registered ? "hsl(222 47% 20%)" : "hsl(215 16% 55%)"
                }
                strokeWidth={node.registered ? 2.5 : 1.5}
                strokeDasharray={node.registered ? undefined : "4 3"}
              />
              <text
                textAnchor="middle"
                dy="0.35em"
                fill="white"
                fontSize={12}
                fontWeight={600}
              >
                {node.score}
              </text>
              <text
                textAnchor="middle"
                y={r + 14}
                className="fill-foreground"
                fontSize={12}
                fontWeight={500}
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-4 border-t px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-[hsl(222_47%_20%)] bg-[hsl(222_47%_30%)]" />
          Signed-up user
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-dashed border-[hsl(215_16%_55%)] bg-[hsl(222_47%_30%/0.4)]" />
          Nominated, not signed up
        </span>
        <span>Number in node = total votes · number on arc = votes forwarded</span>
      </div>
    </div>
  );
}

function radiusFor(score: number): number {
  return 14 + Math.sqrt(score) * 7;
}
