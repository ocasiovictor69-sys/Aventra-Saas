import { AventraServices, ModuleResult } from '../../lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScreeningInputs {
  tenant_id: string
  ssn_last_4: string
  monthly_income: number
  credit_score_min?: number
}

export interface ScreeningResult extends ModuleResult {
  decision?: 'PASS' | 'FAIL'
  credit_score?: number
  flags?: string[]
}

// ── Module Execution ──────────────────────────────────────────────────────────

export async function execute(
  inputs: ScreeningInputs,
  db: any,
  services: AventraServices
): Promise<ScreeningResult> {
  const { tenant_id, ssn_last_4, monthly_income, credit_score_min = 650 } = inputs

  console.log(`[MOD-C01] Initiating Tenant Screening for tenant: ${tenant_id}`)

  // 1. Strict Service Validation
  if (!services.memory || !services.screening) {
    return { success: false, transition: 'MOD-HALT', error: 'SERVICE_MISSING: Module requires Memory and Screening services' }
  }

  // 2. Validation Gate
  if (!tenant_id || !ssn_last_4 || !monthly_income) {
    return { success: false, transition: 'MOD-HALT', error: 'VALIDATION_FAIL: Missing required screening fields' }
  }

  // 3. Execution: Run Credit & Background Checks
  const creditRes = await services.screening.runCreditCheck(ssn_last_4)
  const backgroundRes = await services.screening.runBackgroundCheck(tenant_id)

  const decision = (creditRes.pass && backgroundRes.pass && creditRes.score >= credit_score_min) ? 'PASS' : 'FAIL'

  console.log(`[MOD-C01] Credit Score: ${creditRes.score} | Decision: ${decision}`)

  // 4. Memory Layer: Working Context (Zep)
  await services.memory.captureContext({
    type: 'tenant_screening_completed',
    tenant_id,
    decision,
    credit_score: creditRes.score,
    timestamp: new Date().toISOString()
  })

  // 5. Memory Layer: Permanent Graph (Neo4j)
  await services.memory.mapRelationships({
    tenant_id,
    event: 'SCREENING_DECISION',
    decision
  })

  // 6. Persistence
  await db
    .from('tenants')
    .update({ 
      screening_status: decision,
      credit_score: creditRes.score,
      background_flags: backgroundRes.flags,
      screened_at: new Date().toISOString()
    })
    .eq('id', tenant_id)

  return {
    success: true,
    decision,
    credit_score: creditRes.score,
    flags: backgroundRes.flags,
    transition: decision === 'PASS' ? 'MOD-C02' : 'MOD-HALT'
  }
}
