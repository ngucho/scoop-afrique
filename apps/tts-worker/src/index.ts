import 'dotenv/config'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
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

async function claimJob(): Promise<ClaimedJob | null> {
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
      WHERE status IN ('queued', 'failed')
        AND attempts < ${config.maxAttempts}
        AND (locked_at IS NULL OR locked_at < now() - interval '20 minutes')
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id, article_id, attempts
  `
  return rows[0] ?? null
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

async function maybeConvertAudio(wavPath: string, finalPath: string): Promise<void> {
  if (config.outputFormat === 'wav') return
  await runProcess(config.ffmpegPath, [
    '-y',
    '-i',
    wavPath,
    '-codec:a',
    'libmp3lame',
    '-b:a',
    '64k',
    finalPath,
  ])
}

async function uploadAudio(article: ArticleRow, path: string): Promise<{ url: string; storagePath: string }> {
  await supabase.storage.createBucket(config.bucket, { public: true }).catch(() => {})
  const ext = config.outputFormat
  const storagePath = `${article.id}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
  const buffer = await readFile(path)
  const contentType = ext === 'mp3' ? 'audio/mpeg' : 'audio/wav'
  const { error } = await supabase.storage.from(config.bucket).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  const { data } = supabase.storage.from(config.bucket).getPublicUrl(storagePath)
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
  const wavPath = join(workdir, 'article.wav')
  const finalPath = config.outputFormat === 'mp3' ? join(workdir, 'article.mp3') : wavPath

  try {
    await writeFile(join(workdir, 'article.txt'), text, 'utf8')
    await generatePiperAudio(text, wavPath)
    await maybeConvertAudio(wavPath, finalPath)
    const uploaded = await uploadAudio(article, finalPath)
    await sql`
      UPDATE articles
      SET audio_url = ${uploaded.url},
          audio_storage_path = ${uploaded.storagePath},
          audio_generated_at = now(),
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

async function processOneJob(): Promise<{ processed: boolean; jobId?: string; articleId?: string; status: JobStatus | 'none'; error?: string }> {
  const job = await claimJob()
  if (!job) return { processed: false, status: 'none' }
  try {
    console.log(`[tts-worker] processing article=${job.article_id} job=${job.id}`)
    await processJob(job)
    console.log(`[tts-worker] done job=${job.id}`)
    return { processed: true, jobId: job.id, articleId: job.article_id, status: 'done' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[tts-worker] failed job=${job.id}`, message)
    const status = job.attempts + 1 >= config.maxAttempts ? 'failed' : 'queued'
    await updateJob(job.id, status, message.slice(0, 2000))
    return { processed: true, jobId: job.id, articleId: job.article_id, status, error: message }
  }
}

async function tick(): Promise<boolean> {
  return (await processOneJob()).processed
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
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
      processOneJob()
        .then((result) => sendJson(res, 200, { ok: true, ...result }))
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error)
          sendJson(res, 500, { ok: false, error: message })
        })
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
