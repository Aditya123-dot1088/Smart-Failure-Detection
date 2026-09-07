# ProjectIntake — Enterprise Startup Intelligence & Smart Failure Detection Suite

An end-to-end market intelligence, risk analytics, and strategic decision-support platform for early-stage founders, incubators, and investors in the Indian startup ecosystem.

---

## 📌 Executive Summary

**ProjectIntake** transforms early-stage project ideas into structured, data-driven feasibility reports. By combining top-down market sizing, algorithmic risk scoring, a 7-agent reasoning pipeline, an executive dashboard, and lazy-loaded PDF reporting, the platform helps founders identify fatal blindspots before committing capital.

---

## 🚀 Key Features by Milestone

### 🔹 Milestone 1 — Data Collection & Market Sizing
- **Interactive Project Submission**: Dynamic intake capturing Startup Name, Sector, Business Model, Target Market, Capital/Budget (₹ Lakhs), and Problem Description.
- **Live TAM / SAM / SOM Sizing**: Dynamic sizing calibrated against Indian sector benchmarks across E-commerce, FinTech, HealthTech, EdTech, SaaS/B2B, Logistics, and more.
- **7-Year SOM Growth Trajectory**: Multi-year obtainable market projection with realistic customer acquisition drag modeling.
- **Competitor Landscape**: Real-time competitor benchmarking detailing market shares, estimated revenues (₹ Cr), annual growth rates, and strategic positioning (*Leader, Challenger, Incumbent, Direct, Indirect*).

### 🔹 Milestone 2 — Automated Multi-Category Risk Assessment
- **5-Dimensional Risk Scoring**:
  - 📊 **Market Risk**: Analyzes growth divergence between TAM/SAM and SOM trajectory dips.
  - ⚔️ **Competitive Risk**: Measures category leader dominance and concentration barrier.
  - 💰 **Financial Risk**: Evaluates capital sufficiency against addressable capture requirements.
  - ⚙️ **Technical Risk**: Assesses business-model complexity and regional integration overhead.
  - ⚖️ **Regulatory Risk**: Evaluates sector-specific licensing, data-compliance, and governance burdens.
- **Composite Risk Index**: Weighted overall score (0–100), categorical risk levels (*LOW, MEDIUM, HIGH*), critical risk flags count, and market fit score (45–96%).

### 🔹 Milestone 3 — Strategic Intelligence & 7-Agent Reasoning
- **LangGraph-Style 7-Agent Reasoning Pipeline**:
  1. **Market Intelligence Agent**: Parses sizing signals and competitive concentration.
  2. **Risk Signal Agent**: Aggregates risk scores and high-severity exposures.
  3. **SWOT Synthesis Agent**: Generates contextual Strengths, Weaknesses, Opportunities, and Threats.
  4. **Feasibility Agent**: Calculates launch readiness and isolates the weakest dimension.
  5. **Strategy Reasoning Agent**: Evaluates strategic verdict (*STRONG GO, PROCEED WITH CAUTION, PIVOT RECOMMENDED*) and investor signal.
  6. **Mitigation Planning Agent**: Generates actionable risk-to-mitigation mappings with owners, impact, and time horizons.
  7. **Recommendation Synthesis Agent**: Stages a *Now / Next / Later* roadmap and surfaces ranked top priorities with explainability (*"Why this action"*).
- **Dual Engine Architecture (AI + Deterministic Fallback)**:
  - Supports live narration via **Google Gemini** or **OpenAI** over pure REST (Node 22 native fetch).
  - Falls back automatically to platform deterministic intelligence if no API key is provided or if network calls fail, ensuring zero downtime.

### 🔹 Milestone 4 — Executive Dashboard & PDF Reporting
- **Executive Analytics Dashboard**:
  - High-level KPI status cards (Market Fit %, Critical Risk Flags, High-Risk Items, Weakest Dimension).
  - SOM Capture Trajectory interactive bar chart with tooltip analytics.
  - Risk Category Comparison horizontal bar chart.
  - Launch Readiness circular gauge and 4-dimension progress breakdown.
  - Live Strategic Intelligence summary and verdict badge.
- **Lazy-Loaded PDF Report Generation**:
  - Standalone multi-page executive report rendered client-side via `html2canvas` + `jsPDF`.
  - Lazy-loaded dynamically on click to keep the core application bundle lightweight.
  - Clean A4 pagination, 8mm margins, high-DPI canvas capture, and executive typography.
- **PostgreSQL Persistence**:
  - Full relational persistence of submissions, computed market/risk snapshots, and agent analysis runs with foreign key cascading.
- **Automated Testing Suite**:
  - Comprehensive unit and integration test suites covering frontend calculations and backend intelligence logic with 100% pass rate.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 18, Vite 5, Tailwind CSS 3, Lucide / Custom SVG Icons |
| **Data Visualization** | Recharts 2 (ResponsiveContainer, BarChart, Tooltip, CartesianGrid) |
| **Document Generation** | jsPDF 4, html2canvas 1 (code-split & lazy-loaded) |
| **Backend API** | Node.js 22, Express 4, CORS, dotenv |
| **Database** | PostgreSQL 14+, `pg` (node-postgres connection pooling) |
| **AI Integration** | Google Gemini API (v1beta REST), OpenAI API (v1 REST), zero external AI SDKs |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert/strict`) |

---

## 📂 Project Structure

```
project-intake/
├── dist/                          # Production build output
├── public/                        # Static web assets
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx          # Milestone 4: Executive dashboard & charts
│   │   ├── ProjectInput.jsx       # Milestone 1: Form + live market intelligence
│   │   ├── Recommendations.jsx    # Milestone 3: 7-agent workflow & strategic report
│   │   ├── RiskAssessment.jsx     # Milestone 2: Automated risk category flags
│   │   ├── Sidebar.jsx            # Responsive step-by-step navigation
│   │   └── ui.jsx                 # Reusable UI primitives (Card, badges, progress bars)
│   ├── data/
│   │   └── sectors.js             # Indian sector TAM/SAM/SOM reference database
│   ├── utils/
│   │   ├── analysis.js            # Core market, risk, recommendation & readiness engines
│   │   ├── api.js                 # Frontend API client (Postgres CRUD + Strategic Pipeline)
│   │   └── pdfReport.js           # Lazy-loaded executive PDF export generator
│   ├── App.jsx                    # Top-level state coordinator & pipeline orchestrator
│   ├── index.css                  # Design tokens, typography & animation utilities
│   └── main.jsx                   # React application entrypoint
├── server/
│   ├── ai/
│   │   ├── geminiProvider.js      # Gemini REST client (fetch-based)
│   │   ├── openaiProvider.js      # OpenAI REST client (fetch-based)
│   │   └── provider.js            # Provider abstraction & timeout handler
│   ├── services/
│   │   ├── agents.js              # Milestone 3: 7-agent LangGraph-style workflow runner
│   │   └── aiProvider.js          # Unified AI service with fallback resolution
│   ├── strategy/
│   │   ├── deterministicEngine.js # Grounded platform strategy & verdict engine
│   │   ├── graph.js               # StateGraph execution runner
│   │   ├── improvementEngine.js   # Readiness gap & points improvement engine
│   │   ├── mitigationEngine.js    # Risk-to-mitigation plan builder
│   │   ├── prompt.js              # Grounded AI prompt construction
│   │   ├── recommendationEngine.js# Top priorities & quick wins synthesizer
│   │   └── schema.js              # Defensive schema normalization & validation
│   ├── test/
│   │   ├── apiIntegration.test.js # Live PostgreSQL & Express API integration tests
│   │   └── strategyEngines.test.js# Backend logic & edge-case unit tests
│   ├── db.js                      # PostgreSQL connection pool configuration
│   ├── index.js                   # Express server & API endpoints
│   ├── migrate.js                 # Idempotent database schema migration script
│   ├── package.json               # Backend dependencies & test scripts
│   ├── .env.example               # Backend configuration template
│   └── .env                       # Local backend secrets (git-ignored)
├── test/
│   └── frontendAnalysis.test.js   # Frontend analysis engine test suite
├── .env.example                   # Frontend configuration template
├── .gitignore                     # Git exclusion rules
├── package.json                   # Frontend dependencies & scripts
├── tailwind.config.js             # Curated design palette & typography tokens
└── vite.config.js                 # Vite bundler & build configuration
```

---

## ⚡ Quickstart & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ / v22 recommended)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: Local or hosted instance (Neon, Supabase, RDS, local)

---

### 1. Database Setup & Migration

In the `server/` directory:

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` with your PostgreSQL connection details:

```ini
DATABASE_URL=postgresql://postgres:password@localhost:5432/project_intake
# Or configure host, port, database, user, password individually
PORT=4000
CORS_ORIGIN=http://localhost:5173
PGSSL=false

# Optional: Add an AI API key (leave blank to run in pure deterministic fallback mode)
GEMINI_API_KEY=your-gemini-key-here
# or
OPENAI_API_KEY=your-openai-key-here
```

Run database migrations to initialize tables and indexes:

```bash
npm run migrate
```

Start the backend API server:

```bash
npm start
# or development mode with file watching:
npm run dev
```

The API will be available at `http://localhost:4000`.

---

### 2. Frontend Setup

In the root directory:

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

The repository includes comprehensive automated test suites using the Node.js native test runner:

### Run Frontend Analysis Tests
```bash
# In the project root
npm test
```
*Validates INR formatting, sector data integrity, market data generation, risk scoring, recommendations, and readiness calculations.*

### Run Backend & Integration Tests
```bash
# In the server directory
cd server
npm test
```
*Validates deterministic strategy generation, mitigations, top priorities, quick wins, schema normalization, 7-agent pipeline execution, and live PostgreSQL CRUD/Health endpoints.*

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Request Body / Params |
|---|---|---|---|
| `GET` | `/api/health` | Healthcheck & provider status | `None` |
| `POST` | `/api/projects` | Save project submission & analysis snapshot | `{ name, sector, businessModel, targetMarket, budgetLakh, description, market, risk, recommendations, readiness }` |
| `GET` | `/api/projects` | List all saved projects (newest first) | `None` |
| `GET` | `/api/projects/:id` | Fetch single project by ID | `id` in path |
| `DELETE` | `/api/projects/:id` | Delete project and cascade analyses | `id` in path |
| `POST` | `/api/strategic-analysis` | Execute 7-agent reasoning workflow | `{ projectId, submission, market, risk, readiness, recommendations }` |
| `GET` | `/api/strategic-analysis/:projectId` | Fetch latest strategic analysis for a project | `projectId` in path |

---

## 🔒 Security & Credential Hygiene

- **Zero Client-Side Secrets**: All AI API keys and database credentials are read exclusively on the server (`server/.env`).
- **Sanitized `.env.example`**: Example files contain only generic placeholder values (`USER:PASSWORD@HOST:5432/DBNAME`).
- **Enforced `.gitignore`**: Environment files (`.env`, `server/.env`, `*.local`) and build artifacts are strictly excluded from version control.
- **Configurable CORS**: API requests are restricted to explicitly whitelisted origins via `CORS_ORIGIN`.

---

## 📦 Production Deployment

### Frontend Production Build
```bash
npm run build
npm run preview
```
*Generates optimized assets in `dist/` with lazy-loaded PDF chunking.*

### Backend Production
```bash
cd server
npm start
```
*Starts Express on the configured `PORT` with connection pooling enabled.*

---

## 🔮 Future Enhancements
- Integration with live Ministry of Corporate Affairs (MCA) and Registrar of Companies (RoC) registries for live Indian entity search.
- Multi-user authentication with role-based access for founders and venture analysts.
- Automated competitor web-scraping and live pricing intelligence ingestion.
