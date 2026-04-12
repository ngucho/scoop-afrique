'use client'

import Link from 'next/link'
import { Avatar } from 'scoop'

import type { TribuneAccess } from '@/lib/tribune-access'

export interface TribuneComposerBarProps {
  picture: string | null
  displayName: string | null
  authenticated: boolean
  /** Compte lecteur avec permission Tribune (fil, votes, publications). */
  canContribute: boolean
  /** Évite le doublon avec le bandeau en haut de page (compte rédaction sans accès Tribune). */
  tribuneAccess: TribuneAccess
  onOpenCompose: () => void
  loginHref: string
}

export function TribuneComposerBar({
  picture,
  displayName,
  authenticated,
  canContribute,
  tribuneAccess,
  onOpenCompose,
  loginHref,
}: TribuneComposerBarProps) {
  if (!authenticated) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm text-muted-foreground">
        <Link href={loginHref} className="font-medium text-primary underline" prefetch={false}>
          Connectez-vous
        </Link>{' '}
        pour publier une note sur la Tribune.
      </div>
    )
  }

  if (!canContribute) {
    // Bandeau déjà affiché au-dessus du fil pour les comptes rédaction.
    if (tribuneAccess === 'staff_only') {
      return null
    }
    return (
      <div className="rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm text-muted-foreground">
        Pour participer ici,{' '}
        <Link href={loginHref} className="font-medium text-primary underline" prefetch={false}>
          connectez-vous avec un compte adapté
        </Link>
        .
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpenCompose}
      className="flex w-full items-center gap-3 rounded-2xl border border-border/80 bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
    >
      <Avatar src={picture} alt={displayName ?? ''} size="default" fallback={displayName?.slice(0, 2) ?? '?'} />
      <span className="flex-1 text-muted-foreground">Quoi de neuf ? Ajoutez une note…</span>
    </button>
  )
}
