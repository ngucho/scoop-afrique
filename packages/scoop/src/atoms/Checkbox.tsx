'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement | null>(null)
    const setRefs = (el: HTMLInputElement | null) => {
      (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el
    }
    React.useEffect(() => {
      const el = internalRef.current
      if (el) el.indeterminate = !!indeterminate
    }, [indeterminate])
    return (
      <input
        type="checkbox"
        ref={setRefs}
        className={cn(
          'peer h-4 w-4 shrink-0 rounded border border-input bg-background transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'checked:bg-primary checked:border-primary',
          className
        )}
        {...props}
      />
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
