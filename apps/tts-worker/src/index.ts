import 'dotenv/config'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import postgres from 'postgres'
import { createClient } from '@supabase/supabase-js'

type JobStatus = 'queued' | 'processing' | 'done' | 'failed' | 'skipped'

interface ClaimedJob {
  id: string
  article_id: string
  attempts: number
}

interface ArticleRow {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: unknown
  audio_url: string | null
  audio_text_hash: string | null
}

interface ExpiredAudioRow {
  id: string
  audio_storage_path: string
}

const config = {
  databaseUrl: required('DATABASE_URL'),
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  piperBinaryPath: process.env.PIPER_BINARY_PATH ?? 'piper',
  piperVoiceModel: required('PIPER_VOICE_MODEL'),
  piperVoiceConfig: process.env.PIPER_VOICE_CONFIG ?? null,
  piperVoiceName: process.env.PIPER_VOICE_NAME ?? 'piper-fr',
  bucket: process.env.TTS_AUDIO_BUCKET ?? 'article-audio',
  pollMs: Number(process.env.TTS_WORKER_POLL_MS ?? 5000),
  maxAttempts: Number(process.env.TTS_WORKER_MAX_ATTEMPTS ?? 3),
  maxChars: Number(process.env.TTS_WORKER_MAX_CHARS ?? 12000),
  maxChunkChars: Number(process.env.TTS_WORKER_MAX_CHUNK_CHARS ?? 900),
  batchSize: Number(process.env.TTS_WORKER_BATCH_SIZE ?? 1),
  staleJobMinutes: Number(process.env.TTS_WORKER_STALE_JOB_MINUTES ?? 12),
  cleanupLimit: Number(process.env.TTS_WORKER_CLEANUP_LIMIT ?? 10),
  outputFormat: (process.env.TTS_AUDIO_FORMAT ?? 'wav').toLowerCase() === 'mp3' ? 'mp3' : 'wav',
  ffmpegPath: process.env.FFMPEG_PATH ?? 'ffmpeg',
  port: Number(process.env.PORT ?? 10000),
  workerSecret: process.env.TTS_WORKER_SECRET?.trim() || null,
  once: process.argv.includes('--once'),
  loop: process.argv.includes('--loop'),
}

const sql = postgres(config.databaseUrl, { max: 2, prepare: false })
const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false },
})
let backgroundJob: Promise<void> | null = null
let activeJob = false

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as Record<string, unknown>
  const parts: string[] = []
  if (n.type === 'text' && typeof n.text === 'string') parts.push(n.text)
  if (Array.isArray(n.content)) {
    for (const child of n.content) {
      const text = extractText(child)
      if (text) parts.push(text)
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function articleToSpeechText(article: ArticleRow): string {
  return [article.title, article.excerpt ?? '', extractText(article.content)]
    .map((part) => part.trim())
    .filter(Boolean)
    .join('. ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .slice(0, config.maxChars)
}

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

function splitSpeechText(text: string): string[] {
  const max = Math.max(300, config.maxChunkChars)
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    if (sentence.length > max) {
      if (current) {
        chunks.push(current)
        current = ''
      }
      for (let index = 0; index < sentence.length; index += max) {
        chunks.push(sentence.slice(index, index + max).trim())
      }
      continue
    }

    const next = current ? `${current} ${sentence}` : sentence
    if (next.length > max && current) {
      chunks.push(current)
      current = sentence
    } else {
      current = next
    }
  }

  if (current) chunks.push(current)
  return chunks
}

function runProcess(command: string, args: string[], input?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'inherit', 'inherit'] })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} exited with code ${code}`))
    })
    if (input) child.stdin.write(input)
    child.stdin.end()
  })
}

async function claimJob(articleId?: string | null): Promise<ClaimedJob | null> {
  const rows = await sql<ClaimedJob[]>`
    UPDATE article_audio_jobs
    SET status = 'processing',
        locked_at = now(),
        started_at = now(),
        updated_at = now(),
        attempts = attempts + 1,
        last_error = NULL
    WHERE id = (
      SELECT id
      FROM article_audio_jobs
      WHERE (
          status IN ('queued', 'failed')
          OR (status = 'processing' AND locked_at < now() - (${config.staleJobMinutes}::int * interval '1 minute'))
        )
        AND attempts < ${config.maxAttempts}
        AND (${articleId ?? null}::uuid IS NULL OR article_id = ${articleId ?? null}::uuid)
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id, article_id, attempts
  `
  return rows[0] ?? null
}

async function cleanupExpiredAudio(): Promise<number> {
  const rows = await sql<ExpiredAudioRow[]>`
    SELECT id, audio_storage_path
    FROM articles
    WHERE audio_storage_path IS NOT NULL
      AND audio_expires_at IS NOT NULL
      AND audio_expires_at < now()
    ORDER BY audio_expires_at ASC
    LIMIT ${config.cleanupLimit}
  `

  for (const row of rows) {
    await supabase.storage.from(config.bucket).remove([row.audio_storage_path]).catch((error) => {
      console.warn(`[tts-worker] failed to remove expired audio ${row.audio_storage_path}`, error)
    })
    await sql`
      UPDATE articles
      SET audio_url = NULL,
          audio_storage_path = NULL,
          audio_duration_sec = NULL,
          audio_generated_at = NULL,
          audio_last_accessed_at = NULL,
          audio_expires_at = NULL,
          audio_voice = NULL,
          audio_text_hash = NULL,
          updated_at = updated_at
      WHERE id = ${row.id}
    `
  }

  if (rows.length > 0) console.log(`[tts-worker] cleaned expired audio files=${rows.length}`)
  return rows.length
}

async function getArticle(articleId: string): Promise<ArticleRow | null> {
  const rows = await sql<ArticleRow[]>`
    SELECT id, slug, title, excerpt, content, audio_url, audio_text_hash
    FROM articles
    WHERE id = ${articleId}
      AND status = 'published'
      AND published_at IS NOT NULL
    LIMIT 1
  `
  return rows[0] ?? null
}

async function updateJob(jobId: string, status: JobStatus, error?: string): Promise<void> {
  await sql`
    UPDATE article_audio_jobs
    SET status = ${status},
        last_error = ${error ?? null},
        finished_at = CASE WHEN ${status} IN ('done', 'failed', 'skipped') THEN now() ELSE finished_at END,
        updated_at = now()
    WHERE id = ${jobId}
  `
}

async function generatePiperAudio(text: string, wavPath: string): Promise<void> {
  const args = ['--model', config.piperVoiceModel, '--output_file', wavPath]
  if (config.piperVoiceConfig) args.push('--config', config.piperVoiceConfig)
  await runProcess(config.piperBinaryPath, args, text)
}

async function generatePiperChunks(chunks: string[], workdir: string): Promise<string[]> {
  const paths: string[] = []
  for (let index = 0; index < chunks.length; index += 1) {
    const wavPath = join(workdir, `chunk-${String(index + 1).padStart(3, '0')}.wav`)
    console.log(`[tts-worker] piper chunk ${index + 1}/${chunks.length} chars=${chunks[index].length}`)
    await generatePiperAudio(chunks[index], wavPath)
    const size = (await stat(wavPath)).size
    console.log(`[tts-worker] piper chunk ${index + 1}/${chunks.length} done bytes=${size}`)
    paths.push(wavPath)
  }
  return paths
}

async function concatAudio(wavPaths: string[], listPath: string, finalPath: string): Promise<void> {
  const list = wavPaths
    .map((path) => `file '${path.replace(/'/g, "'\\''")}'`)
    .join('\n')
  await writeFile(listPath, `${list}\n`, 'utf8')

  const args = [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    listPath,
  ]

  if (config.outputFormat === 'mp3') {
    args.push('-codec:a', 'libmp3lame', '-b:a', '64k')
  } else {
    args.push('-c', 'copy')
  }

  args.push(finalPath)
  await runProcess(config.ffmpegPath, args)
}

async function buildFinalAudio(chunks: string[], workdir: string): Promise<string> {
  const wavPaths = await generatePiperChunks(chunks, workdir)
  if (wavPaths.length === 1 && config.outputFormat === 'wav') return wavPaths[0]
  const finalPath = join(workdir, `article.${config.outputFormat}`)
  const listPath = join(workdir, 'chunks.txt')
  console.log(`[tts-worker] concat chunks=${wavPaths.length} format=${config.outputFormat}`)
  await concatAudio(wavPaths, listPath, finalPath)
  const size = (await stat(finalPath)).size
  console.log(`[tts-worker] final audio ready bytes=${size}`)
  return finalPath
}

async function uploadAudio(article: ArticleRow, path: string): Promise<{ url: string; storagePath: string }> {
  console.log(`[tts-worker] ensure bucket=${config.bucket}`)
  await supabase.storage.createBucket(config.bucket, { public: true }).catch(() => {})
  const ext = config.outputFormat
  const storagePath = `${article.id}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
  const buffer = await readFile(path)
  const contentType = ext === 'mp3' ? 'audio/mpeg' : 'audio/wav'
  console.log(`[tts-worker] upload start path=${storagePath} bytes=${buffer.length}`)
  const { error } = await supabase.storage.from(config.bucket).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  const { data } = supabase.storage.from(config.bucket).getPublicUrl(storagePath)
  console.log(`[tts-worker] upload done path=${storagePath}`)
  return { url: data.publicUrl, storagePath }
}

async function processJob(job: ClaimedJob): Promise<void> {
  const article = await getArticle(job.article_id)
  if (!article) {
    await updateJob(job.id, 'skipped', 'Article not published or missing')
    return
  }

  const text = articleToSpeechText(article)
  if (text.length < 120) {
    await updateJob(job.id, 'skipped', 'Article text too short')
    return
  }

  const textHash = hashText(text)
  if (article.audio_url && article.audio_text_hash === textHash) {
    await updateJob(job.id, 'done')
    return
  }

  const workdir = join(tmpdir(), `scoop-tts-${job.id}`)
  await mkdir(workdir, { recursive: true })

  try {
    await writeFile(join(workdir, 'article.txt'), text, 'utf8')
    const chunks = splitSpeechText(text)
    console.log(`[tts-worker] article text chars=${text.length} chunks=${chunks.length} max_chunk=${config.maxChunkChars}`)
    const finalPath = await buildFinalAudio(chunks, workdir)
    const uploaded = await uploadAudio(article, finalPath)
    await sql`
      UPDATE articles
      SET audio_url = ${uploaded.url},
          audio_storage_path = ${uploaded.storagePath},
          audio_generated_at = now(),
          audio_last_accessed_at = now(),
          audio_expires_at = now() + interval '5 days',
          audio_voice = ${config.piperVoiceName},
          audio_text_hash = ${textHash},
          updated_at = updated_at
      WHERE id = ${article.id}
    `
    await updateJob(job.id, 'done')
  } finally {
    await rm(workdir, { recursive: true, force: true }).catch(() => {})
  }
}

async function processOneJob(articleId?: string | null): Promise<{ processed: boolean; jobId?: string; articleId?: string; status: JobStatus | 'none'; error?: string }> {
  await cleanupExpiredAudio()
  const job = await claimJob(articleId)
  if (!job) return { processed: false, articleId: articleId ?? undefined, status: 'none' }
  try {
    console.log(`[tts-worker] processing article=${job.article_id} job=${job.id}`)
    await processJob(job)
    console.log(`[tts-worker] done job=${job.id}`)
    return { processed: true, jobId: job.id, articleId: job.article_id, status: 'done' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[tts-worker] failed job=${job.id}`, message)
    const status = job.attempts >= config.maxAttempts ? 'failed' : 'queued'
    await updateJob(job.id, status, message.slice(0, 2000))
    return { processed: true, jobId: job.id, articleId: job.article_id, status, error: message }
  }
}

async function tick(): Promise<boolean> {
  return (await processOneJob()).processed
}

async function processBatch(articleId?: string | null): Promise<Array<Awaited<ReturnType<typeof processOneJob>>>> {
  const limit = articleId ? 1 : Math.max(1, Math.min(config.batchSize, 5))
  const results: Array<Awaited<ReturnType<typeof processOneJob>>> = []

  for (let index = 0; index < limit; index += 1) {
    const result = await processOneJob(index === 0 ? articleId : null)
    results.push(result)
    if (!result.processed) break
  }

  console.log(`[tts-worker] background batch results=${JSON.stringify(results)}`)
  return results
}

async function processBackgroundBatch(articleId?: string | null): Promise<void> {
  await processBatch(articleId)
}

function isUuid(value: string | null | undefined): value is string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value ?? '')
}

function kickBackgroundJob(articleId?: string | null): { started: boolean; articleId?: string } {
  if (backgroundJob) return { started: false, articleId: articleId ?? undefined }
  backgroundJob = processBackgroundBatch(articleId)
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[tts-worker] background fatal ${message}`)
    })
    .finally(() => {
      backgroundJob = null
    })
  return { started: true }
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 4096) {
        body = ''
        req.destroy()
      }
    })
    req.on('end', () => {
      if (!body.trim()) {
        resolve({})
        return
      }
      try {
        const parsed = JSON.parse(body) as Record<string, unknown>
        resolve(parsed && typeof parsed === 'object' ? parsed : {})
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  if (res.writableEnded || res.destroyed) return
  try {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(body))
  } catch {
    // The caller may have timed out while the synchronous job was still running.
  }
}

async function runExclusive(
  res: ServerResponse,
  articleId?: string | null,
): Promise<void> {
  if (activeJob) {
    sendJson(res, 202, { ok: true, mode: 'busy', started: false, articleId: articleId ?? undefined })
    return
  }

  activeJob = true
  try {
    const results = await processBatch(articleId)
    sendJson(res, 200, { ok: true, mode: 'sync', started: true, articleId: articleId ?? undefined, results })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[tts-worker] request fatal ${message}`)
    sendJson(res, 500, { ok: false, error: message })
  } finally {
    activeJob = false
  }
}

function isAuthorized(req: IncomingMessage): boolean {
  if (!config.workerSecret) return true
  const auth = req.headers.authorization ?? ''
  return auth === `Bearer ${config.workerSecret}`
}

function startHttpServer(): void {
  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      sendJson(res, 200, { ok: true, mode: 'http', voice: config.piperVoiceName, format: config.outputFormat })
      return
    }

    if (req.method === 'POST' && req.url === '/process-one') {
      if (!isAuthorized(req)) {
        sendJson(res, 401, { ok: false, error: 'Unauthorized' })
        return
      }
      void readJsonBody(req).then((body) => {
        const requestedArticleId = typeof body.article_id === 'string' ? body.article_id : null
        const articleId = isUuid(requestedArticleId) ? requestedArticleId : null
        void runExclusive(res, articleId)
      })
      return
    }

    if (req.method === 'POST' && req.url === '/process-batch') {
      if (!isAuthorized(req)) {
        sendJson(res, 401, { ok: false, error: 'Unauthorized' })
        return
      }
      void runExclusive(res)
      return
    }

    sendJson(res, 404, { ok: false, error: 'Not found' })
  })

  server.listen(config.port, () => {
    console.log(`[tts-worker] http server listening on :${config.port}`)
  })
}

async function main() {
  console.log(`[tts-worker] started bucket=${config.bucket} voice=${config.piperVoiceName} format=${config.outputFormat}`)
  if (!config.once && !config.loop) {
    startHttpServer()
    return
  }
  do {
    const processed = await tick()
    if (config.once) break
    if (!processed) await new Promise((resolve) => setTimeout(resolve, config.pollMs))
  } while (true)
  await sql.end()
}

main().catch(async (error) => {
  console.error('[tts-worker] fatal', error)
  await sql.end().catch(() => {})
  process.exit(1)
})
