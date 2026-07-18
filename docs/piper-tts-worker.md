# Piper TTS Worker

## Architecture

Article audio generation is intentionally outside the backend API.

- Backend: creates or refreshes one `article_audio_jobs` row when an article is published or edited after publication.
- TTS worker: polls `article_audio_jobs`, runs Piper locally, uploads audio to Supabase Storage, and writes `articles.audio_url`.
- Frontend: plays `articles.audio_url` when available; falls back to browser speech while audio is not generated.

This keeps CPU-heavy synthesis away from request/response traffic.

## Manual Setup

1. Install Piper on the machine that will run the worker.

2. Download a French Piper voice model and its config.

Recommended first voice:

- `fr_FR-siwis-medium.onnx`
- `fr_FR-siwis-medium.onnx.json`

3. Set environment variables for `apps/tts-worker`.

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
PIPER_BINARY_PATH=C:\tools\piper\piper.exe
PIPER_VOICE_MODEL=C:\tools\piper\voices\fr_FR-siwis-medium.onnx
PIPER_VOICE_CONFIG=C:\tools\piper\voices\fr_FR-siwis-medium.onnx.json
PIPER_VOICE_NAME=fr_FR-siwis-medium
TTS_AUDIO_BUCKET=article-audio
TTS_AUDIO_FORMAT=wav
TTS_WORKER_MAX_CHARS=12000
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
- `POST /process-one`

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
TTS_WORKER_MAX_ATTEMPTS=3
```

The Docker image already sets:

```env
PIPER_BINARY_PATH=/opt/piper/piper
PIPER_VOICE_MODEL=/opt/piper/voices/fr_FR-siwis-medium.onnx
PIPER_VOICE_CONFIG=/opt/piper/voices/fr_FR-siwis-medium.onnx.json
PIPER_VOICE_NAME=fr_FR-siwis-medium
FFMPEG_PATH=ffmpeg
```

### 3. Trigger processing

Render Free web services sleep after inactivity, so use an external free cron/ping service to call:

```text
POST https://<your-render-service>.onrender.com/process-one
Authorization: Bearer <TTS_WORKER_SECRET>
```

Suggested frequency:

- every 10 or 15 minutes while testing;
- every 30 minutes if article volume is low.

Free cron options include GitHub Actions scheduled workflow or cron-job.org.

### 4. Manual test

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

### 5. GitHub Actions cron option

Add repository secrets:

- `TTS_WORKER_URL`: `https://<your-render-service>.onrender.com/process-one`
- `TTS_WORKER_SECRET`: the same value as Render.

Create `.github/workflows/tts-worker-cron.yml`:

```yaml
name: TTS worker cron

on:
  schedule:
    - cron: "*/15 * * * *"
  workflow_dispatch:

jobs:
  process-one:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger one Piper job
        run: |
          curl -fsS -X POST "$TTS_WORKER_URL" \
            -H "Authorization: Bearer $TTS_WORKER_SECRET"
        env:
          TTS_WORKER_URL: ${{ secrets.TTS_WORKER_URL }}
          TTS_WORKER_SECRET: ${{ secrets.TTS_WORKER_SECRET }}
```

## Production Notes

- Run only one worker at first. The DB claim query uses `FOR UPDATE SKIP LOCKED`, so more workers can be added later.
- Start with `TTS_AUDIO_FORMAT=mp3` if ffmpeg is available; it reduces bandwidth and improves Africa mobile performance.
- Keep `TTS_WORKER_MAX_CHARS` conservative. Very long articles can be summarized or split later.
- Use a public Supabase Storage bucket named `article-audio`.
- If Piper fails, the article remains readable and the frontend falls back to browser speech.
- Render Free is acceptable for low volume, but not production-grade. If audio volume grows, move the same Docker service to Render paid worker, Railway Hobby, or a small VPS.
