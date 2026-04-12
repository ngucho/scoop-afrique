import { Avatar, Heading, Text } from 'scoop'

export function ArticleAuthorCard({
  displayName,
  authorPublic,
}: {
  displayName: string
  authorPublic?: { bio: string | null; avatar_url: string | null } | null
}) {
  const avatar = authorPublic?.avatar_url ?? null
  const bio = authorPublic?.bio?.trim() ?? ''

  return (
    <section
      className="mt-10 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-muted/50 to-card shadow-sm"
      aria-labelledby="article-author-heading"
    >
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-6">
        <div className="shrink-0">
          <div className="rounded-full border border-border/60 p-0.5">
            <Avatar src={avatar ?? undefined} alt="" size="lg" fallback={displayName.slice(0, 2)} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Journaliste</p>
          <Heading as="h2" id="article-author-heading" level="h3" className="mt-1 text-xl font-bold tracking-tight">
            {displayName}
          </Heading>
          {bio ? (
            <Text variant="muted" className="mt-3 text-[15px] leading-relaxed">
              {bio}
            </Text>
          ) : (
            <p className="mt-2 text-sm italic text-muted-foreground">
              Membre de la rédaction Scoop.Afrique.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
