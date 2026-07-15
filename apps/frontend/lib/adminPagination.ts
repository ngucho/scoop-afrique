export type PaginationItem =
  | { type: 'page'; page: number; isCurrent: boolean }
  | { type: 'ellipsis'; key: string }

export function buildPaginationItems(currentPage: number, totalPages: number, siblingCount = 1): PaginationItem[] {
  const total = Math.max(0, Math.floor(totalPages))
  if (total <= 0) return []

  const current = Math.min(Math.max(1, Math.floor(currentPage)), total)
  const siblings = Math.max(0, Math.floor(siblingCount))
  const visible = new Set<number>([1, total])

  for (let page = current - siblings; page <= current + siblings; page += 1) {
    if (page >= 1 && page <= total) visible.add(page)
  }

  if (current <= 3 + siblings) {
    for (let page = 1; page <= Math.min(total, 3 + siblings * 2); page += 1) visible.add(page)
  }

  if (current >= total - 2 - siblings) {
    for (let page = Math.max(1, total - 2 - siblings * 2); page <= total; page += 1) visible.add(page)
  }

  const pages = Array.from(visible).sort((a, b) => a - b)
  const items: PaginationItem[] = []

  pages.forEach((page, index) => {
    const previous = pages[index - 1]
    if (previous != null && page - previous > 1) {
      items.push({ type: 'ellipsis', key: `${previous}-${page}` })
    }
    items.push({ type: 'page', page, isCurrent: page === current })
  })

  return items
}
