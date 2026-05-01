'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setLoading(false); return; }
    const { error: insertError } = await supabase.from('properties').insert({
      user_id: user.id,
      name: form.get('name') as string,
      address: form.get('address') as string,
      city: form.get('city') as string,
      state: form.get('state') as string,
      zip: form.get('zip') as string,
      property_type: form.get('property_type') as string,
      total_units: Number(form.get('total_units')) || 1,
      status: 'active',
    });
    if (insertError) { setError(insertError.message); setLoading(false); return; }
    router.push('/dashboard/properties');
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/properties" className="text-slate-400 hover:text-black">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-black">Add Property</h1>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-white space-y-4">
          <h2 className="text-lg font-semibold text-black mb-1">Property Details</h2>

          <div>
            <label className="block text-sm font-medium text-black mb-1">Property Name</label>
            <input name="name" type="text" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" placeholder="Sunset Apartments" />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">Street Address</label>
            <input name="address" type="text" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" placeholder="123 Main St" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">City</label>
              <input name="city" type="text" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" placeholder="Miami" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">State</label>
              <input name="state" type="text" required maxLength={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" placeholder="FL" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">ZIP Code</label>
              <input name="zip" type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" placeholder="33101" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Property Type</label>
              <select name="property_type" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30">
                <option value="single_family">Single Family</option>
                <option value="multi_family">Multi Family</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="mixed_use">Mixed Use</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Total Units</label>
              <input name="total_units" type="number" min="1" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" placeholder="1" />
            </div>
          </div>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="p-6 bg-white flex justify-end gap-3">
          <Link href="/dashboard/properties" className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-purple text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60">
            {loading ? 'Saving...' : 'Add Property'}
          </button>
        </div>
      </form>
    </div>
  );
}
