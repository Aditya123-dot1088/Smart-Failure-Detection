import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import express from 'express'
import cors from 'cors'
import pool from '../db.js'
import { getAIConfig } from '../services/aiProvider.js'
import { runStrategicPipeline } from '../services/agents.js'

// We will construct an isolated test server instance to test all express routes directly
let server
let baseUrl
let testProjectId

const app = express()
app.use(cors())
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

// Create project
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

// List all projects
app.get('/api/projects', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projects ORDER BY created_at DESC')
    res.json(rows)
  } catch (err) {
    console.error('GET /api/projects failed:', err)
    res.status(500).json({ error: 'Failed to fetch projects.' })
  }
})

// Single project
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

// Delete project
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

// Strategic analysis
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

// Fetch strategic analysis
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

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port
      baseUrl = `http://127.0.0.1:${port}`
      resolve()
    })
  })
})

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
  // Clean up test projects created in test
  if (testProjectId) {
    try {
      await pool.query('DELETE FROM projects WHERE id = $1', [testProjectId])
    } catch (_) {}
  }
  await pool.end()
})

describe('Backend + PostgreSQL API Integration Tests', () => {
  test('GET /api/health returns database status and AI configuration', async () => {
    const res = await fetch(`${baseUrl}/api/health`)
    assert.equal(res.status, 200)
    const json = await res.json()
    assert.equal(json.status, 'ok')
    assert.equal(json.db, 'connected')
    assert.ok(json.ai !== undefined, 'Includes AI configuration')
    assert.ok(typeof json.ai.configured === 'boolean')
  })

  test('POST /api/projects with invalid payload returns 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Incomplete Project' }) // missing sector and businessModel
    })

    assert.equal(res.status, 400)
    const json = await res.json()
    assert.match(json.error, /required/i)
  })

  test('POST /api/projects saves a complete project and returns HTTP 201', async () => {
    const payload = {
      name: 'Integration Test Startup',
      sector: 'HealthTech',
      businessModel: 'Marketplace',
      targetMarket: 'Diagnostic Clinics',
      budgetLakh: '45',
      description: 'AI diagnostic intake system for small labs.',
      market: { tam: 96000, sam: 23040, som: 184 },
      risk: { overallScore: 54, overallLevel: 'MEDIUM', criticalFlags: 1 },
      recommendations: [{ title: 'Differentiate offering', priority: 'HIGH' }],
      readiness: { overall: 68 }
    }

    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    assert.equal(res.status, 201)
    const project = await res.json()
    assert.ok(project.id, 'Has generated database ID')
    testProjectId = project.id
    assert.equal(project.name, 'Integration Test Startup')
    assert.equal(project.sector, 'HealthTech')
    assert.equal(project.business_model, 'Marketplace')
    assert.ok(project.created_at, 'Has timestamp')
  })

  test('GET /api/projects lists all projects including newly saved one', async () => {
    const res = await fetch(`${baseUrl}/api/projects`)
    assert.equal(res.status, 200)
    const list = await res.json()
    assert.ok(Array.isArray(list))
    const found = list.find((p) => String(p.id) === String(testProjectId))
    assert.ok(found, 'Found created project in projects list')
  })

  test('GET /api/projects/:id fetches single project details', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}`)
    assert.equal(res.status, 200)
    const project = await res.json()
    assert.equal(String(project.id), String(testProjectId))
    assert.equal(project.name, 'Integration Test Startup')
  })

  test('GET /api/projects/:id returns 404 for nonexistent id', async () => {
    const res = await fetch(`${baseUrl}/api/projects/99999999`)
    assert.equal(res.status, 404)
    const json = await res.json()
    assert.equal(json.error, 'Not found')
  })

  test('POST /api/strategic-analysis runs 7-agent pipeline and persists to PostgreSQL', async () => {
    const payload = {
      projectId: testProjectId,
      submission: {
        name: 'Integration Test Startup',
        sector: 'HealthTech',
        businessModel: 'Marketplace',
        targetMarket: 'Diagnostic Clinics',
        budgetLakh: '45'
      },
      market: {
        sectorName: 'HealthTech',
        tam: 96000,
        sam: 23040,
        som: 184,
        tamGrowth: 19,
        samGrowth: 15,
        topShare: 22,
        competitors: [{ name: 'Practo', share: 22 }]
      },
      risk: {
        overallScore: 54,
        overallLevel: 'MEDIUM',
        criticalFlags: 1,
        categories: [
          { key: 'market', label: 'Market Risk', level: 'MEDIUM', score: 50, message: 'Stable.' },
          { key: 'competitive', label: 'Competitive Risk', level: 'LOW', score: 35, message: 'Fragmented.' },
          { key: 'financial', label: 'Financial Risk', level: 'MEDIUM', score: 52, message: 'Moderate runway.' },
          { key: 'technical', label: 'Technical Risk', level: 'LOW', score: 35, message: 'Standard stack.' },
          { key: 'regulatory', label: 'Regulatory Risk', level: 'HIGH', score: 65, message: 'Medical compliance.' }
        ]
      },
      readiness: {
        overall: 68,
        breakdown: [
          { label: 'Market Validation', value: 70 },
          { label: 'Competitive Position', value: 65 },
          { label: 'Financial Model', value: 60 },
          { label: 'Technical Readiness', value: 75 }
        ]
      },
      recommendations: [
        { title: 'Front-load compliance scoping', priority: 'HIGH', impact: 'High', effort: 'Medium', body: 'Scope medical licensing.' }
      ]
    }

    const res = await fetch(`${baseUrl}/api/strategic-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    assert.equal(res.status, 200)
    const json = await res.json()
    assert.equal(json.persisted, true, 'Successfully persisted to PostgreSQL')
    assert.equal(json.steps.length, 7, '7 agent steps completed')
    assert.ok(json.report.verdict, 'Strategic verdict generated')
  })

  test('GET /api/strategic-analysis/:projectId retrieves persisted analysis from PostgreSQL', async () => {
    const res = await fetch(`${baseUrl}/api/strategic-analysis/${testProjectId}`)
    assert.equal(res.status, 200)
    const saved = await res.json()
    assert.equal(String(saved.project_id), String(testProjectId))
    assert.ok(Array.isArray(saved.steps))
    assert.ok(saved.report.verdict)
  })

  test('DELETE /api/projects/:id deletes project and cascades strategic analyses', async () => {
    const res = await fetch(`${baseUrl}/api/projects/${testProjectId}`, {
      method: 'DELETE'
    })
    assert.equal(res.status, 204)

    // Confirm project no longer exists
    const checkRes = await fetch(`${baseUrl}/api/projects/${testProjectId}`)
    assert.equal(checkRes.status, 404)

    // Confirm cascaded strategic analysis is gone
    const checkAnalysis = await fetch(`${baseUrl}/api/strategic-analysis/${testProjectId}`)
    assert.equal(checkAnalysis.status, 404)
    testProjectId = null
  })
})
