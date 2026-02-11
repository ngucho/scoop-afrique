/**
 * TipTap content shapes for article JSONB (editor ↔ reader).
 *
 * Image: { type: 'image', attrs: { src, alt?, title? } } — insertContent per docs.
 * YouTube: { type: 'youtube', attrs: { src, width?, height? } } — setYoutubeVideo per docs (src = any YouTube link).
 * Reader: getYoutubeEmbedSrc(attrs.src) for iframe; attrs.src for image.
 */

export type TiptapImageAttrs = {
  src: string
  alt?: string
  title?: string
}

export type TiptapYoutubeAttrs = {
  src: string
  width?: number
  height?: number
}
