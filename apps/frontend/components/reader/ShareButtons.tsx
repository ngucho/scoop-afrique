'use client'

import { Button } from 'scoop'
import {
  IconShare,
  IconCopy,
  IconCheck,
  IconBrandWhatsapp,
  IconBrandTelegram,
  IconBrandX,
  IconBrandFacebook,
  IconBrandLinkedin,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import {
  buildNetworkShareTexts,
  shareHrefFacebook,
  shareHrefLinkedIn,
  shareHrefTelegram,
  shareHrefTwitter,
  shareHrefWhatsApp,
} from '@/lib/shareArticleSocial'

interface ShareButtonsProps {
  url: string
  title: string
  excerpt?: string | null
  tags?: string[]
  categoryName?: string | null
  className?: string
}

export function ShareButtons({
  url,
  title,
  excerpt = null,
  tags = [],
  categoryName = null,
  className,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [copiedLong, setCopiedLong] = useState(false)

  const texts = useMemo(
    () => buildNetworkShareTexts({ title, excerpt, tags, categoryName, url }),
    [title, excerpt, tags, categoryName, url],
  )

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyPost = async () => {
    await navigator.clipboard.writeText(texts.linkedInClipboard)
    setCopiedLong(true)
    setTimeout(() => setCopiedLong(false), 2500)
  }

  const openLinkedIn = async () => {
    await navigator.clipboard.writeText(texts.linkedInClipboard).catch(() => {})
    window.open(shareHrefLinkedIn(url), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <span className="mr-2 flex items-center gap-1 text-sm font-medium text-muted-foreground">
        <IconShare className="h-4 w-4" />
        Partager
      </span>
      <Button variant="outline" size="icon-sm" asChild>
        <a
          href={shareHrefWhatsApp(texts.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Partager sur WhatsApp"
        >
          <IconBrandWhatsapp className="h-4 w-4" aria-hidden />
        </a>
      </Button>
      <Button variant="outline" size="icon-sm" asChild>
        <a
          href={shareHrefTelegram(url, texts.telegram)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Partager sur Telegram"
        >
          <IconBrandTelegram className="h-4 w-4" aria-hidden />
        </a>
      </Button>
      <Button variant="outline" size="icon-sm" asChild>
        <a
          href={shareHrefTwitter(url, texts.twitterText)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Partager sur X"
        >
          <IconBrandX className="h-4 w-4" aria-hidden />
        </a>
      </Button>
      <Button variant="outline" size="icon-sm" asChild>
        <a
          href={shareHrefFacebook(url, texts.facebookQuote)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Partager sur Facebook"
        >
          <IconBrandFacebook className="h-4 w-4" aria-hidden />
        </a>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => void openLinkedIn()}
        aria-label="Partager sur LinkedIn (texte copie pour le post)"
      >
        <IconBrandLinkedin className="h-4 w-4" aria-hidden />
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => void handleCopyPost()} aria-label="Copier le texte formate">
        {copiedLong ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
        {copiedLong ? 'Texte copié' : 'Copier le texte'}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => void handleCopyUrl()} aria-label="Copier le lien">
        {copied ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
        {copied ? 'Lien copié' : 'Copier le lien'}
      </Button>
    </div>
  )
}
