'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const labelVariants = cva(
  'font-sans font-medium text-foreground leading-none peer-disabled:opacity-50 peer-disabled:pointer-events-none',
  {
    variants: {
      size: {
        sm: 'text-xs',
        default: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, size, ...props }, ref) => (
    <label ref={ref} className={cn(labelVariants({ size, className }))} {...props} />
  )
)
Label.displayName = 'Label'

export { Label, labelVariants }
