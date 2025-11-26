# Server Rules

## Stack
- Bun runtime (not Node.js)
- Elysia framework
- Drizzle ORM + PostgreSQL
- TypeBox validation (via Elysia `t`)
- OpenAPI docs at `/openapi`

## Multi-Tenant
- Production: extract tenant from Host subdomain
- Development: use `X-Tenant-Slug` header
- `tenantId = null` means superadmin (global access)

## Auth
- `Bun.password.hash()` / `verify()` for passwords (argon2id)
- JWT plugin: access token 15m, refresh token 7d
- Macros: `auth: true` for protected, `superadmin: true` for admin-only

## Routes
- `index.ts` only mounts routes via `.use()`
- Each route file exports Elysia instance with prefix
- Use `detail` for OpenAPI docs

## Database
- UUIDs for IDs
- Enums with `pgEnum`
- Types via `$inferInsert` / `$inferSelect`

## Roles
- `superadmin`: global access, manages tenants
- `admin`: tenant admin (instructor)
- `student`: regular tenant user
