'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createMaintenanceRequest(data: {
  property_id: string;
  title: string;
  description?: string;
  priority: 'emergency' | 'high' | 'medium' | 'low';
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Verify the property belongs to this user
  const { data: prop } = await supabase
    .from('properties')
    .select('user_id')
    .eq('id', data.property_id)
    .single();

  if (!prop || prop.user_id !== user.id) return { error: 'Property not found or access denied' };

  const { error } = await supabase.from('maintenance_requests').insert({
    property_id:  data.property_id,
    title:        data.title,
    description:  data.description || null,
    priority:     data.priority,
    status:       'open',
  });

  if (error) return { error: error.message };
  revalidatePath('/dashboard/maintenance');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateMaintenanceStatus(
  requestId: string,
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Verify ownership via property join
  const { data: req } = await supabase
    .from('maintenance_requests')
    .select('property_id, properties(user_id)')
    .eq('id', requestId)
    .single();

  const ownerCheck = req?.properties as unknown as { user_id: string } | null;
  if (!ownerCheck || ownerCheck.user_id !== user.id) return { error: 'Access denied' };

  const { error } = await supabase
    .from('maintenance_requests')
    .update({ status })
    .eq('id', requestId);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/maintenance');
  revalidatePath('/dashboard');
  return { success: true };
}
