# ProjectIntake — Smart Failure Detection: Market Intelligence Module

Milestone 1 & 2: **Data Collection, Market Intelligence & Risk Assessment**.
Milestone 3: **Recommendations & Strategic Reasoning** (new).

- Startup / project submission form (name, sector, business model, target market, budget, description)
- Live market analysis (TAM / SAM / SOM sizing + growth trend chart) that updates as you fill the form
- Competitor landscape module (market share, revenue, growth, position) per sector
- Automated Risk Assessment (Market / Competitive / Financial / Technical / Regulatory)
- Recommendations engine driven by the risk output
- Dashboard summary with SOM capture trajectory and a launch-readiness gauge
- **Milestone 3 — Strategic Intelligence**: a 7-agent reasoning pipeline (Market → Risk →
  SWOT → Feasibility → Strategy → Mitigation → Recommendation) that produces an AI-narrated
  executive verdict, a risk-to-mitigation plan, a Now/Next/Later improvement roadmap, and
  ranked top priorities with "why this recommendation" explainability — powered by Gemini or
  OpenAI when a key is configured, and by a deterministic fallback engine when it isn't.

## Stack

React 18 + Vite + Tailwind CSS + Recharts on the frontend. Market intelligence (TAM/SAM/SOM,
risk scoring, recommendations, readiness) is generated from a local reference dataset in
`src/data/sectors.js` and an analysis engine in `src/utils/analysis.js` — no API keys needed for that part.

Milestone 3's strategic reasoning runs server-side in `server/services/agents.js` (the agent
pipeline) and `server/services/aiProvider.js` (a thin REST client for Gemini/OpenAI, no SDK
dependency — Node 22's built-in `fetch` is used directly). It falls back to a deterministic
reasoning engine automatically if no AI key is set or a live call fails, so the feature always
works end to end.

Project submissions (along with their computed market/risk/recommendations/readiness snapshot)
are persisted to **PostgreSQL** via a small Express API in `server/`. Generated strategic
analyses are persisted too, in a separate `strategic_analyses` table linked to the project.

## Run it

### 1. Backend (API + Postgres)

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` and set `DATABASE_URL` to your existing Postgres connection string, e.g.:

```
DATABASE_URL=postgresql://myuser:mypassword@myhost:5432/mydatabase
```

(If your provider requires SSL — Neon, Supabase, RDS, etc. — set `PGSSL=true` in that file.)

Optionally add an AI key for live Milestone 3 reasoning (leave both blank to use the built-in
deterministic engine — everything still works without a key):

```
GEMINI_API_KEY=your-key-here
# or
OPENAI_API_KEY=your-key-here
```

Create the `projects` and `strategic_analyses` tables (safe to re-run — uses `CREATE TABLE IF NOT EXISTS`):

```bash
npm run migrate
```

Start the API:

```bash
npm start
```

It listens on `http://localhost:4000` by default (`PORT` in `.env` to change it) and exposes:

| Method | Path                          | Description                             |
|--------|-------------------------------|------------------------------------------|
| GET    | `/api/health`                 | Checks the server, DB, and AI provider config |
| POST   | `/api/projects`               | Save a new project submission           |
| GET    | `/api/projects`               | List all saved projects (newest first)  |
| GET    | `/api/projects/:id`           | Fetch one project by id                 |
| DELETE | `/api/projects/:id`           | Delete a project                        |
| POST   | `/api/strategic-analysis`     | Run the Milestone 3 agent pipeline      |
| GET    | `/api/strategic-analysis/:projectId` | Fetch the latest saved analysis for a project |

### 2. Frontend

In the project root (not `server/`):

```bash
npm install
cp .env.example .env   # VITE_API_URL defaults to http://localhost:4000, adjust if needed
npm run dev
```

Then open the URL Vite prints (defaults to `http://localhost:5173`). Submitting the "Project Input"
form now saves the submission and its computed analysis to Postgres in the background — a status
indicator in the top bar shows "Saving to database…" → "Saved to database" (or an error if the API
is unreachable). On the Recommendations tab, click **Generate Strategic Analysis** to run the
Milestone 3 pipeline — watch the 7-agent workflow diagram complete, then review the verdict, SWOT,
mitigation table, and roadmap.

To build a production bundle:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  data/sectors.js         Reference TAM/SAM/SOM + competitor data per sector
  utils/analysis.js       Turns a submission into market data, risk, recommendations, readiness
  utils/api.js             Frontend client for the Postgres-backed API (save/list/get/delete + Milestone 3)
  components/
    Sidebar.jsx             Step navigation
    ProjectInput.jsx        Submission form + live market analysis + competitor landscape
    RiskAssessment.jsx      Automated risk flags
    Recommendations.jsx     Suggested actions + Milestone 3 Strategic Intelligence section
    Dashboard.jsx            Summary stats, SOM trajectory chart, readiness gauge
    ui.jsx                   Shared UI primitives (Card, badges, bars)
  App.jsx                  Wires the pipeline: submission -> market -> risk -> recommendations -> readiness -> save to DB
server/
  index.js                 Express API (projects CRUD + Milestone 3 strategic-analysis endpoints)
  db.js                    Postgres connection pool (reads DATABASE_URL or PG* env vars)
  migrate.js               Creates the "projects" and "strategic_analyses" tables
  services/aiProvider.js   Gemini/OpenAI REST client with provider auto-detection
  services/agents.js       Milestone 3: 7-node agent pipeline (market/risk/SWOT/feasibility/strategy/mitigation/recommendation)
  .env.example             Copy to .env and fill in your Postgres credentials + (optional) AI key
```

## Extending for later milestones

Everything downstream of the form (`risk`, `recommendations`, `readiness`) is derived purely from
`src/utils/analysis.js`. To swap in a real ML model or live market API for a later milestone,
replace `generateMarketData` / `computeRisk` with real calls — the components don't need to change
since they only consume the shape of the returned objects.

The Milestone 3 agent pipeline in `server/services/agents.js` is a plain sequence of functions
over a shared state object — add a new agent by writing a function that reads `state` and pushes
a step, then call it from `runStrategicPipeline`.

To add a sector, add an entry to `SECTORS` in `src/data/sectors.js` with `tamCr`, `samShare`,
`somShare`, `tamGrowth`, `samGrowth`, and a `competitors` array.
