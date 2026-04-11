'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { EditorialSearchForm } from 'scoop'

export function SearchForm({ variant = 'default' }: { variant?: 'default' | 'hero' }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <EditorialSearchForm
      variant={variant}
      isPending={isPending}
      autoFocus={variant === 'hero'}
      onSearch={(q) => {
        startTransition(() => {
          if (q) router.push(`/articles?q=${encodeURIComponent(q)}`)
          else router.push('/articles')
        })
      }}
    />
  )
}
