'use client'

import * as React from 'react'
import { useEffect, useState, useRef } from 'react'
import { cn } from '../utils/cn'

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*'

export interface GlitchTextProps extends React.HTMLAttributes<HTMLElement> {
  text: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  delay?: number
  scramble?: boolean
}

export function GlitchText({
  text,
  as: Component = 'span',
  delay = 0,
  scramble = true,
  className,
  ...props
}: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(scramble ? '' : text)
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setTimeout(() => setIsVisible(true), delay)
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  useEffect(() => {
    if (!isVisible || !scramble) return
    let iteration = 0
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' '
            if (index < iteration) return text[index]
            return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
          })
          .join('')
      )
      if (iteration >= text.length) clearInterval(interval)
      iteration += 0.5
    }, 30)
    return () => clearInterval(interval)
  }, [isVisible, text, scramble])

  const handleHover = () => {
    if (!scramble) return
    setIsHovered(true)
    let iteration = 0
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' '
            if (index < iteration) return text[index]
            return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
          })
          .join('')
      )
      if (iteration >= text.length) {
        clearInterval(interval)
        setIsHovered(false)
      }
      iteration += 1
    }, 25)
  }

  return (
    <Component
      ref={ref as React.Ref<HTMLHeadingElement & HTMLParagraphElement & HTMLSpanElement>}
      className={cn(isHovered && 'scoop-glitch-skew', className)}
      onMouseEnter={handleHover}
      style={{
        opacity: isVisible || !scramble ? 1 : 0,
        transition: 'opacity 0.3s',
      }}
      data-hover
      {...props}
    >
      {scramble ? displayText : text}
    </Component>
  )
}
