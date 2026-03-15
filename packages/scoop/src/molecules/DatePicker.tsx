'use client'

import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { format, subYears, addYears } from 'date-fns'
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
  /** Year range for dropdown: years back from today (default 10) */
  yearsBack?: number
  /** Year range for dropdown: years forward from today (default 2) */
  yearsForward?: number
}

function buildDayPickerClassNames() {
  return {
    root: 'scoop-datepicker-root',
    month: 'scoop-datepicker-month',
    month_caption: 'flex justify-center gap-2 font-semibold text-foreground',
    month_caption_layout: 'flex items-center justify-center gap-2',
    month_grid: 'scoop-datepicker-month-grid',
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
    dropdowns: 'flex items-center justify-center gap-2 mb-3',
    dropdown_root: 'scoop-datepicker-dropdown-root',
    dropdown: 'scoop-datepicker-dropdown',
    months_dropdown:
      'min-w-[120px] rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer appearance-none',
    years_dropdown:
      'min-w-[80px] rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer appearance-none',
    chevron: 'hidden',
  }
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Sélectionner une date',
      disabled,
      error,
      className,
      mode = 'popover',
      yearsBack = 10,
      yearsForward = 2,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const popoverRef = React.useRef<HTMLDivElement>(null)

    const today = React.useMemo(() => new Date(), [])
    const startMonth = React.useMemo(() => subYears(today, yearsBack), [today, yearsBack])
    const endMonth = React.useMemo(() => addYears(today, yearsForward), [today, yearsForward])
    const defaultMonth = value ?? today
    const dayPickerClassNames = React.useMemo(() => buildDayPickerClassNames(), [])

    const dayPickerProps = {
      mode: 'single' as const,
      selected: value,
      locale: fr,
      classNames: dayPickerClassNames,
      captionLayout: 'dropdown' as const,
      hideNavigation: true,
      startMonth,
      endMonth,
      defaultMonth,
    }

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
          {...dayPickerProps}
          onSelect={onChange}
          className={cn('rounded-[var(--radius)] border border-border bg-popover p-4', className)}
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
              {...dayPickerProps}
              onSelect={(date: Date | undefined) => {
                onChange?.(date)
                setOpen(false)
              }}
            />
          </div>
        )}
      </div>
    )
  }
)
DatePicker.displayName = 'DatePicker'

export { DatePicker }
