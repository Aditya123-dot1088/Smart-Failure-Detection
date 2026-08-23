import { buildMitigations } from './mitigationEngine.js'
import { buildImprovements } from './improvementEngine.js'
import { buildTopPriorities, buildQuickWins, buildNextSteps, buildCriticalRisks } from './recommendationEngine.js'

/**
 * Produces a complete strategic result from the platform's own analysis
 * (market + risk + readiness + Milestone-2 recommendations) with no AI call.
 * Used as:
 *   1. The response when no AI provider is configured (or the call fails).
 *   2. The grounding context handed to the AI provider, so the model reasons
 *      over real computed numbers instead of hallucinating them.
 */
export function runDeterministicStrategy({ submission, market, risk, readiness, recommendations }) {
  const mitigations = buildMitigations(risk, submission)
  const improvements = buildImprovements(readiness)
  const topPriorities = buildTopPriorities(risk, readiness, recommendations)
  const quickWins = buildQuickWins(risk, readiness)
  const criticalRisks = buildCriticalRisks(risk)

  const verdict = pickVerdict(risk, readiness)
  const confidence = computeConfidence(risk, readiness)

  return {
    strategicVerdict: verdict,
    confidence,
    priority: risk.overallLevel === 'HIGH' ? 'CRITICAL' : risk.overallLevel === 'MEDIUM' ? 'HIGH' : 'MEDIUM',

    executiveStrategy: `${submission.name} shows a ${readiness.overall}% launch-readiness score against ${risk.overallLevel.toLowerCase()} overall risk in ${market.sectorName}. ` +
      `${criticalRisks.length ? `The critical exposure is ${criticalRisks.join(' and ')}. ` : ''}` +
      `The recommended path is to validate the highest-uncertainty assumptions before scaling spend, using the mitigation and quick-win plan below.`,

    keyInsights: [
      `Overall risk is ${risk.overallLevel} (${risk.overallScore}/100) across ${risk.categories.length} categories.`,
      `Launch readiness is ${readiness.overall}%, driven lowest by ${[...readiness.breakdown].sort((a, b) => a.value - b.value)[0].label}.`,
      `Market fit estimate is ${risk.marketFit}% based on TAM/SAM/SOM trajectory alignment.`,
      `${market.competitors[0]?.name || 'The category leader'} holds roughly ${market.topShare}% share — differentiation matters more than feature parity.`
    ],

    topPriorities,
    recommendations: recommendations.map((r) => ({ ...r, why: [r.body] })),
    mitigations,
    improvements,
    quickWins,
    criticalRisks,
    nextSteps: buildNextSteps(risk, readiness),

    investorPerspective: `From an investor lens, this is a ${verdict.toLowerCase()} case: ${readiness.overall}% readiness with ${risk.overallLevel.toLowerCase()} risk. ` +
      `The financial risk category is ${risk.categories.find((c) => c.key === 'financial').level.toLowerCase()}, which most directly shapes runway and the next raise timeline. ` +
      `A funded pilot that proves acquisition cost and retention would materially de-risk the next conversation.`,

    marketStrategy: `Target the underserved segment adjacent to ${market.competitors[0]?.name || 'the category leader'} rather than competing head-on. ` +
      `SOM of ₹${Math.round(market.som).toLocaleString('en-IN')} Cr is reachable with disciplined, milestone-gated capture rather than broad-spectrum spend.`,

    executionStrategy: `Sequence: (1) validate demand, (2) prove one acquisition channel, (3) tighten the weakest readiness dimension, (4) only then increase burn. ` +
      `This ordering protects the budget against the financial risk flagged above.`,

    reasoning: {
      market: `TAM is ₹${Math.round(market.tam).toLocaleString('en-IN')} Cr growing at ${market.tamGrowth}%, with SAM capturing ${(market.sam / market.tam * 100).toFixed(0)}% of that. ` +
        `${risk.categories.find((c) => c.key === 'market').message}`,
      risk: `Overall risk sits at ${risk.overallScore}/100 (${risk.overallLevel}), with ${risk.criticalFlags} categor${risk.criticalFlags === 1 ? 'y' : 'ies'} flagged HIGH.`,
      feasibility: `Readiness averages ${readiness.overall}% across market validation, competitive position, financial model, and technical readiness — ` +
        `${readiness.overall >= 70 ? 'a strong base to build on.' : readiness.overall >= 45 ? 'developing, with clear gaps to close before scaling.' : 'early-stage, so validation should precede any scaling decision.'}`,
      conclusion: `${verdict}. Confidence ${confidence}% based on the alignment between market opportunity, computed risk, and current readiness.`
    },

    explainability: topPriorities.map((p) => ({
      title: p.title,
      because: [p.why, `Overall risk is ${risk.overallLevel}`, `Readiness is ${readiness.overall}%`].filter(Boolean),
      therefore: 'A focused validation step is recommended before committing further budget or timeline.'
    })),

    nextBestAction: {
      label: 'Start Validation Sprint',
      description: 'Kick off the top quick win — customer interviews and one pilot — before the next budget or timeline decision.'
    }
  }
}

function pickVerdict(risk, readiness) {
  if (risk.overallLevel === 'HIGH' || readiness.overall < 45) return 'Proceed with Controlled Validation'
  if (risk.overallLevel === 'MEDIUM') return 'Proceed with Staged Investment'
  return 'Proceed to Scale'
}

function computeConfidence(risk, readiness) {
  // Deterministic blend: higher readiness and lower risk score raise confidence.
  const riskComponent = 100 - risk.overallScore
  const raw = riskComponent * 0.5 + readiness.overall * 0.5
  return Math.round(Math.min(92, Math.max(42, raw)))
}
