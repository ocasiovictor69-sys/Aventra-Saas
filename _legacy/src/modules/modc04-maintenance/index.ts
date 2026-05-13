import { AventraServices, ModuleResult } from '../../lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MaintenanceInputs {
  property_id: string
  issue_description: string
  urgency: 'low' | 'medium' | 'high'
}

export interface MaintenanceResult extends ModuleResult {
  vendor_category?: string
  status?: string
}

// ── Module Execution ──────────────────────────────────────────────────────────

export async function execute(
  inputs: MaintenanceInputs,
  db: any,
  services: AventraServices
): Promise<MaintenanceResult> {
  const { property_id, issue_description, urgency } = inputs

  console.log(`[MOD-C04] Maintenance Request for property: ${property_id} | Urgency: ${urgency}`)

  // 1. Strict Service Validation
  if (!services.memory) {
    return { success: false, transition: 'MOD-HALT', error: 'SERVICE_MISSING: Module requires Memory service' }
  }

  // 2. Logic: Determine Vendor Category (Simplified Claude Simulation)
  let vendor_category = 'GENERAL_CONTRACTOR'
  const desc = issue_description.toLowerCase()

  if (desc.includes('water') || desc.includes('leak') || desc.includes('pipe')) {
    vendor_category = 'PLUMBING'
  } else if (desc.includes('electric') || desc.includes('light') || desc.includes('outlet')) {
    vendor_category = 'ELECTRICAL'
  } else if (desc.includes('hvac') || desc.includes('ac') || desc.includes('heat')) {
    vendor_category = 'HVAC'
  }

  // 3. Memory Layer: Working Context (Zep)
  await services.memory.captureContext({
    type: 'maintenance_dispatched',
    property_id,
    vendor_category,
    urgency,
    timestamp: new Date().toISOString()
  })

  return {
    success: true,
    vendor_category,
    status: 'DISPATCHED',
    transition: 'MOD-FINISHED'
  }
}
