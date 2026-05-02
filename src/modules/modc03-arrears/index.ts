import { AventraServices, ModuleResult } from '../../lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ArrearsInputs {
  tenant_id: string
  balance: number
  days_overdue: number
}

export interface ArrearsResult extends ModuleResult {
  tier?: number
  action_taken?: string
}

// ── Module Execution ──────────────────────────────────────────────────────────

export async function execute(
  inputs: ArrearsInputs,
  db: any,
  services: AventraServices
): Promise<ArrearsResult> {
  const { tenant_id, balance, days_overdue } = inputs

  console.log(`[MOD-C03] Processing Arrears for tenant: ${tenant_id} | Balance: ${balance}`)

  // 1. Strict Service Validation
  if (!services.memory) {
    return { success: false, transition: 'MOD-HALT', error: 'SERVICE_MISSING: Module requires Memory service' }
  }

  // 2. Logic: Determine Escalation Tier
  let tier = 1
  let action_taken = 'SMS_REMINDER'

  if (days_overdue > 30 || balance < -2500) {
    tier = 2
    action_taken = 'PDF_LATE_NOTICE'
  }

  if (days_overdue > 60 || balance < -4500) {
    tier = 3
    action_taken = 'LEGAL_ESCALATION'
  }

  // 3. Memory Layer: Permanent Graph (Neo4j)
  await services.memory.mapRelationships({
    tenant_id,
    event: `ARREARS_LEVEL_${tier}`,
    action: action_taken,
    timestamp: new Date().toISOString()
  })

  return {
    success: true,
    tier,
    action_taken,
    transition: tier === 3 ? 'MOD-HALT' : 'MOD-FINISHED'
  }
}
