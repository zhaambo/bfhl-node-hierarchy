# BFHL — Node Hierarchy Processor

A REST API and frontend tool for processing hierarchical node relationships. Feed it edge definitions like `A->B`, and it builds trees, detects cycles, handles duplicates, and returns structured insights — all in one POST request.

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

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |

---


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
