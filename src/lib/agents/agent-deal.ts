// src/lib/agents/agent-deal.ts
import { AgentRunner } from './base'
import type { AgentInput, AgentResult } from './types'
import { Underwriter } from '@/lib/engine/underwriter/engine'
import { UnderwritingInput } from '@/lib/engine/underwriter/types'

export type BuyBox = {
  property_types: string[]
  geography: string[]
  price_min: number
  price_max: number
  cap_rate_min: number
  coc_min: number
  notes: string
}

export class AgentDeal extends AgentRunner {
  async run(input: AgentInput): Promise<AgentResult> {
    const { lead_id, team_id } = input
    if (!lead_id) {
      return { success: false, agent: 'AgentDeal', action_taken: 'none', error: 'MISSING_LEAD_ID' }
    }

    // 1. Fetch Lead
    const { data: lead, error: fetchError } = await this.db
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (fetchError || !lead) {
      return { success: false, agent: 'AgentDeal', action_taken: 'none', error: 'LEAD_NOT_FOUND' }
    }

    // 2. Prepare Underwriting Input
    const valData = lead.valuation || {}
    const underwritingInput: UnderwritingInput = {
      property_id: lead_id,
      strategy: (lead.property_type === 'commercial' ? 'rental' : 'fix_and_flip') as any,
      arv: valData.arv || 0,
      purchase_price: lead.valuation?.purchase_price || 0,
      rehab_budget: valData.rehab_budget || [
        { category: 'General', items: [{ name: 'Estimated Rehab', cost: valData.rehab_estimate || 0, labor: 0, materials: 0 }] }
      ],
      fixed_costs: valData.fixed_costs || {
        closing_costs_acq: (valData.arv || 0) * 0.02,
        closing_costs_exit: (valData.arv || 0) * 0.01,
        insurance: 1500,
        utilities: 1000,
        taxes: 2500,
        commissions_pct: 6
      },
      financing: valData.financing || {
        loan_type: 'hard_money',
        interest_rate: 12,
        interest_only: true,
        points: 2,
        ltv_pct: 75
      },
      holding_period_months: valData.holding_period_months || 6,
      comps: lead.attom_data?.comps || [] // Pass comps from ATTOM data
    }

    // 3. Execute Underwriter
    const result = Underwriter.evaluate(underwritingInput)

    // 4. Generate AI Narrative & Comp Table
    const compTable = this.buildCompTable(underwritingInput.comps || [])
    const narrative = await this.buildDealNarrative(lead.property_address, result, compTable)

    // 5. Create Approval Queue Item (checkpoint: buy_box_confirmation)
    const { error: queueError } = await this.db.from('approval_queue').insert({
      agent_id: lead.owner_id || 'system',
      checkpoint_type: 'buy_box_confirmation',
      status: 'pending',
      payload: {
        lead_id,
        metrics: result.metrics,
        narrative,
        underwriting: result
      }
    })

    if (queueError) {
      console.error('[AgentDeal] Queue insert failed:', queueError)
    }

    await this.logAudit(team_id, 'DEAL_EVALUATION_COMPLETE', { profit: result.metrics.net_profit }, lead_id)

    const notification = this.buildNotification(
      `Deal evaluation complete for ${lead.property_address}. ROI: ${result.metrics.roi_pct.toFixed(1)}%`,
      'action_required',
      `/dashboard/leads/${lead_id}`
    )
    await this.notify(notification)

    return { 
      success: true, 
      agent: 'AgentDeal', 
      action_taken: 'deal_evaluated',
      notification,
      payload: { metrics: result.metrics }
    }
  }

  private buildCompTable(comps: any[]): string {
    if (!comps || comps.length === 0) return ''
    
    let table = '\n\n### Comparable Sales\n'
    table += '| Address | Distance | Price | SqFt | Similarity |\n'
    table += '| :--- | :--- | :--- | :--- | :--- |\n'
    
    comps.slice(0, 5).forEach(comp => {
      table += `| ${comp.address || 'Unknown'} | ${comp.distance_miles?.toFixed(2) || '0.0'} mi | $${(comp.sale_price || 0).toLocaleString()} | ${comp.sqft || 0} | ${(comp.similarity_score * 100 || 0).toFixed(0)}% |\n`
    })
    
    return table
  }

  private async buildDealNarrative(address: string, res: any, compTable: string): Promise<string> {
    const { metrics, sources_and_uses, strategy } = res
    
    const prompt = `
      You are an institutional real estate underwriter. 
      Draft a formal "Acquisition Memorandum" for the property at ${address}.
      Strategy: ${strategy.toUpperCase()}
      
      Financial Highlights:
      - Net Profit: $${metrics.net_profit.toLocaleString()}
      - ROI: ${metrics.roi_pct.toFixed(1)}%
      - CoC Return: ${metrics.coc_pct === 999999 ? 'INFINITE' : metrics.coc_pct.toFixed(1) + '%'}
      - Total Project Cost: $${sources_and_uses.total_project_cost.toLocaleString()}
      
      Structure the response as follows:
      1. # ACQUISITION MEMORANDUM: [Address]
      2. ## EXECUTIVE SUMMARY (High-level investment thesis)
      3. ## SOURCES & USES (Table of Capital Stack)
      4. ## STRATEGY ANALYSIS (Specifics of ${strategy})
      5. ## RISK MITIGATION (Addressing flags: ${res.warnings.join(', ')})
      
      Use professional, lender-grade language.
    `
    
    const memorandum = await this.chat(prompt, `# ACQUISITION MEMORANDUM: ${address}\n\nROI: ${metrics.roi_pct.toFixed(1)}%`)
    
    // Add the Sources and Uses table explicitly if AI misses it or for consistency
    const sourcesTable = `
\n### Capital Stack (Sources & Uses)
| Category | Amount |
| :--- | :--- |
| **Loan Amount** | $${sources_and_uses.loan_amount.toLocaleString()} |
| **Equity Required** | $${sources_and_uses.equity_required.toLocaleString()} |
| **Rehab Allocation** | $${sources_and_uses.rehab_allocation.toLocaleString()} |
| **Fixed Costs** | $${sources_and_uses.fixed_costs_total.toLocaleString()} |
| **Financing Fees** | $${sources_and_uses.financing_fees.toLocaleString()} |
| **Carrying Costs** | $${sources_and_uses.carrying_costs.toLocaleString()} |
| **TOTAL PROJECT COST** | **$${sources_and_uses.total_project_cost.toLocaleString()}** |
\n`

    return memorandum + sourcesTable + compTable
  }
}

