'use client'

/**
 * AnimatedSection — Intersection Observer-based reveal animation.
 *
 * Elements animate in when they scroll into view.
 * No external dependencies, uses CSS animations from animations.css.
 * Mobile-friendly: respects prefers-reduced-motion.
 */
import { useRef, useEffect, useState, type ReactNode } from 'react'

type AnimationType = 'fade-in-up' | 'fade-in' | 'slide-in-left' | 'slide-in-right' | 'scale-in'

const ANIMATION_MAP: Record<AnimationType, string> = {
  'fade-in-up': 'animate-fade-in-up',
  'fade-in': 'animate-fade-in',
  'slide-in-left': 'animate-slide-in-left',
  'slide-in-right': 'animate-slide-in-right',
  'scale-in': 'animate-scale-in',
}

interface AnimatedSectionProps {
  children: ReactNode
  animation?: AnimationType
  delay?: number
  className?: string
  /** Threshold: 0 to 1 — how much of the element must be visible */
  threshold?: number
  as?: 'div' | 'section' | 'article' | 'li'
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
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

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

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={`${className} ${isVisible ? ANIMATION_MAP[animation] : 'opacity-0'}`}
      style={delay > 0 ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </Tag>
  )
}

/**
 * StaggerChildren — staggers animation of child elements.
 * Wraps each child in an AnimatedSection with incremental delays.
 */
export function StaggerChildren({
  children,
  animation = 'fade-in-up',
  staggerMs = 50,
  className = '',
}: {
  children: ReactNode[]
  animation?: AnimationType
  staggerMs?: number
  className?: string
}) {
  return (
    <>
      {children.map((child, i) => (
        <AnimatedSection
          key={i}
          animation={animation}
          delay={(i * staggerMs) / 1000}
          className={className}
        >
          {child}
        </AnimatedSection>
      ))}
    </>
  )
}
