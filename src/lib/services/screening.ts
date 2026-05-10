/**
 * Aventra Screening Service
 *
 * Credit and background check integration.
 * TODO: Wire to Experian or TransUnion when credentials are available.
 *
 * Env vars required (when live):
 *   SCREENING_API_KEY   — credit bureau API key
 *   SCREENING_BASE_URL  — bureau endpoint
 */

export function buildScreeningClient() {
  const apiKey = process.env.SCREENING_API_KEY

  if (!apiKey) {
    console.warn('[Services] SCREENING_API_KEY not set — using structured placeholder')
    return {
      runCreditCheck: async (ssn: string): Promise<{ score: number; pass: boolean }> => {
        console.log(`[Screening] Credit check placeholder for SSN ending: ${ssn.slice(-4)}`)
        // TODO: Replace with real Experian/TransUnion API call
        return { score: 0, pass: false }
      },
      runBackgroundCheck: async (id: string): Promise<{ flags: string[]; pass: boolean }> => {
        console.log(`[Screening] Background check placeholder for tenant: ${id}`)
        // TODO: Replace with real background check provider API call
        return { flags: ['PENDING_INTEGRATION'], pass: false }
      },
    }
  }

  return {
    runCreditCheck: async (ssn: string): Promise<{ score: number; pass: boolean }> => {
      const res = await fetch(`${process.env.SCREENING_BASE_URL}/credit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body:    JSON.stringify({ ssn_last_4: ssn }),
      })
      if (!res.ok) throw new Error(`SCREENING_ERROR: ${res.status}`)
      const data = await res.json()
      return { score: data.score, pass: data.score >= 650 }
    },
    runBackgroundCheck: async (id: string): Promise<{ flags: string[]; pass: boolean }> => {
      const res = await fetch(`${process.env.SCREENING_BASE_URL}/background`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body:    JSON.stringify({ tenant_id: id }),
      })
      if (!res.ok) throw new Error(`SCREENING_ERROR: ${res.status}`)
      const data = await res.json()
      return { flags: data.flags ?? [], pass: data.pass }
    },
  }
}
