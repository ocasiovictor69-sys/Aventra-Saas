// src/lib/engine/underwriter/engine.ts
// MOD-C: The Arrears Matrix & Compliance Engine
// This engine handles the deterministic escalation of late payments and compliance auditing.

export type EscalationLevel = 'GRACE_PERIOD' | 'LATE_NOTICE' | 'LEGAL_DEMAND' | 'EVICTION_READY'

export interface ArrearsInput {
  days_late: number;
  missed_amount: number;
  jurisdiction: string; // e.g. "NYC", "FL", "TX"
  tenant_history_score: number;
}

export interface ArrearsResult {
  escalation_level: EscalationLevel;
  next_action: string;
  is_hard_stop: boolean;
  required_documents: string[];
}

export class AventraEngine {
  static evaluateArrears(input: ArrearsInput): ArrearsResult {
    const { days_late, jurisdiction } = input;
    
    // Deterministic Jurisdictional Logic
    // In TX/FL: 3-day notice after 5 days.
    // In NYC: Much longer grace periods.
    
    let level: EscalationLevel = 'GRACE_PERIOD';
    let action = 'Monitor for payment';
    let hardStop = false;
    let docs: string[] = [];

    if (days_late > 30) {
      level = 'EVICTION_READY';
      action = 'File for Eviction';
      hardStop = true;
      docs = ['LEASE_AGREEMENT', 'LEDGER_HISTORY', '30_DAY_NOTICE'];
    } else if (days_late > 15) {
      level = 'LEGAL_DEMAND';
      action = 'Send Attorney Demand Letter';
      docs = ['DEMAND_LETTER_V1'];
    } else if (days_late > 5) {
      level = 'LATE_NOTICE';
      action = 'Send 3-Day Notice to Pay or Quit';
      docs = ['NOTICE_TO_PAY_OR_QUIT'];
    }

    return {
      escalation_level: level,
      next_action: action,
      is_hard_stop: hardStop,
      required_documents: docs
    };
  }

  static runComplianceAudit(data_points: any[]): { score: number, passed: boolean } {
    // MOD-C04: 47-Point Pass
    const score = data_points.filter(p => p.status === 'PASS').length;
    return {
      score,
      passed: score >= 47
    };
  }
}
