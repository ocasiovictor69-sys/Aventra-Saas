import { AgentRunner } from './base'
import type { AgentInput, AgentResult, EscalationLevel } from './types'

export class AgentArrears extends AgentRunner {
  async run(input: AgentInput): Promise<AgentResult> {
    const { team_id } = input

    try {
      // 1. Fetch Late Leases (Mocking the query for the reconstruction phase)
      const { data: arrears, error } = await this.db
        .from('arrears_logs')
        .select('*, tenants(*)')
        .eq('team_id', team_id)
        .in('escalation_status', ['GRACE_PERIOD', 'NOTICE_SENT'])

      if (error) throw error

      let actionsTaken = 0

      for (const log of arrears || []) {
        let nextStatus: EscalationLevel = log.escalation_status
        
        if (log.days_late > 30) nextStatus = 'LEGAL_REVIEW'
        else if (log.days_late > 10) nextStatus = 'NOTICE_SENT'

        if (nextStatus !== log.escalation_status) {
          await this.db
            .from('arrears_logs')
            .update({ escalation_status: nextStatus, updated_at: new Date().toISOString() })
            .eq('id', log.id)
          
          await this.logAudit(team_id, 'ARREARS_ESCALATED', { from: log.escalation_status, to: nextStatus }, log.property_id)
          actionsTaken++
        }
      }

      return {
        success: true,
        agent: 'AgentArrears',
        action_taken: 'arrears_audit_complete',
        payload: { escalated_count: actionsTaken }
      }

    } catch (err) {
      return { success: false, agent: 'AgentArrears', action_taken: 'failed', error: (err as Error).message }
    }
  }
}
