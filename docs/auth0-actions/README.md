# Auth0 Actions for Scoop Afrique

Scripts in this folder are meant to be **copied into the Auth0 Dashboard**, not run in this repo.

## post-login-add-user-metadata.js

**Trigger:** Login / Post Login

Adds `user_metadata` (firstname, lastname, date of birth, etc.) to the **access token** and **ID token** as a namespaced custom claim so apps can read it without calling the Auth0 userinfo or your backend profile endpoint.

**Setup:**

1. Auth0 Dashboard → **Actions** → **Library** → **Build Custom**
2. Name: e.g. *Add user_metadata to tokens*
3. Trigger: **Login / Post Login**
4. Paste the contents of `post-login-add-user-metadata.js`
5. **Deploy**
6. **Actions** → **Flows** → **Login** → drag this Action into the flow → **Apply**

**Claim in token:** `https://www.scoop-afrique.com/user_metadata` (object with firstname, lastname, etc.)

See **docs/AUTH0_SETUP.md** section 11 for full instructions.
