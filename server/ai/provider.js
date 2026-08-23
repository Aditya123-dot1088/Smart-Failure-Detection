import { callGemini } from './geminiProvider.js'
import { callOpenAI } from './openaiProvider.js'

/**
 * AI provider abstraction.
 *
 * The rest of the app never talks to Gemini/OpenAI directly — it calls
 * `generateStrategicJSON(prompt)` and gets back { ok, data, provider, model, raw }.
 * If no key is configured, or the call fails/times out, `ok` is false and the
 * caller (server/strategy/graph.js) falls back to the deterministic engine.
 *
 * API keys are read from process.env only — never sent to the client.
 */

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 20000

function configuredProvider() {
  const provider = (process.env.AI_PROVIDER || '').toLowerCase().trim()
  if (provider === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini'
  if (provider === 'openai' && process.env.OPENAI_API_KEY) return 'openai'

  // No explicit AI_PROVIDER, or the requested one has no key — auto-detect
  if (process.env.GEMINI_API_KEY) return 'gemini'
  if (process.env.OPENAI_API_KEY) return 'openai'
  return null
}

export function providerStatus() {
  const provider = configuredProvider()
  return {
    configured: !!provider,
    provider: provider || 'none',
    model: provider === 'gemini'
      ? (process.env.GEMINI_MODEL || 'gemini-1.5-flash')
      : provider === 'openai'
        ? (process.env.OPENAI_MODEL || 'gpt-4o-mini')
        : null
  }
}

function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`AI request timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/**
 * Sends a prompt that instructs the model to return ONLY JSON, and parses it.
 * Returns { ok: true, data, provider, model } or { ok: false, error, provider }.
 */
export async function generateStrategicJSON(prompt) {
  const provider = configuredProvider()
  if (!provider) {
    return { ok: false, error: 'No AI provider configured (missing GEMINI_API_KEY / OPENAI_API_KEY).', provider: 'none' }
  }

  try {
    const model = provider === 'gemini'
      ? (process.env.GEMINI_MODEL || 'gemini-1.5-flash')
      : (process.env.OPENAI_MODEL || 'gpt-4o-mini')

    const rawText = provider === 'gemini'
      ? await withTimeout(callGemini(prompt, model), TIMEOUT_MS)
      : await withTimeout(callOpenAI(prompt, model), TIMEOUT_MS)

    const data = extractJSON(rawText)
    if (!data) {
      return { ok: false, error: 'AI response did not contain valid JSON.', provider, model, raw: rawText }
    }
    return { ok: true, data, provider, model }
  } catch (err) {
    return { ok: false, error: err.message || String(err), provider }
  }
}

// Models sometimes wrap JSON in prose or ```json fences — strip and parse defensively.
function extractJSON(text) {
  if (!text) return null
  let candidate = text.trim()
  const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) candidate = fenced[1].trim()

  const firstBrace = candidate.indexOf('{')
  const lastBrace = candidate.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null
  candidate = candidate.slice(firstBrace, lastBrace + 1)

  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}
