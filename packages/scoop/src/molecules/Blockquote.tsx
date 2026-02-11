'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface BlockquoteProps extends React.HTMLAttributes<HTMLQuoteElement> {}

const Blockquote = React.forwardRef<HTMLQuoteElement, BlockquoteProps>(
  ({ className, ...props }, ref) => (
    <blockquote
      ref={ref}
      className={cn('border-l-2 border-primary pl-6', className)}
      {...props}
    />
  )
)
Blockquote.displayName = 'Blockquote'

const BlockquoteContent = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('font-sans text-lg text-muted-foreground md:text-xl', className)} {...props} />
))
BlockquoteContent.displayName = 'BlockquoteContent'

const BlockquoteFooter = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <footer ref={ref} className={cn('font-mono text-sm text-primary', className)} {...props} />
))
BlockquoteFooter.displayName = 'BlockquoteFooter'

export { Blockquote, BlockquoteContent, BlockquoteFooter }
