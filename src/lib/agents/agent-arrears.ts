import { AgentRunner } from './base'
import type { AgentInput, AgentResult } from './types'

export class AgentArrears extends AgentRunner {
  async run(input: AgentInput): Promise<AgentResult> {
    const { team_id } = input

    try {
      // DETERMINISTIC: Real query for tenants in arrears
      const { data: arrears, error } = await this.db
        .from('tenants')
        .select('*')
        .eq('team_id', team_id)
        .gt('arrears_balance', 0)
        .order('arrears_balance', { ascending: false })

      if (error) throw error

      await this.logAudit(team_id, 'ARREARS_AUDIT_COMPLETE', { count: arrears?.length ?? 0 })

      return {
        success: true,
        agent: 'AgentArrears',
        action_taken: 'arrears_audit_complete',
        payload: {
          arrears_count: arrears?.length ?? 0,
          tenants: arrears?.map(t => t.id)
        }
      }
    } catch (err) {
      return { success: false, agent: 'AgentArrears', action_taken: 'failed', error: (err as Error).message }
    }
  }
}
