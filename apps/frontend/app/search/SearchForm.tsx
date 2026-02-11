'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { SearchInput, Button } from 'scoop'

export function SearchForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const q = (form.elements.namedItem('q') as HTMLInputElement | null)?.value?.trim()
    if (q) {
      startTransition(() => {
        router.push(`/articles?q=${encodeURIComponent(q)}`)
      })
    } else {
      router.push('/articles')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <SearchInput
        name="q"
        placeholder="Mot-clé, sujet..."
        className="flex-1"
        disabled={isPending}
        aria-label="Recherche d’articles"
      />
      <Button type="submit" disabled={isPending} className="sm:shrink-0">
        {isPending ? 'Recherche…' : 'Rechercher'}
      </Button>
    </form>
  )
}
