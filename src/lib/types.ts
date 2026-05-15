// src/lib/types.ts
// Institutional type definitions for TomorrowNow AI

export interface TimelineEvent {
  id?: string;
  lead_id?: string;
  event: string;
  status: 'pending' | 'completed' | 'failed';
  created_at?: string;
  metadata?: any;
}

export interface Lead {
  id: string;
  team_id: string;
  seller_name: string;
  seller_email?: string;
  seller_phone?: string;
  property_address: string;
  property_zip?: string;
  property_type?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  pipeline: '1' | '2';
  stage: 'NEW' | 'ACTIVE' | 'QUALIFIED' | 'CLOSED_WON' | 'ARCHIVED' | 'REVIEW';
  score: number;
  outreach_step: number;
  next_action_at?: string;
  created_at: string;
  updated_at: string;
  seller_category?: string;
  last_contacted?: string;
  property_beds?: number;
  property_baths?: number;
  property_sqft?: number;
  attom_data?: any;
  propstream_data?: any;
  goliath_data?: any;
  valuation?: any;
  four_d_breakdown?: any;
  timeline?: TimelineEvent[];
  notes?: any[];
  assigned_to?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'team_leader' | 'viewer';
  lead_count?: number;
  created_at: string;
}

export interface AgentResult {
  success: boolean;
  agent: string;
  action_taken: string;
  payload?: any;
  error?: string;
  notification?: any;
}
