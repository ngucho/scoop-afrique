'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '../utils/cn'
import { Input } from './Input'

export interface SearchInputProps extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  onClear?: () => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, ...props }, ref) => (
    <div className={cn('relative flex w-full items-center', className)}>
      <Search
        className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground"
        aria-hidden
      />
      <Input
        ref={ref}
        type="search"
        className="pl-9 pr-4"
        autoComplete="off"
        aria-label={props['aria-label'] ?? 'Rechercher'}
        {...props}
      />
    </div>
  )
)
SearchInput.displayName = 'SearchInput'

export { SearchInput }
