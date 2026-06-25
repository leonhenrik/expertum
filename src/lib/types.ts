export type User = {
  id: string;
  name: string;
  /** A signed-up user has registered === true. Nominated-but-not-signed-up users are registered === false. */
  registered: boolean;
};

export type Discipline = {
  id: string;
  name: string;
};

/**
 * A nomination: in a given discipline, `nominatorId` declares that `nomineeId`
 * is better than them. Each user can nominate at most one person per discipline.
 */
export type Nomination = {
  disciplineId: string;
  nominatorId: string;
  nomineeId: string;
};

export type GraphNode = {
  id: string;
  name: string;
  registered: boolean;
  /** Total transitive votes flowing into this node (including its own base vote). */
  score: number;
};

export type GraphEdge = {
  /** nominator */
  source: string;
  /** nominee */
  target: string;
  /** Number of votes forwarded along this edge (= nominator's score). */
  weight: number;
  /** Which discipline this nomination belongs to. */
  disciplineId: string;
};

export type DisciplineGraph = {
  disciplineId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};
