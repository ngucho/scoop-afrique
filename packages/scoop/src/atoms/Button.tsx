'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-sans font-bold uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [data-hover]',
  {
    variants: {
      variant: {
        default:
          'border-2 border-primary bg-primary text-primary-foreground hover:opacity-90 active:opacity-95',
        secondary:
          'border-2 border-border bg-secondary text-secondary-foreground hover:bg-muted hover:border-muted-foreground/30',
        outline:
          'border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground',
        text: 'border-0 bg-transparent text-foreground hover:bg-muted hover:text-primary',
        ghost: 'border border-border bg-transparent text-foreground hover:border-primary hover:text-primary',
        fillHover:
          'group relative overflow-hidden border-2 border-primary bg-transparent text-primary hover:text-primary-foreground',
        danger:
          'border-2 border-destructive bg-destructive text-destructive-foreground hover:opacity-90 active:opacity-95',
        breaking:
          'border-2 border-[var(--signal)] bg-[var(--signal)] text-[var(--signal-foreground)] hover:opacity-90 active:opacity-95',
      },
      size: {
        sm: 'px-4 py-2 text-xs',
        default: 'px-6 py-3 text-sm sm:px-8 sm:py-4',
        lg: 'px-8 py-4 text-sm',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, children, loading, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading
    const computedClassName = cn(buttonVariants({ variant, size, className }))
    const content =
      variant === 'fillHover' ? (
        <>
          <span className="absolute inset-0 -translate-x-full bg-primary transition-transform duration-300 group-hover:translate-x-0" aria-hidden />
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
            ) : null}
            {children}
          </span>
        </>
      ) : (
        <>
          {loading ? (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          ) : null}
          {children}
        </>
      )
    if (asChild && React.isValidElement(children) && !loading) {
      const childProps = (children as React.ReactElement<{ className?: string }>).props
      return React.cloneElement(children as React.ReactElement, {
        className: cn(childProps?.className, computedClassName),
        ref,
        'data-hover': true,
      } as React.Attributes & { className?: string; ref?: React.Ref<unknown>; 'data-hover'?: boolean })
    }
    return (
      <button ref={ref} className={computedClassName} data-hover disabled={isDisabled} aria-busy={loading} {...props}>
        {content}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
