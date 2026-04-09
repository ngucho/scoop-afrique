import Link from 'next/link'
import { Button, Card, CardContent, Heading, Text } from 'scoop'
import { MotionEnter } from 'scoop'

export function HomeNewsletterCta() {
  return (
    <MotionEnter as="section" className="my-14">
      <Card variant="glass" className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Heading as="h2" level="h3" className="text-2xl">
              La newsletter Scoop.Afrique
            </Heading>
            <Text variant="muted" className="mt-2 max-w-xl">
              Recevez nos décryptages et l&apos;essentiel de l&apos;actualité panafricaine directement dans votre boîte mail.
            </Text>
          </div>
          <Button asChild size="lg" className="shrink-0 press-effect">
            <Link href="/newsletter">S&apos;inscrire</Link>
          </Button>
        </CardContent>
      </Card>
    </MotionEnter>
  )
}
