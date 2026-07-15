import type { Article } from '@/lib/api/types'
import type { HomePageBlock } from '@/lib/homeSections'

export interface EditorialHomeModel {
  hero: Article | null
  lead: Article[]
  briefs: Article[]
  videos: Article[]
  selection: Article[]
  categoryStrip: Article[]
}

function pushUnique(out: Article[], seen: Set<string>, article: Article | null | undefined) {
  if (!article || seen.has(article.id)) return
  seen.add(article.id)
  out.push(article)
}

export function articlesFromHomeBlocks(blocks: HomePageBlock[], fallback: Article[]): Article[] {
  const out: Article[] = []
  const seen = new Set<string>()

  for (const block of blocks) {
    if (block.type === 'hero') {
      pushUnique(out, seen, block.article)
      continue
    }
    if (block.type === 'articles') {
      for (const article of block.articles) pushUnique(out, seen, article)
      continue
    }
    if (block.type === 'rubriques') {
      for (const strip of block.strips) {
        for (const article of strip.articles) pushUnique(out, seen, article)
      }
    }
  }

  for (const article of fallback) pushUnique(out, seen, article)
  return out
}

export function buildEditorialHomeModel(blocks: HomePageBlock[], fallback: Article[]): EditorialHomeModel {
  const all = articlesFromHomeBlocks(blocks, fallback)
  const hero = blocks.find((block): block is Extract<HomePageBlock, { type: 'hero' }> => block.type === 'hero')?.article ?? all[0] ?? null
  const used = new Set<string>()
  if (hero) used.add(hero.id)

  const take = (source: Article[], count: number) => {
    const picked: Article[] = []
    for (const article of source) {
      if (used.has(article.id)) continue
      used.add(article.id)
      picked.push(article)
      if (picked.length >= count) break
    }
    return picked
  }

  const blockArticles = (key: string) =>
    blocks.find((block): block is Extract<HomePageBlock, { type: 'articles' }> => block.type === 'articles' && block.sectionKey === key)?.articles ?? []

  const videosSource = blockArticles('video').length
    ? blockArticles('video')
    : all.filter((article) => article.video_url || article.tags.some((tag) => tag.toLowerCase() === 'video'))

  return {
    hero,
    lead: take(blockArticles('latest').length ? blockArticles('latest') : all, 4),
    videos: take(videosSource, 4),
    selection: take(blockArticles('editors').length ? blockArticles('editors') : all, 4),
    briefs: take(all, 5),
    categoryStrip: take(all, 5),
  }
}
