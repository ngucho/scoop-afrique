'use client'

/**
 * Brut-style animated SVG: broadcast waves illustrating Scoop Afrique's reach.
 */
export function AnimatedBroadcastSvg() {
  return (
    <svg
      viewBox="0 0 200 120"
      className="h-24 w-full max-w-md text-primary/30 sm:h-32"
      aria-hidden
    >
      <defs>
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
          <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {/* Center dot */}
      <circle cx="100" cy="60" r="4" fill="var(--primary)" className="animate-pulse" />
      {/* Animated waves */}
      <ellipse
        cx="100"
        cy="60"
        rx="30"
        ry="15"
        fill="none"
        stroke="url(#waveGrad)"
        strokeWidth="1.5"
        className="animate-[broadcast-wave_2s_ease-out_infinite]"
        style={{ transformOrigin: '100px 60px' }}
      />
      <ellipse
        cx="100"
        cy="60"
        rx="50"
        ry="25"
        fill="none"
        stroke="url(#waveGrad)"
        strokeWidth="1"
        className="animate-[broadcast-wave_2s_ease-out_0.3s_infinite]"
        style={{ transformOrigin: '100px 60px' }}
      />
      <ellipse
        cx="100"
        cy="60"
        rx="70"
        ry="35"
        fill="none"
        stroke="url(#waveGrad)"
        strokeWidth="0.75"
        className="animate-[broadcast-wave_2s_ease-out_0.6s_infinite]"
        style={{ transformOrigin: '100px 60px' }}
      />
    </svg>
  )
}
