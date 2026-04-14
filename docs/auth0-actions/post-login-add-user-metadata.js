/**
 * Auth0 Post-Login Action: user_metadata + email on access token.
 *
 * SCRIPT_REVISION: 5 (2026-04) — ajoute `https://www.scoop-afrique.com/email` sur l’access token
 * quand Auth0 connaît l’e-mail (souvent absent du JWT « API only » avec Google). Le backend lit
 * cette claim dans `readEmailFromAuth0AccessTokenPayload`.
 *
 * Copy into Auth0: Actions → Library → Build Custom → Trigger: Login / Post Login
 * Then add the Action to the Login flow.
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://www.scoop-afrique.com'
  const metadata = event.user.user_metadata || {}

  if (event.user.email) {
    api.accessToken.setCustomClaim(`${namespace}/email`, event.user.email)
  }

  if (Object.keys(metadata).length > 0) {
    api.accessToken.setCustomClaim(`${namespace}/user_metadata`, metadata)
    api.idToken.setCustomClaim(`${namespace}/user_metadata`, metadata)
  }

  if (metadata.picture) {
    api.idToken.setCustomClaim('picture', metadata.picture)
  }
}
