/**
 * CRM deliverable and metrics service
 */
import { getSupabase } from '../../lib/supabase.js'
import type {
  CreateDeliverableInput,
  UpdateDeliverableInput,
  DeliverableMetricsInput,
} from '../../schemas/crm/deliverable.schema.js'

export async function listDeliverablesByProject(
  projectId: string
): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_deliverables')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Array<Record<string, unknown>>
}

export async function getDeliverableById(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('crm_deliverables').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as Record<string, unknown>
}

export async function createDeliverable(
  projectId: string,
  input: CreateDeliverableInput,
  createdBy?: string
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const insert: Record<string, unknown> = {
    project_id: projectId,
    title: input.title.trim(),
    type: input.type ?? 'post',
    platform: input.platform ?? 'instagram',
    url: input.url?.trim() || null,
    thumbnail_url: input.thumbnail_url?.trim() || null,
    published_at: input.published_at || null,
    notes: input.notes?.trim() || null,
    created_by: createdBy ?? null,
  }

  const { data, error } = await supabase.from('crm_deliverables').insert(insert).select().single()
  if (error) throw new Error(error.message)
  return data as Record<string, unknown>
}

export async function updateDeliverable(
  id: string,
  input: UpdateDeliverableInput
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  const update: Record<string, unknown> = {}
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.type !== undefined) update.type = input.type
  if (input.platform !== undefined) update.platform = input.platform
  if (input.url !== undefined) update.url = input.url?.trim() || null
  if (input.thumbnail_url !== undefined) update.thumbnail_url = input.thumbnail_url?.trim() || null
  if (input.published_at !== undefined) update.published_at = input.published_at || null
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null

  const { data, error } = await supabase.from('crm_deliverables').update(update).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data as Record<string, unknown>
}

export async function addDeliverableMetrics(
  deliverableId: string,
  input: DeliverableMetricsInput
): Promise<Record<string, unknown>> {
  const supabase = getSupabase()
  let engagementRate: number | null = null
  if (
    input.views != null &&
    (input.likes != null || input.comments != null || input.shares != null || input.saves != null)
  ) {
    const engagements = (input.likes ?? 0) + (input.comments ?? 0) + (input.shares ?? 0) + (input.saves ?? 0)
    engagementRate = input.views > 0 ? Math.round((engagements / input.views) * 1000) / 1000 : 0
  }

  const insert: Record<string, unknown> = {
    deliverable_id: deliverableId,
    views: input.views ?? null,
    likes: input.likes ?? null,
    comments: input.comments ?? null,
    shares: input.shares ?? null,
    saves: input.saves ?? null,
    reach: input.reach ?? null,
    impressions: input.impressions ?? null,
    clicks: input.clicks ?? null,
    engagement_rate: engagementRate ?? input.engagement_rate ?? null,
    extra: input.extra ?? {},
  }

  const { data, error } = await supabase.from('crm_deliverable_metrics').insert(insert).select().single()
  if (error) throw new Error(error.message)
  return data as Record<string, unknown>
}

export async function getDeliverableMetrics(
  deliverableId: string,
  limit = 50
): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('crm_deliverable_metrics')
    .select('*')
    .eq('deliverable_id', deliverableId)
    .order('recorded_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as Array<Record<string, unknown>>
}
