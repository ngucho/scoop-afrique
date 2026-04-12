/**
 * Writer API — création / mise à jour de brouillons uniquement (pas de publication).
 */
import { z } from 'zod'
import { createArticleBodySchema } from './article.js'

const emptyStringToNull = <T>(schema: z.ZodType<T>) =>
  z.preprocess((val) => (val === '' ? null : val), schema)

/** Plain text → paragraphes TipTap (double saut de ligne = nouveau paragraphe). */
export function bodyTextToTipTapDoc(bodyText: string): unknown {
  const paras = bodyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  const content =
    paras.length > 0
      ? paras.map((p) => ({
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: p.replace(/\n+/g, ' ') }],
        }))
      : [{ type: 'paragraph' as const, content: [] }]
  return { type: 'doc', content }
}

export const writerCreateArticleBodySchema = createArticleBodySchema
  .omit({ status: true })
  .extend({
    body_text: z.string().min(1).max(200_000).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasBodyText = typeof data.body_text === 'string' && data.body_text.trim().length > 0
    const c = data.content
    const hasContent = c !== undefined && c !== null && typeof c === 'object'
    if (!hasContent && !hasBodyText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Fournir `content` (JSON TipTap) ou `body_text` (texte brut).',
        path: ['content'],
      })
    }
  })

export const writerUpdateArticleBodySchema = createArticleBodySchema
  .omit({ author_display_name: true, status: true })
  .partial()
  .extend({
    body_text: z.string().min(1).max(200_000).optional(),
    /** Pas de publication via l’API — draft / review seulement. */
    status: z.enum(['draft', 'review']).optional(),
  })
  .strict()

export type WriterCreateArticleBody = z.infer<typeof writerCreateArticleBodySchema>
export type WriterUpdateArticleBody = z.infer<typeof writerUpdateArticleBodySchema>
