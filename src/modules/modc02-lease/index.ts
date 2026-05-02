import { AventraServices, ModuleResult } from '../../lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LeaseInputs {
  tenant_id: string
  tenant_email: string
  property_id: string
  rent_amount: number
  lease_term: number
}

export interface LeaseResult extends ModuleResult {
  lease_url?: string
}

// ── Module Execution ──────────────────────────────────────────────────────────

export async function execute(
  inputs: LeaseInputs,
  db: any,
  services: AventraServices
): Promise<LeaseResult> {
  const { tenant_id, tenant_email, property_id, rent_amount, lease_term } = inputs

  console.log(`[MOD-C02] Generating Lease for tenant: ${tenant_id} at property: ${property_id}`)

  // 1. Strict Service Validation
  if (!services.memory || !services.legal) {
    return { success: false, transition: 'MOD-HALT', error: 'SERVICE_MISSING: Module requires Memory and Legal services' }
  }

  // 2. Execution: Generate Lease PDF
  const leaseRes = await services.legal.generateLease({
    tenant_id,
    property_id,
    rent_amount,
    lease_term,
    generated_at: new Date().toISOString()
  })

  // 3. Execution: Dispatch for E-Sign
  const signRes = await services.legal.dispatchESign(leaseRes.pdfUrl, tenant_email)

  if (!signRes.ok) {
    return { success: false, transition: 'MOD-HALT', error: 'DISPATCH_FAIL: E-sign dispatch failed' }
  }

  // 4. Memory Layer: Working Context (Zep)
  await services.memory.captureContext({
    type: 'lease_dispatched',
    tenant_id,
    property_id,
    lease_url: leaseRes.pdfUrl,
    timestamp: new Date().toISOString()
  })

  return {
    success: true,
    lease_url: leaseRes.pdfUrl,
    transition: 'MOD-FINISHED'
  }
}
