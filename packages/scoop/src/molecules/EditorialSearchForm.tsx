'use client'

import * as React from 'react'
import { cn } from '../utils/cn'
import { Button } from '../atoms/Button'
import { SearchInput } from '../atoms/SearchInput'

export interface EditorialSearchFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  /** Appelé avec la requête non vide, ou chaîne vide si submit sans texte (comportement app). */
  onSearch: (query: string) => void
  isPending?: boolean
  variant?: 'default' | 'hero'
  placeholder?: string
  submitLabel?: string
  pendingLabel?: string
  searchName?: string
  searchAriaLabel?: string
  autoFocus?: boolean
}

/**
 * Formulaire recherche éditorial — sans routeur ; le parent gère la navigation.
 */
export function EditorialSearchForm({
  onSearch,
  isPending = false,
  variant = 'default',
  placeholder,
  submitLabel = 'Rechercher',
  pendingLabel = 'Recherche…',
  searchName = 'q',
  searchAriaLabel = 'Recherche',
  autoFocus,
  className,
  ...props
}: EditorialSearchFormProps) {
  const isHero = variant === 'hero'
  const ph =
    placeholder ?? (isHero ? 'Mots-clés, sujets, pays…' : 'Mot-clé, sujet…')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const raw = (form.elements.namedItem(searchName) as HTMLInputElement | null)?.value
    onSearch(raw?.trim() ?? '')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-stretch', className)}
      {...props}
    >
      <SearchInput
        name={searchName}
        variant={isHero ? 'hero' : 'default'}
        placeholder={ph}
        disabled={isPending}
        aria-label={searchAriaLabel}
        autoFocus={autoFocus}
        className={isHero ? 'flex-1' : 'flex-1'}
      />
      <Button
        type="submit"
        disabled={isPending}
        size={isHero ? 'lg' : 'default'}
        className={isHero ? 'shrink-0 rounded-xl px-8 sm:self-stretch' : 'sm:shrink-0'}
      >
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  )
}
