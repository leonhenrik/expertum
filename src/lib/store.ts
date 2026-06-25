import { promises as fs } from "fs";
import path from "path";
import type { Discipline, Nomination, User } from "./types";

export type Database = {
  users: User[];
  disciplines: Discipline[];
  nominations: Nomination[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function seed(): Database {
  return {
    users: [],
    disciplines: [
      { id: "comp-sci", name: "Computer Science" },
      { id: "mathematics", name: "Mathematics" },
      { id: "physics", name: "Physics" },
      { id: "philosophy", name: "Philosophy" },
    ],
    nominations: [],
  };
}

/**
 * Simple file-backed JSON store. Adequate for a single-instance demo app.
 * A real deployment would swap this for a proper database.
 */
async function read(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(raw) as Database;
  } catch {
    const fresh = seed();
    await write(fresh);
    return fresh;
  }
}

async function write(db: Database): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function id(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export async function getDatabase(): Promise<Database> {
  return read();
}

export async function getUsers(): Promise<User[]> {
  return (await read()).users;
}

export async function getDisciplines(): Promise<Discipline[]> {
  return (await read()).disciplines;
}

export async function getNominations(): Promise<Nomination[]> {
  return (await read()).nominations;
}

/** Register a brand new user (sign-up). Returns the created user. */
export async function createUser(name: string): Promise<User> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required.");
  const db = await read();
  const existing = db.users.find(
    (u) => u.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) {
    if (!existing.registered) {
      existing.registered = true;
      await write(db);
    }
    return existing;
  }
  const user: User = { id: id("user"), name: trimmed, registered: true };
  db.users.push(user);
  await write(db);
  return user;
}

/** Mark an already-listed (nominated-but-unregistered) user as registered. */
export async function registerExistingUser(userId: string): Promise<User> {
  const db = await read();
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found.");
  user.registered = true;
  await write(db);
  return user;
}

/** Get or create a placeholder user by name (used when nominating someone new). */
export async function getOrCreatePlaceholderUser(name: string): Promise<User> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required.");
  const db = await read();
  const existing = db.users.find(
    (u) => u.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) return existing;
  const user: User = { id: id("user"), name: trimmed, registered: false };
  db.users.push(user);
  await write(db);
  return user;
}

export async function createDiscipline(name: string): Promise<Discipline> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Discipline name is required.");
  const db = await read();
  const existing = db.disciplines.find(
    (d) => d.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) return existing;
  const discipline: Discipline = { id: id("disc"), name: trimmed };
  db.disciplines.push(discipline);
  await write(db);
  return discipline;
}

/**
 * Record a nomination. Each user may nominate at most one person per
 * discipline, so an existing nomination by the same nominator is replaced.
 */
export async function createNomination(input: {
  disciplineId: string;
  nominatorId: string;
  nomineeId: string;
}): Promise<Nomination> {
  const { disciplineId, nominatorId, nomineeId } = input;
  if (nominatorId === nomineeId) {
    throw new Error("You cannot nominate yourself.");
  }
  const db = await read();
  if (!db.disciplines.some((d) => d.id === disciplineId)) {
    throw new Error("Discipline not found.");
  }
  if (!db.users.some((u) => u.id === nominatorId)) {
    throw new Error("Nominator not found.");
  }
  if (!db.users.some((u) => u.id === nomineeId)) {
    throw new Error("Nominee not found.");
  }

  // Remove any prior nomination by this nominator in this discipline.
  db.nominations = db.nominations.filter(
    (n) => !(n.disciplineId === disciplineId && n.nominatorId === nominatorId)
  );

  const nomination: Nomination = { disciplineId, nominatorId, nomineeId };
  db.nominations.push(nomination);
  await write(db);
  return nomination;
}
