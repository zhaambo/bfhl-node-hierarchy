# BFHL — Node Hierarchy Processor

A REST API and frontend tool for processing hierarchical node relationships. Feed it edge definitions like `A->B`, and it builds trees, detects cycles, handles duplicates, and returns structured insights — all in one POST request.

Built for the SRM Full Stack Engineering Challenge.

---

## What It Does

You give it an array of edges (parent-child relationships between single uppercase letters), and it:

1. **Validates** each entry — rejects malformed edges, self-loops, numbers, empty strings
2. **Deduplicates** — uses first occurrence, tracks repeats
3. **Resolves multi-parent conflicts** — if two nodes claim the same child, first one wins
4. **Builds trees** — nested JSON structures for each independent component
5. **Detects cycles** — DFS with recursion stack, marks cyclic groups
6. **Calculates depth** — longest root-to-leaf node count
7. **Generates summary** — tree count, cycle count, largest tree root (with lex tiebreaker)

---

## Features

- **Clean API** — single `POST /bfhl` endpoint that handles everything
- **Input flexibility** — trims whitespace, handles edge cases gracefully
- **Cycle detection** — proper DFS-based algorithm, not a hack
- **Multi-parent resolution** — first-parent-wins rule, later edges silently dropped
- **Connected components** — independent sub-graphs processed separately
- **Frontend** — dark-themed UI with tree visualization, error display, and summary stats
- **CORS enabled** — works cross-origin out of the box

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js, Express |
| Frontend | Vanilla HTML/CSS/JS |
| Fonts | Inter, JetBrains Mono (Google Fonts) |
| Deployment | Render / Vercel / Railway |

No database. No build step. No framework overhead. Just clean JavaScript.

---

## Project Structure

```
backend/
├── app.js                  # Express server entry point
├── package.json
├── routes/
│   └── bfhl.js             # POST /bfhl route handler
└── utils/
    ├── validator.js         # Input validation + trimming
    ├── graphBuilder.js      # Adjacency list, dedup, multi-parent
    ├── treeBuilder.js       # Tree construction, cycle detection, depth
    └── summary.js           # Summary generation

frontend/
├── index.html
├── script.js
└── styles.css
```

---

## Setup

### Prerequisites
- Node.js 16+
- npm

### Local Development

```bash
# Clone the repo
git clone https://github.com/your-username/bfhl-challenge.git
cd bfhl-challenge

# Install backend dependencies
cd backend
npm install

# Start the server
npm start
# → Server running on http://localhost:3000
```

Open `http://localhost:3000` in your browser — the frontend is served automatically.

---

## API Documentation

### `POST /bfhl`

**Content-Type:** `application/json`

#### Request Body

```json
{
  "data": ["A->B", "A->C", "B->D", "C->E", "E->F", "X->Y", "Y->Z", "Z->X", "P->Q", "Q->R", "G->H", "G->H", "G->I", "hello", "1->2", "A->"]
}
```

#### Response

```json
{
  "user_id": "samrakshan_24042004",
  "email_id": "samrakshan@college.edu",
  "college_roll_number": "RA2211003010000",
  "hierarchies": [
    {
      "root": "A",
      "tree": {
        "A": {
          "B": { "D": {} },
          "C": { "E": { "F": {} } }
        }
      },
      "depth": 4
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    },
    {
      "root": "P",
      "tree": { "P": { "Q": { "R": {} } } },
      "depth": 3
    },
    {
      "root": "G",
      "tree": { "G": { "H": {}, "I": {} } },
      "depth": 2
    }
  ],
  "invalid_entries": ["hello", "1->2", "A->"],
  "duplicate_edges": ["G->H"],
  "summary": {
    "total_trees": 3,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | Format: `fullname_ddmmyyyy` |
| `email_id` | string | College email |
| `college_roll_number` | string | Roll number |
| `hierarchies` | array | Array of hierarchy objects |
| `invalid_entries` | string[] | Entries that didn't match `X->Y` format |
| `duplicate_edges` | string[] | Repeated edges (listed once each) |
| `summary` | object | `total_trees`, `total_cycles`, `largest_tree_root` |

#### Hierarchy Object

| Field | Type | Notes |
|-------|------|-------|
| `root` | string | Root node label |
| `tree` | object | Nested tree (empty `{}` if cycle) |
| `depth` | number | Only for non-cyclic trees |
| `has_cycle` | true | Only present when cycle detected |

---

## Screenshots

*Frontend — Input*
<!-- Add screenshot of the input section here -->

*Frontend — Results*
<!-- Add screenshot of the results section here -->

---

## Deployment

### Render (recommended for backend)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set:
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && node app.js`
   - **Root Directory:** (leave empty)
5. Deploy

### Vercel (alternative)

1. Install Vercel CLI: `npm i -g vercel`
2. From project root: `vercel`
3. Follow the prompts

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |

---

## How I Approached This Problem

### Initial Thinking

When I first read the problem, the core challenge was clear: take flat edge strings and build structured trees. But the devil's in the details — cycles, duplicates, multi-parent conflicts, and connected components all need careful handling.

I decided to break it into a clean pipeline: **validate → deduplicate → build graph → identify components → process each component → generate summary**. Each step is a pure function that takes input and returns output, making it easy to test and debug independently.

### The Tricky Parts

**Cycles.** The classic DFS approach with a visited set and a recursion stack is the right tool here. A node in the recursion stack means we're currently exploring its descendants — if we hit it again, that's a back edge, which means a cycle. Simple but you have to get the recursion stack cleanup right (remove the node when backtracking).

**Multi-parent resolution.** The spec says "first-encountered parent edge wins." This means I need to track which parent each child already has. If a new edge tries to assign a second parent to a child, I silently discard it. Important: this is different from the duplicate check — `A->D` and `B->D` are not duplicates (different parents), but the second one gets dropped because D already has parent A.

**Connected components.** The input can contain multiple independent graphs. I use BFS on an undirected view of the adjacency list to group nodes into components. Each component gets processed independently — its own root, its own cycle check, its own tree.

**Root identification.** A root is any node that never appears as a child. If no such node exists (every node is someone's child), it's a pure cycle — use the lexicographically smallest node as the root.

### Design Decisions

- **Modular utils** — each processing step is its own file. Validator doesn't know about graphs, graph builder doesn't know about trees. Clean separation.
- **No external dependencies** beyond Express and cors. No graph libraries, no lodash. The algorithms are straightforward enough that adding dependencies would just add complexity.
- **Frontend on the same server** — Express serves the static files, so one deployment URL handles everything. No CORS issues between frontend and backend.
- **Flexible input parsing** — the frontend accepts both JSON arrays and comma/newline-separated text. Users shouldn't have to format JSON by hand.

### Edge Cases

- Empty `data` array → empty hierarchies, zeros in summary
- All invalid entries → empty hierarchies, all entries in `invalid_entries`
- Self-loops (`A->A`) → treated as invalid per spec
- Whitespace (`" A->B "`) → trimmed, then validated normally
- Triple duplicates (`A->B, A->B, A->B`) → one in graph, one in `duplicate_edges`
- Pure cycle with no root → lex smallest node becomes root
- Diamond graph → first parent wins, others silently discarded

---

## Testing

### Quick Test

```bash
curl -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data": ["A->B", "A->C", "B->D", "C->E", "E->F", "X->Y", "Y->Z", "Z->X", "P->Q", "Q->R", "G->H", "G->H", "G->I", "hello", "1->2", "A->"]}'
```

### Edge Case Tests

| Input | Expected Behavior |
|-------|-------------------|
| `[]` | Empty hierarchies, zeros in summary |
| `["hello", "123"]` | All in `invalid_entries` |
| `["A->A"]` | Self-loop → `invalid_entries` |
| `[" A->B "]` | Trimmed → valid edge A->B |
| `["A->B", "A->B", "A->B"]` | One tree, one `duplicate_edges` entry |
| `["A->D", "B->D"]` | First parent wins, B->D silently dropped |
| `["X->Y", "Y->Z", "Z->X"]` | Cycle detected, `has_cycle: true` |

---

## License

MIT
