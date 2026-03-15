import { Hono } from 'hono'
import { devisBodySchema } from '../schemas/devis.js'
import * as devisService from '../services/devis.service.js'

const app = new Hono()

app.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = devisBodySchema.safeParse(body)

  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return c.json(
      { error: first?.message ?? 'Données invalides', code: 'VALIDATION_ERROR' },
      400
    )
  }

  const result = await devisService.createDevisRequest(parsed.data)

  if (!result.success) {
    return c.json({ error: result.message ?? 'Erreur serveur' }, 500)
  }

  return c.json({ data: { id: result.id, success: true } }, 201)
})

export default app
