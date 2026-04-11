'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Search } from 'lucide-react'
import { cn } from '../utils/cn'
import { Input } from './Input'

const searchInputVariants = cva('relative flex w-full items-center', {
  variants: {
    variant: {
      default: '',
      hero: '',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface SearchInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'type'>,
    VariantProps<typeof searchInputVariants> {
  onClear?: () => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, variant, onClear, ...props }, ref) => {
    const isHero = variant === 'hero'
    return (
      <div className={cn(searchInputVariants({ variant }), className)}>
        <Search
          className={cn(
            'pointer-events-none absolute text-muted-foreground',
            isHero ? 'left-4 h-5 w-5' : 'left-3 h-4 w-4'
          )}
          aria-hidden
        />
        <Input
          ref={ref}
          type="search"
          className={cn(
            'pr-4',
            isHero ? 'min-h-14 rounded-xl border-border bg-background/80 pl-12 text-base shadow-sm backdrop-blur-md sm:text-lg' : 'pl-9'
          )}
          autoComplete="off"
          aria-label={props['aria-label'] ?? 'Rechercher'}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = 'SearchInput'

export { SearchInput, searchInputVariants }
