# Auth0 Actions for Scoop Afrique

Scripts in this folder are meant to be **copied into the Auth0 Dashboard**, not run in this repo.

## post-login-add-user-metadata.js

**Trigger:** Login / Post Login

1. **Default RBAC role:** if the user has **no** Auth0 roles, assigns the **`reader`** role (via Management API) so new accounts get `access:reader` until an admin assigns a staff role.
2. Adds `user_metadata` (firstname, lastname, etc.) to the **access token** and **ID token** as the namespaced claim `https://www.scoop-afrique.com/user_metadata`.

**Secrets** (Action → **Secrets** — add each key):

| Secret | Description |
|--------|-------------|
| `AUTH0_DOMAIN` | Tenant hostname only, e.g. `scoop-afrique.eu.auth0.com` |
| `MGMT_CLIENT_ID` | Machine-to-Machine application Client ID |
| `MGMT_CLIENT_SECRET` | M2M Client Secret |
| `READER_ROLE_ID` | Role ID of **reader** (Dashboard → **User Management** → **Roles** → open *reader* → ID in URL or via Management API) |

Create an **Machine to Machine** application, authorize it for **Auth0 Management API**, and enable **all** of:

- **`read:users`** — required for user endpoints  
- **`read:roles`** — **required** to call `GET /api/v2/users/:id/roles` (without it you get **403** and the log `list user roles failed403`)  
- **`update:users`** — required to call `POST /api/v2/users/:id/roles` to assign the reader role  

After changing scopes, **save** the M2M app and run the Action test again (the client-credentials token must be minted with the new scopes).

**Setup:**

1. Auth0 Dashboard → **Actions** → **Library** → **Build Custom**
2. Name: e.g. *Post-login: reader default + user_metadata*
3. Trigger: **Login / Post Login**
4. Paste the contents of `post-login-add-user-metadata.js`
5. Add the **Secrets** above
6. **Deploy**
7. **Actions** → **Flows** → **Login** → drag this Action into the flow → **Apply**

If secrets are omitted, the Action still runs but only adds `user_metadata` claims (no automatic reader assignment).

See **docs/AUTH0_SETUP.md** section 11 for full instructions.
