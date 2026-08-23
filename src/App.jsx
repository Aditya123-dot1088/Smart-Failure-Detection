import { useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ProjectInput from './components/ProjectInput.jsx'
import RiskAssessment from './components/RiskAssessment.jsx'
import Recommendations from './components/Recommendations.jsx'
import Dashboard from './components/Dashboard.jsx'
import { generateMarketData, computeRisk, computeRecommendations, computeReadiness } from './utils/analysis.js'
import { saveProject } from './utils/api.js'

export default function App() {
  const [tab, setTab] = useState('input')
  const [submission, setSubmission] = useState(null)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error
  const [saveError, setSaveError] = useState(null)
  const [projectId, setProjectId] = useState(null)
  const [strategicAnalysis, setStrategicAnalysis] = useState(null)

  const market = useMemo(
    () => (submission ? generateMarketData(submission.sector, Number(submission.budgetLakh)) : null),
    [submission]
  )
  const risk = useMemo(() => (submission && market ? computeRisk(submission, market) : null), [submission, market])
  const recommendations = useMemo(
    () => (submission && market && risk ? computeRecommendations(risk, market, submission) : null),
    [submission, market, risk]
  )
  const readiness = useMemo(() => (risk ? computeReadiness(risk) : null), [risk])

  async function handleAnalyze(form) {
    setSubmission(form)
    setStrategicAnalysis(null)
    setTab('risk')

    // Compute the analysis snapshot synchronously so we persist the exact
    // figures the user is about to see, then save it to Postgres.
    const computedMarket = generateMarketData(form.sector, Number(form.budgetLakh))
    const computedRisk = computeRisk(form, computedMarket)
    const computedRecommendations = computeRecommendations(computedRisk, computedMarket, form)
    const computedReadiness = computeReadiness(computedRisk)

    setSaveState('saving')
    setSaveError(null)
    try {
      const saved = await saveProject({
        name: form.name,
        sector: form.sector,
        businessModel: form.businessModel,
        targetMarket: form.targetMarket,
        budgetLakh: form.budgetLakh || null,
        description: form.description,
        market: computedMarket,
        risk: computedRisk,
        recommendations: computedRecommendations,
        readiness: computedReadiness
      })
      setProjectId(saved?.id ?? null)
      setSaveState('saved')
    } catch (err) {
      setSaveState('error')
      setSaveError(err.message)
    }
  }

  const STEP_META = {
    input: { eyebrow: 'Step 01 · Data Collection', label: 'Project Input' },
    risk: { eyebrow: 'Step 02 · Automated Assessment', label: 'Risk Assessment' },
    recommendations: { eyebrow: 'Step 03 · Suggested Actions', label: 'Recommendations' },
    dashboard: { eyebrow: 'Step 04 · Summary', label: 'Dashboard' }
  }

  return (
    <div className="h-screen w-screen flex bg-canvas overflow-hidden">
      <Sidebar active={tab} onChange={setTab} hasData={!!submission} />

      <div className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden">
        <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-brass via-brass-light to-brass" />
        <div className="shrink-0 h-11 flex items-center px-8 border-b border-line-soft bg-canvas/90 backdrop-blur-sm">
          <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-fg-low">
            {STEP_META[tab]?.eyebrow}
          </span>
          <span className="mx-2.5 text-line">/</span>
          <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-brass">
            {STEP_META[tab]?.label}
          </span>
          <SaveStatus state={saveState} error={saveError} />
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {tab === 'input' && <ProjectInput onAnalyze={handleAnalyze} submission={submission} />}

          {tab === 'risk' && risk && <RiskAssessment risk={risk} market={market} />}

          {tab === 'recommendations' && recommendations && (
            <Recommendations
              recommendations={recommendations}
              submission={submission}
              market={market}
              risk={risk}
              readiness={readiness}
              projectId={projectId}
              onAnalysisReady={setStrategicAnalysis}
            />
          )}

          {tab === 'dashboard' && market && readiness && risk && (
            <Dashboard
              market={market}
              readiness={readiness}
              risk={risk}
              submission={submission}
              recommendations={recommendations}
              strategicAnalysis={strategicAnalysis}
              onViewStrategy={() => setTab('recommendations')}
            />
          )}

          {tab !== 'input' && !submission && (
            <div className="h-full flex items-center justify-center text-center text-fg-low text-sm px-6">
              Submit a project on the Project Input tab to generate this view.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SaveStatus({ state, error }) {
  if (state === 'idle') return null
  const config = {
    saving: { text: 'Saving to database…', className: 'text-fg-low' },
    saved: { text: 'Saved to database', className: 'text-accent' },
    error: { text: `Save failed${error ? `: ${error}` : ''}`, className: 'text-danger' }
  }[state]

  return (
    <span className={`ml-auto font-mono text-[10px] tracking-[0.1em] uppercase ${config.className}`}>
      {config.text}
    </span>
  )
}
