/**
 * Auth0 Post-User-Registration Action — **deprecated** (no-op).
 *
 * Le rôle **reader** est désormais attribué par le backend Scoop Afrique (`AUTH0_READER_ROLE_ID` +
 * Management API) lors du premier appel authentifié aux routes `/api/v1/reader/*` si l’utilisateur
 * n’a pas encore ce rôle Auth0.
 *
 * Vous pouvez retirer cette Action du flux **Post User Registration** dans Auth0, ou la laisser
 * déployée telle quelle (elle ne fait rien).
 *
 * SCRIPT_REVISION: 2 (2026-04)
 */
exports.onExecutePostUserRegistration = async () => {}
