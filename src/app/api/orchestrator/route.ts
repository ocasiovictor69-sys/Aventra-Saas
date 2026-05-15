import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AgentArrears } from '@/lib/agents/agent-arrears'
import { AgentLease } from '@/lib/agents/agent-lease'
import { AgentCompliance } from '@/lib/agents/agent-compliance'
import { AgentScreening } from '@/lib/agents/agent-screening'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    const secret = process.env.ORCHESTRATOR_SECRET

    // HARDENED: Zero-Bypass Auth
    if (!secret || authHeader !== `Bearer ${secret}`) {
      console.error('[Aventra Orchestrator] Unauthorized access attempt.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const now = new Date().toISOString()
    const results = []

    const body = await request.json()
    const { action, team_id } = body

    if (!team_id) {
      return NextResponse.json({ error: 'team_id required' }, { status: 400 })
    }

    // 1. ARREARS WORKFLOW (MOD-C03)
    if (action === 'PROCESS_ARREARS') {
      const agent = new AgentArrears(supabase)
      const res = await agent.run({ team_id, trigger: 'cron' })
      results.push(res)
    }

    // 2. LEASE AUDIT WORKFLOW (MOD-C02)
    if (action === 'AUDIT_LEASES') {
      const agent = new AgentLease(supabase)
      const res = await agent.run({ team_id, trigger: 'cron' })
      results.push(res)
    }

    // 3. COMPLIANCE WORKFLOW (MOD-C04)
    if (action === 'RUN_COMPLIANCE') {
      const agent = new AgentCompliance(supabase)
      const res = await agent.run({ team_id, trigger: 'cron' })
      results.push(res)
    }

    // 4. SCREENING WORKFLOW (MOD-C01)
    if (action === 'PROCESS_SCREENING') {
      const agent = new AgentScreening(supabase)
      const { tenant_id } = body
      const res = await agent.run({ team_id, tenant_id, trigger: 'manual' })
      results.push(res)
    }

    return NextResponse.json({
      success: true,
      timestamp: now,
      results
    })

  } catch (error) {
    console.error('[Orchestrator] Fatal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

