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

import type { Discipline, DisciplineGraph } from "@/lib/types";

// Distinct hues for up to ~12 disciplines; cycles after that
const PALETTE = [
  "hsl(215 70% 50%)",
  "hsl(340 70% 52%)",
  "hsl(140 55% 40%)",
  "hsl(30 80% 52%)",
  "hsl(270 60% 55%)",
  "hsl(185 65% 40%)",
  "hsl(0 70% 52%)",
  "hsl(55 75% 42%)",
  "hsl(310 55% 50%)",
  "hsl(165 60% 38%)",
  "hsl(20 75% 48%)",
  "hsl(240 55% 55%)",
];

type SimNode = SimulationNodeDatum & {
  id: string;
  name: string;
  score: number;
};

type SimLink = SimulationLinkDatum<SimNode> & {
  weight: number;
  disciplineId: string;
};

const WIDTH = 760;
const HEIGHT = 520;

type Transform = { x: number; y: number; scale: number };

export function GraphView({ graph, focusedNodeId, disciplines = [] }: { graph: DisciplineGraph; focusedNodeId?: string | null; disciplines?: Discipline[] }) {
  // Stable color per discipline id
  const disciplineColor = React.useMemo(() => {
    const map = new Map<string, string>();
    disciplines.forEach((d, i) => map.set(d.id, PALETTE[i % PALETTE.length]));
    return map;
  }, [disciplines]);

  const edgeColor = (disciplineId: string) =>
    disciplineColor.get(disciplineId) ?? "hsl(215 16% 47%)";
  const [nodes, setNodes] = React.useState<SimNode[]>([]);
  const [links, setLinks] = React.useState<SimLink[]>([]);
  const [transform, setTransform] = React.useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [animating, setAnimating] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const simRef = React.useRef<Simulation<SimNode, SimLink> | null>(null);
  const dragRef = React.useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  const transformRef = React.useRef<Transform>({ x: 0, y: 0, scale: 1 });

  // Keep ref in sync for use inside event handlers
  React.useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  React.useEffect(() => {
    const simNodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
    const simLinks: SimLink[] = graph.edges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
      disciplineId: e.disciplineId,
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

  // Pan and zoom event handlers
  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const getSVGPoint = (clientX: number, clientY: number) => {
      const rect = svg.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        tx: transformRef.current.x,
        ty: transformRef.current.y,
      };
      svg.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;
      const dx = (e.clientX - drag.startX) * scaleX;
      const dy = (e.clientY - drag.startY) * scaleY;
      setTransform((prev) => ({ ...prev, x: drag.tx + dx, y: drag.ty + dy }));
    };

    const onMouseUp = () => {
      dragRef.current = null;
      svg.style.cursor = "grab";
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { x: cx, y: cy } = getSVGPoint(e.clientX, e.clientY);
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      setAnimating(false);
      setTransform((prev) => {
        const newScale = Math.max(0.2, Math.min(8, prev.scale * factor));
        const ratio = newScale / prev.scale;
        return {
          x: cx - (cx - prev.x) * ratio,
          y: cy - (cy - prev.y) * ratio,
          scale: newScale,
        };
      });
    };

    svg.style.cursor = "grab";
    svg.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    svg.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      svg.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      svg.removeEventListener("wheel", onWheel);
    };
  }, []);

  // Smooth centering on focused node
  React.useEffect(() => {
    if (!focusedNodeId || nodes.length === 0) {
      setAnimating(true);
      setTransform({ x: 0, y: 0, scale: 1 });
      return;
    }
    const focusedNode = nodes.find((n) => n.id === focusedNodeId);
    if (!focusedNode || focusedNode.x == null || focusedNode.y == null) return;
    const scale = 2.5;
    setAnimating(true);
    setTransform({
      x: WIDTH / 2 - focusedNode.x * scale,
      y: HEIGHT / 2 - focusedNode.y * scale,
      scale,
    });
  }, [focusedNodeId, nodes]);

  if (graph.nodes.length === 0) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
        No nominations in this discipline yet.
      </div>
    );
  }

  const maxScore = Math.max(...graph.nodes.map((n) => n.score), 1);

  const groupTransform = `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`;

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full select-none"
        role="img"
        aria-label="Knowledge graph"
      >
        <defs>
          {/* One arrow marker per discipline, colored to match */}
          {disciplines.map((d, i) => (
            <marker
              key={d.id}
              id={`arrow-${d.id}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="2.5"
              markerHeight="2.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={PALETTE[i % PALETTE.length]} />
            </marker>
          ))}
          {/* Fallback marker when no disciplines passed */}
          <marker
            id="arrow-"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="2.5"
            markerHeight="2.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(215 16% 47%)" />
          </marker>
        </defs>

        <g
          transform={groupTransform}
          style={animating ? { transition: "transform 500ms cubic-bezier(0.4, 0, 0.2, 1)" } : undefined}
          onTransitionEnd={() => setAnimating(false)}
        >

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
                stroke={edgeColor(link.disciplineId)}
                strokeOpacity={0.6}
                strokeWidth={1 + Math.log2(link.weight + 1) * 2}
                markerEnd={`url(#arrow-${link.disciplineId})`}
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
                stroke="hsl(222 47% 20%)"
                strokeWidth={2}
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
        </g>
      </svg>

      <div className="flex flex-wrap items-center gap-4 border-t px-4 py-3 text-xs text-muted-foreground">
        {disciplines.length > 1 && disciplines.map((d, i) => (
          <span key={d.id} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-5 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
            {d.name}
          </span>
        ))}
        <span>Number in node = total votes · number on arc = votes forwarded</span>
      </div>
    </div>
  );
}

function radiusFor(score: number): number {
  return 14 + Math.sqrt(score) * 7;
}
