// For every risk category surfaced by the existing risk engine (utils/analysis.js
// on the client, mirrored here), produce a structured mitigation:
// risk -> severity -> why it matters -> root cause -> mitigation -> owner ->
// priority -> expected impact -> time horizon.
//
// Everything here is derived deterministically from `risk` + `submission` —
// nothing is invented. This is what the app falls back to when no AI key is
// configured, and it's also handed to the AI provider as grounding context.

const ROOT_CAUSE = {
  market: 'Acquisition funnel and SOM capture assumptions are not yet validated against real customer behavior.',
  competitive: 'The category leader already holds meaningful share, and differentiation has not yet been proven in-market.',
  financial: 'Budget is sized against a SAM capture rate that has not been demonstrated, so a small conversion miss compresses runway fast.',
  technical: 'Core workflow and integrations for this business model are not yet stress-tested with real users.',
  regulatory: 'Sector-specific compliance and licensing requirements have not yet been fully scoped.'
}

const OWNER = {
  market: 'Growth / Product',
  competitive: 'Product & Positioning',
  financial: 'Founders / Finance',
  technical: 'Engineering',
  regulatory: 'Legal / Compliance'
}

const IMPACT = {
  market: 'Improves demand certainty before further spend',
  competitive: 'Improves defensibility and win-rate',
  financial: 'Extends runway and reduces cash risk',
  technical: 'Reduces delivery and integration risk',
  regulatory: 'Removes launch-blocking compliance risk'
}

const HORIZON = {
  HIGH: '0–30 days',
  MEDIUM: '31–90 days',
  LOW: '90+ days'
}

export function buildMitigations(risk, submission) {
  return risk.categories
    .filter((c) => c.level !== 'LOW')
    .sort((a, b) => severityWeight(b.level) - severityWeight(a.level))
    .map((c) => ({
      risk: c.label,
      severity: c.level,
      whyItMatters: c.message,
      rootCause: ROOT_CAUSE[c.key] || 'Root cause not yet isolated — needs discovery.',
      mitigation: mitigationFor(c.key, c.level, submission),
      owner: OWNER[c.key] || 'Founding team',
      priority: c.level,
      expectedImpact: IMPACT[c.key] || 'Reduces overall risk exposure',
      horizon: HORIZON[c.level] || '0–90 days'
    }))
}

function mitigationFor(key, level, submission) {
  const budget = submission?.budgetLakh ? `₹${submission.budgetLakh} Lakh` : 'the current budget'
  switch (key) {
    case 'market':
      return 'Run a structured demand-validation sprint: 15–20 target-customer interviews plus one paid pilot, before committing further acquisition spend.'
    case 'competitive':
      return 'Pick one underserved workflow the category leader ignores and win it decisively, rather than competing feature-for-feature.'
    case 'financial':
      return `Stage ${budget} against validated milestones (pilot signed, CAC proven, retention confirmed) instead of a fixed calendar burn.`
    case 'technical':
      return 'Ship a thin, working MVP for the core workflow first and automate it, deferring secondary integrations until demand is confirmed.'
    case 'regulatory':
      return 'Front-load a compliance and licensing review before pilot launch so it never blocks a signed customer later.'
    default:
      return 'Define an owner and a 30-day discovery plan to isolate the driver before committing further resources.'
  }
}

function severityWeight(level) {
  return level === 'HIGH' ? 2 : level === 'MEDIUM' ? 1 : 0
}
