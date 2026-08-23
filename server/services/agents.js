import { generateText, getAIConfig } from './aiProvider.js'

// --- Milestone 3: LangGraph-style agent workflow -------------------------
// A small dependency-free state graph runner: each node reads the shared
// `state` object, does one focused job, writes its result back onto state,
// and appends a step record. This mirrors a LangGraph graph (named nodes,
// shared state, sequential edges) without requiring the LangGraph package
// itself, so the demo has zero extra install/runtime risk.

function levelRank(level) {
  return { HIGH: 3, MEDIUM: 2, LOW: 1 }[level] ?? 0
}

// Node 1 — Market Intelligence Agent
function marketAgent(state) {
  const { market } = state
  const output = {
    tam: market.tam,
    sam: market.sam,
    som: market.som,
    tamGrowth: market.tamGrowth,
    samGrowth: market.samGrowth,
    topShare: market.topShare,
    leader: market.competitors?.[0]?.name || 'the category leader'
  }
  state.market_signals = output
  state.steps.push({
    id: 'market',
    name: 'Market Intelligence Agent',
    detail: `Read TAM ₹${Math.round(market.tam).toLocaleString('en-IN')} Cr / SAM ₹${Math.round(market.sam).toLocaleString('en-IN')} Cr / SOM ₹${Math.round(market.som).toLocaleString('en-IN')} Cr — ${output.leader} holds ~${market.topShare}% share.`,
    status: 'done'
  })
  return state
}

// Node 2 — Risk Signal Agent
function riskAgent(state) {
  const { risk } = state
  state.risk_signals = risk.categories
  state.steps.push({
    id: 'risk',
    name: 'Risk Signal Agent',
    detail: `Aggregated ${risk.categories.length} risk categories — overall ${risk.overallScore}/100 (${risk.overallLevel}), ${risk.criticalFlags} flagged HIGH.`,
    status: 'done'
  })
  return state
}

// Node 3 — SWOT Synthesis Agent
function swotAgent(state) {
  const { market, risk, submission } = state
  const cat = (key) => risk.categories.find((c) => c.key === key)

  const strengths = []
  const weaknesses = []
  const opportunities = []
  const threats = []

  if (market.samGrowth >= market.tamGrowth) {
    opportunities.push(`SAM is growing at ${market.samGrowth}%/yr, keeping pace with or outrunning the broader TAM — the addressable slice is not shrinking relative to the category.`)
  } else {
    threats.push(`SAM growth (${market.samGrowth}%/yr) trails TAM growth (${market.tamGrowth}%/yr) — the addressable slice is thinning even as the category expands.`)
  }

  if (cat('technical').level === 'LOW') strengths.push('Technical risk is low for the chosen business model — implementation complexity is not the bottleneck here.')
  else weaknesses.push(`Technical risk is ${cat('technical').level.toLowerCase()} for a ${submission.businessModel} model — integration and build complexity need active management.`)

  if (cat('financial').level === 'LOW') strengths.push('Budget is well sized against the SAM capture needed — runway risk is limited.')
  else weaknesses.push(`Financial risk is ${cat('financial').level.toLowerCase()} — the current budget of ₹${submission.budgetLakh || '—'} Lakh is tight against the SAM capture required.`)

  if (market.topShare < 30) {
    opportunities.push(`No single competitor dominates (leader at ~${market.topShare}% share) — room exists for a focused challenger position.`)
  } else {
    threats.push(`${market.competitors?.[0]?.name || 'The category leader'} holds ~${market.topShare}% share — a head-to-head entry faces real distribution and trust headwinds.`)
  }

  if (cat('regulatory').level === 'LOW') strengths.push('No material sector-specific compliance blockers identified — go-to-market can move faster.')
  else threats.push(`${market.sectorName} carries active regulatory/compliance obligations that can slow down launch if not scoped early.`)

  if (!strengths.length) strengths.push('Market fit score is holding up despite category headwinds, which keeps the core thesis intact.')
  if (!opportunities.length) opportunities.push('Early SAM capture compounds — moving decisively now still secures a durable head start.')

  const swot = { strengths, weaknesses, opportunities, threats }
  state.swot = swot
  state.steps.push({
    id: 'swot',
    name: 'SWOT Synthesis Agent',
    detail: `Derived ${strengths.length} strength(s), ${weaknesses.length} weakness(es), ${opportunities.length} opportunity(ies), ${threats.length} threat(s) from market + risk signals.`,
    status: 'done'
  })
  return state
}

// Node 4 — Feasibility Agent
function feasibilityAgent(state) {
  const { readiness } = state
  const weakest = [...readiness.breakdown].sort((a, b) => a.value - b.value)[0]
  state.feasibility = { overall: readiness.overall, weakest }
  state.steps.push({
    id: 'feasibility',
    name: 'Feasibility Agent',
    detail: `Launch readiness at ${readiness.overall}/100 — weakest dimension is ${weakest.label} (${weakest.value}/100).`,
    status: 'done'
  })
  return state
}

// Node 5 — Strategy Reasoning Agent (AI-backed, with deterministic fallback)
async function strategyAgent(state) {
  const { submission, market, risk, readiness, swot } = state

  // Verdict and investor signal are computed deterministically so the
  // headline judgement is always explainable and stable — the AI (when
  // configured) is used to *narrate* the reasoning, not to decide it.
  let verdict = 'PROCEED WITH CAUTION'
  let verdictLevel = 'MEDIUM'
  if (readiness.overall >= 70 && risk.overallScore <= 45) {
    verdict = 'STRONG GO'
    verdictLevel = 'LOW'
  } else if (risk.overallScore >= 65 || readiness.overall < 45) {
    verdict = 'PIVOT RECOMMENDED'
    verdictLevel = 'HIGH'
  }

  const investorSignal =
    verdictLevel === 'LOW'
      ? 'Fundable as positioned — diligence should focus on execution speed, not thesis risk.'
      : verdictLevel === 'MEDIUM'
      ? 'Fundable with conditions — investors will want the top risk items mitigated before a priced round.'
      : 'Not yet fundable as positioned — revisit the market entry angle or business model before raising.'

  const { configured } = getAIConfig()
  let reasoning
  let reasoningSource = 'platform intelligence'
  let aiError = null

  const prompt = buildStrategyPrompt({ submission, market, risk, readiness, swot, verdict })

  if (configured) {
    try {
      const { text, provider } = await generateText(prompt, {
        system:
          'You are a startup strategy analyst writing for an Indian early-stage founder and their mentor. ' +
          'Write exactly two short paragraphs (no headings, no markdown, no bullet points), grounded only in the ' +
          'numbers given. Be direct and specific, not generic.'
      })
      reasoning = text
      reasoningSource = provider
    } catch (err) {
      aiError = err.message
      reasoning = buildFallbackReasoning({ submission, market, risk, readiness, verdict })
    }
  } else {
    reasoning = buildFallbackReasoning({ submission, market, risk, readiness, verdict })
  }

  state.strategy = { verdict, verdictLevel, investorSignal, reasoning, reasoningSource, aiError }
  state.steps.push({
    id: 'strategy',
    name: 'Strategy Reasoning Agent',
    detail:
      reasoningSource === 'platform intelligence'
        ? 'No AI key configured — generated reasoning from the deterministic platform intelligence engine.'
        : `Generated live reasoning via ${reasoningSource}${aiError ? ' (fell back after an error)' : ''}.`,
    status: 'done'
  })
  return state
}

function buildStrategyPrompt({ submission, market, risk, readiness, swot, verdict }) {
  return `Project: ${submission.name} (${market.sectorName}, ${submission.businessModel} model, target market: ${submission.targetMarket || 'unspecified'}).
Budget: ₹${submission.budgetLakh || '—'} Lakh.
Market: TAM ₹${Math.round(market.tam)} Cr, SAM ₹${Math.round(market.sam)} Cr, SOM ₹${Math.round(market.som)} Cr. TAM growth ${market.tamGrowth}%/yr, SAM growth ${market.samGrowth}%/yr. Category leader share ~${market.topShare}%.
Risk (0-100, higher = riskier): ${risk.categories.map((c) => `${c.label} ${c.score} (${c.level})`).join('; ')}. Overall ${risk.overallScore} (${risk.overallLevel}).
Readiness (0-100): overall ${readiness.overall}. ${readiness.breakdown.map((b) => `${b.label} ${b.value}`).join('; ')}.
Key strengths: ${swot.strengths.join(' ')}
Key threats: ${swot.threats.join(' ')}
Computed verdict: ${verdict}.
Write the two-paragraph strategic reasoning behind this verdict for the founder.`
}

function buildFallbackReasoning({ submission, market, risk, readiness, verdict }) {
  const worst = [...risk.categories].sort((a, b) => b.score - a.score)[0]
  const best = [...readiness.breakdown].sort((a, b) => b.value - a.value)[0]

  const p1 =
    `${submission.name} sits at an overall risk score of ${risk.overallScore}/100 (${risk.overallLevel}) against a launch readiness of ${readiness.overall}/100, ` +
    `which is why the platform's computed verdict is "${verdict}". The single largest exposure is ${worst.label.toLowerCase()} at ${worst.score}/100 — ` +
    `${worst.message.charAt(0).toLowerCase()}${worst.message.slice(1)}`

  const p2 =
    `On the upside, ${best.label.toLowerCase()} is the strongest dimension at ${best.value}/100, and the SOM of ₹${Math.round(market.som).toLocaleString('en-IN')} Cr ` +
    `against a ₹${submission.budgetLakh || '—'} Lakh budget gives a concrete number to plan the next funding milestone around. Treat the mitigation items below as the ` +
    `gating checklist before increasing spend or committing to a fixed launch date.`

  return `${p1}\n\n${p2}`
}

// Node 6 — Mitigation Planning Agent
const MITIGATION_LIBRARY = {
  market: {
    HIGH: { action: 'Re-validate the acquisition funnel with 10–15 real customer conversations before spending further on the current SOM assumptions.', owner: 'Founder / Growth', timeframe: '1–2 weeks' },
    MEDIUM: { action: 'Instrument SOM capture tracking against the trajectory model so any dip is caught within a month, not a quarter.', owner: 'Founder', timeframe: '2–4 weeks' }
  },
  competitive: {
    HIGH: { action: 'Pick one underserved workflow the category leader ignores and make it the entire v1 pitch — do not compete on feature parity.', owner: 'Product', timeframe: '2–3 weeks' },
    MEDIUM: { action: 'Run a lightweight competitive teardown to confirm the differentiation angle still holds before the next release.', owner: 'Product', timeframe: '1 month' }
  },
  financial: {
    HIGH: { action: 'Re-cut the budget into milestone-gated tranches tied to validated SAM capture, not a fixed calendar.', owner: 'Founder / Finance', timeframe: 'Immediate' },
    MEDIUM: { action: 'Build a downside-case runway model assuming 60% of projected SAM capture to stress-test the budget.', owner: 'Finance', timeframe: '2 weeks' }
  },
  technical: {
    HIGH: { action: 'Time-box a technical spike on the riskiest integration before committing the full engineering roadmap.', owner: 'Engineering', timeframe: '1–2 weeks' },
    MEDIUM: { action: 'Document the regional integration surface early so sales cycles are not blocked by unknown tech debt.', owner: 'Engineering', timeframe: '3 weeks' }
  },
  regulatory: {
    HIGH: { action: 'Engage counsel to scope licensing/data-handling requirements before pilot launch, not after.', owner: 'Founder / Legal', timeframe: 'Immediate' },
    MEDIUM: { action: 'Maintain a compliance checklist reviewed at each funding milestone so obligations do not surface late.', owner: 'Legal / Ops', timeframe: 'Ongoing' }
  }
}

function mitigationAgent(state) {
  const { risk } = state
  const riskMitigation = risk.categories
    .filter((c) => c.level !== 'LOW')
    .sort((a, b) => levelRank(b.level) - levelRank(a.level))
    .map((c) => {
      const entry = MITIGATION_LIBRARY[c.key]?.[c.level] || {
        action: 'Review this risk category with the team before the next milestone.',
        owner: 'Founder',
        timeframe: '2–4 weeks'
      }
      return { risk: c.label, level: c.level, score: c.score, ...entry }
    })

  state.risk_mitigation = riskMitigation
  state.steps.push({
    id: 'mitigation',
    name: 'Mitigation Planning Agent',
    detail: `Mapped ${riskMitigation.length} risk-to-mitigation action${riskMitigation.length === 1 ? '' : 's'} for every category above LOW.`,
    status: 'done'
  })
  return state
}

// Node 7 — Recommendation Synthesis Agent
function recommendationAgent(state) {
  const { recommendations = [], risk_mitigation, swot } = state

  const priorityRank = { CRITICAL: 3, HIGH: 2, MODERATE: 1 }
  const ranked = [...recommendations].sort((a, b) => (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0))

  const usedThreats = new Set()
  const topPriorities = ranked.slice(0, 4).map((r) => ({
    ...r,
    why: whyForRecommendation(r, risk_mitigation, swot, usedThreats)
  }))

  const quickWins = recommendations.filter((r) => r.effort === 'Low')

  const now = ranked.filter((r) => r.priority === 'CRITICAL').map((r) => r.title)
  const next = ranked.filter((r) => r.priority === 'HIGH').map((r) => r.title)
  const later = ranked.filter((r) => r.priority === 'MODERATE').map((r) => r.title)

  const roadmap = {
    now: now.length ? now : ['No critical blockers — proceed to the next-30-days items.'],
    next: next.length ? next : ['No high-priority items pending.'],
    later: later.length ? later : ['No deferred items — revisit after the next milestone.']
  }

  state.report = {
    verdict: state.strategy.verdict,
    verdictLevel: state.strategy.verdictLevel,
    investorSignal: state.strategy.investorSignal,
    reasoning: state.strategy.reasoning,
    reasoningSource: state.strategy.reasoningSource,
    swot,
    riskMitigation: risk_mitigation,
    roadmap,
    quickWins,
    topPriorities
  }

  state.steps.push({
    id: 'recommendation',
    name: 'Recommendation Synthesis Agent',
    detail: `Ranked ${topPriorities.length} top priorities, isolated ${quickWins.length} quick win(s), and staged a Now/Next/Later roadmap.`,
    status: 'done'
  })
  return state
}

// Keyword hints per recommendation title -> which risk category it targets.
// Matched against riskMitigation entries so each priority gets a distinct,
// accurate "why" instead of every card citing the same generic threat.
const TITLE_RISK_HINTS = {
  'Re-anchor SOM assumptions': 'market',
  'Differentiate from the category leader': 'competitive',
  'Lock in early SAM capture': 'market',
  'Simplify regional integrations': 'technical',
  'Stage the budget against milestones': 'financial',
  'Front-load compliance scoping': 'regulatory'
}

function whyForRecommendation(rec, riskMitigation, swot, usedThreats) {
  const hintKey = TITLE_RISK_HINTS[rec.title]
  const linked = riskMitigation.find((m) => m.risk.toLowerCase().startsWith(hintKey || '___'))
  if (linked) return `Directly addresses ${linked.risk} (${linked.level}) — ${linked.action}`

  const nextThreat = swot.threats.find((t) => !usedThreats.has(t))
  if (nextThreat) {
    usedThreats.add(nextThreat)
    return `Counters a threat the SWOT pass flagged: ${nextThreat}`
  }
  return `Surfaced as ${rec.priority.toLowerCase()} priority with ${rec.impact.toLowerCase()} impact and ${rec.effort.toLowerCase()} effort — favorable ratio to act on first.`
}

/**
 * Runs the full 7-node strategic reasoning graph in order, mutating a shared
 * state object edge-to-edge (LangGraph-style), and returns { steps, report, ai }.
 */
export async function runStrategicPipeline({ submission, market, risk, readiness, recommendations }) {
  const state = { submission, market, risk, readiness, recommendations, steps: [] }

  marketAgent(state)
  riskAgent(state)
  swotAgent(state)
  feasibilityAgent(state)
  await strategyAgent(state)
  mitigationAgent(state)
  recommendationAgent(state)

  return {
    steps: state.steps,
    report: state.report,
    ai: getAIConfig()
  }
}
