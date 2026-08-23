// Every field the frontend renders is guaranteed to exist after this runs —
// whether the data came from Gemini, OpenAI, or the deterministic fallback.
// This is the single seam between "whatever the AI/engine produced" and
// "what React is allowed to assume exists".

const VALID_PRIORITY = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])

export function normalizeStrategy(raw = {}) {
  const s = raw || {}

  return {
    strategicVerdict: str(s.strategicVerdict, 'Proceed with Controlled Validation'),
    confidence: clampNum(s.confidence, 0, 100, 65),
    priority: VALID_PRIORITY.has(s.priority) ? s.priority : 'HIGH',

    executiveStrategy: str(s.executiveStrategy, 'Strategic summary unavailable.'),

    keyInsights: arr(s.keyInsights),
    topPriorities: arr(s.topPriorities).map((p) => ({
      title: str(p?.title, 'Untitled priority'),
      priority: VALID_PRIORITY.has(p?.priority) ? p.priority : 'MEDIUM',
      impact: str(p?.impact, 'Medium'),
      why: str(p?.why, '')
    })),

    recommendations: arr(s.recommendations).map((r) => ({
      title: str(r?.title, 'Recommendation'),
      body: str(r?.body, ''),
      impact: str(r?.impact, 'Medium'),
      effort: str(r?.effort, 'Medium'),
      priority: VALID_PRIORITY.has(r?.priority) ? r.priority : 'MEDIUM',
      why: arr(r?.why)
    })),

    mitigations: arr(s.mitigations).map((m) => ({
      risk: str(m?.risk, 'Risk'),
      severity: VALID_PRIORITY.has(m?.severity) ? m.severity : 'MEDIUM',
      whyItMatters: str(m?.whyItMatters, ''),
      rootCause: str(m?.rootCause, ''),
      mitigation: str(m?.mitigation, ''),
      owner: str(m?.owner, 'Founding team'),
      priority: VALID_PRIORITY.has(m?.priority) ? m.priority : 'MEDIUM',
      expectedImpact: str(m?.expectedImpact, ''),
      horizon: str(m?.horizon, '0–90 days')
    })),

    improvements: arr(s.improvements).map((i) => ({
      area: str(i?.area, 'Area'),
      current: str(i?.current, ''),
      improvement: str(i?.improvement, ''),
      expectedImpact: str(i?.expectedImpact, ''),
      priority: VALID_PRIORITY.has(i?.priority) ? i.priority : 'MEDIUM',
      horizon: str(i?.horizon, 'now')
    })),

    quickWins: arr(s.quickWins).map((q) => ({
      title: str(q?.title, 'Quick win'),
      priority: VALID_PRIORITY.has(q?.priority) ? q.priority : 'MEDIUM',
      impact: str(q?.impact, 'Medium'),
      effort: str(q?.effort, 'Low'),
      horizon: str(q?.horizon, '7–14 days')
    })),

    criticalRisks: arr(s.criticalRisks),
    nextSteps: arr(s.nextSteps),

    investorPerspective: str(s.investorPerspective, ''),
    marketStrategy: str(s.marketStrategy, ''),
    executionStrategy: str(s.executionStrategy, ''),

    reasoning: {
      market: str(s?.reasoning?.market, ''),
      risk: str(s?.reasoning?.risk, ''),
      feasibility: str(s?.reasoning?.feasibility, ''),
      conclusion: str(s?.reasoning?.conclusion, '')
    },

    explainability: arr(s.explainability).map((e) => ({
      title: str(e?.title, ''),
      because: arr(e?.because),
      therefore: str(e?.therefore, '')
    })),

    nextBestAction: {
      label: str(s?.nextBestAction?.label, 'Start Validation Sprint'),
      description: str(s?.nextBestAction?.description, '')
    }
  }
}

function str(v, fallback = '') {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}
function arr(v) {
  return Array.isArray(v) ? v : []
}
function clampNum(v, min, max, fallback) {
  const n = Number(v)
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}
