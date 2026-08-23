import 'dotenv/config'

// --- Milestone 3: AI provider abstraction -------------------------------
// Supports Gemini and OpenAI via plain REST calls (Node 22 has global fetch,
// so no extra SDK dependency is required). If no key is configured, or the
// live call fails for any reason, callers fall back to a deterministic
// reasoning engine — the app must never break just because a key is missing
// or a quota is hit.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

function resolveProvider() {
  const explicit = (process.env.AI_PROVIDER || '').trim().toLowerCase()
  if (explicit === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini'
  if (explicit === 'openai' && process.env.OPENAI_API_KEY) return 'openai'
  if (explicit && explicit !== 'none') {
    // Explicit provider requested but its key is missing — fall through to
    // whatever key *is* present rather than silently ignoring the intent.
  }
  if (process.env.GEMINI_API_KEY) return 'gemini'
  if (process.env.OPENAI_API_KEY) return 'openai'
  return 'none'
}

export function getAIConfig() {
  const provider = resolveProvider()
  return {
    configured: provider !== 'none',
    provider,
    model: provider === 'gemini' ? GEMINI_MODEL : provider === 'openai' ? OPENAI_MODEL : null
  }
}

/**
 * Calls the configured AI provider with a prompt and returns plain text.
 * Returns { text, provider, model } on success.
 * Throws on failure — callers are expected to catch and fall back.
 */
export async function generateText(prompt, { system } = {}) {
  const { provider, model } = getAIConfig()

  if (provider === 'gemini') {
    const text = await callGemini(prompt, system, model)
    return { text, provider, model }
  }

  if (provider === 'openai') {
    const text = await callOpenAI(prompt, system, model)
    return { text, provider, model }
  }

  throw new Error('No AI provider configured')
}

async function callGemini(prompt, system, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.45, maxOutputTokens: 700 }
  }
  if (system) body.systemInstruction = { parts: [{ text: system }] }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Gemini API error (${res.status}): ${errBody.slice(0, 300)}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n').trim()
  if (!text) throw new Error('Gemini returned an empty response')
  return text
}

async function callOpenAI(prompt, system, model) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: 0.45,
      max_tokens: 700
    })
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`OpenAI API error (${res.status}): ${errBody.slice(0, 300)}`)
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('OpenAI returned an empty response')
  return text
}
