import { redirect } from 'next/navigation'
import { getReaderSession } from '@/lib/reader-auth0'

export default async function ReaderAccountProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getReaderSession()
  if (!session?.user) {
    redirect('/account/login')
  }
  return <div className="min-h-screen bg-background">{children}</div>
}
