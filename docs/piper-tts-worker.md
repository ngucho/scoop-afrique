# Piper TTS Worker

## Architecture

Article audio generation is intentionally outside the backend API.

- Backend: creates or refreshes one `article_audio_jobs` row when an article is published or edited after publication.
- TTS worker: polls `article_audio_jobs`, runs Piper locally, uploads audio to Supabase Storage, and writes `articles.audio_url`.
- Frontend: plays `articles.audio_url` when available; if audio is missing, it asks the backend to enqueue generation and waits calmly. It never falls back to browser/device speech.

This keeps CPU-heavy synthesis away from request/response traffic.

## Manual Setup

1. Install Piper on the machine that will run the worker.

2. Download a French Piper voice model and its config.

Recommended first voice:

- `fr_FR-upmc-medium.onnx`
- `fr_FR-upmc-medium.onnx.json`

3. Set environment variables for `apps/tts-worker`.

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
PIPER_BINARY_PATH=C:\tools\piper\piper.exe
PIPER_VOICE_MODEL=C:\tools\piper\voices\fr_FR-upmc-medium.onnx
PIPER_VOICE_CONFIG=C:\tools\piper\voices\fr_FR-upmc-medium.onnx.json
PIPER_VOICE_NAME=fr_FR-upmc-medium
TTS_AUDIO_BUCKET=article-audio
TTS_AUDIO_FORMAT=wav
TTS_WORKER_MAX_CHARS=12000
TTS_WORKER_MAX_CHUNK_CHARS=900
TTS_WORKER_POLL_MS=5000
```

Optional compression:

```env
TTS_AUDIO_FORMAT=mp3
FFMPEG_PATH=C:\tools\ffmpeg\bin\ffmpeg.exe
```

MP3 is smaller and better for readers on mobile networks. WAV is simpler and avoids requiring ffmpeg.

## Commands

Build:

```bash
pnpm build:tts
```

Run continuously:

```bash
pnpm dev:tts
```

Process one job then exit:

```bash
pnpm --filter @scoop-afrique/tts-worker once
```

Run as HTTP service, for Render:

```bash
pnpm --filter @scoop-afrique/tts-worker start
```

Endpoints:

- `GET /health`
- `POST /process-one` with optional JSON `{ "article_id": "<uuid>" }` to prioritize a reader-requested article.
- `POST /process-batch` to process a small queue batch for scheduled automation.

If `TTS_WORKER_SECRET` is set, call `/process-one` with:

```http
Authorization: Bearer <TTS_WORKER_SECRET>
```

## Render Free Deployment

Render Free does not provide free background workers. Deploy this worker as a Free **Web Service** that processes one job per HTTP call.

### 1. Create the Render service

1. Render Dashboard > New > Web Service.
2. Connect the GitHub repo.
3. Select Docker runtime.
4. Dockerfile path:

```text
apps/tts-worker/Dockerfile
```

5. Instance type: Free.
6. Health check path:

```text
/health
```

### 2. Environment variables

Set these in Render:

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
TTS_WORKER_SECRET=<generate-a-long-random-secret>
TTS_AUDIO_BUCKET=article-audio
TTS_AUDIO_FORMAT=mp3
TTS_WORKER_MAX_CHARS=12000
TTS_WORKER_MAX_CHUNK_CHARS=900
TTS_WORKER_MAX_ATTEMPTS=3
TTS_WORKER_BATCH_SIZE=1
TTS_WORKER_STALE_JOB_MINUTES=12
```

The Docker image already sets:

```env
PIPER_BINARY_PATH=/opt/piper/piper
PIPER_VOICE_MODEL=/opt/piper/voices/fr_FR-upmc-medium.onnx
PIPER_VOICE_CONFIG=/opt/piper/voices/fr_FR-upmc-medium.onnx.json
PIPER_VOICE_NAME=fr_FR-upmc-medium
FFMPEG_PATH=ffmpeg
```

The Dockerfile downloads `piper_linux_x86_64.tar.gz`, which is the Linux asset name published by Piper.

### 3. Preferred free execution: GitHub Actions generation

Render Free can restart a long HTTP request while UPMC is still generating. The repo therefore includes `.github/workflows/tts-worker-generate.yml`, which runs the same Piper Docker image inside GitHub Actions and writes the generated MP3 to Supabase Storage.

Add these GitHub repository secrets:

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

The workflow runs every 5 minutes and can also be started manually from GitHub Actions. Manual inputs:

- `article_id`: optional article UUID to process first.
- `batch_size`: number of queued articles to process when no `article_id` is provided. Default: `4`.

For immediate generation when a reader clicks Play, create a GitHub fine-grained token with repository Actions write access, then set this on the Vercel backend:

```env
GITHUB_TTS_DISPATCH_TOKEN=github_pat_...
GITHUB_TTS_OWNER=ngucho
GITHUB_TTS_REPO=scoop-afrique
GITHUB_TTS_WORKFLOW=tts-worker-generate.yml
GITHUB_TTS_REF=main
```

If `GITHUB_TTS_DISPATCH_TOKEN` is not configured, the backend only queues the job and the scheduled workflow will process it on the next run.

### 4. Optional Render trigger

Render can still be used for manual tests or on a paid instance. On Render Free with UPMC, do not use it as the scheduled queue processor because it can restart before upload.

To connect the Vercel backend to Render, set:

Set these variables on the Vercel backend project:

```env
TTS_WORKER_URL=https://<your-render-service>.onrender.com
TTS_WORKER_SECRET=<same-value-as-render>
```

The backend calls `POST /process-one` when a reader clicks Play and no fresh audio exists. If `GITHUB_TTS_DISPATCH_TOKEN` is also configured, GitHub Actions is used first and Render is only a fallback.

### 5. Trigger processing

The preferred cron is `.github/workflows/tts-worker-generate.yml`; it runs every 5 minutes and consumes queued jobs directly.

For a Render manual test:

```text
POST https://<your-render-service>.onrender.com/process-batch
Authorization: Bearer <TTS_WORKER_SECRET>
```

### 6. Manual test

After publishing an article, trigger one job:

```bash
curl -X POST https://<your-render-service>.onrender.com/process-one \
  -H "Authorization: Bearer <TTS_WORKER_SECRET>"
```

Expected response when a job exists:

```json
{ "ok": true, "processed": true, "status": "done" }
```

Expected response when the queue is empty:

```json
{ "ok": true, "processed": false, "status": "none" }
```

### 7. Legacy Render ping workflow

Add repository secrets:

- `TTS_WORKER_URL`: `https://<your-render-service>.onrender.com/process-one`
- `TTS_WORKER_SECRET`: the same value as Render.

The repo includes `.github/workflows/tts-worker-cron.yml`, which can be run manually to ping Render. It is intentionally not scheduled because the direct GitHub Actions generator is more reliable for the UPMC voice on free infrastructure.

## Production Notes

- Run only one worker at first. The DB claim query uses `FOR UPDATE SKIP LOCKED`, so more workers can be added later.
- Start with `TTS_AUDIO_FORMAT=mp3` if ffmpeg is available; it reduces bandwidth and improves Africa mobile performance.
- Keep `TTS_WORKER_MAX_CHARS` conservative. The worker splits that text into Piper chunks with `TTS_WORKER_MAX_CHUNK_CHARS` to avoid long one-shot synthesis on small Render instances.
- Keep `TTS_WORKER_BATCH_SIZE=1` on Render Free with UPMC. The voice is clearer but slow on small CPU; one synchronous article per request is more reliable than a long background batch.
- Use a public Supabase Storage bucket named `article-audio`.
- Worker logs include text length, chunk count, each Piper chunk, concat, upload start, and upload completion. If a log stops before upload, the failure is in synthesis/concat rather than Supabase Storage.
- Generated audio expires 5 days after the last playback. Each playback calls the backend and extends the expiration by 5 days.
- The worker deletes expired Supabase audio files before processing new jobs. If a reader opens the article later, the backend requeues audio generation and the player waits for Piper.
- If Piper fails, the article remains readable and the player shows a calm retry message.
- Render Free is acceptable for health checks and light manual tests, but not reliable for long UPMC synthesis. The free production path is GitHub Actions queue generation; if audio volume grows, move the same Docker service to Render paid worker, Railway Hobby, or a small VPS.
