import { permanentRedirect } from 'next/navigation'
import { wwwPath } from '@/lib/site-urls'

/** Document unique sur le site lecteur (www) — mentions & cadre d’utilisation. */
export default function LegalNoticeRedirect() {
  permanentRedirect(wwwPath('/mentions-legales'))
}
