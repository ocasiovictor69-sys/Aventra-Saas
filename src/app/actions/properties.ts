'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface PropertyFormData {
  name: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  property_type?: string;
  total_units?: number;
  year_built?: number;
  purchase_price?: number;
}

export async function createProperty(data: PropertyFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('properties').insert({
    user_id:       user.id,
    name:          data.name,
    address:       data.address,
    city:          data.city          || null,
    state:         data.state         || null,
    zip:           data.zip           || null,
    property_type: data.property_type || null,
    total_units:   data.total_units   ?? null,
    year_built:    data.year_built    ?? null,
    purchase_price: data.purchase_price ?? null,
    status:        'active',
  });

  if (error) return { error: error.message };
  revalidatePath('/dashboard/properties');
  return { success: true };
}

export async function archiveProperty(propertyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: prop } = await supabase.from('properties').select('user_id').eq('id', propertyId).single();
  if (!prop || prop.user_id !== user.id) return { error: 'Property not found or access denied' };

  const { error } = await supabase.from('properties').update({ status: 'archived' }).eq('id', propertyId);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/properties');
  revalidatePath('/dashboard');
  return { success: true };
}
