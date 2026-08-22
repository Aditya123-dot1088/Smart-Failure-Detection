const STEPS = [
  { key: 'input', num: '01', label: 'Project Input', hint: 'Data collection' },
  { key: 'risk', num: '02', label: 'Risk Assessment', hint: 'Automated flags' },
  { key: 'recommendations', num: '03', label: 'Recommendations', hint: 'Suggested actions' },
  { key: 'dashboard', num: '04', label: 'Dashboard', hint: 'Summary view' }
]

export default function Sidebar({ active, onChange, hasData }) {
  const activeIndex = STEPS.findIndex((s) => s.key === active)

  return (
    <aside
      className="w-340 shrink-0 h-screen overflow-hidden relative
      bg-surface/95 backdrop-blur-xl border-r border-white/10
      flex flex-col justify-between shadow-2xl"
    >
      {/* Background Glow */}
      <div className="absolute -top-24 -left-16 w-64 h-64 rounded-full bg-brass/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-52 h-52 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="relative px-6 py-6 border-b border-white/10 shrink-0">

          <div className="flex items-center gap-5">

            <div
              className="w-16 h-16 rounded-2xl
              bg-gradient-to-br from-brass-light via-brass to-yellow-300
              text-canvas
              flex items-center justify-center
              shadow-lg
              ring-1 ring-white/10"
            >
              <span className="font-display text-[30px] font-black">
                ES
              </span>
            </div>

            <div>

              <h1 className="font-display text-[22px] font-bold text-white leading-none tracking-tight">
                Enterprise Startup
              </h1>

             <p className="font-mono text-[11px] tracking-[0.28em] uppercase text-gray-400 mt-1">
                Intelligence Suite
              </p>

            </div>

          </div>

        </div>

        {/* Navigation */}

        <nav className="flex-1 px-3 py-5 overflow-y-auto">

          <div className="relative">

            <div className="space-y-2">

              {STEPS.map((step, i) => {

                const disabled = step.key !== 'input' && !hasData

                const isActive = active === step.key

                const completed = hasData && i < activeIndex

                return (

                  <button
                    key={step.key}
                    disabled={disabled}
                    onClick={() => onChange(step.key)}
                    className={`
                    relative group
                    w-full
                    flex items-center
                    gap-4
                    rounded-2xl
                    px-3
                    py-3
                    transition-all
                    duration-300

                    ${
                      isActive
                        ? 'bg-gradient-to-r from-brass/15 to-transparent border border-brass/30 shadow-lg'
                        : disabled
                        ? 'opacity-40'
                        : 'hover:bg-white/5 hover:translate-x-1'
                    }
                    `}
                  >

                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-brass shadow-brass" />
                    )}

                    <div
                      className={`
                      w-10 h-10 rounded-full
                      flex items-center justify-center
                      border
                      text-[11px]
                      font-mono
                      transition-all

                      ${
                        isActive
                          ? 'bg-brass text-canvas border-brass scale-110'
                          : completed
                          ? 'bg-green-500/10 border-green-400 text-green-300'
                          : 'border-line text-fg-low'
                      }
                      `}
                    >
                      {completed ? "✓" : step.num}
                    </div>

                    <div className="text-left">

                      <div
                        className={`
                        text-[13px]
                        font-semibold
                        ${
                          isActive
                            ? 'text-white'
                            : 'text-fg-mid group-hover:text-white'
                        }
                        `}
                      >
                        {step.label}
                      </div>

                      <div className="text-[10px] text-fg-low">
                        {step.hint}
                      </div>

                    </div>

                  </button>

                )

              })}

            </div>

          </div>

        </nav>

      </div>

      {/* Footer */}

      <div className="px-4 py-4 border-t border-white/10">

        <div
          className="rounded-2xl
          border border-brass/20
          bg-gradient-to-r
          from-brass/10
          to-transparent
          px-4
          py-3"
        >

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>

              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-fg-low">

                Infosys Springboard

              </span>

            </div>

            <span className="text-green-300 text-[10px] font-semibold">

              Ready

            </span>

          </div>

        </div>

      </div>

    </aside>
  )
}