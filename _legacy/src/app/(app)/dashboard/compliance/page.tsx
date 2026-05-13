import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Compliance — Aventra Real Estate',
  description: 'Track compliance deadlines, inspections, and legal requirements for your portfolio.',
};

interface ComplianceDoc {
  id: string;
  title: string;
  doc_type: string | null;
  status: string;
  expiry_date: string | null;
  property_id: string;
  properties: { address: string } | null;
}

export default async function CompliancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const propertyIds: string[] = user
    ? ((await supabase.from('properties').select('id').eq('user_id', user.id)).data?.map((p: { id: string }) => p.id) ?? [])
    : [];

  const { data: docs } = (propertyIds.length > 0
    ? await supabase
        .from('compliance_docs')
        .select('*, properties(address)')
        .in('property_id', propertyIds)
        .order('expiry_date', { ascending: true })
    : { data: [] }) as { data: ComplianceDoc[] | null };

  const now       = new Date();
  const oneWeek   = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);
  const oneMonth  = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const dueThisWeek  = docs?.filter((d) => d.expiry_date && new Date(d.expiry_date) <= oneWeek  && d.status !== 'expired').length ?? 0;
  const dueThisMonth = docs?.filter((d) => d.expiry_date && new Date(d.expiry_date) <= oneMonth && d.status !== 'expired').length ?? 0;
  const totalActive  = docs?.filter((d) => d.status === 'active').length ?? 0;
  const totalDocs    = docs?.length ?? 0;
  const score        = totalDocs > 0 ? Math.round((totalActive / totalDocs) * 100) : null;

  const statusColors: Record<string, string> = {
    active:           'bg-green-100 text-green-700',
    expired:          'bg-red-100 text-red-700',
    pending_renewal:  'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Compliance</h1>
        <p className="text-slate-600">Track deadlines, inspections, and legal requirements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <div className={`text-3xl font-bold mb-1 ${dueThisWeek > 0 ? 'text-red-600' : 'text-brand-purple'}`}>{dueThisWeek}</div>
          <div className="text-sm text-slate-600">Due This Week</div>
        </div>
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <div className={`text-3xl font-bold mb-1 ${dueThisMonth > 0 ? 'text-yellow-600' : 'text-brand-purple'}`}>{dueThisMonth}</div>
          <div className="text-sm text-slate-600">Due This Month</div>
        </div>
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <div className={`text-3xl font-bold mb-1 ${score !== null && score < 80 ? 'text-red-600' : 'text-green-600'}`}>
            {score !== null ? `${score}%` : '—'}
          </div>
          <div className="text-sm text-slate-600">Compliance Score</div>
        </div>
      </div>

      {!docs || docs.length === 0 ? (
        <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <p className="text-slate-500 mb-2">No compliance items tracked yet</p>
          <p className="text-sm text-slate-400">Add properties to start tracking lease expirations, inspections, and renewals</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-black">{d.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 capitalize">{d.doc_type?.replace('_', ' ')}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{d.properties?.address ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[d.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {d.status?.replace('_', ' ')}
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
