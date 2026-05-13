/**
 * Aventra Legal Service
 *
 * Lease generation and e-signature dispatch.
 * TODO: Wire to DocuSign when account is ready.
 *
 * Env vars required (when live):
 *   DOCUSIGN_API_KEY        — DocuSign integration key
 *   DOCUSIGN_ACCOUNT_ID     — DocuSign account ID
 *   DOCUSIGN_BASE_URL       — DocuSign base URL
 */

export function buildLegalClient() {
  const apiKey    = process.env.DOCUSIGN_API_KEY
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID
  const baseUrl   = process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi/v2.1'

  if (!apiKey || !accountId) {
    console.warn('[Services] DOCUSIGN_API_KEY not set — using structured placeholder')
    return {
      generateLease: async (data: any): Promise<{ pdfUrl: string }> => {
        console.log(`[Legal] Lease generation placeholder for tenant: ${data.tenant_id}`)
        // TODO: Replace with real DocuSign envelope creation
        return { pdfUrl: `https://placeholder.aventra.io/leases/${data.tenant_id}-${Date.now()}.pdf` }
      },
      dispatchESign: async (url: string, email: string): Promise<{ ok: boolean }> => {
        console.log(`[Legal] E-sign dispatch placeholder → ${email} for ${url}`)
        // TODO: Replace with real DocuSign envelope send
        return { ok: false }
      },
    }
  }

  return {
    generateLease: async (data: any): Promise<{ pdfUrl: string }> => {
      const res = await fetch(`${baseUrl}/accounts/${accountId}/envelopes`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          emailSubject: 'Your Lease Agreement',
          documents: [{
            documentBase64: Buffer.from(JSON.stringify(data)).toString('base64'),
            name:           'Lease Agreement',
            fileExtension:  'pdf',
            documentId:     '1',
          }],
          recipients: { signers: [] },
          status: 'created',
        }),
      })
      if (!res.ok) throw new Error(`DOCUSIGN_ERROR: ${res.status}`)
      const envelope = await res.json()
      return { pdfUrl: `${baseUrl}/accounts/${accountId}/envelopes/${envelope.envelopeId}/documents/1` }
    },
    dispatchESign: async (url: string, email: string): Promise<{ ok: boolean }> => {
      const envelopeId = url.split('/envelopes/')[1]?.split('/')[0]
      if (!envelopeId) return { ok: false }
      const res = await fetch(`${baseUrl}/accounts/${accountId}/envelopes/${envelopeId}`, {
        method:  'PUT',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          status: 'sent',
          recipients: {
            signers: [{
              email,
              name:        email,
              recipientId: '1',
              routingOrder: '1',
            }],
          },
        }),
      })
      return { ok: res.ok }
    },
  }
}
