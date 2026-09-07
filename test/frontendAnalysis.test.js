import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { inr, generateMarketData, computeRisk, computeRecommendations, computeReadiness } from '../src/utils/analysis.js'
import { SECTORS } from '../src/data/sectors.js'

describe('INR Currency Formatter (inr)', () => {
  test('formats positive numbers correctly into INR Crores', () => {
    assert.equal(inr(18500), '₹18,500 Cr')
    assert.equal(inr(92), '₹92 Cr')
    assert.equal(inr(0), '₹0 Cr')
  })

  test('rounds floating numbers gracefully', () => {
    assert.equal(inr(1234.56), '₹1,235 Cr')
  })

  test('handles null, undefined, and NaN with clean placeholder', () => {
    assert.equal(inr(null), '—')
    assert.equal(inr(undefined), '—')
    assert.equal(inr(NaN), '—')
  })
})

describe('Sectors Data Integrity (sectors.js)', () => {
  test('all registered sectors have valid market sizing and competitors', () => {
    const sectorKeys = Object.keys(SECTORS)
    assert.ok(sectorKeys.length >= 6, 'Contains at least 6 core sectors')

    sectorKeys.forEach((key) => {
      const sector = SECTORS[key]
      assert.ok(typeof sector.tamCr === 'number' && sector.tamCr > 0, `${key} has positive tamCr`)
      assert.ok(sector.samShare > 0 && sector.samShare < 1, `${key} has valid samShare (0-1)`)
      assert.ok(sector.somShare > 0 && sector.somShare < 1, `${key} has valid somShare (0-1)`)
      assert.ok(typeof sector.tamGrowth === 'number', `${key} has tamGrowth`)
      assert.ok(typeof sector.samGrowth === 'number', `${key} has samGrowth`)
      assert.ok(Array.isArray(sector.competitors) && sector.competitors.length >= 2, `${key} has at least 2 competitors`)

      sector.competitors.forEach((comp) => {
        assert.ok(comp.name, `${key} competitor has name`)
        assert.ok(typeof comp.share === 'number' && comp.share > 0, `${key} competitor has share`)
      })
    })
  })
})

describe('Market Data Generation (generateMarketData)', () => {
  test('computes TAM, SAM, SOM and 7-year trend for FinTech with 50 Lakh budget', () => {
    const market = generateMarketData('FinTech', 50)

    assert.equal(market.sectorName, 'FinTech')
    assert.equal(market.tam, 312000)
    assert.equal(market.sam, 312000 * 0.21)
    assert.ok(market.som > 0, 'SOM is positive')
    assert.equal(market.trend.length, 7, 'Generates 7-year trajectory (2020-2026)')
    assert.equal(market.trend[0].year, 2020)
    assert.equal(market.trend[6].year, 2026)
    assert.ok(market.topShare >= 30, 'Calculates category leader share')
    assert.equal(market.competitors[0].name, 'PhonePe', 'Leader is PhonePe')
  })

  test('scales SOM up with higher budget and down with lower budget', () => {
    const highBudget = generateMarketData('FinTech', 100)
    const lowBudget = generateMarketData('FinTech', 10)
    assert.ok(highBudget.som > lowBudget.som, 'Higher budget yields higher initial SOM capture')
  })

  test('falls back gracefully to first sector if invalid sector provided', () => {
    const fallback = generateMarketData('NonExistentSector', 25)
    assert.ok(fallback.tam > 0, 'Falls back to valid sector')
    assert.equal(fallback.sectorName, 'NonExistentSector')
  })
})

describe('Automated Risk Assessment Engine (computeRisk)', () => {
  const sampleInput = {
    name: 'LogiFast',
    sector: 'Logistics',
    businessModel: 'On-Demand',
    budgetLakh: '30'
  }
  const sampleMarket = generateMarketData('Logistics', 30)

  test('calculates 5 core risk categories with scores and levels', () => {
    const risk = computeRisk(sampleInput, sampleMarket)

    assert.equal(risk.categories.length, 5, 'Contains 5 categories')
    const keys = risk.categories.map((c) => c.key)
    assert.deepEqual(keys, ['market', 'competitive', 'financial', 'technical', 'regulatory'])

    risk.categories.forEach((cat) => {
      assert.ok(cat.score >= 0 && cat.score <= 100, `${cat.label} score is 0-100`)
      assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(cat.level), `${cat.label} level is valid`)
      assert.ok(cat.message && cat.message.length > 10, `${cat.label} has contextual message`)
    })

    assert.ok(risk.overallScore >= 0 && risk.overallScore <= 100, 'Overall score is 0-100')
    assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(risk.overallLevel), 'Overall level is valid')
    assert.ok(typeof risk.criticalFlags === 'number', 'Critical flags count is numeric')
    assert.ok(risk.marketFit >= 45 && risk.marketFit <= 96, 'Market fit score is clamped properly')
  })

  test('financial risk elevates with low budget against high SAM', () => {
    const lowBudgetRisk = computeRisk({ ...sampleInput, budgetLakh: '5' }, sampleMarket)
    const highBudgetRisk = computeRisk({ ...sampleInput, budgetLakh: '50000' }, sampleMarket)

    const finLow = lowBudgetRisk.categories.find((c) => c.key === 'financial').score
    const finHigh = highBudgetRisk.categories.find((c) => c.key === 'financial').score
    assert.ok(finLow > finHigh, `Low budget (${finLow}) creates higher financial risk score than high budget (${finHigh})`)
  })

  test('regulatory risk elevates for FinTech and HealthTech vs SaaS', () => {
    const fintechMarket = generateMarketData('FinTech', 50)
    const saasMarket = generateMarketData('SaaS / B2B', 50)

    const fintechRisk = computeRisk({ name: 'F', businessModel: 'SaaS', budgetLakh: 50 }, fintechMarket)
    const saasRisk = computeRisk({ name: 'S', businessModel: 'SaaS', budgetLakh: 50 }, saasMarket)

    const regFintech = fintechRisk.categories.find((c) => c.key === 'regulatory').score
    const regSaas = saasRisk.categories.find((c) => c.key === 'regulatory').score
    assert.ok(regFintech > regSaas, 'Fintech has higher regulatory risk than SaaS')
  })
})

describe('Recommendations Engine (computeRecommendations)', () => {
  test('generates prioritized recommendations addressing detected risks', () => {
    const market = generateMarketData('HealthTech', 20)
    const risk = computeRisk({ name: 'CareAI', sector: 'HealthTech', businessModel: 'Marketplace', budgetLakh: '20' }, market)
    const recs = computeRecommendations(risk, market, { budgetLakh: '20' })

    assert.ok(recs.length >= 4, 'Generates at least 4 action items')
    recs.forEach((rec) => {
      assert.ok(rec.title, 'Recommendation has title')
      assert.ok(rec.body, 'Recommendation has body text')
      assert.ok(['High', 'Medium'].includes(rec.impact), 'Has valid impact')
      assert.ok(['Low', 'Medium'].includes(rec.effort), 'Has valid effort')
      assert.ok(['CRITICAL', 'HIGH', 'MODERATE'].includes(rec.priority), 'Has valid priority')
    })

    // FinTech/HealthTech with high regulatory risk includes compliance scoping
    assert.ok(recs.some((r) => r.title.includes('compliance') || r.title.includes('Compliance')), 'Includes compliance recommendation')
  })
})

describe('Launch Readiness Engine (computeReadiness)', () => {
  test('computes overall readiness and 4 dimension breakdowns', () => {
    const market = generateMarketData('E-commerce', 40)
    const risk = computeRisk({ name: 'ShopKart', sector: 'E-commerce', businessModel: 'D2C / Direct Sales', budgetLakh: '40' }, market)
    const readiness = computeReadiness(risk)

    assert.ok(readiness.overall >= 0 && readiness.overall <= 100, 'Overall readiness is 0-100')
    assert.equal(readiness.breakdown.length, 4, 'Has 4 readiness dimensions')

    const labels = readiness.breakdown.map((b) => b.label)
    assert.deepEqual(labels, [
      'Market Validation',
      'Competitive Position',
      'Financial Model',
      'Technical Readiness'
    ])

    readiness.breakdown.forEach((dim) => {
      assert.ok(dim.value >= 25 && dim.value <= 96, `${dim.label} value is in range`)
    })
  })
})
