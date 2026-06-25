import type {
  DisciplineGraph,
  GraphEdge,
  GraphNode,
  Nomination,
  User,
} from "./types";

/**
 * Build the transitive vote graph for a single discipline.
 *
 * Model:
 * - Every user holds one base vote.
 * - Nominating someone turns you into a forwarding node: every vote reaching
 *   you (including your own) flows on to your nominee.
 *
 * Therefore the score of a node X equals the number of distinct users who can
 * reach X by following nomination edges, plus X itself:
 *
 *     score(X) = 1 + |{ users who transitively nominate toward X }|
 *
 * The weight of an edge A -> B is the number of votes A forwards to B, which is
 * exactly score(A).
 *
 * Using set-based reachability keeps the computation finite and correct even if
 * users form a nomination cycle.
 */
export function buildDisciplineGraph(
  disciplineId: string,
  users: User[],
  nominations: Nomination[]
): DisciplineGraph {
  const relevant = nominations.filter((n) => n.disciplineId === disciplineId);

  // Collect the set of users that participate in this discipline (either as a
  // nominator or as a nominee).
  const participantIds = new Set<string>();
  for (const n of relevant) {
    participantIds.add(n.nominatorId);
    participantIds.add(n.nomineeId);
  }

  // Reverse adjacency: for a node, who directly nominates toward it.
  const incoming = new Map<string, string[]>();
  for (const n of relevant) {
    if (!incoming.has(n.nomineeId)) incoming.set(n.nomineeId, []);
    incoming.get(n.nomineeId)!.push(n.nominatorId);
  }

  // score(X) = number of distinct users that can reach X via nomination edges,
  // counting X itself. Computed by reverse traversal with a visited set so that
  // cycles are counted at most once.
  const score = (target: string): number => {
    const seen = new Set<string>([target]);
    const stack = [target];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const nominator of incoming.get(current) ?? []) {
        if (!seen.has(nominator)) {
          seen.add(nominator);
          stack.push(nominator);
        }
      }
    }
    return seen.size;
  };

  const userById = new Map(users.map((u) => [u.id, u]));

  const nodes: GraphNode[] = Array.from(participantIds).map((id) => {
    const user = userById.get(id);
    return {
      id,
      name: user?.name ?? "Unknown",
      registered: user?.registered ?? false,
      score: score(id),
    };
  });

  const edges: GraphEdge[] = relevant.map((n) => ({
    source: n.nominatorId,
    target: n.nomineeId,
    weight: score(n.nominatorId),
  }));

  return { disciplineId, nodes, edges };
}

/**
 * Build a combined graph across all disciplines or a filtered set of disciplines.
 * If disciplineIds is empty, includes all disciplines.
 */
export function buildMultiDisciplineGraph(
  disciplineIds: string[],
  users: User[],
  nominations: Nomination[]
): DisciplineGraph {
  // If no specific disciplines requested, include all
  const relevant =
    disciplineIds.length === 0
      ? nominations
      : nominations.filter((n) => disciplineIds.includes(n.disciplineId));

  // Collect all participants across selected disciplines
  const participantIds = new Set<string>();
  for (const n of relevant) {
    participantIds.add(n.nominatorId);
    participantIds.add(n.nomineeId);
  }

  // Reverse adjacency: for a node, who directly nominates toward it (across all disciplines)
  const incoming = new Map<string, string[]>();
  for (const n of relevant) {
    if (!incoming.has(n.nomineeId)) incoming.set(n.nomineeId, []);
    incoming.get(n.nomineeId)!.push(n.nominatorId);
  }

  // score(X) = number of distinct users that can reach X via nomination edges
  const score = (target: string): number => {
    const seen = new Set<string>([target]);
    const stack = [target];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const nominator of incoming.get(current) ?? []) {
        if (!seen.has(nominator)) {
          seen.add(nominator);
          stack.push(nominator);
        }
      }
    }
    return seen.size;
  };

  const userById = new Map(users.map((u) => [u.id, u]));

  const nodes: GraphNode[] = Array.from(participantIds).map((id) => {
    const user = userById.get(id);
    return {
      id,
      name: user?.name ?? "Unknown",
      registered: user?.registered ?? false,
      score: score(id),
    };
  });

  const edges: GraphEdge[] = relevant.map((n) => ({
    source: n.nominatorId,
    target: n.nomineeId,
    weight: score(n.nominatorId),
  }));

  return { disciplineId: "", nodes, edges };
}
