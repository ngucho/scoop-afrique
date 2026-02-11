'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean
  onChange?: (checked: boolean) => void
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, checked = false, onChange, onClick, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        'inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-input bg-input transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
        className
      )}
      data-state={checked ? 'checked' : 'unchecked'}
      onClick={(e) => {
        onChange?.(!checked)
        onClick?.(e)
      }}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-sm transition-transform',
          checked && 'translate-x-5'
        )}
      />
    </button>
  )
)
Toggle.displayName = 'Toggle'

export { Toggle }
