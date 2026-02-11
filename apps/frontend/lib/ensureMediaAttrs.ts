/**
 * Ensure every image/youtube node in TipTap content has attrs.src (and dimensions for youtube).
 * If TipTap's getJSON() omits attrs, we restore structure and optionally fill from pending media
 * (URLs captured when the user inserted media in this session).
 */

type MediaNode = { type?: string; attrs?: Record<string, unknown>; content?: unknown[] }

type PendingMedia = { type: 'image' | 'youtube'; attrs: Record<string, unknown> }

function findAndConsumePending(pending: PendingMedia[], type: 'image' | 'youtube'): PendingMedia | null {
  const i = pending.findIndex((m) => m.type === type)
  if (i === -1) return null
  const [item] = pending.splice(i, 1)
  return item
}

function ensureNodeAttrs(node: MediaNode, pendingMedia: PendingMedia[]): void {
  if (node.type === 'image') {
    const existingSrc =
      node.attrs && typeof node.attrs.src === 'string' && node.attrs.src.trim()
    if (!existingSrc) {
      const next = findAndConsumePending(pendingMedia, 'image')
      if (next) node.attrs = { ...node.attrs, src: next.attrs.src ?? '', ...next.attrs }
      else node.attrs = { ...node.attrs, src: '' }
    } else {
      node.attrs = { ...node.attrs, src: existingSrc }
    }
    return
  }
  if (node.type === 'youtube') {
    const existingSrc =
      node.attrs && typeof node.attrs.src === 'string' && node.attrs.src.trim()
    if (!existingSrc) {
      const next = findAndConsumePending(pendingMedia, 'youtube')
      if (next)
        node.attrs = {
          ...node.attrs,
          src: next.attrs.src ?? '',
          width: next.attrs.width ?? 640,
          height: next.attrs.height ?? 360,
          ...next.attrs,
        }
      else node.attrs = { ...node.attrs, src: '', width: 640, height: 360 }
    } else {
      node.attrs = {
        ...node.attrs,
        src: existingSrc,
        width: node.attrs?.width ?? 640,
        height: node.attrs?.height ?? 360,
      }
    }
    return
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      if (child && typeof child === 'object' && !Array.isArray(child)) {
        ensureNodeAttrs(child as MediaNode, pendingMedia)
      }
    }
  }
}

/**
 * Mutates doc so every image/youtube node has attrs with at least src (and width/height for youtube).
 * Fills missing src from pendingMedia (array; consumed in order per type).
 */
export function ensureMediaAttrsInPayload(
  doc: { type?: string; content?: unknown[] },
  pendingMedia: PendingMedia[],
): void {
  if (!doc || typeof doc !== 'object' || !Array.isArray(doc.content)) return
  const pending = Array.isArray(pendingMedia) ? pendingMedia : []
  for (const node of doc.content) {
    if (node && typeof node === 'object' && !Array.isArray(node)) {
      ensureNodeAttrs(node as MediaNode, pending)
    }
  }
}
