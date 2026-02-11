/**
 * Health check — load balancers, monitoring, Vercel/Railway probes.
 */
import { Hono } from 'hono'
import { config } from '../config/env.js'

const app = new Hono()

app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: '@scoop-afrique/backend',
    version: '1.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  })
})

export default app
