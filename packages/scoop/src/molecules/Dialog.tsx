'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../utils/cn'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
  /** Optional footer (e.g. buttons). */
  footer?: React.ReactNode
  /** Optional class for the content panel. */
  className?: string
  /** Optional aria description. */
  description?: string
}

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ open, onOpenChange, title, children, footer, className, description }, ref) => {
    const panelRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (!open) return
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onOpenChange(false)
      }
      document.addEventListener('keydown', onKeyDown)
      return () => document.removeEventListener('keydown', onKeyDown)
    }, [open, onOpenChange])

    React.useEffect(() => {
      if (open && panelRef.current) {
        panelRef.current.focus({ preventScroll: true })
      }
    }, [open])

    if (!open) return null

    const content = (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-desc' : undefined}
      >
        <div
          className="fixed inset-0 bg-overlay"
          aria-hidden
          onClick={() => onOpenChange(false)}
        />
        <div
          ref={(node) => {
            (panelRef as React.MutableRefObject<HTMLDivElement | null>).current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
          }}
          tabIndex={-1}
          className={cn(
            'relative z-50 w-full max-w-md rounded-lg border border-border bg-popover p-6 text-popover-foreground shadow-lg',
            'focus:outline-none',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="dialog-title" className="text-lg font-semibold">
            {title}
          </h2>
          {description ? (
            <p id="dialog-desc" className="sr-only">
              {description}
            </p>
          ) : null}
          <div className="mt-4">{children}</div>
          {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
        </div>
      </div>
    )

    if (typeof document !== 'undefined') {
      return createPortal(content, document.body)
    }
    return content
  }
)
Dialog.displayName = 'Dialog'

export { Dialog }
