export type ArticleEditorChecklistItem = {
  id: 'title' | 'excerpt' | 'category' | 'body' | 'cover' | 'video' | 'seo'
  label: string
  hint: string
  done: boolean
}

export type ArticleEditorChecklistInput = {
  title: string
  excerpt: string
  categoryId: string
  contentWordCount: number
  hasCoverVisual: boolean
  hasInvalidVideoUrl: boolean
  metaTitle: string
  metaDescription: string
}

type TiptapLikeNode = {
  type?: string
  text?: string
  content?: TiptapLikeNode[]
}

function collectTiptapText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const current = node as TiptapLikeNode
  const ownText = typeof current.text === 'string' ? current.text : ''
  const childText = Array.isArray(current.content)
    ? current.content.map(collectTiptapText).join(' ')
    : ''
  return `${ownText} ${childText}`.trim()
}

export function countArticleContentWords(content: unknown): number {
  const text = collectTiptapText(content)
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

export function buildArticleEditorChecklist(input: ArticleEditorChecklistInput): {
  items: ArticleEditorChecklistItem[]
  readyCount: number
} {
  const title = input.title.trim()
  const excerpt = input.excerpt.trim()
  const hasSeoText = input.metaTitle.trim().length > 0 || input.metaDescription.trim().length > 0
  const items: ArticleEditorChecklistItem[] = [
    {
      id: 'title',
      label: 'Titre solide',
      hint: 'Au moins 10 caracteres',
      done: title.length >= 10,
    },
    {
      id: 'excerpt',
      label: 'Chapeau lisible',
      hint: 'Une phrase courte pour lancer la lecture',
      done: excerpt.length >= 20,
    },
    {
      id: 'category',
      label: 'Rubrique choisie',
      hint: 'Aide le lecteur a situer le sujet',
      done: input.categoryId.trim().length > 0,
    },
    {
      id: 'body',
      label: 'Corps developpe',
      hint: 'Visez au moins 200 mots avant publication',
      done: input.contentWordCount >= 200,
    },
    {
      id: 'cover',
      label: 'Visuel de carte',
      hint: 'Image ou miniature YouTube visible',
      done: input.hasCoverVisual,
    },
    {
      id: 'video',
      label: 'Lien video valide',
      hint: 'Corrigez le lien YouTube si renseigne',
      done: !input.hasInvalidVideoUrl,
    },
  ]

  if (hasSeoText) {
    items.push({
      id: 'seo',
      label: 'SEO precise',
      hint: 'Meta titre ou description personnalise',
      done: true,
    })
  }

  return {
    items,
    readyCount: items.filter((item) => item.done).length,
  }
}
