// Builds the "what should this startup do next" layer: top priorities,
// quick wins, and next steps — all derived from market + risk + readiness +
// the existing (Milestone 2) recommendation list, never invented in isolation.

export function buildTopPriorities(risk, readiness, recommendations) {
  const marketCat = risk.categories.find((c) => c.key === 'market')
  const financialCat = risk.categories.find((c) => c.key === 'financial')
  const weakestReadiness = [...readiness.breakdown].sort((a, b) => a.value - b.value)[0]

  const priorities = [
    {
      title: 'Validate customer demand',
      priority: marketCat.level === 'HIGH' ? 'CRITICAL' : 'HIGH',
      impact: 'High',
      why: marketCat.message
    },
    {
      title: financialCat.level !== 'LOW' ? 'Improve financial resilience' : 'Lock in early market capture',
      priority: financialCat.level === 'HIGH' ? 'CRITICAL' : 'HIGH',
      impact: 'High',
      why: financialCat.message
    },
    {
      title: `Strengthen ${weakestReadiness.label.toLowerCase()}`,
      priority: weakestReadiness.value < 45 ? 'HIGH' : 'MEDIUM',
      impact: weakestReadiness.value < 45 ? 'High' : 'Medium',
      why: `${weakestReadiness.label} is the weakest readiness dimension at ${weakestReadiness.value}%.`
    }
  ]

  // Fold in anything the Milestone-2 recommendation engine flagged CRITICAL
  // that isn't already represented, so the two systems never contradict.
  const existingTitles = new Set(priorities.map((p) => p.title))
  recommendations
    .filter((r) => r.priority === 'CRITICAL' && !existingTitles.has(r.title))
    .slice(0, 1)
    .forEach((r) => priorities.push({ title: r.title, priority: 'CRITICAL', impact: r.impact, why: r.body }))

  return priorities.slice(0, 3)
}

export function buildQuickWins(risk, readiness) {
  const wins = [
    { title: 'Interview 15–20 target customers', priority: 'HIGH', impact: 'High', effort: 'Low', horizon: '7–14 days' },
    { title: 'Run a focused pricing experiment', priority: 'MEDIUM', impact: 'Medium', effort: 'Low', horizon: '14 days' },
    { title: 'Sign one pilot or design-partner customer', priority: 'HIGH', impact: 'High', effort: 'Medium', horizon: '14–21 days' }
  ]

  const regulatoryCat = risk.categories.find((c) => c.key === 'regulatory')
  if (regulatoryCat.level !== 'LOW') {
    wins.push({ title: 'Scope compliance and licensing requirements', priority: 'HIGH', impact: 'Medium', effort: 'Low', horizon: '7–14 days' })
  }

  const weakestReadiness = [...readiness.breakdown].sort((a, b) => a.value - b.value)[0]
  if (weakestReadiness.value < 55) {
    wins.push({ title: `Draft a 30-day plan to lift ${weakestReadiness.label.toLowerCase()}`, priority: 'MEDIUM', impact: 'Medium', effort: 'Low', horizon: '7 days' })
  }

  return wins.slice(0, 5)
}

export function buildNextSteps(risk, readiness) {
  return [
    'Run the validation sprint before committing further budget or launch timeline.',
    'Review the risk → mitigation plan with an owner assigned to each critical item.',
    'Re-run this analysis after the next milestone to track readiness movement.'
  ]
}

export function buildCriticalRisks(risk) {
  return risk.categories.filter((c) => c.level === 'HIGH').map((c) => c.label)
}
