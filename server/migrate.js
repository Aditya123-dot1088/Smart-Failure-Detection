import pool from './db.js'

const SQL = `
CREATE TABLE IF NOT EXISTS projects (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  sector           TEXT NOT NULL,
  business_model   TEXT NOT NULL,
  target_market    TEXT,
  budget_lakh      NUMERIC,
  description      TEXT,
  market           JSONB,
  risk             JSONB,
  recommendations  JSONB,
  readiness        JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_sector ON projects (sector);

-- Milestone 3: Strategic Intelligence — one row per generated agent-pipeline run
CREATE TABLE IF NOT EXISTS strategic_analyses (
  id            BIGSERIAL PRIMARY KEY,
  project_id    BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  steps         JSONB NOT NULL,
  report        JSONB NOT NULL,
  ai_provider   TEXT,
  ai_model      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_strategic_analyses_project_id ON strategic_analyses (project_id);
CREATE INDEX IF NOT EXISTS idx_strategic_analyses_created_at ON strategic_analyses (created_at DESC);
`

async function main() {
  console.log('Running migration...')
  await pool.query(SQL)
  console.log('Done — "projects" and "strategic_analyses" tables are ready.')
  await pool.end()
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
