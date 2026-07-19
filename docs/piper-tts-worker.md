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
TTS_WORKER_BATCH_SIZE=2
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

### 3. Connect the Vercel backend to Render

Set these variables on the Vercel backend project:

```env
TTS_WORKER_URL=https://<your-render-service>.onrender.com
TTS_WORKER_SECRET=<same-value-as-render>
```

The backend calls `POST /process-one` when a reader clicks Play and no fresh audio exists.

### 4. Trigger processing

Render Free web services sleep after inactivity, so use an external free cron/ping service to call:

```text
POST https://<your-render-service>.onrender.com/process-batch
Authorization: Bearer <TTS_WORKER_SECRET>
```

Suggested frequency:

- every 5 minutes while testing or after bulk publishing;
- every 15 minutes if article volume is low.

Free cron options include GitHub Actions scheduled workflow or cron-job.org.

### 5. Manual test

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

### 6. GitHub Actions cron option

Add repository secrets:

- `TTS_WORKER_URL`: `https://<your-render-service>.onrender.com/process-one`
- `TTS_WORKER_SECRET`: the same value as Render.

The repo includes `.github/workflows/tts-worker-cron.yml`, which calls Render every 5 minutes. It safely skips execution until both secrets exist.

## Production Notes

- Run only one worker at first. The DB claim query uses `FOR UPDATE SKIP LOCKED`, so more workers can be added later.
- Start with `TTS_AUDIO_FORMAT=mp3` if ffmpeg is available; it reduces bandwidth and improves Africa mobile performance.
- Keep `TTS_WORKER_MAX_CHARS` conservative. The worker splits that text into Piper chunks with `TTS_WORKER_MAX_CHUNK_CHARS` to avoid long one-shot synthesis on small Render instances.
- Use a public Supabase Storage bucket named `article-audio`.
- Worker logs include text length, chunk count, each Piper chunk, concat, upload start, and upload completion. If a log stops before upload, the failure is in synthesis/concat rather than Supabase Storage.
- Generated audio expires 5 days after the last playback. Each playback calls the backend and extends the expiration by 5 days.
- The worker deletes expired Supabase audio files before processing new jobs. If a reader opens the article later, the backend requeues audio generation and the player waits for Piper.
- If Piper fails, the article remains readable and the player shows a calm retry message.
- Render Free is acceptable for low volume, but not production-grade. If audio volume grows, move the same Docker service to Render paid worker, Railway Hobby, or a small VPS.
