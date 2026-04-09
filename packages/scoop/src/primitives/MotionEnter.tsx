'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface MotionEnterProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article'
  /** Disable enter animation (e.g. when parent already gates on reduced motion). */
  disabled?: boolean
}

/**
 * Fade/slide-in preset — CSS `scoop-motion-enter` respects `prefers-reduced-motion`.
 */
export function MotionEnter({
  as: Component = 'div',
  className,
  disabled,
  style,
  ...props
}: MotionEnterProps) {
  return (
    <Component
      className={cn(!disabled && 'scoop-motion-enter', className)}
      style={{
        animationDuration: disabled ? undefined : 'var(--motion-duration-base)',
        animationTimingFunction: disabled ? undefined : 'var(--motion-ease-out)',
        ...style,
      }}
      {...props}
    />
  )
}
