import { eq } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { newsletterSubscribers } from '../db/schema.js'
import { config } from '../config/env.js'

export async function subscribe(email: string): Promise<{ success: boolean; message?: string }> {
  if (!config.database) return { success: false, message: 'Service unavailable' }
  const db = getDb()
  const token = crypto.randomUUID()
  try {
    await db
      .insert(newsletterSubscribers)
      .values({
        email: email.toLowerCase(),
        status: 'pending',
        token,
      })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: { status: 'pending', token },
      })
  } catch (err: unknown) {
    const e = err as { code?: string }
    if (e.code === '23505') return { success: true, message: 'Déjà inscrit.' }
    return { success: false, message: (e as Error).message }
  }
  // TODO: send confirmation email (Resend, Supabase Edge, etc.)
  return { success: true, message: 'Inscription enregistrée. Vérifiez votre email.' }
}

export async function confirmSubscription(token: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [row] = await db
    .update(newsletterSubscribers)
    .set({ status: 'confirmed', confirmedAt: new Date(), token: null })
    .where(eq(newsletterSubscribers.token, token))
    .returning({ id: newsletterSubscribers.id })
  return !!row
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [row] = await db
    .update(newsletterSubscribers)
    .set({ status: 'unsubscribed' })
    .where(eq(newsletterSubscribers.token, token))
    .returning({ id: newsletterSubscribers.id })
  return !!row
}

export async function unsubscribeByEmail(email: string): Promise<boolean> {
  if (!config.database) return false
  const db = getDb()
  const [row] = await db
    .update(newsletterSubscribers)
    .set({ status: 'unsubscribed' })
    .where(eq(newsletterSubscribers.email, email.toLowerCase()))
    .returning({ id: newsletterSubscribers.id })
  return !!row
}
