// For every readiness dimension below a healthy threshold, produce a
// concrete improvement action. Impact is expressed as a qualitative,
// clearly-labeled estimate derived from how far the score sits from the
// healthy threshold — never a random number.

const HEALTHY_THRESHOLD = 70

const ACTION = {
  'Market Validation': 'Run structured customer discovery (15–20 interviews) and one paid pilot to replace assumption with evidence.',
  'Competitive Position': 'Sharpen positioning around one underserved workflow and document it in outbound and onboarding materials.',
  'Financial Model': 'Rebuild the budget around milestone-based tranches tied to validated demand, not a fixed calendar.',
  'Technical Readiness': 'Complete MVP validation for the core workflow and automate the highest-friction manual step.'
}

const HORIZON = {
  'Market Validation': '0–30 days',
  'Competitive Position': '30–60 days',
  'Financial Model': '0–30 days',
  'Technical Readiness': '30–60 days'
}

export function buildImprovements(readiness) {
  return readiness.breakdown
    .filter((b) => b.value < HEALTHY_THRESHOLD)
    .sort((a, b) => a.value - b.value)
    .map((b) => {
      const gap = HEALTHY_THRESHOLD - b.value
      // Deterministic estimate: close roughly a third of the gap to the
      // healthy threshold within the recommended horizon — clearly framed
      // as an estimate, not a measured result.
      const projected = Math.round(gap / 3)
      return {
        area: b.label,
        current: `${b.value}%`,
        improvement: ACTION[b.label] || 'Close the gap with a focused 30-day workstream.',
        expectedImpact: `Est. +${projected} readiness points`,
        priority: b.value < 45 ? 'HIGH' : 'MEDIUM',
        horizon: HORIZON[b.label] || '30–60 days'
      }
    })
}
