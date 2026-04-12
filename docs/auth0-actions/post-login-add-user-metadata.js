/**
 * Auth0 Post-Login Action: default RBAC role + user_metadata in tokens.
 *
 * SCRIPT_REVISION: 2 (2026-04) — pas de changement de logique par rapport à la v1 : tout
 * `user_metadata` est recopié dans le jeton (bio, contact, préférences journalistes inclus).
 * Mettez à jour dans Auth0 seulement si votre copie locale ne fait plus un merge complet du
 * metadata, ou si vous ajoutez de nouvelles étapes (ex. Post User Registration).
 *
 * Copy into Auth0: Actions → Library → Build Custom → Trigger: Login / Post Login
 * Then add the Action to the Login flow.
 *
 * 1) Default role **reader** (permission `access:reader`): if the user has no Auth0
 *    roles yet, assign the Reader role via Management API. New signups are readers;
 *    an admin later adds a staff role (journalist, editor, …) in the Dashboard.
 *
 * 2) Adds user_metadata as namespaced claims on access + ID tokens (see AUTH0_SETUP §11).
 *
 * Required secrets (Actions → your action → Secrets):
 *   AUTH0_DOMAIN       — tenant host only, e.g. scoop-afrique.eu.auth0.com
 *   MGMT_CLIENT_ID     — Machine-to-Machine app Client ID (authorized for Auth0 Management API)
 *   MGMT_CLIENT_SECRET — M2M Client Secret
 *   READER_ROLE_ID     — Auth0 Role ID for "reader" (Roles → reader → copy ID from URL or API)
 *
 * M2M application must be authorized for API "Auth0 Management API" with these scopes:
 *   read:users, read:roles, update:users
 * Missing read:roles causes 403 on GET .../users/:id/roles. 404 on that GET usually means
 * the user id does not exist in the tenant (e.g. Action "Test" sample user) or AUTH0_DOMAIN
 * is wrong — see AUTH0_SETUP troubleshooting.
 *
 * Note: If the first login still shows empty permissions, have the user refresh the session
 * or log in once more — some tenants resolve RBAC after the Action completes. Prefer also
 * a Post-User-Registration Action with the same assign-default-reader block for the cleanest
 * first token (see docs/AUTH0_SETUP.md §11).
 */
exports.onExecutePostLogin = async (event, api) => {
  const domain = event.secrets.AUTH0_DOMAIN
  const mgmtClientId = event.secrets.MGMT_CLIENT_ID
  const mgmtClientSecret = event.secrets.MGMT_CLIENT_SECRET
  const readerRoleId = event.secrets.READER_ROLE_ID

  if (domain && mgmtClientId && mgmtClientSecret && readerRoleId) {
    try {
      const tokenRes = await fetch(`https://${domain}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: mgmtClientId,
          client_secret: mgmtClientSecret,
          audience: `https://${domain}/api/v2/`,
        }),
      })
      if (!tokenRes.ok) {
        console.log('post-login: Management API token request failed', tokenRes.status)
      } else {
        const tokenBody = await tokenRes.json()
        const mgmtToken = tokenBody.access_token
        if (mgmtToken) {
          const userId = event.user.user_id
          const rolesRes = await fetch(
            `https://${domain}/api/v2/users/${encodeURIComponent(userId)}/roles`,
            { headers: { Authorization: `Bearer ${mgmtToken}` } }
          )
          if (rolesRes.ok) {
            const currentRoles = await rolesRes.json()
            if (Array.isArray(currentRoles) && currentRoles.length === 0) {
              const assignRes = await fetch(
                `https://${domain}/api/v2/users/${encodeURIComponent(userId)}/roles`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${mgmtToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ roles: [readerRoleId] }),
                }
              )
              if (!assignRes.ok) {
                console.log('post-login: assign reader role failed', assignRes.status)
              }
            }
          } else {
            console.log('post-login: list user roles failed', rolesRes.status)
          }
        }
      }
    } catch (e) {
      console.log('post-login: default reader role error', e && e.message ? e.message : e)
    }
  }

  const namespace = 'https://www.scoop-afrique.com'
  const metadata = event.user.user_metadata || {}

  if (Object.keys(metadata).length > 0) {
    api.accessToken.setCustomClaim(`${namespace}/user_metadata`, metadata)
    api.idToken.setCustomClaim(`${namespace}/user_metadata`, metadata)
  }

  if (metadata.picture) {
    api.idToken.setCustomClaim('picture', metadata.picture)
  }
}
