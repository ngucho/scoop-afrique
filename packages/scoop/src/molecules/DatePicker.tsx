'use client'

import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar } from 'lucide-react'
import { cn } from '../utils/cn'

export interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  className?: string
  /** Show calendar popover (default) or inline */
  mode?: 'popover' | 'inline'
}

const dayPickerClassNames = {
  root: 'scoop-datepicker-root',
  month: 'scoop-datepicker-month',
  month_caption: 'flex justify-center font-semibold text-foreground',
  nav: 'flex gap-2',
  button_previous:
    'h-9 w-9 rounded-[var(--radius-sm)] border border-border bg-background text-foreground hover:bg-muted transition-colors',
  button_next:
    'h-9 w-9 rounded-[var(--radius-sm)] border border-border bg-background text-foreground hover:bg-muted transition-colors',
  weekdays: 'flex gap-1',
  weekday: 'w-9 text-center text-xs font-medium text-muted-foreground',
  week: 'flex gap-1',
  day: 'h-9 w-9 rounded-[var(--radius-sm)] text-center text-sm text-foreground',
  day_button:
    'h-9 w-9 rounded-[var(--radius-sm)] hover:bg-primary hover:text-primary-foreground transition-colors',
  selected: 'bg-primary text-primary-foreground',
  today: 'font-bold',
  disabled: 'text-muted-foreground opacity-50',
  outside: 'text-muted-foreground opacity-50',
  hidden: 'invisible',
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ value, onChange, placeholder = 'Sélectionner une date', disabled, error, className, mode = 'popover' }, ref) => {
    const [open, setOpen] = React.useState(false)
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const popoverRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (!open) return
      const handleClickOutside = (e: MouseEvent) => {
        if (
          popoverRef.current &&
          !popoverRef.current.contains(e.target as Node) &&
          !buttonRef.current?.contains(e.target as Node)
        ) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    const mergedRef = (node: HTMLButtonElement | null) => {
      (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
    }

    if (mode === 'inline') {
      return (
        <DayPicker
          mode="single"
          selected={value}
          onSelect={onChange}
          locale={fr}
          className={cn('rounded-[var(--radius)] border border-border bg-popover p-4', className)}
          classNames={dayPickerClassNames}
        />
      )
    }

    return (
      <div className="relative">
        <button
          ref={mergedRef}
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={cn(
            'flex h-11 w-full items-center gap-2 rounded-[var(--radius-button)] border border-[var(--surface-border)] bg-[var(--surface)] px-4 py-3 font-sans text-sm text-foreground transition-colors',
            'border-input bg-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="flex-1 text-left">
            {value ? format(value, 'PPP', { locale: fr }) : placeholder}
          </span>
        </button>
        {open && (
          <div
            ref={popoverRef}
            className="absolute left-0 top-full z-50 mt-2 rounded-[var(--radius-xl)] border border-[var(--surface-border)] bg-popover p-4 shadow-[var(--shadow-lg)]"
          >
            <DayPicker
              mode="single"
              selected={value}
              onSelect={(date) => {
                onChange?.(date)
                setOpen(false)
              }}
              locale={fr}
              classNames={dayPickerClassNames}
            />
          </div>
        )}
      </div>
    )
  }
)
DatePicker.displayName = 'DatePicker'

export { DatePicker }
