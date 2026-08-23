// The AI is never asked "what should this startup do" in the abstract — it's
// handed the platform's own computed market/risk/readiness numbers and the
// deterministic engine's draft, and asked to refine the reasoning and prose
// into the same structured schema. This keeps the AI grounded in real inputs
// instead of inventing external facts, and means the fallback and the AI path
// always produce a compatible shape.

export function buildStrategyPrompt({ submission, market, risk, readiness, recommendations, draft }) {
  return `You are a senior startup strategy analyst. Analyze the project intelligence below and return STRATEGIC RECOMMENDATIONS as a single JSON object — no prose outside the JSON, no markdown fences.

PROJECT
Name: ${submission.name}
Sector: ${market.sectorName}
Business model: ${submission.businessModel}
Target market: ${submission.targetMarket || 'Not specified'}
Budget: ₹${submission.budgetLakh || 'Not specified'} Lakh
Description: ${submission.description || 'Not provided'}

MARKET (computed by the platform)
TAM: ₹${Math.round(market.tam).toLocaleString('en-IN')} Cr (growing ${market.tamGrowth}%/yr)
SAM: ₹${Math.round(market.sam).toLocaleString('en-IN')} Cr (growing ${market.samGrowth}%/yr)
SOM: ₹${Math.round(market.som).toLocaleString('en-IN')} Cr
Top competitor share: ${market.topShare}%

RISK (computed by the platform, 0-100 scores)
${risk.categories.map((c) => `- ${c.label}: ${c.score}/100 (${c.level}) — ${c.message}`).join('\n')}
Overall: ${risk.overallScore}/100 (${risk.overallLevel})

READINESS (computed by the platform)
${readiness.breakdown.map((b) => `- ${b.label}: ${b.value}%`).join('\n')}
Overall readiness: ${readiness.overall}%

EXISTING RECOMMENDATIONS (Milestone 2 engine)
${recommendations.map((r) => `- [${r.priority}] ${r.title}: ${r.body}`).join('\n')}

Return ONLY a JSON object with exactly this shape (fill every field, keep arrays non-empty, base everything on the data above — do not invent external market facts):
{
  "strategicVerdict": "short verdict phrase, e.g. 'Proceed with Controlled Validation'",
  "confidence": 0-100 integer,
  "priority": "CRITICAL | HIGH | MEDIUM | LOW",
  "executiveStrategy": "2-3 sentence strategic interpretation",
  "keyInsights": ["3-5 short insight strings"],
  "topPriorities": [{"title": "", "priority": "HIGH", "impact": "High", "why": ""}],
  "mitigations": [{"risk": "", "severity": "HIGH", "whyItMatters": "", "rootCause": "", "mitigation": "", "owner": "", "priority": "HIGH", "expectedImpact": "", "horizon": "0-90 days"}],
  "improvements": [{"area": "", "current": "", "improvement": "", "expectedImpact": "", "priority": "HIGH", "horizon": "30-60 days"}],
  "quickWins": [{"title": "", "priority": "HIGH", "impact": "High", "effort": "Low", "horizon": "7-14 days"}],
  "criticalRisks": ["strings"],
  "nextSteps": ["3 short next-step strings"],
  "investorPerspective": "2-3 sentences",
  "marketStrategy": "2-3 sentences",
  "executionStrategy": "2-3 sentences",
  "reasoning": {"market": "", "risk": "", "feasibility": "", "conclusion": ""},
  "explainability": [{"title": "", "because": ["reason 1", "reason 2"], "therefore": ""}],
  "nextBestAction": {"label": "short CTA", "description": "one sentence"}
}

For reference, here is the platform's own deterministic draft — you may refine, reprioritize, or rewrite it, but stay grounded in the same numbers:
${JSON.stringify(draft)}`
}
