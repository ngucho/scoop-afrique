/**
 * Auth service — Auth0 is the sole IAM.
 *
 * There is NO server-side login/logout/refresh. Auth0 handles all of that
 * on the frontend via the Auth0 SDK. The backend only validates JWTs.
 *
 * This file re-exports types for convenience.
 */
export type { AppRole, Profile, Auth0UserInfo } from './profile.service.js'
