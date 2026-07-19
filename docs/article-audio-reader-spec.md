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
- If audio is missing or expired, the backend enqueues one `article_audio_jobs` row and triggers the Piper worker through `TTS_WORKER_URL`.
- The Piper worker runs on Render, generates the audio, uploads it to Supabase Storage, and updates `articles.audio_url`.
- The frontend polls the same access endpoint briefly and starts playback when the generated file becomes available.

## Backend Environment

The Vercel backend must know where the Render Piper worker lives:

```env
TTS_WORKER_URL=https://scoop-tts-image.onrender.com
TTS_WORKER_SECRET=same-secret-as-render-worker
```

`TTS_WORKER_SECRET` must match the value configured on Render. If the Render worker has no secret, the backend variable can be omitted, but production should use a secret.

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
