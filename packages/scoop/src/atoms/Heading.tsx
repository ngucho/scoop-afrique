'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const headingVariants = cva('font-sans font-bold tracking-tight text-foreground', {
  variants: {
    level: {
      h1: 'text-4xl md:text-5xl',
      h2: 'text-2xl md:text-3xl',
      h3: 'text-xl md:text-2xl',
      h4: 'text-lg md:text-xl',
      h5: 'text-base md:text-lg',
      h6: 'text-sm md:text-base',
    },
    accent: {
      none: '',
      primary: 'text-primary',
      signal: 'text-[var(--signal)]',
    },
  },
  defaultVariants: {
    level: 'h1',
    accent: 'none',
  },
})

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, as: Tag = 'h1', level = 'h1', accent, ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn(headingVariants({ level, accent, className }))}
      {...props}
    />
  )
)
Heading.displayName = 'Heading'

export { Heading, headingVariants }
