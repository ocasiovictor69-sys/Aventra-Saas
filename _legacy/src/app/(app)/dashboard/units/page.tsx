import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata = {
  title: 'Units — Aventra Real Estate',
  description: 'Track all rental units across your property portfolio.',
};

interface PropertyRow {
  id: string;
  name: string;
  address: string;
}

interface Unit {
  id: string;
  unit_number: string;
  status: string;
  rent_amount: number | null;
  tenant_name: string | null;
  lease_end: string | null;
  property_id: string;
  properties: { name: string; address: string } | null;
}

export default async function UnitsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const propertyRows: PropertyRow[] = user
    ? ((await supabase.from('properties').select('id, name, address').eq('user_id', user.id)).data ?? [])
    : [];

  const idList = propertyRows.map((p) => p.id);

  const { data: units } = (idList.length > 0
    ? await supabase
        .from('units')
        .select('*, properties(name, address)')
        .in('property_id', idList)
        .order('created_at', { ascending: false })
    : { data: [] }) as { data: Unit[] | null };

  const occupied    = units?.filter((u) => u.status === 'occupied').length    ?? 0;
  const vacant      = units?.filter((u) => u.status === 'vacant').length      ?? 0;
  const maintenance = units?.filter((u) => u.status === 'maintenance').length ?? 0;
  const totalRent   = units?.filter((u) => u.status === 'occupied').reduce((s, u) => s + (u.rent_amount ?? 0), 0) ?? 0;

  const statusColors: Record<string, string> = {
    occupied:    'bg-green-100 text-green-700',
    vacant:      'bg-slate-100 text-slate-600',
    maintenance: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Units</h1>
          <p className="text-slate-600">{units?.length ?? 0} units across your portfolio</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Units',  value: units?.length ?? 0,              color: 'text-brand-purple' },
          { label: 'Occupied',     value: occupied,                         color: 'text-green-600' },
          { label: 'Vacant',       value: vacant,                           color: 'text-slate-600' },
          { label: 'Monthly Rent', value: `$${totalRent.toLocaleString()}`, color: 'text-brand-purple' },
        ].map((card) => (
          <div key={card.label} className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className={`text-2xl font-bold mb-1 ${card.color}`}>{card.value}</div>
            <div className="text-sm text-slate-600">{card.label}</div>
          </div>
        ))}
      </div>

      {!units || units.length === 0 ? (
        <div className="p-12 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <p className="text-slate-500 mb-2">No units yet</p>
          <p className="text-sm text-slate-400">Add properties first, then units will appear here</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rent</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lease End</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {units.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-black">Unit {u.unit_number}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{u.properties?.name ?? u.properties?.address ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {u.tenant_name ?? <span className="text-slate-400 italic">Vacant</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {u.rent_amount ? `$${Number(u.rent_amount).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {u.lease_end ? new Date(u.lease_end).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${statusColors[u.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {maintenance > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
          {maintenance} unit{maintenance > 1 ? 's' : ''} currently under maintenance — check the{' '}
          <Link href="/dashboard/maintenance" className="font-medium underline">Maintenance</Link> page for details.
        </div>
      )}
    </div>
  );
}
