/**
 * CRM activity log — record actions for audit trail
 */
import { getSupabase } from '../../lib/supabase.js'

export async function logActivity(params: {
  entityType: string
  entityId: string
  action: string
  description?: string
  metadata?: Record<string, unknown>
  createdBy?: string
}): Promise<void> {
  const supabase = getSupabase()
  await supabase.from('crm_activity_log').insert({
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    description: params.description ?? null,
    metadata: params.metadata ?? {},
    created_by: params.createdBy ?? null,
  })
}

export async function getActivityLog(
  entityType: string,
  entityId: string,
  limit = 50
): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_activity_log')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as Array<Record<string, unknown>>
}

export async function getGlobalActivity(limit = 100): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as Array<Record<string, unknown>>
}
