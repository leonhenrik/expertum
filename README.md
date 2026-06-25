# Expertum

Nominate one person who is better than you at a discipline, and watch
knowledge centers emerge through a transitive vote graph.

## How the vote graph works

- Every user holds **one base vote**.
- When you nominate someone in a discipline, you become a **forwarding node**:
  every vote that reaches you (including your own) flows on to your nominee.
- A node's **score** is therefore the total number of people whose votes
  transitively land on it (itself included).
- An arc's **weight** is how many votes the nominator forwards along it
  (equal to the nominator's own score).

The most-trusted experts naturally become the largest, darkest nodes.

## Tech

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui components
- `d3-force` for the force-directed visualization
- File-backed JSON store (`data/db.json`) — swap for a real DB in production

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Usage

1. **Sign up** as a brand new person, or claim an account that someone has
   already nominated for you.
2. **Nominate** tab: choose (or add) a discipline, then nominate an existing
   user or name someone who has not signed up yet.
3. **Visualize** tab: pick a discipline to see the weighted knowledge graph.
