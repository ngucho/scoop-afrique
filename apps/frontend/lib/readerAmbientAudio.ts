type AmbientMode = 'transition' | 'bed'

const VOLUMES: Record<AmbientMode, number> = {
  transition: 0.25,
  bed: 0.2,
}

class ReaderAmbientAudio {
  private audio: HTMLAudioElement | null = null
  private mode: AmbientMode | null = null
  private url: string | null = null

  start(mode: AmbientMode, url: string) {
    if (typeof window === 'undefined') return
    const audio = this.getAudio()
    if (!audio) return

    const nextUrl = new URL(url, window.location.origin).toString()
    if (this.mode !== mode || this.url !== nextUrl) {
      audio.pause()
      audio.src = nextUrl
      audio.currentTime = 0
      this.mode = mode
      this.url = nextUrl
    }

    audio.loop = true
    audio.volume = VOLUMES[mode]
    void audio.play().catch(() => {})
  }

  stop() {
    const audio = this.audio
    if (!audio) return
    audio.pause()
    this.mode = null
  }

  private getAudio() {
    if (this.audio) return this.audio
    if (typeof window === 'undefined') return null
    this.audio = new Audio()
    this.audio.preload = 'auto'
    return this.audio
  }
}

declare global {
  interface Window {
    __scoopReaderAmbientAudio?: ReaderAmbientAudio
  }
}

export function getReaderAmbientAudio() {
  if (typeof window === 'undefined') return null
  window.__scoopReaderAmbientAudio ??= new ReaderAmbientAudio()
  return window.__scoopReaderAmbientAudio
}
