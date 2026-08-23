// Calls OpenAI's Chat Completions API directly over REST using the built-in
// `fetch` (Node 18+). No SDK dependency — keeps the install surface small.

export async function callOpenAI(prompt, model) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a startup strategy analyst. Always reply with a single valid JSON object and nothing else.' },
        { role: 'user', content: prompt }
      ]
    })
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`OpenAI API error (${res.status}): ${body.slice(0, 300)}`)
  }

  const json = await res.json()
  const text = json?.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenAI returned no content.')
  return text
}
