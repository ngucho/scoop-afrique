type AmbientMode = 'transition' | 'bed'

class ReaderAmbientAudio {
  private context: AudioContext | null = null
  private nodes: AudioNode[] = []
  private interval: number | null = null

  start(mode: AmbientMode) {
    if (typeof window === 'undefined') return
    const context = this.getContext()
    if (!context) return
    void context.resume().catch(() => {})

    this.stop()
    const master = context.createGain()
    master.gain.value = mode === 'transition' ? 0.045 : 0.018
    master.connect(context.destination)
    this.nodes.push(master)

    if (mode === 'bed') {
      this.addDrone(context, master)
    }

    const playPluck = () => this.playPluck(context, master, mode)
    playPluck()
    this.interval = window.setInterval(playPluck, mode === 'transition' ? 850 : 1700)
  }

  stop() {
    if (typeof window !== 'undefined' && this.interval) {
      window.clearInterval(this.interval)
      this.interval = null
    }
    for (const node of this.nodes) {
      try {
        node.disconnect()
      } catch {
        // Already disconnected.
      }
    }
    this.nodes = []
  }

  private getContext() {
    if (this.context) return this.context
    if (typeof window === 'undefined') return null
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null
    this.context = new AudioContextClass()
    return this.context
  }

  private addDrone(context: AudioContext, destination: AudioNode) {
    for (const frequency of [98, 147]) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.value = 0.16
      oscillator.connect(gain)
      gain.connect(destination)
      oscillator.start()
      this.nodes.push(oscillator, gain)
    }
  }

  private playPluck(context: AudioContext, destination: AudioNode, mode: AmbientMode) {
    const scale = [196, 220, 247, 294, 330, 392]
    const frequency = scale[Math.floor(Math.random() * scale.length)]
    const now = context.currentTime
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(mode === 'transition' ? 0.34 : 0.16, now + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (mode === 'transition' ? 0.42 : 0.72))
    oscillator.connect(gain)
    gain.connect(destination)
    oscillator.start(now)
    oscillator.stop(now + 0.8)
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
    __scoopReaderAmbientAudio?: ReaderAmbientAudio
  }
}

export function getReaderAmbientAudio() {
  if (typeof window === 'undefined') return null
  window.__scoopReaderAmbientAudio ??= new ReaderAmbientAudio()
  return window.__scoopReaderAmbientAudio
}
