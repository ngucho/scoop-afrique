'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, ...props }, ref) => (
    <input
      type="radio"
      ref={ref}
      className={cn(
        'h-4 w-4 shrink-0 rounded-full border border-input bg-background transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'checked:border-primary checked:bg-primary checked:ring-2 checked:ring-primary checked:ring-offset-2',
        className
      )}
      {...props}
    />
  )
)
Radio.displayName = 'Radio'

export { Radio }
