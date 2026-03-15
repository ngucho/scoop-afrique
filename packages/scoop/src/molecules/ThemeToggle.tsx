'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '../utils/cn'

export interface ThemeToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function ThemeToggle({ className, ...props }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const html = document.documentElement
    setIsDark(html.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    const html = document.documentElement
    if (isDark) {
      html.classList.remove('dark')
      setIsDark(false)
    } else {
      html.classList.add('dark')
      setIsDark(true)
    }
  }

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground', className)}
        aria-label="Toggle theme"
        {...props}
      >
        <div className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary',
        className
      )}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      {...props}
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  )
}
