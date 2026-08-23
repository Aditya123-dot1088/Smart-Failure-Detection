import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { Card } from './ui.jsx'
import { SECTOR_NAMES, BUSINESS_MODELS } from '../data/sectors.js'
import { generateMarketData, inr } from '../utils/analysis.js'

const EMPTY = {
  name: '',
  sector: SECTOR_NAMES[0],
  businessModel: BUSINESS_MODELS[0],
  targetMarket: '',
  budgetLakh: '',
  description: ''
}

export default function ProjectInput({ onAnalyze, submission }) {
  const [form, setForm] = useState(submission || EMPTY)
  const [preview, setPreview] = useState(() =>
    generateMarketData(form.sector, Number(form.budgetLakh))
  )

  function update(field, value) {
    const next = { ...form, [field]: value }
    setForm(next)
    if (field === 'sector' || field === 'budgetLakh') {
      setPreview(generateMarketData(next.sector, Number(next.budgetLakh)))
    }
  }

  function handleReset() {
    setForm(EMPTY)
    setPreview(generateMarketData(EMPTY.sector, 0))
  }

  function handleAnalyze(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onAnalyze(form)
  }

  const chartData = preview.trend.map((t, i) => ({
    year: t.year,
    tam: Math.round(10 + i * (preview.tamGrowth / 1.6)),
    sam: Math.round(6 + i * (preview.samGrowth / 1.8))
  }))

  return (
    <div className="h-full overflow-hidden px-6 py-4 fade-up">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <div className="mb-3 shrink-0">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-brass mb-1">
            Milestone 1 · Data Collection
          </p>
          <h1 className="font-display text-2xl font-semibold text-fg-hi tracking-tight">
            Project Input
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 flex-1 min-h-0">
          {/* Submission form */}
          <Card className="glass hover-card p-5 overflow-y-auto">
            <h2 className="font-display font-semibold text-sm text-fg-hi mb-3">Project Submission</h2>
            <form onSubmit={handleAnalyze} className="space-y-3">
              <Field label="Startup / Project Name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="e.g. Flora"
                  className={inputClass}
                />
              </Field>

              <Field label="Industry / Sector">
                <select
                  value={form.sector}
                  onChange={(e) => update('sector', e.target.value)}
                  className={inputClass}
                >
                  {SECTOR_NAMES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>

              <Field label="Business Model">
                <select
                  value={form.businessModel}
                  onChange={(e) => update('businessModel', e.target.value)}
                  className={inputClass}
                >
                  {BUSINESS_MODELS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </Field>

              <Field label="Target Market">
                <input
                  value={form.targetMarket}
                  onChange={(e) => update('targetMarket', e.target.value)}
                  placeholder="e.g. Tier-1 urban working professionals"
                  className={inputClass}
                />
              </Field>

              <Field label="Budget (INR Lakh)">
                <input
                  type="number"
                  min="0"
                  value={form.budgetLakh}
                  onChange={(e) => update('budgetLakh', e.target.value)}
                  placeholder="25"
                  className={inputClass}
                />
              </Field>

              <Field label="Project Description">
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="What does the product do, and who is it for?"
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 rounded-lg text-[13px] font-medium text-fg-mid border border-line hover:bg-white/5 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg text-[13px] font-semibold text-canvas bg-gradient-to-r from-brass-light to-brass hover:shadow-brass transition-all"
                >
                  Analyze Project
                </button>
              </div>
            </form>
          </Card>

          {/* Market analysis + competitor landscape */}
          <div className="grid grid-rows-[1fr_1fr] gap-4 min-h-0">
            <Card className="glass hover-card p-5 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-1 shrink-0">
                <h2 className="font-display font-semibold text-sm text-fg-hi">Market Analysis</h2>
                <span className="font-mono text-[10px] text-fg-low">{preview.sectorName}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-2 mb-2 shrink-0">
                <MiniStat label="TAM" value={inr(preview.tam)} delta={`+${preview.tamGrowth.toFixed(1)}%`} />
                <MiniStat label="SAM" value={inr(preview.sam)} delta={`+${preview.samGrowth.toFixed(1)}%`} />
                <MiniStat label="SOM" value={inr(preview.som)} delta={`+${(preview.samGrowth / 4).toFixed(1)}%`} />
              </div>

              <div className="flex-1 min-h-0">
                <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-fg-low mb-1">
                  Market Trends (2020–2026)
                </p>
                <div className="h-[calc(100%-14px)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="#242938" vertical={false} />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#5B6274' }} axisLine={{ stroke: '#242938' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#5B6274' }} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid #242938', background: '#171B24', color: '#EDEFF3', fontSize: 11 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="tam" name="TAM Growth (%)" stroke="#E1596A" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="sam" name="SAM Growth (%)" stroke="#2BB3A3" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            <Card className="glass hover-card p-5 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <h2 className="font-display font-semibold text-sm text-fg-hi">Competitor Landscape</h2>
                <span className="font-mono text-[10px] text-fg-low">{preview.competitors.length} tracked</span>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
                {preview.competitors.map((c) => (
                  <div key={c.name} className="border border-line rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-semibold text-[13px] text-fg-hi">{c.name}</span>
                      <PositionBadge position={c.position} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-fg-low mb-1.5">
                      <span>Share {c.share}%</span>
                      <span>Rev {inr(c.revenueCr)}</span>
                      <span className={c.growth >= 0 ? 'text-success' : 'text-danger'}>
                        {c.growth >= 0 ? '+' : ''}{c.growth}%
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-line overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-brass-light to-brass" style={{ width: `${c.share * 2.6}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputClass =
  'w-full px-3 py-1.5 rounded-lg border border-line bg-raised text-[13px] text-fg-hi placeholder:text-fg-low focus:outline-none focus:ring-2 focus:ring-brass/30 focus:border-brass/60 transition-shadow'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-fg-mid mb-1">{label}</span>
      {children}
    </label>
  )
}

function MiniStat({ label, value, delta }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-fg-low mb-0.5">{label}</div>
      <div className="font-mono text-[15px] font-semibold text-fg-hi tabular">{value}</div>
      <div className="text-[10px] text-success font-medium">{delta}</div>
    </div>
  )
}

const positionStyles = {
  Leader: 'bg-amber/10 text-amber border-amber/25',
  Direct: 'bg-danger/10 text-danger border-danger/25',
  Indirect: 'bg-brass/10 text-brass border-brass/25'
}

function PositionBadge({ position }) {
  return (
    <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full border ${positionStyles[position] || ''}`}>
      {position.toUpperCase()}
    </span>
  )
}
