'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'

const skeletonVariants = cva('rounded-[var(--radius-md)]', {
  variants: {
    variant: {
      default: 'animate-pulse bg-muted',
      glass: 'scoop-skeleton-glass',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  )
)
Skeleton.displayName = 'Skeleton'

export { Skeleton, skeletonVariants }
