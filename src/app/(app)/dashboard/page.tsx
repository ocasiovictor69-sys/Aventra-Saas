import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Dashboard — Aventra Real Estate',
  description: 'Institutional real estate portfolio and compliance management dashboard.',
};

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const uid = user?.id ?? '';

  let propertyCount = 0;
  let totalUnits = 0;
  let occupiedUnits = 0;
  let maintenanceCount = 0;

  try {
    const { data: propertyRows } = await supabase
      .from('properties')
      .select('id')
      .eq('user_id', uid)
      .eq('status', 'active');

    const propertyIds = propertyRows?.map((p: { id: string }) => p.id) ?? [];
    propertyCount = propertyIds.length;

    if (propertyIds.length > 0) {
      const [{ data: units }, { count: mc }] = await Promise.all([
        supabase.from('units').select('property_id, status').in('property_id', propertyIds),
        supabase.from('maintenance_requests')
          .select('*', { count: 'exact', head: true })
          .in('property_id', propertyIds)
          .in('status', ['open', 'in_progress']),
      ]);
      totalUnits = units?.length ?? 0;
      occupiedUnits = units?.filter((u: { status: string }) => u.status === 'occupied').length ?? 0;
      maintenanceCount = mc ?? 0;
    }
  } catch {
    // Graceful fallback — DB unreachable or env vars missing
  }

  const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '—';

  const metrics = [
    { title: 'Managed Properties', value: propertyCount.toString(),                               sub: 'active' },
    { title: 'Occupancy Rate',     value: totalUnits > 0 ? `${occupancyRate}%` : '—',             sub: `${occupiedUnits} of ${totalUnits} units` },
    { title: 'Open Maintenance',   value: maintenanceCount.toString(),                             sub: 'open or in progress' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen p-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2 block">Ad Astra per Aspera</span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-slate-900">
            Aventra <span className="text-gradient">Real Estate</span>
          </h1>
          <p className="text-lg text-slate-500 mt-1 font-medium">Institutional Portfolio &amp; Compliance Management.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {metrics.map((metric) => (
          <div key={metric.title} className="glass-card rounded-2xl p-8">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">{metric.title}</h3>
            <p className="text-4xl font-extrabold text-slate-800 mt-3">{metric.value}</p>
            <span className="text-indigo-500 text-sm font-bold block mt-2">{metric.sub}</span>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-2xl p-10 max-w-xl border-slate-200/60">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Portfolio Controls</h2>
        <div className="flex flex-col gap-4">
          <Link href="/dashboard/properties" className="flex items-center justify-between group p-4 hover:bg-slate-50/50 rounded-xl transition-all duration-200">
            <span className="text-slate-700 font-semibold group-hover:text-indigo-600 transition-colors">View Properties &amp; Units</span>
            <span className="text-indigo-500 transform group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <Link href="/dashboard/maintenance" className="flex items-center justify-between group p-4 hover:bg-slate-50/50 rounded-xl transition-all duration-200">
            <span className="text-slate-700 font-semibold group-hover:text-indigo-600 transition-colors">Review Maintenance Tickets</span>
            <span className="text-indigo-500 transform group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <Link href="/dashboard/compliance" className="flex items-center justify-between group p-4 hover:bg-slate-50/50 rounded-xl transition-all duration-200">
            <span className="text-slate-700 font-semibold group-hover:text-indigo-600 transition-colors">Compliance Documents</span>
            <span className="text-indigo-500 transform group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
