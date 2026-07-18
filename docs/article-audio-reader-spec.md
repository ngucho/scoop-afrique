# Article Audio Reader Spec

## Goal

Give readers a “listen” option on every published article without adding a paid dependency or server-side audio generation pipeline.

## Constraints

- No paid service and no external TTS API.
- Fast start: playback must begin from the browser without waiting for audio file generation.
- Reliable on low bandwidth: no audio download is required after the page loads.
- Accessible: keyboard controls, clear labels, and no autoplay.
- African audience: prioritize available French and African-locale browser voices when present, while allowing the reader to choose and persist a preferred voice.

## Technical Approach

- Use the browser Web Speech API (`window.speechSynthesis`).
- Extract article title, excerpt, and TipTap body into plain text server-side.
- Send plain text to a client component.
- Split long article text into sentence-aware chunks before playback.
- Store voice, rate, and pitch preferences in `localStorage`.
- If Web Speech API or voices are unavailable, show a clear fallback message instead of failing silently.

## Voice Strategy

Browser TTS voices depend on the reader device and OS. The app ranks voices as follows:

1. Reader's saved voice.
2. African-locale voices if exposed by the OS/browser (`fr-*`, `en-ZA`, `en-NG`, `en-KE`, etc.).
3. French voices (`fr-FR`, `fr-CA`, `fr-BE`, `fr-CH`).
4. Any available local voice.

This avoids paid cloud TTS while letting readers select the best voice available on their own device.

## UX

- Compact audio module appears near article actions.
- Primary button toggles play/pause/resume.
- Stop button resets playback.
- Progress shows current chunk over total chunks.
- Advanced controls expose voice, speed, and tone.

## Manual Setup

- No API key is required.
- For best results, install high-quality French voices on test devices:
  - Windows: Settings > Time & language > Speech > Manage voices.
  - macOS/iOS: System Settings > Accessibility > Spoken Content > System Voice.
  - Android: Settings > Accessibility or Text-to-speech output.
- Test on Chrome/Edge Android and desktop Chrome/Edge because available voices differ by platform.
