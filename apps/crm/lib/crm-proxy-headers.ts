/**
 * En-têtes de la requête serveur → backend.
 *
 * Liste blanche volontaire : ne jamais réémettre `request.headers` en bloc. Le
 * cookie de session Auth0 ajouté au jeton Bearer dépasse la limite d'en-têtes
 * par défaut de Node et produit un HTTP 431.
 */

/**
 * En-têtes de la requête entrante explicitement retransmis.
 *
 * `Idempotency-Key` est indispensable : la clôture de dossier l'exige côté
 * backend et refuse la requête avec `400 IDEMPOTENCY_KEY_REQUIRED` en son
 * absence. C'est cette clé qui empêche une double clôture sur un double clic
 * ou un renvoi réseau.
 */
export const FORWARDED_REQUEST_HEADERS = ['idempotency-key'] as const

export function buildCrmProxyHeaders(params: {
  requestHeaders: Headers
  accessToken: string
  requestId: string
  method: string
}): Headers {
  const { requestHeaders, accessToken, requestId, method } = params
  const headers = new Headers()
  headers.set('Authorization', `Bearer ${accessToken}`)
  headers.set('x-request-id', requestId)

  const accept = requestHeaders.get('accept')
  if (accept) headers.set('Accept', accept)

  const verb = method.toUpperCase()
  const contentType = requestHeaders.get('content-type')
  if (contentType && verb !== 'GET' && verb !== 'HEAD') {
    headers.set('Content-Type', contentType)
  }

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = requestHeaders.get(name)
    if (value) headers.set(name, value)
  }

  return headers
}
