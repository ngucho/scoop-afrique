'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Pause, Play, Square, Volume2 } from 'lucide-react'
import { config } from '@/lib/config'

type PlaybackState = 'idle' | 'playing' | 'paused' | 'preparing' | 'error'

export function ArticleAudioPlayer({
  articleId,
  text,
  audioUrl,
  className = '',
  variant = 'inline',
}: {
  articleId: string
  text: string
  audioUrl?: string | null
  className?: string
  variant?: 'inline' | 'hero'
}) {
  const [state, setState] = useState<PlaybackState>('idle')
  const [preparedAudioUrl, setPreparedAudioUrl] = useState<string | null>(audioUrl ?? null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isHero = variant === 'hero'
  const currentAudioUrl = preparedAudioUrl ?? audioUrl ?? null

  useEffect(() => {
    setPreparedAudioUrl(audioUrl ?? null)
  }, [audioUrl])

  const requestAudio = async (): Promise<string | null> => {
    const response = await fetch(`${config.apiBaseUrl}/api/v1/articles/${encodeURIComponent(articleId)}/audio-access`, {
      method: 'POST',
      keepalive: true,
    })
    if (!response.ok) throw new Error('audio-access failed')
    const payload = (await response.json()) as {
      data?: { available?: boolean; audio_url?: string | null }
    }
    const nextUrl = payload.data?.available ? payload.data.audio_url ?? null : null
    if (nextUrl) setPreparedAudioUrl(nextUrl)
    return nextUrl
  }

  const play = async () => {
    if (currentAudioUrl && audioRef.current) {
      audioRef.current.play().then(() => setState('playing')).catch(() => setState('error'))
      return
    }

    setState('preparing')
    try {
      const nextUrl = await requestAudio()
      if (!nextUrl) return
      window.setTimeout(() => {
        audioRef.current?.play().then(() => setState('playing')).catch(() => setState('error'))
      }, 0)
    } catch {
      setState('error')
    }
  }

  const pause = () => {
    audioRef.current?.pause()
    setState('paused')
  }

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setState('idle')
  }

  if (!articleId || (!text.trim() && !currentAudioUrl)) return null

  const helperText =
    state === 'preparing'
      ? "Nous préparons la version audio de cet article. Elle sera disponible dans quelques instants."
      : state === 'error'
        ? "Nous n'avons pas pu lancer l'audio pour le moment. Réessayez dans un instant."
        : currentAudioUrl
          ? 'Voix Scoop générée avec Piper.'
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
            <p className="mt-1 max-w-xl text-sm leading-5 text-muted-foreground">{helperText}</p>
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
            {isHero ? null : state === 'preparing' ? 'Préparation' : state === 'playing' ? 'Pause' : state === 'paused' ? 'Reprendre' : 'Ecouter'}
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
        <p className="mt-3 max-w-sm text-xs leading-5 text-muted-foreground">{helperText}</p>
      ) : null}
    </section>
  )
}
