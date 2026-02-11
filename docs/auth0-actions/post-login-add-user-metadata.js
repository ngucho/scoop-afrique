/**
 * Auth0 Post-Login Action: Add user_metadata to access and ID tokens.
 *
 * Copy this file's contents into Auth0 Dashboard:
 *   Actions → Library → Build Custom → Trigger: Login / Post Login
 * Then add the Action to the Login flow.
 *
 * This adds user_metadata (firstname, lastname, etc.) as a namespaced custom claim
 * so the frontend and backend can read it from the token without an extra API call.
 * See docs/AUTH0_SETUP.md section 11.
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://www.scoop-afrique.com'
  const metadata = event.user.user_metadata || {}

  if (Object.keys(metadata).length > 0) {
    api.accessToken.setCustomClaim(`${namespace}/user_metadata`, metadata)
    api.idToken.setCustomClaim(`${namespace}/user_metadata`, metadata)
  }

  // Optional: use profile picture from user_metadata in ID token
  if (metadata.picture) {
    api.idToken.setCustomClaim('picture', metadata.picture)
  }
}
