'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const textVariants = cva('font-sans', {
  variants: {
    variant: {
      body: 'text-base text-foreground',
      muted: 'text-sm text-muted-foreground md:text-base',
      small: 'text-xs text-muted-foreground',
      mono: 'font-mono text-xs uppercase tracking-widest text-muted-foreground',
      lead: 'text-lg text-muted-foreground md:text-xl',
      caption: 'text-sm text-muted-foreground',
      overline: 'text-xs font-semibold uppercase tracking-wider text-muted-foreground',
      label: 'text-sm font-medium text-foreground',
      quote: 'font-[var(--font-scoop)] text-xl leading-relaxed text-foreground',
    },
    truncate: {
      none: '',
      '1': 'scoop-line-clamp-1',
      '2': 'scoop-line-clamp-2',
      '3': 'scoop-line-clamp-3',
    },
  },
  defaultVariants: {
    variant: 'body',
    truncate: 'none',
  },
})

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, truncate, ...props }, ref) => (
    <p ref={ref} className={cn(textVariants({ variant, truncate, className }))} {...props} />
  )
)
Text.displayName = 'Text'

export { Text, textVariants }
