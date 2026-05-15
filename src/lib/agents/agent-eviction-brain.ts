import { AgentRunner } from './base'
import type { AgentInput, AgentResult, PropertyDossier } from './types'

export class C05_EvictionBrain extends AgentRunner {
  async run(input: AgentInput): Promise<AgentResult> {
    const { team_id, property_id, payload } = input
    const dossier = payload?.dossier as PropertyDossier

    if (!property_id || !dossier) {
      return { success: false, agent: 'C05_EvictionBrain', action_taken: 'failed', error: 'property_id and dossier required' }
    }

    try {
      // DETERMINISTIC: Structural legal analysis based on arrears/days_late
      const recommendation = dossier.arrears_balance > 2500 || dossier.days_late > 45 
        ? 'INITIATE_LEGAL_FILING' 
        : 'SEND_COURTESY_NOTICE'

      await this.logAudit(team_id, 'LEGAL_ANALYSIS_COMPLETE', { property_id, recommendation }, property_id)

      return {
        success: true,
        agent: 'C05_EvictionBrain',
        action_taken: 'analysis_complete',
        payload: {
          module_id: 'C05',
          recommendation,
          hitl_required: true
        }
      }
    } catch (err) {
      return { success: false, agent: 'C05_EvictionBrain', action_taken: 'failed', error: (err as Error).message }
    }
  }
}
