/**
 * Split TipTap doc JSON (or legacy block array) after the Nth paragraph (0-based index of last para in first chunk).
 * Used to insert mid-article ads without shipping full body twice to the client as HTML.
 */

interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  attrs?: Record<string, unknown>
  marks?: unknown[]
}

function countParagraphsInDoc(doc: TiptapNode): number {
  if (doc.type !== 'doc' || !Array.isArray(doc.content)) return 0
  return doc.content.filter((n) => n.type === 'paragraph').length
}

function splitDocAtParagraph(doc: TiptapNode, lastParagraphIndexInFirst: number): { first: TiptapNode; second: TiptapNode } | null {
  if (doc.type !== 'doc' || !Array.isArray(doc.content)) return null
  const paraIndices: number[] = []
  doc.content.forEach((node, i) => {
    if (node.type === 'paragraph') paraIndices.push(i)
  })
  if (paraIndices.length <= lastParagraphIndexInFirst + 1) return null
  const splitAt = paraIndices[lastParagraphIndexInFirst]!
  const firstContent = doc.content.slice(0, splitAt + 1)
  const secondContent = doc.content.slice(splitAt + 1)
  return {
    first: { ...doc, content: firstContent },
    second: { ...doc, content: secondContent },
  }
}

function splitLegacyBlocks(blocks: unknown[], lastParagraphIndexInFirst: number): { first: unknown[]; second: unknown[] } | null {
  const paraIndices: number[] = []
  blocks.forEach((b, i) => {
    const block = b as { type?: string }
    if (block?.type === 'paragraph') paraIndices.push(i)
  })
  if (paraIndices.length <= lastParagraphIndexInFirst + 1) return null
  const splitAt = paraIndices[lastParagraphIndexInFirst]!
  return {
    first: blocks.slice(0, splitAt + 1),
    second: blocks.slice(splitAt + 1),
  }
}

/**
 * @param lastParagraphIndexInFirst — e.g. 2 = first chunk ends after the 3rd paragraph
 */
/** Split raw HTML after N closing </p> tags (1-based N). */
export function splitHtmlAfterParagraphs(html: string, paragraphCount: number): { first: string; second: string } | null {
  if (!html || paragraphCount < 1) return null
  let idx = 0
  for (let i = 0; i < paragraphCount; i++) {
    const close = html.indexOf('</p>', idx)
    if (close === -1) return null
    idx = close + 4
  }
  return { first: html.slice(0, idx), second: html.slice(idx) }
}

export function splitArticleContentAfterParagraphs(
  content: unknown,
  lastParagraphIndexInFirst: number
): { first: unknown; second: unknown } | null {
  if (!content || typeof content !== 'object') return null
  const doc = content as TiptapNode
  if (typeof content === 'string') {
    return splitHtmlAfterParagraphs(content, lastParagraphIndexInFirst + 1)
  }
  if (doc.type === 'doc' && Array.isArray(doc.content)) {
    if (countParagraphsInDoc(doc) <= lastParagraphIndexInFirst + 1) return null
    const split = splitDocAtParagraph(doc, lastParagraphIndexInFirst)
    if (!split) return null
    return { first: split.first, second: split.second }
  }
  if (Array.isArray(content)) {
    const split = splitLegacyBlocks(content, lastParagraphIndexInFirst)
    if (!split) return null
    return { first: split.first, second: split.second }
  }
  return null
}
