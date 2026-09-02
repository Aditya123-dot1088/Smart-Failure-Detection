import { useState } from 'react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

import { Card } from './ui.jsx'
import { inr } from '../utils/analysis.js'
// Lazy-loaded on demand: jspdf + html2canvas are heavy and only needed
// once someone actually clicks "Download PDF Report", so they're kept
// out of the main bundle to shrink the initial load.
const loadPdfReport = () => import('../utils/pdfReport.js')

export default function Dashboard({ market, readiness, risk, submission, recommendations, strategicAnalysis, onViewStrategy }) {
 const readinessScore = readiness?.overall ?? 0

const readinessLabel =
  readinessScore >= 70
    ? 'Strong'
    : readinessScore >= 45
    ? 'Developing'
    : 'Early Stage'

const growthLabel =
  (market?.tamGrowth ?? 0) >= (market?.samGrowth ?? 0) + 3
    ? 'High'
    : (market?.tamGrowth ?? 0) >= (market?.samGrowth ?? 0)
    ? 'Steady'
    : 'Cautious'

const competitionLabel =
  (market?.topShare ?? 0) >= 28
    ? 'Concentrated'
    : (market?.topShare ?? 0) >= 18
    ? 'Moderate'
    : 'Fragmented'

const recommendation =
  risk?.overallLevel === 'HIGH'
    ? 'Address Risks'
    : risk?.overallLevel === 'MEDIUM'
    ? 'Proceed with Caution'
    : 'Proceed'
  return (
    <div className="h-full overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 fade-up">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 pb-10">

        {/* Executive Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-brass mb-1.5 flex items-center gap-2">
              <span className="w-4 h-px bg-brass/60" />
              Executive Dashboard
            </p>
            <h1 className="font-display text-[30px] leading-tight font-semibold text-fg-hi tracking-tight">
              {submission?.name || 'Startup'} <span className="text-fg-low font-normal">· Intelligence Report</span>
            </h1>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
           <StatusBadge title="Sector" value={market?.sectorName || '—'} />
           <StatusBadge title="Risk" value={capitalize(risk?.overallLevel || '—')} />
            <StatusBadge title="Readiness" value={readinessLabel} />
            <StatusBadge title="Verdict" value={recommendation} />
          </div>
        </div>

        {/* Launch Score */}
        <div className="relative overflow-hidden rounded-xl2 border border-line bg-raised p-5 shrink-0 hover-card">
          <div
            className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-70"
            style={{ background: 'radial-gradient(circle, rgba(198,161,91,0.14) 0%, rgba(198,161,91,0) 70%)' }}
          />
          <div className="relative flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-brass mb-2.5">
                Serviceable Obtainable Market
              </p>
              <div className="font-display text-[44px] leading-[0.9] font-medium text-fg-hi tabular tracking-tight">
                {inr(market?.som ?? 0)}
              </div>
            </div>
            <div className="flex gap-8 border-l border-line/70 pl-8">
              <MiniLedger label="TAM" value={inr(market?.tam ?? 0)} dot="#E1596A" />
              <MiniLedger label="SAM" value={inr(market?.sam ?? 0)} dot="#E3A23C" />
              <MiniLedger label="Top Share" value={`${market?.topShare ?? 0}%`} dot="#C6A15B" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3">
          <Card className="glass hover-card p-5 flex flex-col overflow-hidden h-[340px]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className="font-display font-semibold text-[14px] text-fg-hi">SOM Capture Trajectory</h2>
              <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-fg-low">₹ Crore · 2020–2026</span>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={market.trend} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="somFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#DDBE84" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#8F7238" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1E2330" vertical={false} strokeDasharray="3 4" />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#5B6274' }} axisLine={{ stroke: '#242938' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#5B6274' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} width={44} />
                  <Tooltip
                    cursor={{ fill: 'rgba(198,161,91,0.06)' }}
                    formatter={(v) => [inr(v), 'SOM']}
                    contentStyle={{ borderRadius: 10, border: '1px solid #2A3040', background: '#171B24', color: '#EDEFF3', fontSize: 11, boxShadow: '0 12px 32px -8px rgba(0,0,0,0.5)' }}
                    labelStyle={{ color: '#9AA1B2', fontSize: 10, marginBottom: 2 }}
                  />
                  <Bar dataKey="som" name="SOM (₹ Cr)" fill="url(#somFill)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 shrink-0">
              <InsightCard title="Growth" value={growthLabel} />
              <InsightCard title="Competition" value={competitionLabel} />
             <InsightCard title="Market Fit" value={`${risk?.marketFit ?? 0}%`} />
            </div>
          </Card>

          <Card className="glass hover-card p-5 flex flex-col overflow-hidden h-[340px]">
            <h2 className="font-display font-semibold text-[14px] text-fg-hi mb-3 shrink-0">Launch Readiness</h2>
            <div className="shrink-0">
              <ReadinessGauge value={readinessScore} />
            </div>
            <div className="space-y-2.5 mt-3 overflow-y-auto flex-1 min-h-0">
              {(readiness?.breakdown || []).map((b) => (
                <div key={b.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-fg-mid">{b.label}</span>
                    <span className="font-mono text-[10px] text-fg-low tabular">{b.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-line/80 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-brass-light to-brass transition-all duration-500" style={{ width: `${b.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <RiskBreakdownChart risk={risk} />

        <StrategicOutlook
          risk={risk}
          readiness={readiness}
          strategicAnalysis={strategicAnalysis}
          onViewStrategy={onViewStrategy}
        />

        < ExecutiveReport
          submission={submission}
          market={market}
          risk={risk}
          readiness={readiness}
          recommendations={recommendations}
          strategicAnalysis={strategicAnalysis}
        />
      </div>
    </div>
  )
}

// --- Risk Category Comparison (Milestone 4: which areas threaten launch most) ---

const RISK_LEVEL_COLOR = {
  HIGH: '#E1596A',
  MEDIUM: '#E3A23C',
  LOW: '#2BB3A3'
}

function RiskBreakdownChart({ risk }) {
  const categories = risk?.categories || []
  if (!categories.length) return null

  const data = [...categories].sort((a, b) => b.score - a.score)
  const highestRisk = data[0]

  return (
    <Card className="glass hover-card p-5 flex flex-col overflow-hidden h-[300px]">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <div>
          <h2 className="font-display font-semibold text-[14px] text-fg-hi">Risk Category Comparison</h2>
          <p className="text-[11px] text-fg-low mt-0.5">Which areas create the greatest threat to launch?</p>
        </div>
        {highestRisk && (
          <span className="font-mono text-[9.5px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full border"
            style={{
              color: RISK_LEVEL_COLOR[highestRisk.level],
              borderColor: `${RISK_LEVEL_COLOR[highestRisk.level]}40`,
              background: `${RISK_LEVEL_COLOR[highestRisk.level]}14`
            }}
          >
            Top risk · {highestRisk.label}
          </span>
        )}
      </div>
      <div className="flex-1 min-h-0 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
            <CartesianGrid stroke="#1E2330" horizontal={false} strokeDasharray="3 4" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#5B6274' }} axisLine={{ stroke: '#242938' }} tickLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 10.5, fill: '#9AA1B2' }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              cursor={{ fill: 'rgba(198,161,91,0.06)' }}
              formatter={(value, _name, item) => [`${value}/100 · ${capitalize(item.payload.level)}`, 'Risk score']}
              contentStyle={{ borderRadius: 10, border: '1px solid #2A3040', background: '#171B24', color: '#EDEFF3', fontSize: 11, boxShadow: '0 12px 32px -8px rgba(0,0,0,0.5)' }}
              labelStyle={{ color: '#9AA1B2', fontSize: 10, marginBottom: 2 }}
            />
            <Bar dataKey="score" name="Risk score" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {data.map((entry) => (
                <Cell key={entry.key} fill={RISK_LEVEL_COLOR[entry.level] || '#C6A15B'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// --- Strategic Outlook (Milestone 3 summary surfaced on the Dashboard) ---

function StrategicOutlook({ risk, readiness, strategicAnalysis, onViewStrategy }) {
  const report = strategicAnalysis?.report

  if (!report) {
    return (
      <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-fg-low mb-1.5">Strategic Outlook</p>
          <p className="text-[12.5px] text-fg-mid max-w-lg leading-relaxed">
            Generate the strategic analysis on the Recommendations tab to unlock the executive verdict, top
            priority, and investor signal here.
          </p>
        </div>
        <button
          onClick={onViewStrategy}
          className="font-mono text-[11px] tracking-[0.08em] uppercase px-4 py-2.5 rounded-lg border border-brass/30 text-brass hover:bg-brass/10 transition-colors shrink-0"
        >
          Generate Strategic Analysis →
        </button>
      </Card>
    )
  }

  const successPrediction = Math.round((readiness.overall + (100 - risk.overallScore)) / 2)
  const investorLabel =
    report.verdictLevel === 'LOW' ? 'Highly Fundable' : report.verdictLevel === 'HIGH' ? 'Needs Improvement' : 'Monitor & Validate'
  const primaryRisk = [...risk.categories].sort((a, b) => b.score - a.score)[0]
  const topPriority = report.topPriorities?.[0]

  const verdictStyles = {
    LOW: 'text-accent',
    MEDIUM: 'text-amber',
    HIGH: 'text-danger'
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-fg-low mb-1">Strategic Outlook</p>
          <p className="text-[12px] text-fg-mid">Decision support generated from the project's intelligence signals.</p>
        </div>
        <button
          onClick={onViewStrategy}
          className="font-mono text-[10.5px] tracking-[0.06em] uppercase text-brass hover:text-brass-light transition-colors shrink-0"
        >
          View Strategic Analysis →
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
        <OutlookCard label="Strategic Verdict" value={report.verdict} valueClass={verdictStyles[report.verdictLevel]} />
        <OutlookCard label="Top Priority" value={topPriority?.title || '—'} />
        <OutlookCard label="Primary Risk" value={primaryRisk?.label || '—'} />
        <OutlookCard label="Next Best Action" value={topPriority?.title ? `Validate: ${topPriority.title}` : 'Proceed to plan'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-line bg-raised/40 p-4">
          <p className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-fg-low mb-2.5">Success Prediction</p>
          <div className="flex items-center gap-3">
            <span className="font-display text-[28px] font-semibold text-fg-hi tabular leading-none">{successPrediction}%</span>
            <div className="flex-1 h-1.5 rounded-full bg-line-soft overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-brass-light to-accent" style={{ width: `${successPrediction}%` }} />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-raised/40 p-4">
          <p className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-fg-low mb-2.5">Investor Recommendation</p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[15px] font-display font-semibold text-fg-hi">{investorLabel}</span>
            <span className={`font-mono text-[10px] uppercase px-2.5 py-1 rounded-full border ${
              report.verdictLevel === 'HIGH' ? 'text-danger bg-danger/10 border-danger/25' : report.verdictLevel === 'MEDIUM' ? 'text-amber bg-amber/10 border-amber/25' : 'text-accent bg-accent/10 border-accent/25'
            }`}>
              {capitalize(risk.overallLevel)} Risk
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function OutlookCard({ label, value, valueClass = 'text-fg-hi' }) {
  return (
    <div className="rounded-lg border border-line bg-raised/40 px-3.5 py-3">
      <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-fg-low mb-1">{label}</div>
      <div className={`text-[12.5px] font-semibold leading-snug ${valueClass}`}>{value}</div>
    </div>
  )
}

// --- Executive Report / PDF export ---------------------------------------

function ExecutiveReport({
  submission,
  market,
  risk,
  readiness,
  recommendations,
  strategicAnalysis
}) {
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(null)

  async function handleDownload() {
    setDownloadError(null)
    setDownloading(true)

    try {
      // Validate all required report data before generating the report.
      if (!submission) {
        throw new Error('Project information is missing.')
      }

      if (!market) {
        throw new Error('Market analysis is missing.')
      }

      if (!risk) {
        throw new Error('Risk assessment is missing.')
      }

      if (!readiness) {
        throw new Error('Launch readiness data is missing.')
      }

      const { downloadPdfReport } = await loadPdfReport()

      await downloadPdfReport({
        submission,
        market,
        risk,
        readiness,
        recommendations: Array.isArray(recommendations)
          ? recommendations
          : [],
        strategicReport: strategicAnalysis?.report || null
      })
    } catch (error) {
      console.error('PDF generation failed:', error)

      setDownloadError(
        error?.message || 'Unable to generate the report.'
      )
    } finally {
      setDownloading(false)
    }
  }

  const hasStrategicAnalysis = Boolean(strategicAnalysis?.report)

  return (
    <Card className="relative overflow-hidden p-5 sm:p-6 border-brass/20 bg-gradient-to-r from-brass/[0.07] via-transparent to-transparent">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brass/10 blur-3xl" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">

        {/* Report information */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-px bg-brass" />

            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-brass">
              Executive Report
            </p>

            {hasStrategicAnalysis && (
              <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="font-mono text-[8px] tracking-[0.12em] uppercase text-accent">
                  Strategy Ready
                </span>
              </span>
            )}
          </div>

          <h3 className="font-display text-[18px] sm:text-[20px] font-semibold text-fg-hi mb-1.5">
            Export Project Intelligence
          </h3>

          <p className="text-[12px] sm:text-[12.5px] text-fg-mid max-w-2xl leading-relaxed">
            Generate a print-ready executive report containing market
            intelligence, risk assessment, launch readiness, strategic
            recommendations, mitigation actions, and improvement roadmap.
          </p>

          {/* Report contents */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              'Market Analysis',
              'Risk Assessment',
              'Launch Readiness',
              'Strategic Intelligence',
              'Mitigation Plan',
              'Improvement Roadmap'
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-raised/60 px-2.5 py-1.5"
              >
                <span className="text-accent text-[10px]">✓</span>
                <span className="font-mono text-[8.5px] tracking-[0.04em] text-fg-low">
                  {item}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Download button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="
            relative shrink-0
            inline-flex items-center justify-center gap-2
            px-5 py-3.5
            rounded-lg
            bg-brass text-canvas
            font-mono text-[10.5px]
            font-semibold
            tracking-[0.08em]
            uppercase
            shadow-brass
            transition-all duration-200
            hover:bg-brass-light
            hover:-translate-y-0.5
            active:translate-y-0
            disabled:opacity-60
            disabled:cursor-not-allowed
            disabled:hover:translate-y-0
          "
        >
          {downloading ? (
            <>
              <svg
                className="animate-spin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.25"
                />

                <path
                  d="M21 12a9 9 0 0 1-9 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              Preparing Report…
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              Download PDF Report
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {downloadError && (
        <div className="relative mt-5 pt-4 border-t border-danger/20">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger text-[10px]">
              !
            </span>

            <div>
              <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-danger mb-1">
                Report Generation Error
              </p>

              <p className="text-[11.5px] text-danger/90 leading-relaxed">
                {downloadError}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

function MiniLedger({ label, value, dot }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
        <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-fg-low">{label}</span>
      </div>
      <div className="font-mono text-base font-medium text-fg-hi tabular">{value}</div>
    </div>
  )
}

function StatusBadge({ title, value }) {
  return (
    <div className="rounded-lg border border-line bg-raised px-3 py-2 min-w-[92px]">
      <div className="text-[8.5px] uppercase tracking-[0.14em] text-fg-low font-mono mb-0.5">{title}</div>
      <div className="text-[12px] font-semibold text-fg-hi truncate">{value}</div>
    </div>
  )
}

function InsightCard({ title, value }) {
  return (
    <div className="rounded-lg border border-line bg-raised px-3 py-2 transition-colors duration-200 hover:border-line-soft">
      <div className="text-[8.5px] uppercase tracking-[0.14em] text-fg-low font-mono">{title}</div>
      <div className="mt-0.5 text-[12.5px] font-semibold text-fg-hi">{value}</div>
    </div>
  )
}
function capitalize(s) {
  if (!s || s === '—') return '—'
  if (s === 'MEDIUM') return 'Moderate'
  return s.charAt(0) + s.slice(1).toLowerCase()
}

function ReadinessGauge({ value }) {
  const size = 130
  const stroke = 11
  const radius = (size - stroke) / 2
  const circumference = Math.PI * radius
  const offset = circumference * (1 - value / 100)

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        <path
          d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          fill="none"
          stroke="#242938"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          fill="none"
          stroke="#C6A15B"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="-mt-5 text-center">
        <div className="font-display text-xl font-semibold text-fg-hi tabular">{value}%</div>
        <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-fg-low">Ready</div>
      </div>
    </div>
  )
}
