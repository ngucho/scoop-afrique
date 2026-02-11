# SCOOP AFRIQUE — Role-Based Access Control (RBAC)

## Overview

Auth0 is the **sole Identity and Access Management (IAM)** provider. All users, roles, and permissions are defined and managed exclusively in Auth0. The backend validates Auth0 JWTs and maps permissions to roles.

## Roles

| Role | Description | Auth0 Permission Trigger |
|------|-------------|-------------------------|
| **Journalist** | Creates and submits articles, uploads media | `create:articles` or `read:articles` |
| **Editor** | Reviews, publishes, moderates comments, edits any article | `publish:articles` |
| **Manager** | Deletes articles, manages categories, manages teams | `delete:articles` |
| **Admin** | Full system access, user management | `manage:users` |

## Permission Mapping (Backend)

The backend maps Auth0 permissions to roles using this priority:

```typescript
if (permissions.includes('manage:users')) return 'admin'
if (permissions.includes('delete:articles')) return 'manager'
if (permissions.includes('publish:articles')) return 'editor'
if (permissions.includes('create:articles')) return 'journalist'
```

## Role Hierarchy

Roles are hierarchical — each role inherits all permissions of roles below it:

```
admin > manager > editor > journalist
```

## Detailed Permissions

### Journalist

| Resource | Permissions |
|----------|-----------|
| Profile | Read/update own |
| Articles | Create, read own, update own drafts, submit for review |
| Media | Upload images, register URLs |
| Analytics | View own article stats |

**Cannot:** publish, delete, moderate comments, manage categories/users

### Editor

All journalist permissions, plus:

| Resource | Permissions |
|----------|-----------|
| Articles | Read all, update any, publish, schedule, return for correction |
| Comments | Read all (any status), approve, reject, delete |
| Analytics | View team stats |

### Manager

All editor permissions, plus:

| Resource | Permissions |
|----------|-----------|
| Articles | Delete |
| Categories | Create, update, delete |
| Teams | Manage assignments, assign roles (journalist/editor) |
| Analytics | View global stats |

### Admin

All manager permissions, plus:

| Resource | Permissions |
|----------|-----------|
| Users | Create, read, update, suspend, delete (via Auth0) |
| Settings | Full system configuration |
| Audit | Access logs |

## Frontend Route Guards

```
/admin                  → All authenticated users
/admin/articles         → All authenticated users (filtered by role)
/admin/comments         → editor+
/admin/media            → All authenticated users
/admin/categories       → manager+
/admin/team             → manager+
/admin/users            → admin only
/admin/settings         → admin only
```

## Implementation

### Backend
- `middleware/auth.ts` → `requireAuth()` and `requireRole()`
- Auth0 JWT verified via JWKS on every request
- Profile synced to Supabase `profiles` table (get-or-create by `auth0_id`)
- `profiles.role` is a cache — authorization always uses JWT

### Frontend
- `lib/admin/rbac.ts` → `hasMinRole()`, `canPublish()`, `canDelete()`, etc.
- Protected layout checks session and fetches profile
- Navigation filtered by role
- Page-level guards redirect unauthorized users

## Auth0 Setup

In Auth0 Dashboard:
1. Create API with identifier = `AUTH0_AUDIENCE`
2. Enable RBAC: "Enable RBAC" + "Add Permissions in the Access Token"
3. Define permissions: `create:articles`, `read:articles`, `publish:articles`, `delete:articles`, `manage:users`, etc.
4. Create roles: journalist, editor, manager, admin
5. Assign permissions to roles
6. Assign roles to users

See `docs/AUTH0_SETUP.md` for detailed Auth0 configuration.
