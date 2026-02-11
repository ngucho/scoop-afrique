'use server'

import { apiPost } from '@/lib/api/client'
import type { NewsletterResponse } from '@/lib/api/types'

export async function subscribeNewsletter(formData: FormData): Promise<{ success: boolean; message: string }> {
  const email = formData.get('email')
  if (!email || typeof email !== 'string') {
    return { success: false, message: 'Email requis.' }
  }
  const trimmed = email.trim()
  if (!trimmed) return { success: false, message: 'Email requis.' }
  try {
    const res = await apiPost<NewsletterResponse>('/newsletter/subscribe', { email: trimmed })
    return {
      success: res.data?.success ?? true,
      message: res.data?.message ?? "Inscription enregistrée. Vérifiez votre email pour confirmer.",
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'inscription.'
    return { success: false, message }
  }
}
