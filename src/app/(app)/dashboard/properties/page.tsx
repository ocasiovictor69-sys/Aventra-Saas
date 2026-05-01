import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Properties — Aventra Real Estate',
  description: 'Manage your real estate property portfolio.',
};

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  property_type: string;
  total_units: number;
  status: string;
}

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: properties } = (user
    ? await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    : { data: [] }) as { data: Property[] | null };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Properties</h1>
          <p className="text-slate-600">{properties?.length ?? 0} properties in portfolio</p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:opacity-90 font-medium"
        >
          + Add Property
        </Link>
      </div>

      {!properties || properties.length === 0 ? (
        <div className="p-12 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <p className="text-slate-500 mb-4">No properties yet</p>
          <Link href="/dashboard/properties/new" className="text-brand-purple font-medium hover:underline">
            Add your first property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <div key={p.id} className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-brand-purple/30 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-black">{p.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {p.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-3">{p.address}, {p.city}, {p.state}</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{p.property_type}</span>
                <span className="font-medium text-black">{p.total_units} units</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
