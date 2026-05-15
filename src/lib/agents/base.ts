import { SupabaseClient } from '@supabase/supabase-js'
import { AgentInput, AgentResult } from './types'

export abstract class AgentRunner {
  protected db: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.db = supabase
  }

  abstract run(input: AgentInput): Promise<AgentResult>

  protected async logAudit(team_id: string, event: string, metadata: any, property_id?: string) {
    const { error } = await this.db
      .from('underwriting_logs') // Reusing the same audit table name for consistency
      .insert({
        team_id,
        property_id,
        event_type: event,
        metadata,
        created_at: new Date().toISOString()
      })
    
    if (error) console.error(`[Audit Log Error] ${error.message}`)
  }
}
