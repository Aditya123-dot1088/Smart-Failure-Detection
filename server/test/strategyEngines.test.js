import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { runDeterministicStrategy } from '../strategy/deterministicEngine.js'
import { buildMitigations } from '../strategy/mitigationEngine.js'
import { buildTopPriorities, buildQuickWins, buildNextSteps, buildCriticalRisks } from '../strategy/recommendationEngine.js'
import { buildImprovements } from '../strategy/improvementEngine.js'
import { normalizeStrategy } from '../strategy/schema.js'
import { runStrategicPipeline } from '../services/agents.js'
import { runStrategyGraph } from '../strategy/graph.js'
import { buildStrategyPrompt } from '../strategy/prompt.js'

// Standard sample fixture
const sampleSubmission = {
  name: 'FinFlow India',
  sector: 'FinTech',
  businessModel: 'Subscription / SaaS',
  targetMarket: 'Tier 2 & 3 MSMEs',
  budgetLakh: '50',
  description: 'Automated invoice discounting and reconciliation for Indian SMBs.'
}

const sampleMarket = {
  sectorName: 'FinTech',
  tam: 185000,
  sam: 37000,
  som: 2960,
  tamGrowth: 24,
  samGrowth: 28,
  trend: [
    { year: 2020, som: 533 },
    { year: 2021, som: 915 },
    { year: 2022, som: 1420 },
    { year: 2023, som: 2010 },
    { year: 2024, som: 2450 },
    { year: 2025, som: 2680 },
    { year: 2026, som: 2960 }
  ],
  competitors: [
    { name: 'Razorpay', share: 32, revenueCr: 2100, growth: 38, position: 'Leader' },
    { name: 'Cashfree', share: 18, revenueCr: 650, growth: 29, position: 'Challenger' },
    { name: 'Pine Labs', share: 14, revenueCr: 1200, growth: 18, position: 'Incumbent' }
  ],
  topShare: 32
}

const sampleRisk = {
  overallScore: 58,
  overallLevel: 'MEDIUM',
  criticalFlags: 1,
  marketFit: 82,
  categories: [
    { key: 'market', label: 'Market Risk', level: 'MEDIUM', score: 48, message: 'SOM trajectory tracks market growth.' },
    { key: 'competitive', label: 'Competitive Risk', level: 'HIGH', score: 72, message: 'Leader holds 32% share.' },
    { key: 'financial', label: 'Financial Risk', level: 'MEDIUM', score: 52, message: 'Budget requires disciplined capture.' },
    { key: 'technical', label: 'Technical Risk', level: 'LOW', score: 35, message: 'SaaS model is well understood.' },
    { key: 'regulatory', label: 'Regulatory Risk', level: 'HIGH', score: 68, message: 'FinTech carries compliance obligations.' }
  ]
}

const sampleReadiness = {
  overall: 62,
  breakdown: [
    { label: 'Market Validation', value: 72 },
    { label: 'Competitive Position', value: 42 },
    { label: 'Financial Model', value: 58 },
    { label: 'Technical Readiness', value: 76 }
  ]
}

const sampleRecommendations = [
  { title: 'Re-anchor SOM assumptions', body: 'Validate customer acquisition funnel.', impact: 'High', effort: 'Low', priority: 'HIGH' },
  { title: 'Differentiate from the category leader', body: 'Target underserved workflow.', impact: 'High', effort: 'Medium', priority: 'CRITICAL' },
  { title: 'Lock in early SAM capture', body: 'Secure beachhead accounts fast.', impact: 'Medium', effort: 'Medium', priority: 'HIGH' }
]

describe('Deterministic Strategy Engine (deterministicEngine.js)', () => {
  test('generates complete strategic output from valid inputs', () => {
    const result = runDeterministicStrategy({
      submission: sampleSubmission,
      market: sampleMarket,
      risk: sampleRisk,
      readiness: sampleReadiness,
      recommendations: sampleRecommendations
    })

    assert.ok(result.strategicVerdict, 'Has strategic verdict')
    assert.match(result.strategicVerdict, /Proceed/i)
    assert.ok(typeof result.confidence === 'number' && result.confidence >= 0 && result.confidence <= 100, 'Confidence is 0-100')
    assert.ok(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(result.priority), 'Valid priority')
    assert.ok(result.executiveStrategy.includes('FinFlow India'), 'Strategy cites project name')
    assert.ok(Array.isArray(result.keyInsights) && result.keyInsights.length >= 3, 'Produces key insights')
    assert.ok(Array.isArray(result.topPriorities) && result.topPriorities.length > 0, 'Produces top priorities')
    assert.ok(Array.isArray(result.mitigations) && result.mitigations.length > 0, 'Produces mitigations')
    assert.ok(Array.isArray(result.improvements) && result.improvements.length > 0, 'Produces improvements')
    assert.ok(Array.isArray(result.quickWins) && result.quickWins.length > 0, 'Produces quick wins')
    assert.ok(Array.isArray(result.criticalRisks), 'Produces critical risks list')
    assert.ok(result.criticalRisks.includes('Competitive Risk'), 'Identifies HIGH risk categories')
    assert.ok(result.criticalRisks.includes('Regulatory Risk'), 'Identifies HIGH regulatory risk')
    assert.ok(result.reasoning.market && result.reasoning.risk && result.reasoning.feasibility && result.reasoning.conclusion, 'Has comprehensive reasoning sections')
    assert.ok(result.nextBestAction.label && result.nextBestAction.description, 'Has next best action')
  })

  test('verdict scales accurately with high risk and low readiness', () => {
    const highRisk = {
      ...sampleRisk,
      overallScore: 78,
      overallLevel: 'HIGH',
      criticalFlags: 3
    }
    const lowReadiness = {
      ...sampleReadiness,
      overall: 38
    }

    const result = runDeterministicStrategy({
      submission: sampleSubmission,
      market: sampleMarket,
      risk: highRisk,
      readiness: lowReadiness,
      recommendations: sampleRecommendations
    })

    assert.equal(result.strategicVerdict, 'Proceed with Controlled Validation')
    assert.equal(result.priority, 'CRITICAL')
    assert.ok(result.confidence < 60, 'Lower confidence under high risk')
  })

  test('verdict scales to scale when low risk and high readiness', () => {
    const lowRisk = {
      ...sampleRisk,
      overallScore: 28,
      overallLevel: 'LOW',
      criticalFlags: 0,
      categories: sampleRisk.categories.map((c) => ({ ...c, level: 'LOW', score: 25 }))
    }
    const highReadiness = {
      ...sampleReadiness,
      overall: 85,
      breakdown: sampleReadiness.breakdown.map((b) => ({ ...b, value: 85 }))
    }

    const result = runDeterministicStrategy({
      submission: sampleSubmission,
      market: sampleMarket,
      risk: lowRisk,
      readiness: highReadiness,
      recommendations: sampleRecommendations
    })

    assert.equal(result.strategicVerdict, 'Proceed to Scale')
    assert.equal(result.priority, 'MEDIUM')
    assert.ok(result.confidence >= 70, 'High confidence for de-risked startup')
  })
})

describe('Mitigation Engine (mitigationEngine.js)', () => {
  test('filters out LOW risks and ranks HIGH above MEDIUM', () => {
    const mitigations = buildMitigations(sampleRisk, sampleSubmission)

    assert.equal(mitigations.length, 4, 'Filters out 1 LOW technical risk out of 5')
    assert.equal(mitigations[0].severity, 'HIGH', 'First mitigation is HIGH severity')
    assert.equal(mitigations[1].severity, 'HIGH', 'Second mitigation is HIGH severity')
    assert.equal(mitigations[2].severity, 'MEDIUM', 'Third mitigation is MEDIUM severity')

    mitigations.forEach((m) => {
      assert.ok(m.risk, 'Has risk name')
      assert.ok(m.whyItMatters, 'Has why it matters')
      assert.ok(m.rootCause, 'Has root cause')
      assert.ok(m.mitigation, 'Has mitigation action')
      assert.ok(m.owner, 'Has owner')
      assert.ok(m.expectedImpact, 'Has expected impact')
      assert.ok(m.horizon, 'Has time horizon')
    })
  })

  test('incorporates user budget correctly into financial mitigation', () => {
    const withBudget = buildMitigations(sampleRisk, { budgetLakh: '75' })
    const finMitWith = withBudget.find((m) => m.risk === 'Financial Risk')
    assert.ok(finMitWith.mitigation.includes('₹75 Lakh'), 'Cites explicit budget')

    const withoutBudget = buildMitigations(sampleRisk, { budgetLakh: null })
    const finMitWithout = withoutBudget.find((m) => m.risk === 'Financial Risk')
    assert.ok(finMitWithout.mitigation.includes('the current budget'), 'Falls back cleanly without budget')
  })
})

describe('Recommendation & Priority Engine (recommendationEngine.js)', () => {
  test('builds top priorities addressing weakest readiness and critical risks', () => {
    const priorities = buildTopPriorities(sampleRisk, sampleReadiness, sampleRecommendations)

    assert.ok(priorities.length <= 3, 'Yields at most 3 top priorities')
    const titles = priorities.map((p) => p.title)
    assert.ok(titles.includes('Validate customer demand'), 'Includes demand validation')
    assert.ok(titles.some((t) => t.includes('Strengthen competitive position') || t.includes('competitive')), 'Addresses competitive position gap')
  })

  test('builds quick wins with low effort actions and clear horizons', () => {
    const quickWins = buildQuickWins(sampleRisk, sampleReadiness)

    assert.ok(quickWins.length >= 3 && quickWins.length <= 5, 'Yields 3 to 5 quick wins')
    quickWins.forEach((w) => {
      assert.ok(w.title, 'Quick win has title')
      assert.ok(['High', 'Medium'].includes(w.impact), 'Has valid impact')
      assert.ok(['Low', 'Medium'].includes(w.effort), 'Has valid effort')
      assert.ok(w.horizon, 'Has horizon')
    })

    // FinTech has regulatory risk flagged HIGH, so compliance quick win should be included
    assert.ok(quickWins.some((w) => w.title.toLowerCase().includes('compliance')), 'Surfaces compliance quick win for regulatory risk')
  })

  test('builds non-empty next steps and isolates critical risks', () => {
    const nextSteps = buildNextSteps(sampleRisk, sampleReadiness)
    assert.equal(nextSteps.length, 3, 'Generates 3 next steps')

    const criticalRisks = buildCriticalRisks(sampleRisk)
    assert.deepEqual(criticalRisks, ['Competitive Risk', 'Regulatory Risk'])
  })
})

describe('Improvement Engine (improvementEngine.js)', () => {
  test('identifies dimensions below 70 threshold and calculates estimated impact', () => {
    const improvements = buildImprovements(sampleReadiness)

    assert.equal(improvements.length, 2, '2 dimensions below 70 (Competitive Position at 42%, Financial Model at 58%)')
    assert.equal(improvements[0].area, 'Competitive Position', 'Sorted by lowest score first')
    assert.equal(improvements[0].priority, 'HIGH', 'Score < 45 gets HIGH priority')
    assert.equal(improvements[1].priority, 'MEDIUM', 'Score >= 45 gets MEDIUM priority')
    assert.ok(improvements[0].expectedImpact.includes('readiness points'), 'Estimates point gains')
  })

  test('returns empty array if all dimensions are already healthy', () => {
    const perfectReadiness = {
      overall: 88,
      breakdown: sampleReadiness.breakdown.map((b) => ({ ...b, value: 85 }))
    }
    const improvements = buildImprovements(perfectReadiness)
    assert.equal(improvements.length, 0, 'No improvements needed when all >= 70')
  })
})

describe('Schema & Normalization (schema.js)', () => {
  test('handles malformed, null, or empty strategy inputs without throwing', () => {
    const normalized = normalizeStrategy(null)

    assert.equal(normalized.strategicVerdict, 'Proceed with Controlled Validation')
    assert.equal(normalized.confidence, 65)
    assert.equal(normalized.priority, 'HIGH')
    assert.equal(normalized.executiveStrategy, 'Strategic summary unavailable.')
    assert.deepEqual(normalized.keyInsights, [])
    assert.deepEqual(normalized.topPriorities, [])
    assert.deepEqual(normalized.mitigations, [])
    assert.deepEqual(normalized.improvements, [])
    assert.deepEqual(normalized.quickWins, [])
    assert.deepEqual(normalized.criticalRisks, [])
    assert.deepEqual(normalized.nextSteps, [])
    assert.equal(typeof normalized.reasoning, 'object')
    assert.equal(normalized.nextBestAction.label, 'Start Validation Sprint')
  })

  test('clamps confidence safely and preserves valid structured fields', () => {
    const raw = {
      strategicVerdict: '  Strong Strategic Position  ',
      confidence: 150, // out of bounds
      priority: 'INVALID_PRIORITY',
      topPriorities: [
        { title: 'Item 1', priority: 'CRITICAL', impact: 'High', why: 'Because of market' },
        null // corrupted item
      ]
    }

    const normalized = normalizeStrategy(raw)
    assert.equal(normalized.strategicVerdict, 'Strong Strategic Position')
    assert.equal(normalized.confidence, 100, 'Clamped to 100 max')
    assert.equal(normalized.priority, 'HIGH', 'Invalid priority falls back to HIGH')
    assert.equal(normalized.topPriorities.length, 2)
    assert.equal(normalized.topPriorities[0].title, 'Item 1')
    assert.equal(normalized.topPriorities[1].title, 'Untitled priority')
  })
})

describe('Agent Pipeline & Graph Orchestration (agents.js & graph.js)', () => {
  test('runStrategicPipeline executes all 7 agents in sequence', async () => {
    const result = await runStrategicPipeline({
      submission: sampleSubmission,
      market: sampleMarket,
      risk: sampleRisk,
      readiness: sampleReadiness,
      recommendations: sampleRecommendations
    })

    assert.ok(result.steps, 'Returns steps list')
    assert.equal(result.steps.length, 7, 'Executes exactly 7 agent steps')
    const stepIds = result.steps.map((s) => s.id)
    assert.deepEqual(stepIds, ['market', 'risk', 'swot', 'feasibility', 'strategy', 'mitigation', 'recommendation'])

    result.steps.forEach((s) => {
      assert.equal(s.status, 'done', `${s.name} completed successfully`)
      assert.ok(s.detail && s.detail.length > 5, `${s.name} has detailed output log`)
    })

    const { report } = result
    assert.ok(report.verdict, 'Report contains verdict')
    assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(report.verdictLevel), 'Report contains verdict level')
    assert.ok(report.investorSignal, 'Report contains investor signal')
    assert.ok(report.reasoning, 'Report contains strategic reasoning')
    assert.ok(report.swot.strengths.length > 0, 'SWOT has strengths')
    assert.ok(report.swot.threats.length > 0, 'SWOT has threats')
    assert.ok(report.riskMitigation.length > 0, 'Has risk mitigation table')
    assert.ok(report.roadmap.now && report.roadmap.next && report.roadmap.later, 'Has now/next/later roadmap')
    assert.ok(report.topPriorities.length > 0, 'Has top priorities')
  })

  test('runStrategyGraph completes with full LangGraph-style workflow nodes', async () => {
    const result = await runStrategyGraph({
      submission: sampleSubmission,
      market: sampleMarket,
      risk: sampleRisk,
      readiness: sampleReadiness,
      recommendations: sampleRecommendations
    })

    assert.ok(result.strategy, 'Produces normalized strategy')
    assert.ok(result.workflow, 'Produces workflow steps')
    assert.equal(result.workflow.length, 7, 'Workflow has 7 nodes')
    result.workflow.forEach((node) => {
      assert.equal(node.status, 'complete', `${node.agent} completed`)
      assert.ok(typeof node.durationMs === 'number', `${node.agent} tracks durationMs`)
    })
    assert.ok(result.meta.generatedAt, 'Meta has timestamp')
    assert.ok(result.meta.statusLabel, 'Meta has status label')
  })

  test('buildStrategyPrompt builds grounded prompt with exact numbers', () => {
    const prompt = buildStrategyPrompt({
      submission: sampleSubmission,
      market: sampleMarket,
      risk: sampleRisk,
      readiness: sampleReadiness,
      recommendations: sampleRecommendations,
      draft: { test: 123 }
    })

    assert.ok(prompt.includes('FinFlow India'), 'Includes project name')
    assert.ok(prompt.includes('TAM: ₹1,85,000 Cr'), 'Includes formatted TAM')
    assert.ok(prompt.includes('SAM: ₹37,000 Cr'), 'Includes formatted SAM')
    assert.ok(prompt.includes('Overall: 58/100 (MEDIUM)'), 'Includes overall risk')
    assert.ok(prompt.includes('Overall readiness: 62%'), 'Includes overall readiness')
    assert.ok(prompt.includes('Return ONLY a JSON object'), 'Specifies JSON contract')
  })
})

describe('Edge Cases & Minimal Inputs Handling', () => {
  test('handles minimal project input with missing optional fields and 0 budget', async () => {
    const minimalSubmission = {
      name: 'MinimalApp',
      sector: 'EdTech',
      businessModel: 'Freemium',
      targetMarket: '',
      budgetLakh: '',
      description: ''
    }

    const minimalMarket = {
      sectorName: 'EdTech',
      tam: 45000,
      sam: 9000,
      som: 450,
      tamGrowth: 18,
      samGrowth: 15,
      trend: [{ year: 2020, som: 50 }, { year: 2026, som: 450 }],
      competitors: [{ name: 'BYJU’S', share: 22 }],
      topShare: 22
    }

    const minimalRisk = {
      overallScore: 40,
      overallLevel: 'MEDIUM',
      criticalFlags: 0,
      marketFit: 70,
      categories: [
        { key: 'market', label: 'Market Risk', level: 'LOW', score: 30, message: 'Stable.' },
        { key: 'competitive', label: 'Competitive Risk', level: 'LOW', score: 35, message: 'Low.' },
        { key: 'financial', label: 'Financial Risk', level: 'MEDIUM', score: 45, message: 'Moderate.' },
        { key: 'technical', label: 'Technical Risk', level: 'LOW', score: 30, message: 'Low.' },
        { key: 'regulatory', label: 'Regulatory Risk', level: 'LOW', score: 25, message: 'Low.' }
      ]
    }

    const minimalReadiness = {
      overall: 70,
      breakdown: [
        { label: 'Market Validation', value: 70 },
        { label: 'Competitive Position', value: 70 },
        { label: 'Financial Model', value: 65 },
        { label: 'Technical Readiness', value: 75 }
      ]
    }

    const result = await runStrategicPipeline({
      submission: minimalSubmission,
      market: minimalMarket,
      risk: minimalRisk,
      readiness: minimalReadiness,
      recommendations: []
    })

    assert.ok(result.report.verdict, 'Successfully computes verdict for minimal input')
    assert.ok(result.report.roadmap.now.length > 0, 'Provides fallback roadmap now item')
    assert.ok(result.report.roadmap.next.length > 0, 'Provides fallback roadmap next item')
    assert.ok(result.report.roadmap.later.length > 0, 'Provides fallback roadmap later item')
    assert.equal(result.steps.length, 7, 'All 7 steps finish without error')
  })
})
