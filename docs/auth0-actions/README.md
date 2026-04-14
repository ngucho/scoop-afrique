# Auth0 Actions for Scoop Afrique

Scripts in this folder are meant to be **copied into the Auth0 Dashboard**, not run in this repo.

## post-login-add-user-metadata.js

**Trigger:** Login / Post Login · **SCRIPT_REVISION 5**

Adds **`https://www.scoop-afrique.com/email`** on the **access token** when available, plus `user_metadata` on access + ID tokens under `https://www.scoop-afrique.com/user_metadata`.

**No Secrets required.** Default **reader** role assignment is handled by the **backend** (see `AUTH0_READER_ROLE_ID` and `docs/AUTH0_SETUP.md`).

**Setup:** Actions → Library → Build Custom → trigger **Login / Post Login** → paste → Deploy → **Flows → Login** → Apply.

## post-user-registration-assign-reader.js

**Deprecated (no-op).** You can remove it from **Flows → Post User Registration**. The backend assigns the reader role on first reader API call when needed.

---

See **docs/AUTH0_SETUP.md** §10–11 for RBAC (`access:reader`, API settings) and backend Management API configuration.
