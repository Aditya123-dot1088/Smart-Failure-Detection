import { Card } from './ui.jsx'

const icons = {
  'Re-anchor SOM assumptions': '◐',
  'Differentiate from the category leader': '◆',
  'Lock in early SAM capture': '↗',
  'Simplify regional integrations': '▣',
  'Stage the budget against milestones': '⊞',
  'Front-load compliance scoping': '⛊'
}

const priorityStyles = {
  CRITICAL: 'text-danger bg-danger/10 border border-danger/20',
  HIGH: 'text-amber bg-amber/10 border border-amber/20',
  MODERATE: 'text-brass bg-brass/10 border border-brass/20'
}

export default function Recommendations({ recommendations }) {
  const critical = recommendations.filter((r) => r.priority === 'CRITICAL').length
  const high = recommendations.filter((r) => r.priority === 'HIGH').length

  return (
    <div className="h-full overflow-hidden px-6 py-4 fade-up">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <div className="mb-3 shrink-0">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-brass mb-1.5 flex items-center gap-2">
            <span className="w-4 h-px bg-brass/60" />
            Suggested Actions
          </p>
          <h1 className="font-display text-[26px] leading-tight font-semibold text-fg-hi tracking-tight">
            Recommendations
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0 overflow-y-auto pb-1">
          {recommendations.map((rec) => (
            <Card key={rec.title} hover className="p-4 relative">
              <span
                className={`absolute top-4 right-4 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full tracking-wide ${priorityStyles[rec.priority]}`}
              >
                {rec.priority}
              </span>
              <div className="w-7 h-7 rounded-lg bg-brass/10 text-brass flex items-center justify-center text-sm mb-2.5">
                {icons[rec.title] || '•'}
              </div>
              <h3 className="font-display font-semibold text-[13px] text-fg-hi mb-1.5 pr-[72px] leading-snug">{rec.title}</h3>
              <p className="text-[12px] text-fg-mid leading-relaxed mb-3">{rec.body}</p>
              <div className="flex items-center gap-4 text-[10px] font-mono text-fg-low pt-2.5 border-t border-line/60">
                <span>Impact <strong className="text-fg-mid font-semibold ml-1">{rec.impact}</strong></span>
                <span>Effort <strong className="text-fg-mid font-semibold ml-1">{rec.effort}</strong></span>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-3 rounded-xl2 border border-brass/20 bg-gradient-to-r from-brass/10 to-transparent p-4 shrink-0">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-brass mb-1.5">Summary</p>
          <p className="text-[12.5px] text-fg-mid leading-relaxed">
            {recommendations.length} action{recommendations.length === 1 ? '' : 's'} identified — {' '}
            <strong className="text-fg-hi font-semibold">{critical}</strong> critical and{' '}
            <strong className="text-fg-hi font-semibold">{high}</strong> high priority. Address critical items
            before committing further budget or launch timeline.
          </p>
        </div>
      </div>
    </div>
  )
}
