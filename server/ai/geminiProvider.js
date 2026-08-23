// Calls Google's Gemini API directly over REST using the built-in `fetch`
// (Node 18+). No SDK dependency — keeps the install surface small.

export async function callGemini(prompt, model) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json'
      }
    })
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Gemini API error (${res.status}): ${body.slice(0, 300)}`)
  }

  const json = await res.json()
  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n')
  if (!text) throw new Error('Gemini returned no content (possibly blocked by safety filters).')
  return text
}
