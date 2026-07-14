export function isAuthorizedCronRequest(authorization: string | null | undefined, secret: string | null | undefined): boolean {
  if (!secret) return false
  return authorization === `Bearer ${secret}`
}
