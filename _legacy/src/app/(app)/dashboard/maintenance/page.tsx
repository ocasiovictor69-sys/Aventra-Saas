import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Maintenance — Aventra Real Estate',
  description: 'Track and manage maintenance requests across your property portfolio.',
};

interface MaintenanceRequest {
  id: string;
  title: string;
  priority: string;
  status: string;
  property_id: string;
  properties: { address: string } | null;
}

export default async function MaintenancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const propertyIds: string[] = user
    ? ((await supabase.from('properties').select('id').eq('user_id', user.id)).data?.map((p: { id: string }) => p.id) ?? [])
    : [];

  const { data: requests } = (propertyIds.length > 0
    ? await supabase
        .from('maintenance_requests')
        .select('*, properties(address)')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
    : { data: [] }) as { data: MaintenanceRequest[] | null };

  const counts = {
    emergency: requests?.filter((r) => r.priority === 'emergency' && r.status !== 'completed').length ?? 0,
    high:      requests?.filter((r) => r.priority === 'high'      && r.status !== 'completed').length ?? 0,
    medium:    requests?.filter((r) => r.priority === 'medium'    && r.status !== 'completed').length ?? 0,
    low:       requests?.filter((r) => r.priority === 'low'       && r.status !== 'completed').length ?? 0,
  };

  const categories = [
    { label: 'Emergency', color: 'bg-red-100 text-red-700',       count: counts.emergency },
    { label: 'High',      color: 'bg-orange-100 text-orange-700', count: counts.high },
    { label: 'Medium',    color: 'bg-yellow-100 text-yellow-700', count: counts.medium },
    { label: 'Low',       color: 'bg-green-100 text-green-700',   count: counts.low },
  ];

  const statusColors: Record<string, string> = {
    open:        'bg-red-100 text-red-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed:   'bg-green-100 text-green-700',
    cancelled:   'bg-slate-100 text-slate-600',
  };

  const openCount = requests?.filter((r) => r.status !== 'completed').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Maintenance</h1>
          <p className="text-slate-600">{openCount} open requests across your portfolio</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat.label} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className="text-2xl font-bold text-black mb-1">{cat.count}</div>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${cat.color}`}>{cat.label}</span>
          </div>
        ))}
      </div>

      {!requests || requests.length === 0 ? (
        <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <p className="text-slate-500">No maintenance requests yet</p>
          <p className="text-sm text-slate-400 mt-1">Add properties to start tracking requests</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-black">{r.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.properties?.address ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${categories.find((c) => c.label.toLowerCase() === r.priority)?.color ?? 'bg-slate-100 text-slate-600'}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {r.status?.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
