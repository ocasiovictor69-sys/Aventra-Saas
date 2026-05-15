export type AgentUrgency = 'info' | 'action_required' | 'warning' | 'critical'

export type AgentNotification = {
  target: string
  message: string
  action_url?: string
  urgency: AgentUrgency
}

export type AgentResult = {
  success: boolean
  agent: string
  action_taken: string
  notification?: AgentNotification
  error?: string
  payload?: Record<string, any>
}

export type AgentInput = {
  property_id?: string
  tenant_id?: string
  lease_id?: string
  team_id: string
  trigger: 'event' | 'cron' | 'manual'
  payload?: Record<string, any>
}

// --- MOD-C Specific Types (Asset Management) ---

export type EscalationLevel = 'GRACE_PERIOD' | 'NOTICE_SENT' | 'LEGAL_REVIEW' | 'EVICTION_FILED'

export type ArrearsReport = {
  property_id: string
  tenant_id: string
  amount_due: number
  days_late: number
  escalation: EscalationLevel
}

export type ComplianceAudit = {
  property_id: string
  pass_score: number
  failed_points: string[]
  is_compliant: boolean
}
