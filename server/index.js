import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import pool from './db.js'
import { getAIConfig } from './services/aiProvider.js'
import { runStrategicPipeline } from './services/agents.js'

const app = express()
const PORT = Number(process.env.PORT) || 4000
const corsEnv = process.env.CORS_ORIGIN || 'http://localhost:5173'
const allowedOrigins = corsEnv.split(',').map((s) => s.trim()).filter(Boolean)

app.use(
  cors({
    origin: corsEnv === '*' || allowedOrigins.includes('*') ? '*' : allowedOrigins
  })
)
app.use(express.json({ limit: '1mb' }))

// Health check — also verifies DB connectivity
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected', ai: getAIConfig() })
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'unreachable', message: err.message })
  }
})

// Create a project submission (with computed market/risk/recommendations/readiness snapshot)
app.post('/api/projects', async (req, res) => {
  const {
    name,
    sector,
    businessModel,
    targetMarket,
    budgetLakh,
    description,
    market,
    risk,
    recommendations,
    readiness
  } = req.body || {}

  if (!name || !sector || !businessModel) {
    return res.status(400).json({ error: 'name, sector, and businessModel are required.' })
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO projects
        (name, sector, business_model, target_market, budget_lakh, description, market, risk, recommendations, readiness)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name,
        sector,
        businessModel,
        targetMarket || null,
        budgetLakh || null,
        description || null,
        market ? JSON.stringify(market) : null,
        risk ? JSON.stringify(risk) : null,
        recommendations ? JSON.stringify(recommendations) : null,
        readiness ? JSON.stringify(readiness) : null
      ]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('POST /api/projects failed:', err)
    res.status(500).json({ error: 'Failed to save project.' })
  }
})

// List all projects, most recent first
app.get('/api/projects', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projects ORDER BY created_at DESC')
    res.json(rows)
  } catch (err) {
    console.error('GET /api/projects failed:', err)
    res.status(500).json({ error: 'Failed to fetch projects.' })
  }
})

// Fetch a single project by id
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    console.error('GET /api/projects/:id failed:', err)
    res.status(500).json({ error: 'Failed to fetch project.' })
  }
})

// Delete a project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'Not found' })
    res.status(204).end()
  } catch (err) {
    console.error('DELETE /api/projects/:id failed:', err)
    res.status(500).json({ error: 'Failed to delete project.' })
  }
})

// --- Milestone 3: Strategic Intelligence -----------------------------------
// Runs the 7-agent reasoning pipeline (market -> risk -> SWOT -> feasibility
// -> strategy [Gemini/OpenAI or fallback] -> mitigation -> recommendation)
// and persists the result against the project when a projectId is given.
app.post('/api/strategic-analysis', async (req, res) => {
  const { projectId, submission, market, risk, readiness, recommendations } = req.body || {}

  if (!submission || !market || !risk || !readiness) {
    return res.status(400).json({ error: 'submission, market, risk, and readiness are required.' })
  }

  let result
  try {
    result = await runStrategicPipeline({ submission, market, risk, readiness, recommendations })
  } catch (err) {
    console.error('Strategic pipeline failed:', err)
    return res.status(500).json({ error: 'Failed to generate strategic analysis.' })
  }

  let persisted = false
  if (projectId) {
    try {
      await pool.query(
        `INSERT INTO strategic_analyses (project_id, steps, report, ai_provider, ai_model)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          projectId,
          JSON.stringify(result.steps),
          JSON.stringify(result.report),
          result.ai.provider,
          result.ai.model
        ]
      )
      persisted = true
    } catch (err) {
      console.error('Failed to persist strategic analysis:', err)
    }
  }

  res.json({ ...result, persisted })
})

// Fetch the most recent strategic analysis saved for a project
app.get('/api/strategic-analysis/:projectId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM strategic_analyses WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.projectId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    console.error('GET /api/strategic-analysis/:projectId failed:', err)
    res.status(500).json({ error: 'Failed to fetch strategic analysis.' })
  }
})

app.listen(PORT, () => {
  console.log(`Project Intake API listening on http://localhost:${PORT}`)
})
