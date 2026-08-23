import React from 'react'

const STEPS = [
  { key: 'input', num: '01', label: 'Project Input', hint: 'Data collection' },
  { key: 'risk', num: '02', label: 'Risk Assessment', hint: 'Automated flags' },
  { key: 'recommendations', num: '03', label: 'Recommendations', hint: 'Suggested actions' },
  { key: 'dashboard', num: '04', label: 'Dashboard', hint: 'Summary view' },
]

export default function Sidebar({ active, onChange, hasData }) {
  const activeIndex = STEPS.findIndex((s) => s.key === active)

  return (
    <aside className="w-56 lg:w-64 shrink-0 h-screen overflow-hidden relative bg-surface border-r border-line-soft flex flex-col justify-between">
      <div className="absolute -top-20 -left-16 w-56 h-56 rounded-full bg-brass/10 blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="relative px-4 lg:px-6 py-5 lg:py-6 border-b border-line-soft shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brass-light to-brass text-canvas flex items-center justify-center shadow-brass shrink-0 ring-1 ring-white/10">
              <span className="font-display text-[16px] font-bold">E</span>
            </div>

            <div className="min-w-0">
              <h1 className="font-display text-[14px] lg:text-[15px] font-semibold text-fg-hi leading-tight">
                Enterprise Startup
              </h1>
              <p className="font-mono text-[9px] tracking-[0.20em] uppercase text-fg-low mt-1">
                Intelligence Suite
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2.5 lg:px-3 py-5 lg:py-6 overflow-y-auto">
          <div className="space-y-2">
            {STEPS.map((step, i) => {
              const disabled = step.key !== 'input' && !hasData
              const isActive = active === step.key
              const isCompleted = hasData && activeIndex > 0 && i < activeIndex

              return (
                <button
                  key={step.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange?.(step.key)}
                  className={`
                    relative group w-full flex items-center gap-3 rounded-xl
                    px-2.5 lg:px-3 py-3 border transition-all duration-300
                    ${isActive
                      ? 'bg-gradient-to-r from-brass/[0.10] via-brass/[0.04] to-transparent border-brass/35 shadow-[0_8px_30px_rgba(198,161,91,0.07)]'
                      : 'border-transparent hover:border-white/[0.06] hover:bg-white/[0.025]'}
                    ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-[4px] rounded-full bg-brass shadow-[0_0_15px_rgba(198,161,91,0.55)]" />
                  )}

                  <div
                    className={`
                      relative w-9 h-9 rounded-full flex items-center justify-center shrink-0
                      border font-mono transition-all duration-300
                      ${isActive
                        ? 'bg-brass border-brass text-canvas shadow-[0_0_18px_rgba(198,161,91,0.30)] scale-[1.04]'
                        : isCompleted
                          ? 'bg-accent/10 border-accent/60 text-accent'
                          : 'bg-transparent border-brass/40 text-brass group-hover:border-brass/70'}
                    `}
                  >
                    {isCompleted ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 12.5L9.5 17L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span className="text-[10px]">{step.num}</span>
                    )}
                  </div>

                  <div className="text-left min-w-0 flex-1">
                    <div
                      className={`
                        text-[12px] lg:text-[13px] font-semibold truncate transition-colors
                        ${isActive || isCompleted ? 'text-fg-hi' : 'text-fg-mid group-hover:text-fg-hi'}
                      `}
                    >
                      {step.label}
                    </div>

                    <div className={`text-[10px] mt-[2px] truncate ${isCompleted ? 'text-accent/70' : 'text-fg-low'}`}>
                      {isCompleted ? 'Completed' : step.hint}
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="hidden xl:flex items-center justify-center w-5 h-5 rounded-full bg-accent/10 border border-accent/20">
                      <span className="text-accent text-[10px]">✓</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      <div className="px-3 lg:px-4 py-4 border-t border-line-soft shrink-0">
        <div className="rounded-xl border border-brass/20 bg-gradient-to-r from-brass/[0.08] via-transparent to-transparent px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative w-2 h-2 rounded-full bg-accent">
                <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30" />
              </span>
              <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-fg-low">
                Milestone 3
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="text-accent" aria-hidden="true">
                <path d="M5 12.5L9.5 17L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[10px] text-brass font-semibold">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
