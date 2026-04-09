import { ArticleBody } from '@/components/reader/ArticleBody'
import { InlineAnnouncementCard } from '@/components/reader/InlineAnnouncementCard'
import { AdSlotSection } from '@/components/reader/AdSlotSection'
import type { Announcement, AdCreative } from '@/lib/api/types'
import { splitArticleContentAfterParagraphs } from '@/lib/tiptapSplit'
import { AD_SLOT_KEYS } from '@/lib/readerAds'

interface ArticleContentBlocksProps {
  content: unknown
  articleId: string
  inlineAnnouncement: Announcement | undefined
  midCreative: AdCreative | null
}

export function ArticleContentBlocks({
  content,
  articleId,
  inlineAnnouncement,
  midCreative,
}: ArticleContentBlocksProps) {
  const split = splitArticleContentAfterParagraphs(content, 2)

  if (split) {
    return (
      <>
        <ArticleBody content={split.first} className="mb-6" />
        {inlineAnnouncement ? <InlineAnnouncementCard announcement={inlineAnnouncement} /> : null}
        <div className="my-8">
          <AdSlotSection slotKey={AD_SLOT_KEYS.ARTICLE_MID} creative={midCreative} articleId={articleId} />
        </div>
        <ArticleBody content={split.second} />
      </>
    )
  }

  return (
    <>
      <ArticleBody content={content} className="mb-8" />
      {inlineAnnouncement ? <InlineAnnouncementCard announcement={inlineAnnouncement} /> : null}
      <div className="mt-8">
        <AdSlotSection slotKey={AD_SLOT_KEYS.ARTICLE_MID} creative={midCreative} articleId={articleId} />
      </div>
    </>
  )
}
