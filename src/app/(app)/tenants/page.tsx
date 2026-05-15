import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tenants — Aventra Sovereign Control',
  description: 'Review screening scores and lease status.',
}

export default async function TenantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', user.id)
    .single()

  const teamId = profile?.team_id

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('team_id', teamId)
    .order('full_name', { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
          Aventra Real Estate
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          Tenant Matrix
        </h1>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/[0.05]">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tenant Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Screening</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Income</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tenants?.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4 text-white font-bold">{tenant.full_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    tenant.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                    tenant.status === 'APPROVED' ? 'bg-indigo-500/20 text-indigo-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${tenant.screening_score > 700 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${(tenant.screening_score / 850) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-mono text-xs">{tenant.screening_score}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {tenant.income_verified ? '✅ Verified' : '⏳ Pending'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-indigo-400 hover:text-indigo-300 font-bold text-sm">
                    View Dossier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
