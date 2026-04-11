/** Site lecteur public (canonical www). */
export const WWW_READER_URL =
  (process.env.NEXT_PUBLIC_READER_SITE_URL ?? 'https://www.scoop-afrique.com').replace(/\/$/, '')

export const wwwPath = (path: string) => `${WWW_READER_URL}${path.startsWith('/') ? path : `/${path}`}`
