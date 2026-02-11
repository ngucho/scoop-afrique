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
        className={cn(
          'relative flex h-12 w-12 items-center justify-center border border-border bg-background/80 backdrop-blur-sm transition-all duration-300',
          className
        )}
        aria-label="Toggle theme"
        {...props}
      >
        <div className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'group relative flex h-12 w-12 items-center justify-center border border-border bg-background/80 backdrop-blur-sm transition-all duration-300 hover:border-primary hover:bg-primary',
        className
      )}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      data-hover
      {...props}
    >
      <div className="relative h-5 w-5">
        <Sun
          className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
            isDark
              ? 'rotate-90 scale-0 opacity-0'
              : 'rotate-0 scale-100 opacity-100 text-foreground group-hover:text-primary-foreground'
          }`}
        />
        <Moon
          className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
            isDark
              ? 'rotate-0 scale-100 opacity-100 text-foreground group-hover:text-primary-foreground'
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
      <span className="absolute inset-0 -translate-y-full bg-primary transition-transform duration-300 group-hover:translate-y-0" aria-hidden />
    </button>
  )
}
