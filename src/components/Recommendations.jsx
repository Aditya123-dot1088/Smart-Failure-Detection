import { useEffect, useRef, useState } from 'react'
import { Card } from './ui.jsx'
import { generateStrategicAnalysis } from '../utils/api.js'

const icons = {
  'Re-anchor SOM assumptions': '◐',
  'Differentiate from the category leader': '◆',
  'Lock in early SAM capture': '↗',
  'Simplify regional integrations': '▣',
  'Stage the budget against milestones': '⊞',
  'Front-load compliance scoping': '⛊',
}

const priorityStyles = {
  CRITICAL: 'text-danger bg-danger/10 border border-danger/20',
  HIGH: 'text-amber bg-amber/10 border border-amber/20',
  MODERATE: 'text-brass bg-brass/10 border border-brass/20',
}

const priorityAccent = {
  CRITICAL: 'border-l-danger',
  HIGH: 'border-l-amber',
  MODERATE: 'border-l-brass',
}

const priorityTimeHorizon = {
  CRITICAL: 'Immediate',
  HIGH: '2–3 weeks',
  MODERATE: '30–60 days',
}

const AGENT_META = {
  market: { icon: '◈' },
  risk: { icon: '▲' },
  swot: { icon: '▦' },
  feasibility: { icon: '◔' },
  strategy: { icon: '✦' },
  mitigation: { icon: '⛊' },
  recommendation: { icon: '➤' },
}

const AGENT_LABELS = [
  { id: 'market', name: 'Market Intelligence' },
  { id: 'risk', name: 'Risk Signal' },
  { id: 'swot', name: 'SWOT Synthesis' },
  { id: 'feasibility', name: 'Feasibility' },
  { id: 'strategy', name: 'Strategy Reasoning' },
  { id: 'mitigation', name: 'Mitigation Planning' },
  { id: 'recommendation', name: 'Recommendation Synthesis' },
]

const verdictStyles = {
  LOW: 'text-accent bg-accent/10 border-accent/25',
  MEDIUM: 'text-amber bg-amber/10 border-amber/25',
  HIGH: 'text-danger bg-danger/10 border-danger/25',
}

const riskLevelStyles = {
  HIGH: 'text-danger bg-danger/10 border-danger/25',
  MEDIUM: 'text-amber bg-amber/10 border-amber/25',
  LOW: 'text-accent bg-accent/10 border-accent/25',
}

export default function Recommendations({
  recommendations = [],
  submission,
  market,
  risk = { overallScore: 0, categories: [] },
  readiness = { overall: 0 },
  projectId,
  onAnalysisReady,
}) {
  const safeRecommendations = Array.isArray(recommendations)
    ? recommendations
    : []

  const critical = safeRecommendations.filter(
    (r) => r.priority === 'CRITICAL',
  ).length

  const high = safeRecommendations.filter(
    (r) => r.priority === 'HIGH',
  ).length

  return (
    <div className="h-full overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 fade-up">
      <div className="max-w-7xl mx-auto flex flex-col gap-7 pb-10">
        <div>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-brass mb-1.5 flex items-center gap-2">
                <span className="w-4 h-px bg-brass/60" />
                Milestone 3 · Recommended Actions
              </p>

              <h1 className="font-display text-[30px] leading-tight font-semibold text-fg-hi tracking-tight">
                Recommendations
              </h1>

              <p className="text-[13px] text-fg-mid mt-2 max-w-2xl leading-relaxed">
                Turn risk signals into focused mitigations, investment priorities,
                and an executable improvement plan.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-line bg-raised/70 px-3.5 py-2.5">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-fg-mid">
                {safeRecommendations.length} actions identified
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {safeRecommendations.map((rec, index) => (
              <Card
                key={rec.title || `recommendation-${index}`}
                hover
                className="p-5 relative overflow-hidden group"
              >
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <span
                  className={`absolute top-4 right-4 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full tracking-wide ${
                    priorityStyles[rec.priority] || priorityStyles.MODERATE
                  }`}
                >
                  {rec.priority || 'MODERATE'}
                </span>

                <div className="w-9 h-9 rounded-xl bg-brass/10 border border-brass/20 text-brass flex items-center justify-center text-base mb-3">
                  {icons[rec.title] || '•'}
                </div>

                <h3 className="font-display font-semibold text-[15px] text-fg-hi mb-2 pr-[72px] leading-snug">
                  {rec.title}
                </h3>

                <p className="text-[12.5px] text-fg-mid leading-relaxed mb-4">
                  {rec.body}
                </p>

                <div className="flex items-center gap-4 text-[10px] font-mono text-fg-low pt-2.5 border-t border-line/60">
                  <span>
                    Impact
                    <strong className="text-fg-mid font-semibold ml-1">
                      {rec.impact}
                    </strong>
                  </span>
                  <span>
                    Effort
                    <strong className="text-fg-mid font-semibold ml-1">
                      {rec.effort}
                    </strong>
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 rounded-xl2 border border-brass/20 bg-gradient-to-r from-brass/10 via-brass/[0.04] to-transparent p-5">
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-brass mb-1.5">
              Summary
            </p>
            <p className="text-[12.5px] text-fg-mid leading-relaxed">
              {safeRecommendations.length} action
              {safeRecommendations.length === 1 ? '' : 's'} identified —{' '}
              <strong className="text-fg-hi font-semibold">{critical}</strong>{' '}
              critical and{' '}
              <strong className="text-fg-hi font-semibold">{high}</strong> high
              priority. Address critical items before committing further budget
              or launch timeline.
            </p>
          </div>
        </div>

        <StrategicIntelligence
          submission={submission}
          market={market}
          risk={risk}
          readiness={readiness}
          recommendations={safeRecommendations}
          projectId={projectId}
          onAnalysisReady={onAnalysisReady}
        />
      </div>
    </div>
  )
}

function StrategicIntelligence({
  submission,
  market,
  risk,
  readiness,
  recommendations,
  projectId,
  onAnalysisReady,
}) {
  const [status, setStatus] = useState('idle')
  const [analysis, setAnalysis] = useState(null)
  const [visibleCount, setVisibleCount] = useState(0)
  const [error, setError] = useState(null)
  const [openWhy, setOpenWhy] = useState(null)

  const prioritiesRef = useRef(null)
  const roadmapRef = useRef(null)

  async function handleGenerate() {
    setStatus('loading')
    setError(null)
    setVisibleCount(0)

    try {
      const data = await generateStrategicAnalysis({
        projectId,
        submission,
        market,
        risk,
        readiness,
        recommendations,
      })

      if (!data) {
        throw new Error('The analysis service returned an empty response.')
      }

      const normalized = {
        ...data,
        steps: Array.isArray(data.steps) ? data.steps : [],
        report: data.report || null,
      }

      setAnalysis(normalized)
      setStatus('revealing')
    } catch (err) {
      setStatus('error')
      setError(err?.message || 'Unknown error while generating analysis.')
    }
  }

  useEffect(() => {
    if (status !== 'revealing' || !analysis) return

    const steps = Array.isArray(analysis.steps) ? analysis.steps : []

    if (visibleCount >= steps.length) {
      setStatus('done')
      return
    }

    const t = setTimeout(
      () => setVisibleCount((c) => Math.min(c + 1, steps.length)),
      320,
    )

    return () => clearTimeout(t)
  }, [status, visibleCount, analysis])

  useEffect(() => {
    if (status === 'done' && analysis) {
      onAnalysisReady?.(analysis)
    }
  }, [status, analysis, onAnalysisReady])

  const report = analysis?.report
  const showReport = status === 'done' && report

  function scrollToPlan() {
    const target = prioritiesRef.current || roadmapRef.current
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-brass mb-1.5 flex items-center gap-2">
            <span className="w-4 h-px bg-brass/60" />
            Milestone 3 · Strategic Intelligence
          </p>

          <h2 className="font-display text-[26px] leading-tight font-semibold text-fg-hi tracking-tight">
            Strategic Intelligence
          </h2>

          <p className="text-[13px] text-fg-mid mt-2">
            A transparent decision layer built from market, risk, readiness,
            and recommendation signals.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={status === 'loading' || status === 'revealing'}
          className="font-mono text-[11px] tracking-[0.08em] uppercase px-5 py-3 rounded-lg bg-brass text-canvas font-semibold shadow-brass hover:bg-brass-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {status === 'idle' && 'Generate Strategic Analysis'}
          {(status === 'loading' || status === 'revealing') &&
            'Running agents…'}
          {(status === 'done' || status === 'error') &&
            'Regenerate Analysis'}
        </button>
      </div>

      {status === 'idle' && (
        <Card className="p-6 sm:p-7 text-center border-brass/20 bg-gradient-to-br from-brass/[0.07] via-surface to-surface">
          <div className="mx-auto mb-4 w-11 h-11 rounded-2xl bg-brass/10 border border-brass/20 text-brass flex items-center justify-center text-lg">
            ✦
          </div>

          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-brass mb-2">
            Analysis ready to run
          </p>

          <p className="text-[13px] text-fg-mid leading-relaxed max-w-2xl mx-auto">
            A LangGraph-compatible, seven-agent workflow synthesizes market
            intelligence, risk flags, SWOT context, feasibility, strategy,
            mitigation, and final recommendations into one decision-ready
            report.
          </p>
        </Card>
      )}

      {status === 'error' && (
        <Card className="p-5 border-danger/30">
          <p className="text-[12.5px] text-danger">
            Couldn&apos;t generate the analysis: {error}
          </p>
        </Card>
      )}

      {(status === 'loading' || status === 'revealing' || status === 'done') &&
        analysis && (
          <WorkflowDiagram
            steps={analysis.steps}
            visibleCount={
              status === 'done'
                ? analysis.steps.length
                : visibleCount
            }
          />
        )}

      {status === 'loading' && !analysis && (
        <WorkflowDiagram
          steps={AGENT_LABELS}
          visibleCount={0}
          pending
        />
      )}

      {showReport && (
        <div className="mt-5 flex flex-col gap-4">
          <EngineStatus report={report} ai={analysis.ai} />
          <VerdictCard
            report={report}
            risk={risk}
            readiness={readiness}
          />
          <SwotGrid swot={report.swot} />

          <div ref={prioritiesRef}>
            <TopPriorities
              items={report.topPriorities}
              risk={risk}
              readiness={readiness}
              openWhy={openWhy}
              setOpenWhy={setOpenWhy}
            />
          </div>

          <RiskMitigationTable items={report.riskMitigation} />

          <div ref={roadmapRef}>
            <RoadmapAndQuickWins
              roadmap={report.roadmap}
              quickWins={report.quickWins}
            />
          </div>

          <NextBestAction
            report={report}
            onStart={scrollToPlan}
          />
        </div>
      )}
    </div>
  )
}

function WorkflowDiagram({ steps = [], visibleCount = 0, pending = false }) {
  const safeSteps = Array.isArray(steps) ? steps : []
  const safeVisibleCount = Math.min(
    Math.max(Number(visibleCount) || 0, 0),
    safeSteps.length,
  )

  return (
    <Card className="p-5 sm:p-6 overflow-x-auto border-brass/15">
      <div className="flex items-center justify-between gap-3 mb-5 min-w-[640px] md:min-w-0">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-brass mb-1">
            Agent orchestration
          </p>
          <p className="text-[12px] text-fg-mid">
            LangGraph-compatible strategic reasoning workflow
          </p>
        </div>

        <span className="font-mono text-[10px] text-fg-low tabular">
          {safeVisibleCount}/{safeSteps.length} agents complete
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-stretch gap-0 min-w-[640px] md:min-w-0">
        {safeSteps.map((step, i) => {
          const done = !pending && i < safeVisibleCount
          const active = !pending && i === safeVisibleCount
          const meta = AGENT_META[step.id] || { icon: '•' }
          const isLast = i === safeSteps.length - 1

          return (
            <div key={step.id || step.name || i} className="flex items-stretch flex-1">
              <div
                className={`flex-1 md:min-w-0 rounded-xl border px-3 py-3 transition-all duration-300 ${
                  done
                    ? 'border-accent/30 bg-accent/10'
                    : active
                      ? 'border-brass/40 bg-brass/10 soft-pulse'
                      : 'border-line bg-raised/40 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                      done
                        ? 'bg-accent text-canvas'
                        : active
                          ? 'bg-brass text-canvas animate-pulse'
                          : 'border border-line text-fg-low'
                    }`}
                  >
                    {done ? '✓' : meta.icon}
                  </span>

                  <span className="text-[10.5px] font-semibold text-fg-hi leading-tight">
                    {step.name}
                  </span>
                </div>

                <p
                  className={`text-[10px] leading-relaxed pl-7 min-h-[28px] ${
                    done ? 'text-fg-low' : 'text-fg-low/50 italic'
                  }`}
                >
                  {done && step.detail
                    ? step.detail
                    : active
                      ? 'Processing…'
                      : 'Waiting'}
                </p>
              </div>

              {!isLast && (
                <>
                  <div className="hidden md:flex items-center justify-center px-1.5 shrink-0">
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
                      <path
                        d="M1 5H12M12 5L8 1M12 5L8 9"
                        stroke={done ? '#2BB3A3' : '#3A4155'}
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className="flex md:hidden items-center justify-center py-1 pl-2 shrink-0">
                    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden="true">
                      <path
                        d="M5 1V12M5 12L1 8M5 12L9 8"
                        stroke={done ? '#2BB3A3' : '#3A4155'}
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function EngineStatus({ report, ai }) {
  const [open, setOpen] = useState(false)
  const live = report?.reasoningSource !== 'platform intelligence'

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              live ? 'bg-accent animate-pulse' : 'bg-brass'
            }`}
          />

          <div>
            <p className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-fg-low">
              Strategic Engine
            </p>
            <p className="text-[12.5px] font-semibold text-fg-hi">
              {live
                ? 'Platform Intelligence + AI Reasoning'
                : 'Platform Intelligence Mode'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {live && (
            <span className="font-mono text-[10px] tracking-[0.06em] uppercase text-accent bg-accent/10 border border-accent/25 px-2.5 py-1 rounded-full">
              AI Provider · {ai?.provider || 'Configured AI'}
            </span>
          )}

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="font-mono text-[10px] tracking-[0.06em] uppercase text-brass hover:text-brass-light transition-colors"
          >
            {open ? '▾ Hide engine details' : '▸ Engine details'}
          </button>
        </div>
      </div>

      {open && (
        <p className="mt-3 pt-3 border-t border-line/60 text-[11.5px] text-fg-mid leading-relaxed">
          {live
            ? `Narrative reasoning for the executive verdict was generated live via ${
                ai?.provider || 'the configured AI provider'
              }${
                ai?.model ? ` (${ai.model})` : ''
              }. Every figure it references — TAM/SAM/SOM, risk scores, readiness — is computed deterministically by the platform first; the model narrates that data rather than inventing it.`
            : 'No external AI key is configured for this deployment, so all reasoning is produced by the deterministic platform intelligence engine using the computed market, risk, and readiness signals. Add a Gemini or OpenAI key in server/.env to enable live model-narrated reasoning.'}
        </p>
      )}
    </Card>
  )
}

function VerdictCard({ report, risk, readiness }) {
  const riskScore = Number(risk?.overallScore) || 0
  const readinessScore = Number(readiness?.overall) || 0
  const confidence = Math.max(
    0,
    Math.min(100, Math.round((readinessScore + (100 - riskScore)) / 2)),
  )

  const summary = (report?.reasoning || '').split('\n\n')[0]
  const verdictLevel = report?.verdictLevel || 'MEDIUM'

  return (
    <Card className="p-5 border-brass/20 bg-gradient-to-br from-brass/[0.07] to-transparent">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-fg-low mb-2">
            Executive Strategic Verdict
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full border text-[13px] font-mono font-semibold tracking-wide ${
                verdictStyles[verdictLevel] || verdictStyles.MEDIUM
              }`}
            >
              {report?.verdict || 'Assessment available'}
            </span>

            <span className="font-mono text-[11px] text-fg-low">
              Confidence{' '}
              <strong className="text-fg-hi tabular">
                {confidence}%
              </strong>
            </span>
          </div>
        </div>

        <div className="text-right max-w-xs">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-fg-low mb-1.5">
            Investor Signal
          </p>
          <p className="text-[12px] text-fg-mid leading-relaxed">
            {report?.investorSignal || 'No investor signal provided.'}
          </p>
        </div>
      </div>

      {summary && (
        <p className="pt-3 border-t border-line/60 text-[12.5px] text-fg-mid leading-relaxed">
          {summary}
        </p>
      )}
    </Card>
  )
}

function SwotGrid({ swot = {} }) {
  const cells = [
    { label: 'Strengths', items: swot.strengths, dot: 'bg-accent' },
    { label: 'Weaknesses', items: swot.weaknesses, dot: 'bg-danger' },
    { label: 'Opportunities', items: swot.opportunities, dot: 'bg-brass' },
    { label: 'Threats', items: swot.threats, dot: 'bg-amber' },
  ]

  return (
    <Card className="p-5">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-fg-low mb-4">
        SWOT Synthesis
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cells.map((cell) => {
          const items = Array.isArray(cell.items) ? cell.items : []

          return (
            <div key={cell.label}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-1.5 h-1.5 rounded-full ${cell.dot}`} />
                <span className="text-[11px] font-semibold text-fg-hi uppercase tracking-wide">
                  {cell.label}
                </span>
              </div>

              {items.length ? (
                <ul className="space-y-1.5">
                  {items.map((item, i) => (
                    <li
                      key={i}
                      className="text-[11.5px] text-fg-mid leading-relaxed pl-3 border-l border-line/60"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-fg-low italic">
                  None flagged.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function TopPriorities({
  items = [],
  risk = {},
  readiness = {},
  openWhy,
  setOpenWhy,
}) {
  const categories = Array.isArray(risk?.categories)
    ? risk.categories
    : []

  const signals = [...categories]
    .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
    .slice(0, 3)
    .map((c) => `${c.label}: ${c.score}/100`)

  signals.push(
    `Launch readiness: ${Number(readiness?.overall) || 0}/100`,
  )

  return (
    <Card className="p-5">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-fg-low mb-1">
        Top Strategic Priorities
      </p>

      <p className="text-[12px] text-fg-mid mb-4">
        The four actions with the highest expected decision impact.
      </p>

      <div className="space-y-3">
        {items.map((item, i) => {
          const isOpen = openWhy === item.title
          const timeHorizon =
            priorityTimeHorizon[item.priority] || '2–4 weeks'

          return (
            <div
              key={item.title || i}
              className={`rounded-lg border border-line border-l-2 ${
                priorityAccent[item.priority] || 'border-l-brass'
              } bg-raised/40 p-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="font-mono text-[13px] text-brass w-5 shrink-0 pt-0.5">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="min-w-0">
                    <h4 className="text-[13.5px] font-semibold text-fg-hi leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-[11.5px] text-fg-mid leading-relaxed mt-1">
                      {item.body}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full tracking-wide ${
                    priorityStyles[item.priority] || priorityStyles.MODERATE
                  }`}
                >
                  {item.priority || 'MODERATE'}
                </span>
              </div>

              <div className="flex items-center gap-5 mt-3 ml-8 text-[10px] font-mono text-fg-low flex-wrap">
                <span>
                  Impact{' '}
                  <strong className="text-fg-mid font-semibold ml-1">
                    {item.impact}
                  </strong>
                </span>

                <span>
                  Effort{' '}
                  <strong className="text-fg-mid font-semibold ml-1">
                    {item.effort}
                  </strong>
                </span>

                <span>
                  Time Horizon{' '}
                  <strong className="text-fg-mid font-semibold ml-1">
                    {timeHorizon}
                  </strong>
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpenWhy(isOpen ? null : item.title)
                }
                className="mt-2.5 ml-8 font-mono text-[10px] tracking-[0.06em] uppercase text-brass hover:text-brass-light transition-colors"
              >
                {isOpen
                  ? '▾ Hide why this matters'
                  : '▸ Why this matters'}
              </button>

              {isOpen && (
                <div className="mt-2.5 ml-8 pl-3 border-l border-brass/30 space-y-2">
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-fg-low mb-1">
                      Signals Used
                    </p>

                    <ul className="space-y-1">
                      {signals.map((s) => (
                        <li
                          key={s}
                          className="text-[11px] text-fg-mid tabular"
                        >
                          • {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-fg-low mb-1">
                      Reasoning
                    </p>
                    <p className="text-[11.5px] text-fg-mid leading-relaxed">
                      {item.why || 'No additional reasoning provided.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function RiskMitigationTable({ items = [] }) {
  const safeItems = Array.isArray(items) ? items : []

  if (!safeItems.length) {
    return (
      <Card className="p-5">
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-fg-low mb-2">
          Risk → Mitigation Plan
        </p>
        <p className="text-[12px] text-fg-mid">
          No risk category above LOW — no mitigation actions required right
          now.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-fg-low mb-4">
        Risk → Mitigation Plan
      </p>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[560px]">
          <thead>
            <tr className="text-[10px] font-mono uppercase tracking-wide text-fg-low border-b border-line">
              <th className="pb-2 pr-3 font-medium">Risk</th>
              <th className="pb-2 pr-3 font-medium">
                Mitigation Action
              </th>
              <th className="pb-2 pr-3 font-medium">Owner</th>
              <th className="pb-2 font-medium">Timeframe</th>
            </tr>
          </thead>

          <tbody>
            {safeItems.map((item, index) => (
              <tr
                key={item.risk || index}
                className="border-b border-line/50 align-top"
              >
                <td className="py-2.5 pr-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9.5px] font-mono font-semibold tracking-wide ${
                      riskLevelStyles[item.level] ||
                      riskLevelStyles.LOW
                    }`}
                  >
                    {item.risk}
                  </span>
                </td>

                <td className="py-2.5 pr-3 text-[11.5px] text-fg-mid leading-relaxed">
                  {item.action}
                </td>

                <td className="py-2.5 pr-3 text-[11px] text-fg-mid whitespace-nowrap">
                  {item.owner}
                </td>

                <td className="py-2.5 text-[11px] text-fg-mid whitespace-nowrap">
                  {item.timeframe}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2.5">
        {safeItems.map((item, index) => (
          <div
            key={item.risk || index}
            className="rounded-lg border border-line bg-raised/40 p-3.5"
          >
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9.5px] font-mono font-semibold tracking-wide ${
                riskLevelStyles[item.level] || riskLevelStyles.LOW
              }`}
            >
              {item.risk}
            </span>

            <p className="text-[12px] text-fg-mid leading-relaxed mt-2">
              {item.action}
            </p>

            <div className="flex items-center gap-4 mt-2 font-mono text-[10px] text-fg-low flex-wrap">
              <span>
                Owner{' '}
                <strong className="text-fg-mid ml-1">
                  {item.owner}
                </strong>
              </span>

              <span>
                Timeframe{' '}
                <strong className="text-fg-mid ml-1">
                  {item.timeframe}
                </strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function RoadmapAndQuickWins({ roadmap = {}, quickWins = [] }) {
  const columns = [
    {
      key: 'now',
      label: 'Now',
      hint: '0–14 days',
      dot: 'bg-danger',
      bar: 'bg-danger',
    },
    {
      key: 'next',
      label: 'Next',
      hint: '15–30 days',
      dot: 'bg-amber',
      bar: 'bg-amber',
    },
    {
      key: 'later',
      label: 'Later',
      hint: '31–90 days',
      dot: 'bg-accent',
      bar: 'bg-accent',
    },
  ]

  const safeQuickWins = Array.isArray(quickWins)
    ? quickWins
    : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="p-5 lg:col-span-2">
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-fg-low mb-4">
          Improvement Roadmap
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {columns.map((col) => {
            const items = Array.isArray(roadmap?.[col.key])
              ? roadmap[col.key]
              : []

            return (
              <div key={col.key} className="relative">
                <div
                  className={`h-1 rounded-full ${col.bar} opacity-70 mb-2.5`}
                />

                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${col.dot}`}
                  />
                  <span className="text-[11px] font-semibold text-fg-hi">
                    {col.label}
                  </span>
                  <span className="text-[9.5px] font-mono text-fg-low">
                    · {col.hint}
                  </span>
                </div>

                <ul className="space-y-1.5">
                  {items.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-[11px] text-fg-mid leading-relaxed pl-3 border-l border-line/60"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="p-5">
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-fg-low mb-1">
          Quick Wins
        </p>

        <p className="text-[11px] text-fg-mid mb-3.5">
          High-impact actions that can be executed immediately.
        </p>

        {safeQuickWins.length ? (
          <div className="space-y-2">
            {safeQuickWins.map((qw, index) => (
              <div
                key={qw.title || index}
                className="rounded-lg border border-line bg-raised/40 px-3 py-2.5 hover-card"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-brass text-sm shrink-0">
                    {icons[qw.title] || '•'}
                  </span>

                  <span className="text-[11.5px] text-fg-hi font-medium leading-snug flex-1">
                    {qw.title}
                  </span>

                  <span className="text-brass shrink-0 text-xs">
                    →
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1.5 ml-[26px] font-mono text-[9.5px] text-fg-low">
                  <span>Impact {qw.impact}</span>
                  <span>Effort {qw.effort}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11.5px] text-fg-mid">
            No low-effort items identified for this submission.
          </p>
        )}
      </Card>
    </div>
  )
}

function NextBestAction({ report, onStart }) {
  const top = report?.topPriorities?.[0]
  if (!top) return null

  return (
    <Card className="p-5 border-brass/25 bg-gradient-to-r from-brass/[0.08] via-transparent to-transparent">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-brass mb-2">
        Next Best Action
      </p>

      <h3 className="font-display text-[17px] font-semibold text-fg-hi leading-snug mb-3">
        {top.title}.
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-fg-low mb-1">
            Why Now
          </p>
          <p className="text-[12px] text-fg-mid leading-relaxed">
            {top.why}
          </p>
        </div>

        <div>
          <p className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-fg-low mb-1">
            Expected Outcome
          </p>
          <p className="text-[12px] text-fg-mid leading-relaxed">
            Reduces the highest-weighted risk in this analysis and strengthens
            the case for the next funding milestone.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="font-mono text-[11px] tracking-[0.08em] uppercase px-4 py-2.5 rounded-lg bg-brass text-canvas font-semibold shadow-brass hover:bg-brass-light transition-colors"
      >
        Start Validation Plan
      </button>
    </Card>
  )
}
