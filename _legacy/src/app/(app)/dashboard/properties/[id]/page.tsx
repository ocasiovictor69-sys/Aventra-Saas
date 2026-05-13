'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { updateProperty, archiveProperty } from '@/app/actions/properties';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  property_type: string | null;
  total_units: number | null;
  year_built: number | null;
  purchase_price: number | null;
  status: string;
  created_at: string;
}

interface Unit {
  id: string;
  unit_number: string;
  status: string;
  tenant_name: string | null;
  rent_amount: number | null;
  lease_end: string | null;
}

const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'multi_family',  label: 'Multi Family' },
  { value: 'residential',   label: 'Residential' },
  { value: 'commercial',    label: 'Commercial' },
  { value: 'mixed_use',     label: 'Mixed Use' },
  { value: 'industrial',    label: 'Industrial' },
];

const statusColors: Record<string, string> = {
  occupied:    'bg-green-100 text-green-700',
  vacant:      'bg-slate-100 text-slate-600',
  maintenance: 'bg-yellow-100 text-yellow-700',
};

export default function PropertyDetailPage() {
  const router  = useRouter();
  const params  = useParams();
  const id      = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [units,    setUnits]    = useState<Unit[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [saved,    setSaved]    = useState(false);

  const [form, setForm] = useState({
    name: '', address: '', city: '', state: '', zip: '',
    property_type: 'single_family', total_units: '', year_built: '', purchase_price: '',
  });

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: prop }, { data: unitRows }] = await Promise.all([
      supabase.from('properties').select('*').eq('id', id).single(),
      supabase.from('units').select('*').eq('property_id', id).order('unit_number'),
    ]);

    if (!prop) { router.push('/dashboard/properties'); return; }

    setProperty(prop);
    setUnits(unitRows ?? []);
    setForm({
      name:           prop.name          ?? '',
      address:        prop.address       ?? '',
      city:           prop.city          ?? '',
      state:          prop.state         ?? '',
      zip:            prop.zip           ?? '',
      property_type:  prop.property_type ?? 'single_family',
      total_units:    prop.total_units   != null ? String(prop.total_units)   : '',
      year_built:     prop.year_built    != null ? String(prop.year_built)    : '',
      purchase_price: prop.purchase_price != null ? String(prop.purchase_price) : '',
    });
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSaved(false);
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await updateProperty(id, {
      name:           form.name,
      address:        form.address,
      city:           form.city   || undefined,
      state:          form.state  || undefined,
      zip:            form.zip    || undefined,
      property_type:  form.property_type || undefined,
      total_units:    form.total_units    ? Number(form.total_units)    : undefined,
      year_built:     form.year_built     ? Number(form.year_built)     : undefined,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : undefined,
    });
    if (result?.error) setError(result.error);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  };

  const handleArchive = async () => {
    if (!confirm('Archive this property? It will be hidden from your active portfolio.')) return;
    setArchiving(true);
    const result = await archiveProperty(id);
    if (result?.error) { setError(result.error); setArchiving(false); }
    else router.push('/dashboard/properties');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) return null;

  const occupied  = units.filter(u => u.status === 'occupied').length;
  const vacant    = units.filter(u => u.status === 'vacant').length;
  const monthlyRent = units.filter(u => u.status === 'occupied').reduce((s, u) => s + (u.rent_amount ?? 0), 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/properties" className="text-slate-400 hover:text-black transition-colors">
          ← Properties
        </Link>
        <h1 className="text-2xl font-bold text-black">{property.name}</h1>
        <span className={`ml-auto px-2 py-1 text-xs font-semibold rounded-full ${property.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
          {property.status}
        </span>
      </div>

      {/* Unit summary strip */}
      {units.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Occupied',     value: occupied,                           color: 'text-green-600' },
            { label: 'Vacant',       value: vacant,                             color: 'text-slate-600' },
            { label: 'Monthly Rent', value: `$${monthlyRent.toLocaleString()}`, color: 'text-brand-purple' },
          ].map(card => (
            <div key={card.label} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Edit form */}
      <form onSubmit={handleSave} className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-white space-y-4">
          <h2 className="text-lg font-semibold text-black mb-1">Property Details</h2>

          <div>
            <label className="block text-sm font-medium text-black mb-1">Property Name *</label>
            <input name="name" type="text" required value={form.name} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">Street Address *</label>
            <input name="address" type="text" required value={form.address} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">City</label>
              <input name="city" type="text" value={form.city} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">State</label>
              <input name="state" type="text" maxLength={2} value={form.state} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">ZIP</label>
              <input name="zip" type="text" value={form.zip} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Property Type</label>
              <select name="property_type" value={form.property_type} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30">
                {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Total Units</label>
              <input name="total_units" type="number" min="1" value={form.total_units} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Year Built</label>
              <input name="year_built" type="number" min="1800" max={new Date().getFullYear()} value={form.year_built} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" placeholder="e.g. 2005" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Purchase Price ($)</label>
              <input name="purchase_price" type="number" min="0" step="1000" value={form.purchase_price} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" placeholder="e.g. 850000" />
            </div>
          </div>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="p-6 bg-white flex items-center justify-between gap-3">
          <button type="button" onClick={handleArchive} disabled={archiving}
            className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
            {archiving ? 'Archiving...' : 'Archive Property'}
          </button>
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-green-600">Saved ✓</span>}
            <Link href="/dashboard/properties" className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </Link>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-brand-purple text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>

      {/* Units table */}
      {units.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-black mb-3">Units</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rent</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lease End</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-black">Unit {u.unit_number}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.tenant_name ?? <span className="italic text-slate-400">Vacant</span>}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.rent_amount ? `$${Number(u.rent_amount).toLocaleString()}` : '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.lease_end ? new Date(u.lease_end).toLocaleDateString() : '—'}</td>
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
        </div>
      )}
    </div>
  );
}
