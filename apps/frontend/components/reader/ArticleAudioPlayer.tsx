'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Gauge, Pause, Play, Settings2, Square, Volume2 } from 'lucide-react'

const VOICE_KEY = 'scoop_audio_voice_uri'
const RATE_KEY = 'scoop_audio_rate'
const PITCH_KEY = 'scoop_audio_pitch'

type PlaybackState = 'idle' | 'playing' | 'paused' | 'unsupported'

function splitForSpeech(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []
  const sentences = normalized.match(/[^.!?;:]+[.!?;:]?/g) ?? [normalized]
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    const next = `${current} ${sentence}`.trim()
    if (next.length > 900 && current) {
      chunks.push(current)
      current = sentence.trim()
    } else {
      current = next
    }
  }

  if (current) chunks.push(current)
  return chunks
}

function rankVoice(voice: SpeechSynthesisVoice, savedVoiceUri: string | null): number {
  if (savedVoiceUri && voice.voiceURI === savedVoiceUri) return 1000
  const lang = voice.lang.toLowerCase()
  const name = voice.name.toLowerCase()
  if (/fr-(ci|sn|cm|bj|tg|ga|cd|ma|dz|tn|mg|bf|ne|rw|bi)/.test(lang)) return 920
  if (/en-(za|ng|ke|gh|tz|ug|bw|zm|zw)/.test(lang)) return 880
  if (lang.startsWith('fr-')) return 820
  if (lang === 'fr') return 800
  if (name.includes('french') || name.includes('francais') || name.includes('français')) return 760
  if (voice.localService) return 500
  return 100
}

export function ArticleAudioPlayer({
  text,
  audioUrl,
  className = '',
  variant = 'inline',
}: {
  text: string
  audioUrl?: string | null
  className?: string
  variant?: 'inline' | 'hero'
}) {
  const [state, setState] = useState<PlaybackState>('idle')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceUri, setVoiceUri] = useState('')
  const [rate, setRate] = useState(0.95)
  const [pitch, setPitch] = useState(1)
  const [chunkIndex, setChunkIndex] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunks = useMemo(() => splitForSpeech(text), [text])
  const chunkRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setState('unsupported')
      return
    }

    const savedVoice = window.localStorage.getItem(VOICE_KEY)
    const savedRate = Number(window.localStorage.getItem(RATE_KEY))
    const savedPitch = Number(window.localStorage.getItem(PITCH_KEY))
    if (Number.isFinite(savedRate) && savedRate >= 0.7 && savedRate <= 1.25) setRate(savedRate)
    if (Number.isFinite(savedPitch) && savedPitch >= 0.8 && savedPitch <= 1.2) setPitch(savedPitch)

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices()
      const ranked = [...available].sort((a, b) => rankVoice(b, savedVoice) - rankVoice(a, savedVoice))
      setVoices(ranked)
      setVoiceUri((current) => current || savedVoice || ranked[0]?.voiceURI || '')
    }

    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis.cancel()
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    }
  }, [])

  useEffect(() => {
    window.localStorage?.setItem(VOICE_KEY, voiceUri)
  }, [voiceUri])

  useEffect(() => {
    window.localStorage?.setItem(RATE_KEY, String(rate))
  }, [rate])

  useEffect(() => {
    window.localStorage?.setItem(PITCH_KEY, String(pitch))
  }, [pitch])

  const speakChunk = useCallback(
    (index: number) => {
      if (!chunks[index]) {
        setState('idle')
        setChunkIndex(0)
        chunkRef.current = 0
        return
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index])
      utterance.lang = 'fr-FR'
      utterance.rate = rate
      utterance.pitch = pitch
      const voice = voices.find((v) => v.voiceURI === voiceUri) ?? voices[0]
      if (voice) utterance.voice = voice
      utterance.onend = () => {
        const next = chunkRef.current + 1
        chunkRef.current = next
        setChunkIndex(next)
        speakChunk(next)
      }
      utterance.onerror = () => setState('idle')
      window.speechSynthesis.speak(utterance)
      setState('playing')
    },
    [chunks, pitch, rate, voiceUri, voices],
  )

  const play = () => {
    if (state === 'unsupported' || chunks.length === 0) return
    if (audioUrl && audioRef.current) {
      audioRef.current.play().then(() => setState('playing')).catch(() => setState('idle'))
      return
    }
    if (state === 'paused') {
      window.speechSynthesis.resume()
      setState('playing')
      return
    }
    window.speechSynthesis.cancel()
    chunkRef.current = chunkIndex
    speakChunk(chunkIndex)
  }

  const pause = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.pause()
      setState('paused')
      return
    }
    window.speechSynthesis.pause()
    setState('paused')
  }

  const stop = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setState('idle')
      return
    }
    window.speechSynthesis.cancel()
    chunkRef.current = 0
    setChunkIndex(0)
    setState('idle')
  }

  if (!text.trim() && !audioUrl) return null

  const progressLabel = chunks.length > 0 ? `${Math.min(chunkIndex + 1, chunks.length)} / ${chunks.length}` : ''
  const isHero = variant === 'hero'
  const disabled = !audioUrl && (state === 'unsupported' || chunks.length === 0)

  return (
    <section
      className={
        isHero
          ? `rounded-[1rem] border border-background/18 bg-background/92 p-3 text-foreground shadow-[var(--shadow-lg)] backdrop-blur-md ${className}`
          : `rounded-[1rem] border border-border bg-background p-4 ${className}`
      }
      aria-label="Lecture audio de l'article"
    >
      {audioUrl ? (
        <audio
          ref={audioRef}
          preload="metadata"
          src={audioUrl}
          onEnded={() => setState('idle')}
          onPause={() => setState((current) => (current === 'playing' ? 'paused' : current))}
          onPlay={() => setState('playing')}
        />
      ) : null}
      <div className={isHero ? 'flex items-center gap-3' : 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'}>
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-sans text-[10px] font-black uppercase tracking-[0.14em] text-primary">
            <Volume2 className="h-4 w-4" aria-hidden />
            Ecouter l'article
          </p>
          {isHero ? (
            <div className="mt-2 flex h-8 items-end gap-1" aria-hidden>
              {Array.from({ length: 18 }).map((_, index) => (
                <span
                  key={index}
                  className={`reader-sound-wave block w-1 rounded-full ${state === 'playing' ? 'bg-primary' : 'bg-foreground/28'}`}
                  style={{
                    height: `${8 + ((index * 7) % 22)}px`,
                    animationDelay: `${index * 0.06}s`,
                    animationPlayState: state === 'playing' ? 'running' : 'paused',
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {audioUrl ? 'Voix Scoop generee avec Piper.' : 'Lecture instantanee sur votre appareil.'} {progressLabel && !audioUrl ? `Segment ${progressLabel}` : ''}
            </p>
          )}
        </div>

        <div className={isHero ? 'ml-auto flex shrink-0 items-center gap-2' : 'flex items-center gap-2'}>
          <button
            type="button"
            onClick={state === 'playing' ? pause : play}
            disabled={disabled}
            className={
              isHero
                ? 'inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-md)] transition hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50'
                : 'inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 font-sans text-xs font-black uppercase tracking-[0.1em] text-background transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50'
            }
            aria-label={state === 'playing' ? 'Mettre en pause' : state === 'paused' ? 'Reprendre la lecture' : "Lire l'article"}
          >
            {state === 'playing' ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            {isHero ? null : state === 'playing' ? 'Pause' : state === 'paused' ? 'Reprendre' : 'Lire'}
          </button>
          {!isHero ? (
            <button
              type="button"
              onClick={stop}
              disabled={state === 'idle' || state === 'unsupported'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Arreter la lecture"
            >
              <Square className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setSettingsOpen((open) => !open)}
            className={
              isHero
                ? 'inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/88 transition hover:border-primary'
                : 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card transition hover:border-primary'
            }
            aria-expanded={settingsOpen}
            aria-label="Reglages audio"
          >
            <Settings2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {state === 'unsupported' && !audioUrl ? (
        <p className="mt-3 rounded-[0.75rem] bg-muted p-3 text-sm text-muted-foreground">
          Votre navigateur ne fournit pas de synthese vocale. Essayez Chrome, Edge, Safari ou activez une voix systeme.
        </p>
      ) : null}

      {settingsOpen && !audioUrl ? (
        <div className={isHero ? 'mt-3 grid gap-3 border-t border-border pt-3' : 'mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-[1fr_160px_160px]'}>
          <label className="grid gap-1 text-sm font-bold">
            Voix
            <select
              value={voiceUri}
              onChange={(event) => setVoiceUri(event.target.value)}
              className="h-11 rounded-[0.75rem] border border-border bg-card px-3 text-sm font-normal"
            >
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold">
            <span className="inline-flex items-center gap-2"><Gauge className="h-4 w-4" aria-hidden /> Vitesse</span>
            <input
              type="range"
              min="0.75"
              max="1.15"
              step="0.05"
              value={rate}
              onChange={(event) => setRate(Number(event.target.value))}
            />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Ton
            <input
              type="range"
              min="0.85"
              max="1.15"
              step="0.05"
              value={pitch}
              onChange={(event) => setPitch(Number(event.target.value))}
            />
          </label>
        </div>
      ) : null}
    </section>
  )
}
