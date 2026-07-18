export function extractPlainTextFromTipTap(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as Record<string, unknown>
  const parts: string[] = []

  if (n.type === 'text' && typeof n.text === 'string') {
    parts.push(n.text)
  }

  if (Array.isArray(n.content)) {
    for (const child of n.content) {
      const text = extractPlainTextFromTipTap(child)
      if (text) parts.push(text)
    }
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

export function buildArticleAudioText(params: {
  title: string
  excerpt?: string | null
  content: unknown
}): string {
  return [params.title, params.excerpt ?? '', extractPlainTextFromTipTap(params.content)]
    .map((part) => part.trim())
    .filter(Boolean)
    .join('. ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
}
