import { Node, mergeAttributes } from '@tiptap/core'
import { normalizeAllowedEmbedPath } from '@/lib/embedAllowlist'

export const ARTICLE_EMBED_NODE_NAME = 'articleEmbed' as const

export type ArticleEmbedAttrs = {
  src: string
  title: string
  minHeight: number
}

export function buildArticleEmbedAttrs(
  attrs: Partial<ArticleEmbedAttrs>,
): ArticleEmbedAttrs | null {
  const src = normalizeAllowedEmbedPath(String(attrs.src ?? ''))
  if (!src) return null
  const title =
    typeof attrs.title === 'string' && attrs.title.trim()
      ? attrs.title.trim()
      : 'Contenu intégré'
  const mh = Number(attrs.minHeight)
  const minHeight = Number.isFinite(mh) ? Math.min(Math.max(mh, 200), 1200) : 420
  return { src, title, minHeight }
}

export const ArticleEmbed = Node.create({
  name: ARTICLE_EMBED_NODE_NAME,
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-src') ?? '',
        renderHTML: (attrs: Record<string, unknown>) => {
          if (!attrs.src) return {}
          return { 'data-src': attrs.src }
        },
      },
      title: {
        default: 'Contenu intégré',
        parseHTML: (el: HTMLElement) =>
          el.getAttribute('data-title') ?? 'Contenu intégré',
        renderHTML: (attrs: Record<string, unknown>) => ({
          'data-title': attrs.title,
        }),
      },
      minHeight: {
        default: 420,
        parseHTML: (el: HTMLElement) => {
          const n = Number(el.getAttribute('data-min-height'))
          return Number.isFinite(n) && n > 0 ? n : 420
        },
        renderHTML: (attrs: Record<string, unknown>) => ({
          'data-min-height': String(attrs.minHeight),
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-article-embed]',
      },
    ]
  },

  renderHTML({
    HTMLAttributes,
    node,
  }: {
    HTMLAttributes: Record<string, unknown>
    node: { attrs: Record<string, unknown> }
  }) {
    const src = normalizeAllowedEmbedPath(String(node.attrs.src ?? ''))
    if (!src) {
      return [
        'div',
        mergeAttributes(HTMLAttributes, {
          'data-article-embed': '',
          class: 'rounded-lg border border-dashed border-muted-foreground/40 p-4 text-sm text-muted-foreground',
        }),
        'Cadre intégré — URL non autorisée',
      ]
    }
    const title = String(node.attrs.title ?? 'Contenu intégré')
    const minH = Math.min(Math.max(Number(node.attrs.minHeight) || 420, 200), 1200)
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-article-embed': '',
        class: 'article-embed my-6 overflow-hidden rounded-lg border border-border bg-muted/20',
      }),
      [
        'iframe',
        {
          src,
          title,
          loading: 'lazy',
          class: 'block w-full border-0 bg-background',
          style: `min-height: ${minH}px`,
          sandbox:
            'allow-scripts allow-same-origin allow-popups-to-escape-sandbox',
          referrerpolicy: 'no-referrer-when-downgrade',
        },
      ],
    ]
  },

})
