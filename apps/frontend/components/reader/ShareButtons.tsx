'use client'

import { Button } from 'scoop'
import { IconShare, IconCopy, IconCheck } from '@tabler/icons-react'
import { useState } from 'react'

const SHARE_LINKS = {
  whatsapp: (url: string, title: string) =>
    `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  telegram: (url: string, title: string) =>
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  twitter: (url: string, title: string) =>
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  facebook: (url: string) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  linkedin: (url: string, title: string) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
} as const

interface ShareButtonsProps {
  url: string
  title: string
  className?: string
}

export function ShareButtons({ url, title, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <span className="mr-2 flex items-center gap-1 text-sm font-medium text-muted-foreground">
        <IconShare className="h-4 w-4" />
        Partager
      </span>
      <Button variant="outline" size="sm" asChild>
        <a href={SHARE_LINKS.whatsapp(url, title)} target="_blank" rel="noopener noreferrer" aria-label="Partager sur WhatsApp">
          WhatsApp
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={SHARE_LINKS.telegram(url, title)} target="_blank" rel="noopener noreferrer" aria-label="Partager sur Telegram">
          Telegram
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={SHARE_LINKS.twitter(url, title)} target="_blank" rel="noopener noreferrer" aria-label="Partager sur X">
          X
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={SHARE_LINKS.facebook(url)} target="_blank" rel="noopener noreferrer" aria-label="Partager sur Facebook">
          Facebook
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={SHARE_LINKS.linkedin(url, title)} target="_blank" rel="noopener noreferrer" aria-label="Partager sur LinkedIn">
          LinkedIn
        </a>
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopy} aria-label="Copier le lien">
        {copied ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
        {copied ? 'Copié' : 'Copier'}
      </Button>
    </div>
  )
}
