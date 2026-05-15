import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Dashboard — Aventra Sovereign Control',
  description: 'Institutional asset management running 24/7.',
}

const WORKFLOWS = [
  { id: 'C01', label: 'Tenant Screening (TransUnion)', pipeline: 'both' },
  { id: 'C02', label: 'Lease Generation (DocuSign)', pipeline: 'both' },
  { id: 'C03', label: 'Arrears Matrix Monitoring', pipeline: 'both' },
  { id: 'C04', label: '47-Point Compliance Audit', pipeline: 'both' },
  { id: 'C05', label: 'Maintenance Ticket Routing', pipeline: 'both' },
  { id: 'C06', label: 'Unit Turnover Optimization', pipeline: 'both' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id, full_name, role')
    .eq('id', user?.id ?? '')
    .single()

  const teamId = profile?.team_id

  let propertyCount = 0, tenantCount = 0, leaseCount = 0, complianceRate = 0

  if (teamId) {
    const [{ count: pCount }, { count: tCount }, { count: lCount }, { data: audits }] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('team_id', teamId),
      supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('team_id', teamId),
      supabase.from('leases').select('*', { count: 'exact', head: true }).eq('team_id', teamId),
      supabase.from('compliance_audits').select('is_compliant').eq('team_id', teamId)
    ])

    propertyCount = pCount || 0
    tenantCount = tCount || 0
    leaseCount = lCount || 0
    
    if (audits && audits.length > 0) {
      const compliantCount = audits.filter(a => a.is_compliant).length
      complianceRate = Math.round((compliantCount / audits.length) * 100)
    } else {
      complianceRate = 100 // Default to pass if no audits exist yet
    }
  }

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Agent'

  return (
    <div className="space-y-10">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
            Aventra Sovereign Control
          </p>
          <h1 className="text-5xl font-extrabold tracking-tight text-white mb-3">
            Welcome back, {displayName}
          </h1>
          <p className="text-slate-400 text-lg">
            Institutional asset management running 24/7.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">
            View Properties
          </button>
          <button className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20">
            Run Audit
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Managed Units', value: propertyCount, color: 'from-indigo-500 to-indigo-600' },
          { label: 'Active Tenants', value: tenantCount, color: 'from-violet-500 to-violet-600' },
          { label: 'Leases Signed', value: leaseCount, color: 'from-rose-500 to-rose-600' },
          { label: 'Compliance Rate', value: `${complianceRate}%`, color: 'from-emerald-500 to-emerald-600' },
        ].map((card) => (
          <div key={card.label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">{card.label}</p>
            <p className={`text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Automated Workflows Panel */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-sm font-bold text-slate-300 tracking-wide">
            {WORKFLOWS.length} Automated Workflows Active
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {WORKFLOWS.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 hover:bg-white/[0.06] hover:border-white/10 transition-all"
            >
              <span className="text-xs font-mono text-indigo-400 font-semibold">{w.id}</span>
              <span className="text-xs text-slate-400">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/properties', title: 'Property Pipeline', desc: 'Manage your portfolio and unit inventory', icon: '🏢' },
          { href: '/tenants', title: 'Tenant Matrix', desc: 'Review screening scores and lease status', icon: '👥' },
          { href: '/compliance', title: 'Compliance Audit', desc: 'Monitor legal and safety standards', icon: '🛡️' },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="group bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 rounded-2xl p-6 transition-all hover:bg-white/[0.05]"
          >
            <div className="text-2xl mb-3">{item.icon}</div>
            <h3 className="text-white font-semibold mb-1 group-hover:text-indigo-300 transition-colors">{item.title}</h3>
            <p className="text-slate-500 text-sm">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  )
}

