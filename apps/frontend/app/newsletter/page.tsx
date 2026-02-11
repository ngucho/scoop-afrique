import { ReaderLayout } from '@/components/reader/ReaderLayout'
import { NewsletterForm } from './NewsletterForm'
import { Heading, Text, SectionHeader, Card, CardContent } from 'scoop'

export default function NewsletterPage() {
  return (
    <ReaderLayout>
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <header className="mb-10">
          <SectionHeader label="Newsletter" className="mb-4" />
          <Heading as="h1" level="h1" className="text-3xl font-bold tracking-tight sm:text-4xl">
            Restez informé
          </Heading>
          <Text variant="muted" className="mt-3">
            Inscrivez-vous pour recevoir nos actualités, dossiers et reportages dans votre boîte mail.
          </Text>
        </header>

        <Card variant="default" className="overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <NewsletterForm />
          </CardContent>
        </Card>
      </div>
    </ReaderLayout>
  )
}
