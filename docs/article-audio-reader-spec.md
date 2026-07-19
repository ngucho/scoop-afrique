# Article Audio Reader Spec

## Goal

Give readers a "listen" option on every published article using Scoop Afrique's Piper-generated voice. The reader must never fall back to browser or device voices.

## Constraints

- No paid TTS service and no external TTS API.
- No browser `speechSynthesis` fallback.
- No autoplay; audio generation starts only after a reader clicks Play.
- Reliable on mobile networks: generated files use compressed audio when available.
- Calm UX while audio is being prepared.

## Technical Approach

- The frontend calls `POST /api/v1/articles/:id/audio-access` when the reader clicks Play.
- The backend checks whether a fresh `articles.audio_url` exists.
- If audio exists, the frontend plays it with a native `<audio>` element.
- If audio is missing or expired, the backend enqueues one `article_audio_jobs` row.
- If `GITHUB_TTS_DISPATCH_TOKEN` is configured, the backend dispatches the GitHub Actions Piper workflow for the requested article.
- If no dispatch token is configured, the scheduled GitHub Actions workflow processes queued jobs every 5 minutes.
- The Piper worker runs from the project Docker image, generates the audio, uploads it to Supabase Storage, and updates `articles.audio_url`.
- The frontend polls the same access endpoint briefly and starts playback when the generated file becomes available.

## Backend Environment

Preferred setup for immediate click-triggered generation:

```env
GITHUB_TTS_DISPATCH_TOKEN=github_pat_with_actions_write
GITHUB_TTS_OWNER=ngucho
GITHUB_TTS_REPO=scoop-afrique
GITHUB_TTS_WORKFLOW=tts-worker-generate.yml
GITHUB_TTS_REF=main
```

GitHub repository secrets required by the generator workflow:

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Render HTTP triggering remains available through `TTS_WORKER_URL`, `TTS_WORKER_SECRET`, and `TTS_RENDER_FALLBACK_ENABLED=true`, but it should not be the primary free path for the UPMC voice because Render Free can restart before long audio generation finishes.

## UX

- The player appears as a compact article control.
- Play starts existing audio immediately or starts preparation.
- During generation, the player says: "Nous preparons la version audio de cet article. Elle sera disponible dans quelques instants."
- No technical segment count is shown to readers.
- No device voice settings are exposed.

## Expiration

- Generated audio expires 5 days after the last playback.
- Each successful audio access extends expiration by 5 days.
- If an expired file has been cleaned up, a later Play click requeues generation.
