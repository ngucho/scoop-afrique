import Link from 'next/link'
import { Card, CardContent, Text } from 'scoop'
import type { Announcement } from '@/lib/api/types'

export function InlineAnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <Card variant="glass" className="my-8 border-[var(--signal)]/25 bg-[var(--signal)]/5">
      <CardContent className="p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--signal)]">Info</p>
        <p className="text-base font-semibold text-foreground">{announcement.title}</p>
        {announcement.body ? (
          <Text variant="muted" className="mt-2 text-sm">
            {announcement.body}
          </Text>
        ) : null}
        {announcement.link_url ? (
          <Link
            href={announcement.link_url}
            className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-2"
          >
            En savoir plus
          </Link>
        ) : null}
      </CardContent>
    </Card>
  )
}
