'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createProperty(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const property = {
    user_id: user.id,
    name: formData.get('name') as string,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    zip: formData.get('zip') as string,
    property_type: formData.get('property_type') as string,
    total_units: parseInt(formData.get('total_units') as string) || 1,
  };
  
  const { data, error } = await supabase.from('properties').insert(property).select().single();
  if (error) throw error;
  
  revalidatePath('/dashboard/properties');
  return data;
}

export async function updateProperty(id: string, updates: Partial<{
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  property_type: string;
  total_units: number;
  status: 'active' | 'inactive';
}>) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
    
  if (error) throw error;
  
  revalidatePath('/dashboard/properties');
  return data;
}

export async function deleteProperty(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
    
  if (error) throw error;
  
  revalidatePath('/dashboard/properties');
}
