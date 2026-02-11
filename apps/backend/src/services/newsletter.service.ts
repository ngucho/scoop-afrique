import { getSupabase } from '../lib/supabase.js'
import { config } from '../config/env.js'

export async function subscribe(email: string): Promise<{ success: boolean; message?: string }> {
  if (!config.supabase) return { success: false, message: 'Service unavailable' }
  const supabase = getSupabase()
  const token = crypto.randomUUID()
  const { error } = await supabase.from('newsletter_subscribers').upsert(
    { email: email.toLowerCase(), status: 'pending', token },
    { onConflict: 'email' }
  )
  if (error) {
    if (error.code === '23505') return { success: true, message: 'Déjà inscrit.' }
    return { success: false, message: error.message }
  }
  // TODO: send confirmation email (Resend, Supabase Edge, etc.)
  return { success: true, message: 'Inscription enregistrée. Vérifiez votre email.' }
}

export async function confirmSubscription(token: string): Promise<boolean> {
  if (!config.supabase) return false
  const supabase = getSupabase()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), token: null })
    .eq('token', token)
  return !error
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  if (!config.supabase) return false
  const supabase = getSupabase()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed' })
    .eq('token', token)
  return !error
}

export async function unsubscribeByEmail(email: string): Promise<boolean> {
  if (!config.supabase) return false
  const supabase = getSupabase()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed' })
    .eq('email', email.toLowerCase())
  return !error
}
