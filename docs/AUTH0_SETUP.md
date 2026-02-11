# Auth0 — Complete Setup & Access Control Guide

**Auth0 is the only Identity and Access Management (IAM)** for Scoop Afrique. All users and roles are created, assigned, and managed in the Auth0 Dashboard. The Supabase `profiles` table is not used for access control; it is synced from the Auth0 JWT (get-or-create by `auth0_id`, cache `role` for display/joins). Never create or edit users/roles in the database.

This guide explains how to configure Auth0 for the **backoffice** (frontend login) and **backend API** (authenticated calls): tenant, applications, API, RBAC, roles, and permissions.

---

## 1. Overview

| Component | Role |
|-----------|------|
| **Auth0 Tenant** | Your Auth0 account / environment (e.g. `scoop-afrique`) |
| **Auth0 Application (Web)** | Represents the Next.js frontend; users log in here (Universal Login). |
| **Auth0 API** | Represents the Scoop Afrique backend API; access tokens are issued for this audience. |
| **Roles & Permissions** | Defined and assigned in Auth0 only; included in access tokens; backend enforces RBAC from the JWT. |

**Flow:**

1. User opens `/admin` → redirected to Auth0 Universal Login (via Next.js `/auth/login`).
2. After login, Auth0 redirects to your app with a **session** (cookie). The Next.js app can get an **access token** for your API from this session.
3. Frontend calls backend with `Authorization: Bearer <access_token>`.
4. Backend validates the JWT (signature, issuer, audience) and reads **permissions** or **roles** from the token to enforce RBAC.

---

## 2. Create an Auth0 Tenant and Application

### 2.1 Sign up and create a tenant

1. Go to [auth0.com/signup](https://auth0.com/signup) and create an account.
2. During sign-up you choose a **tenant name** (e.g. `scoop-afrique`). Your Auth0 **Domain** will be `scoop-afrique.auth0.com` (or use a [custom domain](https://auth0.com/docs/get-started/auth0-overview/create-tenants#custom-domains) later).
3. For production, consider separate tenants per environment (e.g. `scoop-afrique-dev`, `scoop-afrique-prod`) — see [Set up multiple environments](https://auth0.com/docs/get-started/auth0-overview/create-tenants/set-up-multiple-environments).

### 2.2 Create the frontend application (Regular Web Application)

1. In the [Auth0 Dashboard](https://manage.auth0.com/), go to **Applications** → **Applications**.
2. Click **Create Application**.
3. **Name:** e.g. `Scoop Afrique Backoffice`.
4. **Application type:** **Regular Web Applications** (server-side Next.js).
5. Click **Create**.

### 2.3 Configure Application URIs

In the application **Settings**:

- **Allowed Callback URLs** (where Auth0 redirects after login):
  - Local: `http://localhost:3001/auth/callback`
  - Production: `https://your-frontend-domain.com/auth/callback`
- **Allowed Logout URLs** (where Auth0 redirects after logout):
  - Local: `http://localhost:3001`
  - Production: `https://your-frontend-domain.com`
- **Allowed Web Origins:** same as your frontend base URL (e.g. `http://localhost:3001`, `https://your-frontend-domain.com`) if the frontend calls Auth0 from the browser.

Save changes.

### 2.4 Get credentials

In **Settings** → **Basic Information** note:

- **Domain** (e.g. `scoop-afrique.auth0.com`)
- **Client ID**
- **Client Secret** (keep secret; used only on the server, e.g. Next.js API routes)

These will be used in the Next.js app as `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`.

---

## 3. Create the Backend API in Auth0

The backend (Hono/Node) will accept **access tokens** issued for this API. Auth0 will only issue tokens for this API when the frontend requests the correct **audience**.

### 3.1 Create the API

1. Go to **Applications** → **APIs** in the Auth0 Dashboard.
2. Click **Create API**.
3. **Name:** e.g. `Scoop Afrique API`.
4. **Identifier:** unique URI, e.g. `https://api.scoop-afrique.com` or `https://www.scoop-afrique.com/api`. This is the **audience** (`aud`) of the access token — the backend will reject tokens that do not have this `aud`.
5. **Signing Algorithm:** RS256 (recommended).

Click **Create**.

### 3.2 Enable RBAC and add permissions

1. Open the API you just created.
2. Go to **Permissions** and add the following **permissions** (scope values). These will be used to gate backend actions.

| Permission (scope) | Description |
|-------------------|-------------|
| `read:articles` | List and read articles (admin list, get one). |
| `create:articles` | Create draft articles. |
| `update:articles` | Update articles (own or any, depending on role). |
| `delete:articles` | Delete articles. |
| `publish:articles` | Change status to published/scheduled. |
| `read:media` | List media. |
| `create:media` | Upload media. |
| `delete:media` | Delete media. |
| `read:users` | Read users/profiles (admin). |
| `manage:users` | Manage roles/settings (admin). |

3. Go to **Settings** → **RBAC Settings**:
   - Turn **Enable RBAC** **On**.
   - Turn **Add Permissions in the Access Token** **On** (so the backend gets a `permissions` array in the JWT).

Save.

### 3.3 Authorize the frontend application to call the API

1. Go to **Applications** → **APIs** → your API → **Machine to Machine Applications** (or **Applications** tab depending on UI).
2. Find your **Scoop Afrique Backoffice** application and **Authorize** it.
3. For that application, grant all the permissions you defined above (or a subset if you want to limit which scopes the frontend can request). The frontend will request `openid profile email` plus these API permissions when getting an access token.

---

## 4. Roles and How Access Is Granted

Auth0 RBAC is **permission-based**; roles are a way to **group permissions** and assign them to users.

### 4.1 Create roles

1. Go to **User Management** → **Roles** in the Auth0 Dashboard.
2. Create the following roles (names and descriptions are up to you):

| Role ID / Name | Description |
|----------------|-------------|
| `journalist` | Create and edit own drafts; upload media. |
| `editor` | All journalist + review, publish, edit any article; moderate comments. |
| `manager` | All editor + delete articles, schedule, manage ads. |
| `admin` | Full access; user/role management, settings. |

### 4.2 Assign permissions to roles

In each **Role** → **Permissions**:

- **journalist:** `read:articles`, `create:articles`, `update:articles` (own only is enforced in backend), `read:media`, `create:media`
- **editor:** journalist + `publish:articles`, `delete:media` (if you added it)
- **manager:** editor + `delete:articles`
- **admin:** all permissions including `read:users`, `manage:users`

(Exact list should match the permissions you created in the API and how your backend maps them — see section 6.)

### 4.3 Assign roles to users

1. Go to **User Management** → **Users**.
2. Create users (or use existing ones). These are your backoffice users (editors, admins, etc.).
3. Open a user → **Roles** → **Assign Roles** and assign one or more roles (e.g. `editor`).

A user gets the **union** of all permissions from all assigned roles. Typically each user has a single role (journalist, editor, manager, or admin).

### 4.4 How the level of access is determined

- **At login:** Auth0 issues an **ID token** (for the app) and, if the app requested an **access token** for your API, an **access token** (JWT) with:
  - `aud` = your API identifier
  - `sub` = user ID
  - `permissions` (or `scope`) = list of permissions assigned to that user (from their roles).
- The **backend** does not store roles; it only trusts the JWT. It checks the `permissions` claim (or `scope`) and allows or denies the action (e.g. “delete article” requires `delete:articles`).
- The **frontend** can also read the same token (or the session) to show/hide UI (e.g. “Delete” only if the user has `delete:articles`). The source of truth for authorization is the backend.

---

## 5. Request the access token from the frontend (Next.js)

The Auth0 Next.js SDK must request an **access token for your API** so that the frontend can send it to the backend.

When configuring the SDK (e.g. in the Auth0 Provider or when calling `getAccessToken()`), you must:

1. Set **audience** to your API identifier (e.g. `https://api.scoop-afrique.com`).
2. Request the scopes you need (e.g. `read:articles create:articles update:articles ...` or `openid profile email` plus API scopes).

Example (conceptual): in your Next.js app you might use `getAccessToken({ scopes: ['read:articles', 'create:articles', ...], audience: process.env.AUTH0_AUDIENCE })` so that the session contains an access token for your API. The exact API depends on the SDK version — see [Auth0 Next.js SDK](https://github.com/auth0/nextjs-auth0) and [Call a protected API from Next.js](https://auth0.com/docs/quickstart/webapp/nextjs/02-calling-apis).

If the audience is not set, Auth0 will issue an **opaque** access token (for the Auth0 Management API or nothing useful), and your backend will not accept it. Always set the **audience** to your API identifier.

---

## 6. Backend: Validate JWT and enforce RBAC

The backend:

1. Reads `Authorization: Bearer <token>`.
2. Validates the JWT (signature via Auth0 JWKS, `iss`, `aud`, `exp`).
3. Reads `sub` (user id) and `permissions` (or `scope`) from the payload.
4. For each endpoint, checks that the required permission is in the list (e.g. `DELETE /admin/articles/:id` requires `delete:articles`).

Mapping from **permissions** to **role-like behavior** (optional): you can keep a small mapping in code, e.g. “if user has `manage:users` then treat as admin” or “if user has `delete:articles` then allow delete.” The PLAN’s role names (journalist, editor, manager, admin) can be derived from permissions for backward compatibility (e.g. `manage:users` → admin, `delete:articles` → manager or above).

---

## 7. Environment variables

### Frontend (Next.js) — `.env.local`

Create `.env.local` in `apps/frontend/` with:

```bash
# Auth0 v4 (required for backoffice login)
AUTH0_SECRET="<generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\">"
AUTH0_DOMAIN="scoop-afrique.auth0.com"
AUTH0_CLIENT_ID="..."
AUTH0_CLIENT_SECRET="..."
APP_BASE_URL="http://localhost:3001"
# Must match the API Identifier in Auth0 so the access token is for your backend
AUTH0_AUDIENCE="https://api.scoop-afrique.com"

# Existing
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_SITE_URL="http://localhost:3001"
```

**Important:** `AUTH0_AUDIENCE` must be set so that the login flow requests an access token for your API. The backoffice uses `getAccessToken()` to send this token to the backend; without the audience, the token will not be valid for API authorization. Auth0 SDK v4 uses `AUTH0_DOMAIN` (tenant domain, e.g. `your-tenant.auth0.com`) and `APP_BASE_URL` (your app URL).

### Backend (Node) — `.env`

```bash
# Auth0 (for JWT validation)
AUTH0_DOMAIN="scoop-afrique.auth0.com"
AUTH0_AUDIENCE="https://api.scoop-afrique.com"

# Existing
PORT=4000
CORS_ORIGINS="http://localhost:3001"
API_PREFIX="/api/v1"
SUPABASE_URL="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

---

## 8. Summary: Building your Auth0 management and access levels

| Step | Where | What to do |
|------|--------|------------|
| 1 | Auth0 Dashboard | Create tenant; create **Regular Web Application** (backoffice); set callback/logout URLs; note Domain, Client ID, Client Secret. |
| 2 | Auth0 Dashboard | Create **API** (identifier = audience); add **Permissions**; enable **RBAC** and **Add Permissions in the Access Token**; authorize the backoffice app to the API. |
| 3 | Auth0 Dashboard | Under **User Management** → **Roles**, create roles: journalist, editor, manager, admin; assign the right **Permissions** to each role. |
| 4 | Auth0 Dashboard | Under **User Management** → **Users**, create/invite users; **Assign Roles** to each user. |
| 5 | Next.js | Set env vars; use Auth0 Next.js SDK; protect `/admin`; request access token with **audience** and use it for API calls. |
| 6 | Backend | Validate JWT (JWKS, iss, aud); read `permissions`; allow or deny each endpoint based on required permission. |

**Level of access** is granted by **assigning roles to users**. Each role has a fixed set of permissions; the backend (and optionally the frontend) uses these permissions to allow or deny actions. No extra “level” is stored in your database unless you mirror it (e.g. for display); the token is the source of truth for API authorization.

---

## 9. Auth0 Management API — Profile (personal info, avatar, password)

The backoffice lets users edit **personal information** (firstname, lastname, date of birth, place of birth, telephone), **upload a profile picture** (< 500 KB), and **change their password**. These are stored in Auth0 **user_metadata** (and mirrored in the Supabase `profiles` table) and updated via the **Auth0 Management API**.

### 9.1 Create a Machine-to-Machine (M2M) application

1. In Auth0 Dashboard go to **Applications** → **Applications** → **Create Application**.
2. Choose **Machine to Machine Applications**; select your **Scoop Afrique API** (or the Auth0 Management API).
3. Name it e.g. `Scoop Backend M2M`.
4. Authorize and grant scopes: **read:users**, **update:users** (required to PATCH user and user_metadata).
5. After creation, note **Client ID** and **Client Secret**.

### 9.2 Backend environment variables

Add to the backend `.env`:

- `AUTH0_MANAGEMENT_CLIENT_ID` — M2M application Client ID
- `AUTH0_MANAGEMENT_CLIENT_SECRET` — M2M application Client Secret

The backend uses the same `AUTH0_DOMAIN`; the Management API audience is `https://<AUTH0_DOMAIN>/api/v2/`.

### 9.3 How it works

| Action | Backend | Auth0 |
|--------|--------|--------|
| Update firstname, lastname, DOB, place of birth, telephone | PATCH `/admin/profile/me` → updates Supabase `profiles` | PATCH user `user_metadata` |
| Upload profile picture | POST `/admin/profile/me/avatar` → upload to Supabase Storage (max 500 KB) | `user_metadata.picture` set to the public image URL |
| Change password | POST `/admin/profile/me/password` | PATCH user `password` (database users only) |

- **Profile picture**: To show it in the ID token, add a [Post-Login Action](https://auth0.com/docs/manage-users/user-accounts/change-user-picture) that sets `api.idToken.setCustomClaim("picture", event.user.user_metadata.picture)` when present.
- **Password change** only works for users on the Auth0 **Database** connection; social users must change password with their provider.

### 9.4 References

- [Get Management API Access Tokens](https://auth0.com/docs/secure/tokens/access-tokens/management-api-access-tokens)
- [Manage user metadata](https://auth0.com/docs/manage-users/user-accounts/metadata/manage-metadata-api)
- [Change user picture](https://auth0.com/docs/manage-users/user-accounts/change-user-picture)

---

## 10. Get permissions in the access token (checklist)

If the backoffice shows "no permissions" or users are redirected to the reader page, the **access token** does not contain the `permissions` claim. Follow this checklist in order.

### 10.1 API configuration

1. **Applications → APIs** → open your backend API (e.g. *Scoop Afrique API*).
2. **Permissions** tab: ensure all needed permissions exist (e.g. `read:articles`, `create:articles`, `publish:articles`, `delete:articles`, `manage:users`, etc.). Add any missing ones.
3. **Settings** → scroll to **RBAC Settings**:
   - **Enable RBAC** → **On**.
   - **Add Permissions in the Access Token** → **On** (this adds the `permissions` array to the JWT).
4. **Save**.

### 10.2 Application access (user access)

1. In the same API, open the **Application Access** tab.
2. **User access** (access on behalf of a user) must allow your backoffice app to get a token:
   - If set to **Allow**: any app can request an access token for this API when a user logs in. No extra step.
   - If set to **Allow via client-grant**: you must **Edit** and under **User Access Authorization** add your *Scoop Afrique Backoffice* application and set it to **Authorized** (or **All**). Otherwise the app cannot get a token for this API.
3. **Save**.

### 10.3 Roles and permissions

1. **User Management → Roles**: create roles (e.g. *journalist*, *editor*, *manager*, *admin*) if needed.
2. For each role, open **Permissions**: add the API permissions that role should have (e.g. *admin* → `manage:users`, `read:users`, plus all article/media permissions).
3. **User Management → Users**: for each backoffice user, open the user → **Roles** → **Assign Roles** and assign at least one role.

A user’s access token will contain the **union of permissions** from all their assigned roles. If a user has no roles, `permissions` will be empty and the app will redirect them to the reader.

### 10.4 Frontend audience

- In the frontend `.env.local`, **AUTH0_AUDIENCE** must be set to the **exact API Identifier** (e.g. `https://api.scoop-afrique.com`). If it is missing or wrong, Auth0 will not issue an access token for your API and the token will have no `permissions`.

### 10.5 Verify

- Log in to the backoffice, then inspect the session (e.g. decode the access token at [jwt.io](https://jwt.io)). The payload should contain `aud` (your API identifier) and `permissions` (array of strings). If `permissions` is missing or empty, re-check sections 10.1–10.4.

---

## 11. Add user_metadata to tokens (Post-Login Action)

By default, **user_metadata** (firstname, lastname, etc.) is not in the access or ID token. To have it available in tokens (e.g. for the frontend or for smaller backend round-trips), add a **Post-Login Action** in Auth0 that copies `user_metadata` into custom claims.

### 11.1 Create the Action

1. In Auth0 Dashboard go to **Actions** → **Library** → **Build Custom**.
2. **Name:** e.g. `Add user_metadata to tokens`.
3. **Trigger:** **Login / Post Login**.
4. Paste the code from `docs/auth0-actions/post-login-add-user-metadata.js` (see below), or use this script:

```javascript
/**
 * Post-Login Action: add user_metadata to access and ID tokens as namespaced custom claims.
 * Namespace avoids collisions with standard claims.
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://www.scoop-afrique.com'
  const metadata = event.user.user_metadata || {}

  if (Object.keys(metadata).length > 0) {
    api.accessToken.setCustomClaim(`${namespace}/user_metadata`, metadata)
    api.idToken.setCustomClaim(`${namespace}/user_metadata`, metadata)
  }

  // Optional: ensure picture from user_metadata is in ID token for profile photo
  if (metadata.picture) {
    api.idToken.setCustomClaim('picture', metadata.picture)
  }
}
```

5. **Deploy** the Action.
6. **Actions** → **Flows** → **Login**: drag this Action into the flow, then **Apply**.

### 11.2 Reading the claims

- **Access token:** backend or frontend must read the **namespaced** key: `payload['https://www.scoop-afrique.com/user_metadata']` (firstname, lastname, etc.). There is no top-level `user_metadata` in the token — Auth0 requires custom claims on access tokens to be namespaced (a URL), so the claim appears under that full key.
- **ID token:** same namespaced claim; `picture` can also be set as a top-level claim when present in user_metadata.

The backend currently gets profile data from the database (synced from Auth0); you can later optionally use these claims to avoid an extra profile fetch. The frontend can read the access token claims if you decode it (e.g. from `getAccessToken()`).

---

## 12. GET /auth/me (backend) and 401 debugging

**GET /api/v1/auth/me** is our backend route, not Auth0’s. The backend accepts the Auth0 access token (Bearer), verifies the JWT locally, then returns the user profile from our database (Supabase), creating it if needed.

**Required backend config** in `apps/backend/.env`:

```bash
AUTH0_DOMAIN=scoop-afrique.eu.auth0.com
AUTH0_AUDIENCE=https://api.scoop-afrique.com
```

- **AUTH0_DOMAIN**: tenant only, no `https://` or trailing slash (must match token `iss`: `https://<domain>/`).
- **AUTH0_AUDIENCE**: exact API identifier (must be one of the token `aud` values).

**Why you get 401:** No Bearer token, or JWT verification fails (wrong issuer/audience, expired, or Auth0 vars missing in backend `.env`). Decode the token at [jwt.io](https://jwt.io): `iss` must be `https://<AUTH0_DOMAIN>/`, `aud` must include `AUTH0_AUDIENCE`. Fix backend `.env` and CORS (`CORS_ORIGINS` includes frontend origin) so the admin layout no longer redirects to the reader home.

---

## 13. References

- [Auth0 Next.js SDK](https://github.com/auth0/nextjs-auth0)
- [Next.js Authentication (Auth0)](https://developer.auth0.com/resources/guides/web-app/nextjs/basic-authentication)
- [Auth0 RBAC](https://auth0.com/docs/manage-users/access-control/rbac)
- [Enable RBAC for APIs](https://auth0.com/docs/get-started/apis/enable-role-based-access-control-for-apis)
- [Add Permissions in the Access Token](https://auth0.com/docs/get-started/apis/enable-role-based-access-control-for-apis)
- [API Access Policies for Applications](https://auth0.com/docs/get-started/apis/api-access-policies-for-applications)
- [Validate Access Tokens](https://auth0.com/docs/secure/tokens/access-tokens/validate-access-tokens)
- [Create custom claims (Actions)](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)
