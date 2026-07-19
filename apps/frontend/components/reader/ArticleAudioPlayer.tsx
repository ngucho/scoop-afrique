'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pause, Play, Radio, Square, Volume2 } from 'lucide-react'
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
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const transitionAudioRef = useRef<HTMLAudioElement | null>(null)
  const bedAudioRef = useRef<HTMLAudioElement | null>(null)
  const nextWarmupRef = useRef<string | null>(null)
  const isHero = variant === 'hero'
  const currentAudioUrl = preparedAudioUrl ?? audioUrl ?? null
  const atmosphere = readerAudioAtmosphereForCategory(categorySlug ?? nextArticle?.category_slug)

  useEffect(() => {
    setPreparedAudioUrl(audioUrl ?? null)
  }, [audioUrl])

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
    const transition = transitionAudioRef.current
    const bed = bedAudioRef.current
    transition?.pause()
    bed?.pause()
    getReaderAmbientAudio()?.stop()
  }

  const startTransitionAmbience = () => {
    if (!ambienceEnabled) return
    const transition = transitionAudioRef.current
    const bed = bedAudioRef.current
    if (!transition) return
    bed?.pause()
    transition.volume = 0.28
    transition.loop = true
    if (transition.paused) transition.currentTime = 0
    void transition.play().catch(() => {})
    getReaderAmbientAudio()?.start('transition')
  }

  const startBedAmbience = () => {
    if (!ambienceEnabled) return
    const transition = transitionAudioRef.current
    const bed = bedAudioRef.current
    if (!bed) return
    transition?.pause()
    bed.volume = 0.07
    bed.loop = true
    void bed.play().catch(() => {})
    getReaderAmbientAudio()?.start('bed')
  }

  useEffect(() => {
    const transition = transitionAudioRef.current
    const bed = bedAudioRef.current
    if (!transition || !bed) return

    if (!ambienceEnabled) {
      stopAmbience()
      return
    }

    if (state === 'preparing') {
      startTransitionAmbience()
    } else if (state === 'playing') {
      startBedAmbience()
    } else {
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
    const audio = audioRef.current
    if (!audio) {
      stopAmbience()
      setState('error')
      return
    }
    audio.play()
      .then(() => {
        setState('playing')
        startBedAmbience()
      })
      .catch(() => {
        stopAmbience()
        setState('error')
      })
  }

  const play = async () => {
    if (currentAudioUrl && audioRef.current) {
      playCurrentAudio()
      return
    }

    setPrepareAttempt(0)
    startTransitionAmbience()
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
    stopAmbience()
    setState('paused')
  }

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    stopAmbience()
    setState('idle')
  }

  const goToNextArticle = () => {
    if (!nextArticle?.slug) {
      setState('idle')
      return
    }
    startTransitionAmbience()
    setState('preparing')
    window.sessionStorage.setItem(CONTINUOUS_AUDIO_KEY, nextArticle.id)
    router.push(`/articles/${nextArticle.slug}?autoplayAudio=1`)
  }

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio?.duration || Number.isNaN(audio.duration)) return
    if (audio.currentTime >= audio.duration / 2) void warmNextAudio()
  }

  if (!articleId || (!text.trim() && !currentAudioUrl)) return null

  const helperText =
    state === 'preparing'
      ? `Nous préparons la version audio avec Piper. Une ambiance douce reste en fond pendant l'attente${prepareAttempt ? ` (${prepareAttempt}/16)` : ''}.`
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
          onPause={() => setState((current) => (current === 'playing' ? 'paused' : current))}
          onPlay={() => setState('playing')}
        />
      ) : null}
      <audio ref={transitionAudioRef} preload="none" src={atmosphere.url} aria-hidden />
      <audio ref={bedAudioRef} preload="none" src={atmosphere.url} aria-hidden />

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
