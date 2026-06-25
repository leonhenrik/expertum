import { NextRequest, NextResponse } from "next/server";
import { buildDisciplineGraph, buildMultiDisciplineGraph } from "@/lib/graph";
import { getNominations, getUsers } from "@/lib/store";

export async function GET(request: NextRequest) {
  const disciplineId = request.nextUrl.searchParams.get("disciplineId");
  const disciplineIdsParam = request.nextUrl.searchParams.get("disciplineIds");

  const [users, nominations] = await Promise.all([
    getUsers(),
    getNominations(),
  ]);

  // If disciplineId is provided, show single discipline
  if (disciplineId) {
    const graph = buildDisciplineGraph(disciplineId, users, nominations);
    return NextResponse.json(graph);
  }

  // If disciplineIds is provided (comma-separated), show filtered disciplines
  if (disciplineIdsParam) {
    const disciplineIds = disciplineIdsParam.split(",").filter((id) => id);
    const graph = buildMultiDisciplineGraph(disciplineIds, users, nominations);
    return NextResponse.json(graph);
  }

  // If no filter, show all disciplines
  const graph = buildMultiDisciplineGraph([], users, nominations);
  return NextResponse.json(graph);
}
