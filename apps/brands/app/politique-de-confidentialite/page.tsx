import { permanentRedirect } from 'next/navigation'
import { wwwPath } from '@/lib/site-urls'

/** Document unique sur le site lecteur (www). */
export default function PrivacyPolicyRedirect() {
  permanentRedirect(wwwPath('/politique-de-confidentialite'))
}
