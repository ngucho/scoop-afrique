'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FastForward, Loader2, Pause, Play, Radio, Rewind, Square, Volume2 } from 'lucide-react'
import { getReaderAmbientAudio } from '@/lib/readerAmbientAudio'
import { readerAudioAtmosphereForCategory } from '@/lib/readerAudioAtmospheres'

type PlaybackState = 'idle' | 'playing' | 'paused' | 'preparing' | 'queued' | 'error'

type NextAudioArticle = {
  id: string
  slug: string
  title: string
  audio_url?: string | null
  category_slug?: string | null
}

const CONTINUOUS_AUDIO_KEY = 'scoop_continuous_audio'
const SEEK_BACK_SECONDS = 15
const SEEK_FORWARD_SECONDS = 30

function stopOtherReaderAudio(instanceId: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('scoop-reader-audio-stop', { detail: { instanceId } }))
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const rounded = Math.floor(seconds)
  const minutes = Math.floor(rounded / 60)
  const rest = rounded % 60
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

export function ArticleAudioPlayer({
  articleId,
  text,
  audioUrl,
  categorySlug,
  nextArticle,
  className = '',
  variant = 'inline',
}: {
  articleId: string
  text: string
  audioUrl?: string | null
  categorySlug?: string | null
  nextArticle?: NextAudioArticle | null
  className?: string
  variant?: 'inline' | 'hero'
}) {
  const [state, setState] = useState<PlaybackState>('idle')
  const [preparedAudioUrl, setPreparedAudioUrl] = useState<string | null>(audioUrl ?? null)
  const [ambienceEnabled, setAmbienceEnabled] = useState(true)
  const [nextAudioQueued, setNextAudioQueued] = useState(Boolean(nextArticle?.audio_url))
  const [prepareAttempt, setPrepareAttempt] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const nextWarmupRef = useRef<string | null>(null)
  const playInFlightRef = useRef(false)
  const autoplayArticleRef = useRef<string | null>(null)
  const instanceIdRef = useRef(`reader-audio-${articleId}-${Math.random().toString(36).slice(2)}`)
  const isHero = variant === 'hero'
  const currentAudioUrl = preparedAudioUrl ?? audioUrl ?? null
  const atmosphere = readerAudioAtmosphereForCategory(categorySlug ?? nextArticle?.category_slug)

  useEffect(() => {
    setPreparedAudioUrl(audioUrl ?? null)
    setCurrentTime(0)
    setDuration(0)
  }, [audioUrl])

  useEffect(() => {
    const handleStop = (event: Event) => {
      const detail = (event as CustomEvent<{ instanceId?: string }>).detail
      if (detail?.instanceId === instanceIdRef.current) return
      audioRef.current?.pause()
      playInFlightRef.current = false
      setState((current) => (current === 'playing' || current === 'preparing' ? 'idle' : current))
    }
    window.addEventListener('scoop-reader-audio-stop', handleStop)
    return () => {
      window.removeEventListener('scoop-reader-audio-stop', handleStop)
      audioRef.current?.pause()
      playInFlightRef.current = false
      stopAmbience()
    }
    // `stopAmbience` is stable enough here; cleanup must always silence global ambience.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setNextAudioQueued(Boolean(nextArticle?.audio_url))
    nextWarmupRef.current = null
  }, [nextArticle?.id, nextArticle?.audio_url])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const shouldAutoplay =
      params.get('autoplayAudio') === '1' ||
      window.sessionStorage.getItem(CONTINUOUS_AUDIO_KEY) === articleId
    if (!shouldAutoplay) return
    if (autoplayArticleRef.current === articleId) return
    autoplayArticleRef.current = articleId

    window.sessionStorage.removeItem(CONTINUOUS_AUDIO_KEY)
    const timer = window.setTimeout(() => {
      void play()
      params.delete('autoplayAudio')
      const qs = params.toString()
      window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`)
    }, 350)
    return () => window.clearTimeout(timer)
    // `play` intentionally uses current refs/state; this effect runs once per article page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId])

  const stopAmbience = () => {
    getReaderAmbientAudio()?.stop()
  }

  const startBedAmbience = () => {
    if (!ambienceEnabled) return
    getReaderAmbientAudio()?.start('bed', atmosphere.url)
  }

  useEffect(() => {
    if (!ambienceEnabled) {
      stopAmbience()
      return
    }

    if (state !== 'playing') {
      stopAmbience()
    }
    // Ambience helpers intentionally read refs and the current toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambienceEnabled, state])

  const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

  const requestAudio = async (
    targetArticleId = articleId,
    updateCurrent = targetArticleId === articleId,
  ): Promise<string | null> => {
    const response = await fetch('/api/reader-bff/article-audio-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: targetArticleId }),
      cache: 'no-store',
    })
    if (!response.ok) throw new Error('audio-access failed')
    const payload = (await response.json()) as {
      data?: { available?: boolean; audio_url?: string | null }
    }
    const nextUrl = payload.data?.available ? payload.data.audio_url ?? null : null
    if (nextUrl && updateCurrent) setPreparedAudioUrl(nextUrl)
    return nextUrl
  }

  const warmNextAudio = async () => {
    if (!nextArticle?.id || nextWarmupRef.current === nextArticle.id) return
    nextWarmupRef.current = nextArticle.id
    try {
      const nextUrl = nextArticle.audio_url ?? await requestAudio(nextArticle.id, false)
      setNextAudioQueued(Boolean(nextUrl))
    } catch {
      setNextAudioQueued(false)
    }
  }

  const waitForPreparedAudio = async (): Promise<string | null> => {
    for (let attempt = 0; attempt < 16; attempt += 1) {
      setPrepareAttempt(attempt + 1)
      const nextUrl = await requestAudio()
      if (nextUrl) return nextUrl
      await wait(attempt < 3 ? 3000 : 6000)
    }
    return null
  }

  const playCurrentAudio = () => {
    if (playInFlightRef.current) return
    const audio = audioRef.current
    if (!audio) {
      stopAmbience()
      setState('error')
      return
    }
    stopOtherReaderAudio(instanceIdRef.current)
    playInFlightRef.current = true
    audio.play()
      .then(() => {
        setState('playing')
      })
      .catch(() => {
        stopAmbience()
        setState('error')
      })
      .finally(() => {
        playInFlightRef.current = false
      })
  }

  const play = async () => {
    if (currentAudioUrl && audioRef.current) {
      playCurrentAudio()
      return
    }

    setPrepareAttempt(0)
    stopAmbience()
    setState('preparing')
    try {
      const nextUrl = await waitForPreparedAudio()
      if (!nextUrl) {
        setState('queued')
        return
      }
      window.setTimeout(() => {
        playCurrentAudio()
      }, 0)
    } catch {
      stopAmbience()
      setState('error')
    }
  }

  const pause = () => {
    audioRef.current?.pause()
    playInFlightRef.current = false
    stopAmbience()
    setState('paused')
  }

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setCurrentTime(0)
    playInFlightRef.current = false
    stopAmbience()
    setState('idle')
  }

  const goToNextArticle = () => {
    if (!nextArticle?.slug) {
      setState('idle')
      stopAmbience()
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.removeAttribute('src')
      audioRef.current.load()
    }
    setCurrentTime(0)
    setDuration(0)
    playInFlightRef.current = false
    stopAmbience()
    setState('preparing')
    window.sessionStorage.setItem(CONTINUOUS_AUDIO_KEY, nextArticle.id)
    router.push(`/articles/${nextArticle.slug}?autoplayAudio=1`)
  }

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio?.duration || Number.isNaN(audio.duration)) return
    setCurrentTime(audio.currentTime)
    setDuration(audio.duration)
    if (audio.currentTime >= audio.duration / 2) void warmNextAudio()
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (!audio) return
    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    setCurrentTime(Number.isFinite(audio.currentTime) ? audio.currentTime : 0)
  }

  const seekTo = (value: number) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const nextTime = Math.min(Math.max(value, 0), duration)
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  const seekBy = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    const max = Number.isFinite(audio.duration) ? audio.duration : duration
    const nextTime = Math.min(Math.max(audio.currentTime + seconds, 0), max || audio.currentTime + seconds)
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  if (!articleId || (!text.trim() && !currentAudioUrl)) return null

  const helperText =
    state === 'preparing'
      ? `Nous préparons la version audio avec Piper${prepareAttempt ? ` (${prepareAttempt}/16)` : ''}. L'ambiance démarre avec la lecture.`
      : state === 'queued'
        ? 'La génération est bien lancée et continue en arrière-plan. Vous pouvez réessayer dans un instant.'
        : state === 'error'
          ? "Nous n'avons pas pu lancer l'audio pour le moment. Réessayez dans un instant."
          : currentAudioUrl
            ? 'Voix Scoop générée avec Piper, accompagnée discrètement.'
            : "La version audio n'est pas encore prête. Nous la préparons dès que vous la demandez."

  return (
    <section
      className={
        isHero
          ? `rounded-[1rem] border border-background/18 bg-background/92 p-3 text-foreground shadow-[var(--shadow-lg)] backdrop-blur-md ${className}`
          : `rounded-[1rem] border border-border bg-background p-4 ${className}`
      }
      aria-label="Lecture audio de l'article"
    >
      {currentAudioUrl ? (
        <audio
          ref={audioRef}
          preload="metadata"
          src={currentAudioUrl}
          onEnded={goToNextArticle}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPause={() => {
            stopAmbience()
            setState((current) => (current === 'playing' ? 'paused' : current))
          }}
          onPlay={() => {
            setState('playing')
            startBedAmbience()
          }}
        />
      ) : null}
      <div className={isHero ? 'flex items-center gap-3' : 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'}>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-sans text-[10px] font-black uppercase tracking-[0.14em] text-primary">
            <Volume2 className="h-4 w-4" aria-hidden />
            Ecouter l&apos;article
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
            <div className="mt-1 space-y-1">
              <p className="max-w-xl text-sm leading-5 text-muted-foreground">{helperText}</p>
              {nextArticle ? (
                <p className="flex items-center gap-1.5 font-sans text-xs font-semibold text-muted-foreground">
                  <Radio className="h-3.5 w-3.5 text-primary" aria-hidden />
                  Lecture continue : {nextAudioQueued ? 'prochain audio prêt' : 'préparation automatique à mi-parcours'}.
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className={isHero ? 'ml-auto flex shrink-0 items-center gap-2' : 'flex items-center gap-2'}>
          <button
            type="button"
            onClick={() => seekBy(-SEEK_BACK_SECONDS)}
            disabled={!currentAudioUrl || duration <= 0}
            className={isHero
              ? 'inline-flex h-10 w-10 items-center justify-center rounded-full border border-background/18 bg-background/10 transition hover:bg-background/20 disabled:cursor-not-allowed disabled:opacity-45'
              : 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50'}
            aria-label={`Reculer de ${SEEK_BACK_SECONDS} secondes`}
          >
            <Rewind className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={state === 'playing' ? pause : play}
            disabled={state === 'preparing'}
            className={
              isHero
                ? 'inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-md)] transition hover:bg-foreground hover:text-background disabled:cursor-wait disabled:opacity-70'
                : 'inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 font-sans text-xs font-black uppercase tracking-[0.1em] text-background transition hover:bg-primary disabled:cursor-wait disabled:opacity-70'
            }
            aria-label={state === 'playing' ? 'Mettre en pause' : state === 'paused' ? 'Reprendre la lecture' : "Ecouter l'article"}
          >
            {state === 'preparing' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : state === 'playing' ? (
              <Pause className="h-4 w-4" aria-hidden />
            ) : (
              <Play className="h-4 w-4" aria-hidden />
            )}
            {isHero ? null : state === 'preparing' ? 'Préparation' : state === 'playing' ? 'Pause' : state === 'paused' ? 'Reprendre' : state === 'queued' ? 'Réessayer' : 'Ecouter'}
          </button>
          <button
            type="button"
            onClick={() => seekBy(SEEK_FORWARD_SECONDS)}
            disabled={!currentAudioUrl || duration <= 0}
            className={isHero
              ? 'inline-flex h-10 w-10 items-center justify-center rounded-full border border-background/18 bg-background/10 transition hover:bg-background/20 disabled:cursor-not-allowed disabled:opacity-45'
              : 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50'}
            aria-label={`Avancer de ${SEEK_FORWARD_SECONDS} secondes`}
          >
            <FastForward className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setAmbienceEnabled((value) => !value)}
            className={
              isHero
                ? `hidden h-10 w-10 items-center justify-center rounded-full border border-background/18 bg-background/10 transition hover:bg-background/20 sm:inline-flex ${ambienceEnabled ? 'text-primary' : 'text-foreground/55'}`
                : `inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card transition hover:border-primary ${ambienceEnabled ? 'text-primary' : 'text-muted-foreground'}`
            }
            aria-label={ambienceEnabled ? "Couper l'ambiance sonore" : "Activer l'ambiance sonore"}
            title={atmosphere.label}
          >
            <Volume2 className="h-4 w-4" aria-hidden />
          </button>
          {!isHero ? (
            <button
              type="button"
              onClick={stop}
              disabled={state !== 'playing' && state !== 'paused'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Arreter la lecture"
            >
              <Square className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div className={isHero ? 'mt-3 space-y-2' : 'mt-4 space-y-2'}>
        <div className="flex items-center justify-between font-sans text-[11px] font-bold text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={1}
          value={duration ? Math.min(currentTime, duration) : 0}
          onChange={(event) => seekTo(Number(event.currentTarget.value))}
          disabled={!currentAudioUrl || duration <= 0}
          aria-label="Progression de la lecture"
          className="h-2 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {isHero && state !== 'idle' ? (
        <div className="mt-3 space-y-1">
          <p className="max-w-sm text-xs leading-5 text-muted-foreground">{helperText}</p>
          {nextArticle ? (
            <p className="max-w-sm font-sans text-[11px] font-semibold text-muted-foreground">
              Lecture continue vers : {nextArticle.title}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
