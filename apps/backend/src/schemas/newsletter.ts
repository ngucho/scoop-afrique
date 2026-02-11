import { z } from 'zod'

export const subscribeBodySchema = z.object({
  email: z.string().email(),
})

export const unsubscribeBodySchema = z.object({
  token: z.string().optional(),
  email: z.string().email().optional(),
}).refine((d) => d.token ?? d.email, { message: 'token or email required' })

export type SubscribeBody = z.infer<typeof subscribeBodySchema>
export type UnsubscribeBody = z.infer<typeof unsubscribeBodySchema>
