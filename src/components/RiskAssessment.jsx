import { Card, LevelBadge, RiskBar } from './ui.jsx'

export default function RiskAssessment({ risk, market }) {
  return (
    <div className="h-full overflow-hidden px-6 py-4 fade-up">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <div className="mb-3 shrink-0">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-brass mb-1.5 flex items-center gap-2">
            <span className="w-4 h-px bg-brass/60" />
            Automated Assessment
          </p>
          <h1 className="font-display text-[26px] leading-tight font-semibold text-fg-hi tracking-tight">
            Risk Assessment
          </h1>
        </div>

        <div className="relative rounded-xl2 border border-line bg-raised overflow-hidden mb-3 p-5 flex flex-wrap items-end justify-between gap-6 shrink-0">
          <div
            className="pointer-events-none absolute -top-16 -left-16 w-72 h-72 rounded-full opacity-60"
            style={{ background: `radial-gradient(circle, ${glowColor(risk.overallLevel)} 0%, transparent 70%)` }}
          />
          <div className="relative">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-fg-low mb-2.5">
              Overall Risk Score
            </p>
            <div className={`font-display text-[42px] leading-[0.9] font-medium tracking-tight ${overallColor(risk.overallLevel)}`}>
              {capitalize(risk.overallLevel)}
            </div>
          </div>
          <div className="relative flex gap-8 border-l border-line/70 pl-8">
            <div>
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-fg-low mb-1">Critical Flags</div>
              <div className="font-mono text-lg font-medium text-fg-hi tabular">{risk.criticalFlags}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-fg-low mb-1">Market Fit</div>
              <div className="font-mono text-lg font-medium text-accent tabular">{risk.marketFit}%</div>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-fg-low mb-1">Sector</div>
              <div className="font-mono text-lg font-medium text-fg-hi">{market.sectorName}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0 overflow-y-auto pb-1">
          {risk.categories.map((c) => (
            <Card key={c.key} hover className="p-4 sm:p-[18px]">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-[13px] text-fg-hi">{c.label}</h3>
                  <LevelBadge level={c.level} />
                </div>
              </div>
              <p className="text-[12px] text-fg-mid leading-relaxed mb-3">{c.message}</p>
              <RiskBar level={c.level} score={c.score} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function overallColor(level) {
  if (level === 'HIGH') return 'text-danger'
  if (level === 'MEDIUM') return 'text-amber'
  return 'text-accent'
}

function glowColor(level) {
  if (level === 'HIGH') return 'rgba(225,89,106,0.16)'
  if (level === 'MEDIUM') return 'rgba(227,162,60,0.16)'
  return 'rgba(43,179,163,0.16)'
}

function capitalize(s) {
  if (s === 'MEDIUM') return 'Moderate'
  return s.charAt(0) + s.slice(1).toLowerCase()
}
