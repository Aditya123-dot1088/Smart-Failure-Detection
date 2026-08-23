import { inr } from './analysis.js'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// -----------------------------------------------------------------------------
// Executive Report / PDF export
//
// Generates the report directly in the browser.
// No window.open()
// No window.print()
// No popup permission required.
//
// The existing Dashboard can continue calling:
//
// downloadPdfReport({
//   submission,
//   market,
//   risk,
//   readiness,
//   recommendations,
//   strategicReport
// })
// -----------------------------------------------------------------------------

function esc(value) {
  if (value === null || value === undefined) return ''

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function capitalize(s) {
  if (!s) return '—'
  if (s === 'MEDIUM') return 'Moderate'

  return s.charAt(0) + s.slice(1).toLowerCase()
}

export async function downloadPdfReport({
  submission,
  market,
  risk,
  readiness,
  recommendations = [],
  strategicReport = null
}) {
  if (!submission || !market || !risk || !readiness) {
    throw new Error('Report data is incomplete.')
  }

  const generated = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const verdict =
    strategicReport?.verdict ||
    (
      risk.overallLevel === 'HIGH'
        ? 'Address Risks'
        : risk.overallLevel === 'MEDIUM'
          ? 'Proceed with Caution'
          : 'Proceed'
    )

  const successPrediction = Math.round(
    (Number(readiness.overall || 0) +
      (100 - Number(risk.overallScore || 0))) /
      2
  )

  // ---------------------------------------------------------------------------
  // Create a temporary report element.
  // It is rendered off-screen and never opens a browser popup.
  // ---------------------------------------------------------------------------

  const container = document.createElement('div')

  container.innerHTML = buildReportHtml({
    submission,
    market,
    risk,
    readiness,
    recommendations,
    strategicReport,
    generated,
    verdict,
    successPrediction
  })

  Object.assign(container.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: '794px',
    minHeight: '1123px',
    background: '#ffffff',
    zIndex: '-1',
    overflow: 'visible'
  })

  document.body.appendChild(container)

  try {
    // Allow the browser to finish layout before capturing.
    await new Promise((resolve) => requestAnimationFrame(resolve))

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
      imageTimeout: 15000
    })

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const margin = 8
    const usableWidth = pageWidth - margin * 2
    const usableHeight = pageHeight - margin * 2

    const imageWidth = usableWidth
    const imageHeight =
      (canvas.height * imageWidth) / canvas.width

    let remainingHeight = imageHeight
    let sourceY = 0

    // First page
    addCanvasSlice({
      pdf,
      canvas,
      sourceY,
      imageWidth,
      imageHeight,
      pageWidth,
      pageHeight,
      margin
    })

    remainingHeight -= usableHeight
    sourceY += (usableHeight / imageHeight) * canvas.height

    // Additional pages
    while (remainingHeight > 0) {
      pdf.addPage()

      addCanvasSlice({
        pdf,
        canvas,
        sourceY,
        imageWidth,
        imageHeight,
        pageWidth,
        pageHeight,
        margin
      })

      remainingHeight -= usableHeight
      sourceY += (usableHeight / imageHeight) * canvas.height
    }

    const safeName =
      String(submission.name || 'startup-intelligence-report')
        .trim()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase()

    pdf.save(`${safeName || 'startup'}-intelligence-report.pdf`)
  } finally {
    container.remove()
  }
}

// -----------------------------------------------------------------------------
// Add one A4 page slice from the complete report canvas.
// -----------------------------------------------------------------------------

function addCanvasSlice({
  pdf,
  canvas,
  sourceY,
  imageWidth,
  imageHeight,
  pageWidth,
  pageHeight,
  margin
}) {
  const usableWidth = pageWidth - margin * 2
  const usableHeight = pageHeight - margin * 2

  const sourceHeight = Math.min(
    canvas.height - sourceY,
    (usableHeight / imageWidth) * canvas.width
  )

  if (sourceHeight <= 0) return

  const slice = document.createElement('canvas')

  slice.width = canvas.width
  slice.height = Math.ceil(sourceHeight)

  const ctx = slice.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, slice.width, slice.height)

  ctx.drawImage(
    canvas,
    0,
    sourceY,
    canvas.width,
    sourceHeight,
    0,
    0,
    canvas.width,
    sourceHeight
  )

  const sliceHeight =
    (slice.height * usableWidth) / slice.width

  pdf.addImage(
    slice.toDataURL('image/jpeg', 0.94),
    'JPEG',
    margin,
    margin,
    usableWidth,
    Math.min(sliceHeight, usableHeight),
    undefined,
    'FAST'
  )

  // Small professional page footer.
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(140, 145, 156)

  pdf.text(
    'Enterprise Startup Intelligence Suite',
    margin,
    pageHeight - 3
  )

  pdf.text(
    'Confidential',
    pageWidth - margin,
    pageHeight - 3,
    { align: 'right' }
  )
}

// -----------------------------------------------------------------------------
// Complete report HTML
// -----------------------------------------------------------------------------

function buildReportHtml({
  submission,
  market,
  risk,
  readiness,
  recommendations,
  strategicReport,
  generated,
  verdict,
  successPrediction
}) {
  return `
    <div class="report">

      ${coverBlock({
        submission,
        market,
        risk,
        generated,
        verdict,
        successPrediction
      })}

      ${marketSection(market)}

      ${riskSection(risk)}

      ${readinessSection(readiness)}

      ${recommendationsSection(recommendations)}

      ${
        strategicReport
          ? strategicSection(strategicReport)
          : ''
      }

      <div class="footer">
        Enterprise Startup Intelligence Suite —
        Confidential project analysis generated for internal / evaluation use.
      </div>

    </div>

    <style>
      ${reportStyles()}
    </style>
  `
}

// -----------------------------------------------------------------------------
// Cover
// -----------------------------------------------------------------------------

function coverBlock({
  submission,
  market,
  risk,
  generated,
  verdict,
  successPrediction
}) {
  return `
    <header class="cover">

      <div class="brand">

        <span class="brand-mark">E</span>

        <div>
          <div class="brand-name">
            Enterprise Startup Intelligence Suite
          </div>

          <div class="brand-sub">
            Executive Project Report
          </div>
        </div>

      </div>

      <div class="cover-meta">
        Generated ${esc(generated)}
      </div>

    </header>

    <div class="hero">

      <div class="eyebrow">
        STARTUP INTELLIGENCE REPORT
      </div>

      <h1>
        ${esc(submission.name || 'Untitled Project')}
      </h1>

      <p class="subtitle">
        ${esc(market.sectorName || submission.sector || 'Startup')}
        ·
        ${esc(submission.businessModel || 'Business Model')}
        ·
        ${esc(
          submission.targetMarket ||
          'Target market unspecified'
        )}
      </p>

    </div>

    <div class="stat-row">

      <div class="stat">
        <div class="stat-label">
          Budget
        </div>

        <div class="stat-value">
          ₹${esc(submission.budgetLakh || '—')} Lakh
        </div>
      </div>

      <div class="stat">
        <div class="stat-label">
          Serviceable Obtainable Market
        </div>

        <div class="stat-value">
          ${esc(inr(market.som))}
        </div>
      </div>

      <div class="stat">
        <div class="stat-label">
          Success Prediction
        </div>

        <div class="stat-value">
          ${successPrediction}%
        </div>
      </div>

      <div class="stat">
        <div class="stat-label">
          Executive Verdict
        </div>

        <div class="stat-value accent">
          ${esc(verdict)}
        </div>
      </div>

    </div>

    ${
      submission.description
        ? `
          <div class="description-box">
            <div class="section-label">
              PROJECT OVERVIEW
            </div>

            <p>
              ${esc(submission.description)}
            </p>
          </div>
        `
        : ''
    }

    <div class="executive-strip">

      <div>
        <span class="strip-label">
          Overall Risk
        </span>

        <strong>
          ${esc(capitalize(riskLevel(risk)))}
        </strong>
      </div>

      <div>
        <span class="strip-label">
          Launch Readiness
        </span>

        <strong>
          ${esc(readiness.overall)}%
        </strong>
      </div>

      <div>
        <span class="strip-label">
          Critical Flags
        </span>

        <strong>
          ${esc(risk.criticalFlags)}
        </strong>
      </div>

    </div>
  `
}

// -----------------------------------------------------------------------------
// Market
// -----------------------------------------------------------------------------

function marketSection(market) {
  const rows = (market.competitors || [])
    .slice(0, 6)
    .map(
      (c) => `
        <tr>
          <td>${esc(c.name)}</td>
          <td>${esc(c.share)}%</td>
          <td>${esc(inr(c.revenueCr))}</td>
          <td>${esc(c.position || '—')}</td>
        </tr>
      `
    )
    .join('')

  return `
    <section>

      <div class="section-heading">
        <span>01</span>
        <div>
          <div class="section-kicker">
            MARKET INTELLIGENCE
          </div>
          <h2>Market Analysis</h2>
        </div>
      </div>

      <div class="stat-row">

        <div class="stat">
          <div class="stat-label">TAM</div>
          <div class="stat-value">
            ${esc(inr(market.tam))}
          </div>
        </div>

        <div class="stat">
          <div class="stat-label">SAM</div>
          <div class="stat-value">
            ${esc(inr(market.sam))}
          </div>
        </div>

        <div class="stat">
          <div class="stat-label">SOM</div>
          <div class="stat-value">
            ${esc(inr(market.som))}
          </div>
        </div>

        <div class="stat">
          <div class="stat-label">
            Category Leader Share
          </div>
          <div class="stat-value">
            ${esc(market.topShare)}%
          </div>
        </div>

      </div>

      ${
        rows
          ? `
            <div class="table-card">

              <div class="table-title">
                Competitive Landscape
              </div>

              <table>

                <thead>
                  <tr>
                    <th>Competitor</th>
                    <th>Share</th>
                    <th>Revenue</th>
                    <th>Position</th>
                  </tr>
                </thead>

                <tbody>
                  ${rows}
                </tbody>

              </table>

            </div>
          `
          : ''
      }

    </section>
  `
}

// -----------------------------------------------------------------------------
// Risk
// -----------------------------------------------------------------------------

function riskSection(risk) {
  const rows = (risk.categories || [])
    .map(
      (c) => `
        <tr>

          <td>
            <strong>
              ${esc(c.label)}
            </strong>
          </td>

          <td>
            <span class="badge ${badgeClass(c.level)}">
              ${esc(c.level)}
            </span>
          </td>

          <td class="tabular">
            ${esc(c.score)}/100
          </td>

          <td>
            ${esc(c.message)}
          </td>

        </tr>
      `
    )
    .join('')

  return `
    <section>

      <div class="section-heading">
        <span>02</span>
        <div>
          <div class="section-kicker">
            RISK INTELLIGENCE
          </div>
          <h2>Risk Assessment</h2>
        </div>
      </div>

      <div class="stat-row">

        <div class="stat">
          <div class="stat-label">
            Overall Risk
          </div>

          <div class="stat-value">
            ${esc(capitalize(riskLevel(risk)))}
          </div>
        </div>

        <div class="stat">
          <div class="stat-label">
            Risk Score
          </div>

          <div class="stat-value">
            ${esc(risk.overallScore)}/100
          </div>
        </div>

        <div class="stat">
          <div class="stat-label">
            Critical Flags
          </div>

          <div class="stat-value">
            ${esc(risk.criticalFlags)}
          </div>
        </div>

        <div class="stat">
          <div class="stat-label">
            Market Fit
          </div>

          <div class="stat-value">
            ${esc(risk.marketFit)}%
          </div>
        </div>

      </div>

      <div class="table-card">

        <div class="table-title">
          Risk Intelligence Matrix
        </div>

        <table>

          <thead>
            <tr>
              <th>Category</th>
              <th>Level</th>
              <th>Score</th>
              <th>Assessment</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>

        </table>

      </div>

    </section>
  `
}

// -----------------------------------------------------------------------------
// Readiness
// -----------------------------------------------------------------------------

function readinessSection(readiness) {
  const rows = (readiness.breakdown || [])
    .map(
      (b) => `
        <tr>
          <td>${esc(b.label)}</td>
          <td class="tabular">
            ${esc(b.value)}/100
          </td>
          <td>
            <div class="score-bar">
              <span style="width:${Math.max(
                0,
                Math.min(100, Number(b.value || 0))
              )}%"></span>
            </div>
          </td>
        </tr>
      `
    )
    .join('')

  return `
    <section>

      <div class="section-heading">
        <span>03</span>
        <div>
          <div class="section-kicker">
            EXECUTION READINESS
          </div>
          <h2>Launch Readiness</h2>
        </div>
      </div>

      <div class="readiness-hero">

        <div>
          <div class="section-label">
            OVERALL READINESS
          </div>

          <div class="readiness-score">
            ${esc(readiness.overall)}%
          </div>
        </div>

        <div class="readiness-copy">
          The readiness score summarizes the project's
          current position across key execution dimensions.
        </div>

      </div>

      <div class="table-card">

        <div class="table-title">
          Readiness Breakdown
        </div>

        <table>

          <thead>
            <tr>
              <th>Dimension</th>
              <th>Score</th>
              <th>Progress</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>

        </table>

      </div>

    </section>
  `
}

// -----------------------------------------------------------------------------
// Recommendations
// -----------------------------------------------------------------------------

function recommendationsSection(recommendations) {
  if (!recommendations?.length) return ''

  const rows = recommendations
    .map(
      (r) => `
        <tr>

          <td>
            <span class="badge ${badgeClass(r.priority)}">
              ${esc(r.priority)}
            </span>
          </td>

          <td>
            <strong>${esc(r.title)}</strong>
          </td>

          <td>
            ${esc(r.body)}
          </td>

          <td>
            ${esc(r.impact)}
          </td>

          <td>
            ${esc(r.effort)}
          </td>

        </tr>
      `
    )
    .join('')

  return `
    <section class="page-break">

      <div class="section-heading">
        <span>04</span>
        <div>
          <div class="section-kicker">
            STRATEGIC ACTION
          </div>
          <h2>Recommendations</h2>
        </div>
      </div>

      <div class="table-card">

        <div class="table-title">
          Recommended Actions
        </div>

        <table>

          <thead>
            <tr>
              <th>Priority</th>
              <th>Action</th>
              <th>Detail</th>
              <th>Impact</th>
              <th>Effort</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>

        </table>

      </div>

    </section>
  `
}

// -----------------------------------------------------------------------------
// Strategic Intelligence
// -----------------------------------------------------------------------------

function strategicSection(report) {
  const swotBlock = (label, items) => `
    <div class="swot-col">

      <div class="swot-label">
        ${esc(label)}
      </div>

      <ul>

        ${
          items && items.length
            ? items
                .map(
                  (item) =>
                    `<li>${esc(item)}</li>`
                )
                .join('')
            : '<li class="muted">None flagged.</li>'
        }

      </ul>

    </div>
  `

  const priorities = (report.topPriorities || [])
    .map(
      (p, i) => `
        <div class="priority">

          <div class="priority-head">

            <span class="priority-num">
              ${i + 1}
            </span>

            <span class="priority-title">
              ${esc(p.title)}
            </span>

            <span class="badge ${badgeClass(p.priority)}">
              ${esc(p.priority)}
            </span>

          </div>

          <p>
            ${esc(p.body)}
          </p>

          ${
            p.why
              ? `
                <p class="muted">
                  <strong>Why this matters:</strong>
                  ${esc(p.why)}
                </p>
              `
              : ''
          }

        </div>
      `
    )
    .join('')

  const mitigationRows = (report.riskMitigation || [])
    .map(
      (m) => `
        <tr>

          <td>
            <span class="badge ${badgeClass(m.level)}">
              ${esc(m.risk)}
            </span>
          </td>

          <td>${esc(m.action)}</td>

          <td>${esc(m.owner)}</td>

          <td>${esc(m.timeframe)}</td>

        </tr>
      `
    )
    .join('')

  const roadmapCol = (label, items) => `
    <div class="roadmap-col">

      <div class="roadmap-label">
        ${esc(label)}
      </div>

      <ul>

        ${(items || [])
          .map(
            (item) =>
              `<li>${esc(item)}</li>`
          )
          .join('')}

      </ul>

    </div>
  `

  const quickWins = (report.quickWins || [])
    .map(
      (q) =>
        `<li><strong>${esc(q.title)}</strong></li>`
    )
    .join('')

  return `
    <section class="page-break">

      <div class="section-heading">
        <span>05</span>
        <div>
          <div class="section-kicker">
            MILESTONE 3
          </div>
          <h2>Strategic Intelligence</h2>
        </div>
      </div>

      <div class="verdict-block">

        <div>

          <div class="stat-label">
            Executive Strategic Verdict
          </div>

          <div class="verdict-value">
            ${esc(report.verdict || 'Strategic Review')}
          </div>

        </div>

        <div class="verdict-investor">

          <div class="stat-label">
            Investor Signal
          </div>

          <p>
            ${esc(
              report.investorSignal ||
              'Strategic investor assessment available in the dashboard.'
            )}
          </p>

        </div>

      </div>

      ${
        report.reasoning
          ? `
            <div class="reasoning">

              <div class="section-label">
                STRATEGIC REASONING
              </div>

              ${String(report.reasoning)
                .split('\n\n')
                .map(
                  (paragraph) =>
                    `<p>${esc(paragraph)}</p>`
                )
                .join('')}

            </div>
          `
          : ''
      }

      <h3>SWOT Synthesis</h3>

      <div class="swot-grid">

        ${swotBlock(
          'Strengths',
          report.swot?.strengths
        )}

        ${swotBlock(
          'Weaknesses',
          report.swot?.weaknesses
        )}

        ${swotBlock(
          'Opportunities',
          report.swot?.opportunities
        )}

        ${swotBlock(
          'Threats',
          report.swot?.threats
        )}

      </div>

      ${
        priorities
          ? `
            <h3>Top Strategic Priorities</h3>
            ${priorities}
          `
          : ''
      }

      ${
        mitigationRows
          ? `
            <h3>Risk → Mitigation Plan</h3>

            <div class="table-card">

              <table>

                <thead>
                  <tr>
                    <th>Risk</th>
                    <th>Mitigation Action</th>
                    <th>Owner</th>
                    <th>Timeframe</th>
                  </tr>
                </thead>

                <tbody>
                  ${mitigationRows}
                </tbody>

              </table>

            </div>
          `
          : ''
      }

      <h3>Improvement Roadmap</h3>

      <div class="roadmap-grid">

        ${roadmapCol(
          'Now · 0–14 days',
          report.roadmap?.now
        )}

        ${roadmapCol(
          'Next · 15–30 days',
          report.roadmap?.next
        )}

        ${roadmapCol(
          'Later · 31–90 days',
          report.roadmap?.later
        )}

      </div>

      ${
        quickWins
          ? `
            <h3>Quick Wins</h3>

            <ul class="quick-wins">
              ${quickWins}
            </ul>
          `
          : ''
      }

    </section>
  `
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function riskLevel(risk) {
  return (
    risk?.overallLevel ||
    risk?.level ||
    'MEDIUM'
  )
}

function badgeClass(level) {
  const normalized =
    String(level || '').toUpperCase()

  if (
    normalized === 'HIGH' ||
    normalized === 'CRITICAL'
  ) {
    return 'badge-danger'
  }

  if (
    normalized === 'MEDIUM' ||
    normalized === 'MODERATE'
  ) {
    return 'badge-amber'
  }

  return 'badge-accent'
}

// -----------------------------------------------------------------------------
// Report styles
// -----------------------------------------------------------------------------

function reportStyles() {
  return `
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    .report {
      width: 794px;
      min-height: 1123px;
      padding: 54px 52px 70px;
      background: #ffffff;
      color: #1b1e27;

      font-family:
        Inter,
        "Segoe UI",
        Arial,
        Helvetica,
        sans-serif;

      -webkit-font-smoothing: antialiased;
    }

    .cover {
      display: flex;
      align-items: center;
      justify-content: space-between;

      padding-bottom: 18px;
      margin-bottom: 34px;

      border-bottom: 2px solid #c6a15b;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-mark {
      width: 38px;
      height: 38px;

      display: flex;
      align-items: center;
      justify-content: center;

      border-radius: 10px;

      background:
        linear-gradient(
          135deg,
          #ddbe84,
          #c6a15b
        );

      color: #12151c;

      font-family: Georgia, serif;
      font-size: 16px;
      font-weight: 700;
    }

    .brand-name {
      font-size: 14px;
      font-weight: 700;
      color: #171a22;
    }

    .brand-sub {
      margin-top: 3px;

      font-size: 9px;
      letter-spacing: 0.16em;
      text-transform: uppercase;

      color: #7c8290;
    }

    .cover-meta {
      font-size: 9px;
      color: #7c8290;
    }

    .hero {
      margin-bottom: 22px;
    }

    .eyebrow,
    .section-kicker,
    .section-label {
      font-size: 8.5px;
      font-weight: 700;

      letter-spacing: 0.16em;
      text-transform: uppercase;

      color: #8f7238;
    }

    .hero h1 {
      margin: 7px 0 7px;

      font-family:
        Georgia,
        "Times New Roman",
        serif;

      font-size: 31px;
      line-height: 1.08;

      color: #171a22;
      letter-spacing: -0.02em;
    }

    .subtitle {
      margin: 0;

      font-size: 11px;
      line-height: 1.5;

      color: #5b6070;
    }

    .stat-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;

      margin: 18px 0;
    }

    .stat {
      flex: 1 1 150px;

      min-height: 66px;

      padding: 11px 13px;

      border: 1px solid #e3e1d8;
      border-radius: 9px;

      background: #fbfaf6;
    }

    .stat-label {
      margin-bottom: 5px;

      font-size: 8px;
      line-height: 1.2;

      letter-spacing: 0.12em;
      text-transform: uppercase;

      color: #8a8f9c;
    }

    .stat-value {
      font-family:
        Georgia,
        "Times New Roman",
        serif;

      font-size: 16px;
      font-weight: 600;

      color: #171a22;
    }

    .stat-value.accent {
      color: #8f7238;
    }

    .description-box {
      margin: 20px 0;

      padding: 14px 16px;

      border-left: 3px solid #c6a15b;
      border-radius: 6px;

      background: #f6f4ef;
    }

    .description-box p {
      margin: 7px 0 0;

      font-size: 10.5px;
      line-height: 1.65;

      color: #3f4351;
    }

    .executive-strip {
      display: flex;
      gap: 0;

      margin: 22px 0 32px;

      border: 1px solid #e2dfd5;
      border-radius: 9px;

      overflow: hidden;

      background: #ffffff;
    }

    .executive-strip > div {
      flex: 1;

      padding: 12px 14px;

      border-right: 1px solid #e5e2da;
    }

    .executive-strip > div:last-child {
      border-right: 0;
    }

    .strip-label {
      display: block;

      margin-bottom: 5px;

      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.1em;

      color: #8a8f9c;
    }

    .executive-strip strong {
      font-family: Georgia, serif;
      font-size: 14px;
      color: #252936;
    }

    section {
      margin-top: 34px;
    }

    .page-break {
      page-break-before: always;
    }

    .section-heading {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      margin-bottom: 17px;
    }

    .section-heading > span {
      display: flex;
      align-items: center;
      justify-content: center;

      width: 27px;
      height: 27px;

      border-radius: 8px;

      background: #f7f0df;
      color: #8f7238;

      font-family: Georgia, serif;
      font-size: 11px;
      font-weight: 700;
    }

    .section-heading h2 {
      margin: 3px 0 0;

      font-family:
        Georgia,
        "Times New Roman",
        serif;

      font-size: 20px;
      line-height: 1.15;

      color: #1b1e27;
    }

    .table-card {
      margin-top: 14px;

      border: 1px solid #e3e1d8;
      border-radius: 9px;

      overflow: hidden;

      background: #ffffff;
    }

    .table-title {
      padding: 10px 13px;

      border-bottom: 1px solid #e5e3dc;

      background: #fbfaf6;

      font-size: 9px;
      font-weight: 700;

      letter-spacing: 0.1em;
      text-transform: uppercase;

      color: #555b69;
    }

    table {
      width: 100%;
      border-collapse: collapse;

      font-size: 9.5px;
    }

    th {
      padding: 8px 9px;

      text-align: left;

      font-size: 7.5px;
      font-weight: 700;

      letter-spacing: 0.08em;
      text-transform: uppercase;

      color: #858a97;

      background: #fcfbf8;

      border-bottom: 1px solid #dedcd4;
    }

    td {
      padding: 8px 9px;

      vertical-align: top;

      line-height: 1.45;

      color: #383c48;

      border-bottom: 1px solid #eeece6;
    }

    tr:last-child td {
      border-bottom: 0;
    }

    .tabular {
      font-variant-numeric: tabular-nums;
    }

    .badge {
      display: inline-block;

      padding: 3px 8px;

      border-radius: 999px;

      font-size: 7.5px;
      font-weight: 700;

      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .badge-danger {
      background: #fbe4e6;
      color: #a23a47;
    }

    .badge-amber {
      background: #fbeeda;
      color: #92651c;
    }

    .badge-accent {
      background: #def2ef;
      color: #1d8578;
    }

    .readiness-hero {
      display: flex;
      align-items: center;
      justify-content: space-between;

      gap: 30px;

      margin: 14px 0;

      padding: 17px;

      border: 1px solid #e7d9b8;
      border-radius: 10px;

      background: #fbf7ee;
    }

    .readiness-score {
      margin-top: 3px;

      font-family: Georgia, serif;

      font-size: 28px;
      font-weight: 600;

      color: #8f7238;
    }

    .readiness-copy {
      max-width: 380px;

      font-size: 10px;
      line-height: 1.6;

      color: #555a68;
    }

    .score-bar {
      width: 100%;
      height: 6px;

      overflow: hidden;

      border-radius: 999px;

      background: #eeeae1;
    }

    .score-bar span {
      display: block;

      height: 100%;

      border-radius: inherit;

      background: #c6a15b;
    }

    .verdict-block {
      display: flex;
      justify-content: space-between;

      gap: 20px;

      padding: 16px;

      border: 1px solid #e7d9b8;
      border-radius: 10px;

      background: #fbf7ee;
    }

    .verdict-value {
      margin-top: 4px;

      font-family: Georgia, serif;

      font-size: 21px;
      font-weight: 600;

      color: #8f7238;
    }

    .verdict-investor {
      max-width: 330px;
    }

    .verdict-investor p {
      margin: 5px 0 0;

      font-size: 10px;
      line-height: 1.55;

      color: #4b4f5c;
    }

    .reasoning {
      margin-top: 15px;

      padding: 14px 16px;

      border-left: 3px solid #c6a15b;

      background: #f8f7f3;
    }

    .reasoning p {
      margin: 6px 0;

      font-size: 10px;
      line-height: 1.6;

      color: #33364a;
    }

    h3 {
      margin: 21px 0 10px;

      font-size: 9px;
      font-weight: 700;

      letter-spacing: 0.1em;
      text-transform: uppercase;

      color: #55596a;
    }

    .swot-grid {
      display: grid;

      grid-template-columns: 1fr 1fr;

      gap: 10px;
    }

    .swot-col {
      min-height: 90px;

      padding: 11px 12px;

      border: 1px solid #e5e3da;
      border-radius: 8px;

      background: #ffffff;
    }

    .swot-label {
      font-size: 9px;
      font-weight: 700;

      letter-spacing: 0.07em;
      text-transform: uppercase;

      color: #8f7238;
    }

    .swot-col ul,
    .roadmap-col ul {
      margin: 6px 0 0;
      padding-left: 15px;
    }

    .swot-col li,
    .roadmap-col li {
      margin-bottom: 4px;

      font-size: 9.5px;
      line-height: 1.45;

      color: #434652;
    }

    .priority {
      margin-bottom: 8px;

      padding: 11px 12px;

      border: 1px solid #e5e3da;
      border-radius: 8px;

      background: #ffffff;
    }

    .priority-head {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .priority-num {
      color: #c6a15b;

      font-family: Georgia, serif;

      font-size: 12px;
      font-weight: 700;
    }

    .priority-title {
      flex: 1;

      font-size: 10.5px;
      font-weight: 600;

      color: #252936;
    }

    .priority p {
      margin: 5px 0 0;

      font-size: 9.5px;
      line-height: 1.5;

      color: #3b3e49;
    }

    .muted {
      color: #7b7f8c;
    }

    .roadmap-grid {
      display: grid;

      grid-template-columns: repeat(3, 1fr);

      gap: 10px;
    }

    .roadmap-col {
      padding: 10px;

      border: 1px solid #e5e3da;
      border-top: 3px solid #c6a15b;
      border-radius: 7px;

      background: #fbfaf6;
    }

    .roadmap-label {
      margin-bottom: 3px;

      font-size: 8.5px;
      font-weight: 700;

      text-transform: uppercase;
      letter-spacing: 0.06em;

      color: #55596a;
    }

    .quick-wins {
      margin: 0;
      padding-left: 17px;
    }

    .quick-wins li {
      margin-bottom: 5px;

      font-size: 9.5px;
      line-height: 1.45;

      color: #3b3e49;
    }

    .footer {
      margin-top: 36px;

      padding-top: 12px;

      border-top: 1px solid #e3e1d8;

      font-size: 8px;
      line-height: 1.5;

      color: #9aa0ac;

      text-align: center;
    }
  `
}
