import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compliance Audit — Aventra Sovereign Control',
  description: 'Monitor legal and safety standards.',
}

export default async function CompliancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', user.id)
    .single()

  const teamId = profile?.team_id

  const { data: audits, error } = await supabase
    .from('compliance_audits')
    .select('*, properties(address)')
    .eq('team_id', teamId)
    .order('last_audit_date', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
          Aventra Real Estate
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          Compliance Audit
        </h1>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/[0.05]">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Property</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Score</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Failed Points</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Audit Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {audits?.map((audit) => (
              <tr key={audit.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4 text-white font-bold">{audit.properties?.address}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-black ${audit.pass_score >= 47 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {audit.pass_score}
                    </span>
                    <span className="text-slate-500 font-mono text-xs">/ 47</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    audit.is_compliant ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {audit.is_compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {audit.failed_points?.length > 0 ? (
                      audit.failed_points.map((p: string) => (
                        <span key={p} className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[9px] font-bold">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic text-xs">None</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-slate-400 text-sm font-mono">
                  {new Date(audit.last_audit_date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
