import { useEffect, useState } from 'react'
import { Card } from './ui.jsx'

const AGENT_ICON = {
  'Market Agent': '▲',
  'Risk Agent': '⚠',
  'SWOT Agent': '◧',
  'Feasibility Agent': '⊙',
  'Strategy Agent': '✺',
  'Mitigation Agent': '⛊',
  'Recommendation Agent': '➤',
}

const LOADING_STAGES = [
  'Reading market signals',
  'Evaluating risk',
  'Generating strategic reasoning',
  'Building mitigation plan',
  'Preparing recommendations',
]

export function StrategyLoading() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => Math.min(i + 1, LOADING_STAGES.length - 1))
    }, 900)

    return () => clearInterval(id)
  }, [])

  return (
    <Card className="p-5">
      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-brass mb-3">
        Strategic Intelligence Engine
      </p>

      <div className="space-y-2">
        {LOADING_STAGES.map((label, i) => (
          <div key={label} className="flex items-center gap-2.5 text-[12.5px]">
            <span
              className={`font-mono text-[13px] w-4 shrink-0 ${
                i < active
                  ? 'text-accent'
                  : i === active
                    ? 'text-brass soft-pulse rounded-full'
                    : 'text-fg-low'
              }`}
            >
              {i < active ? '✓' : i === active ? '●' : '○'}
            </span>
            <span className={i <= active ? 'text-fg-hi' : 'text-fg-low'}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function StrategyWorkflow({ workflow }) {
  if (!Array.isArray(workflow) || workflow.length === 0) return null

  return (
    <Card className="p-5">
      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-brass mb-4">
        LangGraph-Compatible Workflow
      </p>

      <div className="flex flex-col">
        {workflow.map((node, i) => (
          <div key={node.agent || node.id || i} className="flex gap-3">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] border ${
                  node.status === 'complete'
                    ? 'bg-brass/10 border-brass/40 text-brass'
                    : node.status === 'error'
                      ? 'bg-danger/10 border-danger/40 text-danger'
                      : 'border-line text-fg-low'
                }`}
              >
                {node.status === 'complete'
                  ? '✓'
                  : AGENT_ICON[node.agent] || '•'}
              </div>

              {i < workflow.length - 1 && (
                <div className="w-px flex-1 min-h-[16px] bg-line my-1" />
              )}
            </div>

            <div className="pb-4 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12.5px] font-semibold text-fg-hi">
                  {node.agent || node.name}
                </span>

                {node.status === 'complete' && (
                  <span className="font-mono text-[9px] text-accent">
                    {node.durationMs ?? 0}ms
                  </span>
                )}

                {node.status === 'error' && (
                  <span className="font-mono text-[9px] text-danger">
                    failed — fallback used
                  </span>
                )}
              </div>

              <p className="text-[11px] text-fg-low mt-0.5 leading-relaxed">
                {node.description || node.detail || ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
