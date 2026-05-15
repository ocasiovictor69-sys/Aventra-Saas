import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Properties — Aventra Sovereign Control',
  description: 'Manage your portfolio and unit inventory.',
}

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', user.id)
    .single()

  const teamId = profile?.team_id

  // Fetch properties and their associated tenant data
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*, tenants(full_name, status)')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
            Aventra Real Estate
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Property Pipeline
          </h1>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/[0.05]">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Address</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Jurisdiction</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tenant</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {properties?.map((prop) => {
              const tenant = prop.tenants?.[0]
              return (
                <tr key={prop.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-white font-bold">{prop.address}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-400 font-mono text-sm">{prop.jurisdiction}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{tenant?.full_name || 'VACANT'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      tenant?.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                      tenant?.status === 'EVICTED' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      {tenant?.status || 'AVAILABLE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-400 hover:text-indigo-300 font-bold text-sm">
                      Manage
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
