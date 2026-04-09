'use client'

import { useRef, useEffect, useState, type ReactNode } from 'react'

interface AnimatedSectionProps {
  children: ReactNode
  animation?: 'fade-in-up' | 'fade-in'
  delay?: number
  className?: string
  threshold?: number
  as?: 'div' | 'section' | 'article'
}

export function AnimatedSection({
  children,
  animation = 'fade-in-up',
  delay = 0,
  className = '',
  threshold = 0.1,
  as: Tag = 'div',
}: AnimatedSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  const animClass = animation === 'fade-in-up' ? 'animate-fade-in-up' : 'animate-fade-in'

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={`${className} ${isVisible ? animClass : 'opacity-0'}`}
      style={delay > 0 ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </Tag>
  )
}
