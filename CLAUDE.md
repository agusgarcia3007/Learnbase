# LMS Monorepo

## Structure

```
apps/
├── client/   # React + Vite + Tailwind v4 + shadcn/ui
└── server/   # Elysia + Bun + Drizzle + PostgreSQL
```

## Commands

- **Type check**: Use IDE diagnostics or `bun run build` in client/server (no direct `tsc`)
- **Dev**: `bun run dev` in each app

## Multi-Tenant

- Subdomain per tenant: `tenant1.domain.com`
- Users isolated by tenant, superadmin has global access
- Dev: use `X-Tenant-Slug` header

## Code Style

- No emojis, no `any`, no comments, minimal `try/catch`
- Clear names over comments
- Small composable components, avoid `useEffect`

## Client (React)

### i18n

All UI text must be translated using `useTranslation`:
- Translations in `apps/client/src/locales/{en,es,pt}.json`
- Use `t("key")` or `t("key", { param })` for interpolation

### TanStack Query

- Global error handler (`catchAxiosError`) - no try/catch needed
- `const { mutate, isPending } = useMyMutation()`
- `const { data, isLoading } = useMyQuery()`

### Services Structure

```
services/[resource]/
├── service.ts    # Types, QUERY_KEYS, HTTP calls
├── options.ts    # queryOptions, mutationOptions
├── queries.ts    # useQuery hooks
└── mutations.ts  # useMutation hooks
```

### Button Component

- `isLoading` prop shows spinner (hides children on mobile)

### File Uploads

All file uploads must use the dropzone pattern with `useFileUpload` hook:
- Use existing components: `ImageUpload`, `VideoUpload`, `AvatarUpload` from `@/components/file-upload/`
- Never use URL input fields for file uploads
- Files are uploaded as base64 to dedicated `POST /:id/<resource>` endpoints
- S3 keys are stored in database, presigned URLs generated on-demand

## Server (Elysia)

### Route Handlers

Always use `withHandler` wrapper:

```typescript
routes.get("/", (ctx) =>
  withHandler(ctx, async () => {
    if (!ctx.user) throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    return { data: ctx.user };
  })
);
```

- Throw `AppError` for expected errors
- Never manual try/catch in routes

### Database

Add indexes on filter columns (foreign keys, WHERE clauses):

```typescript
export const usersTable = pgTable("users", {
  tenantId: uuid("tenant_id").references(() => tenantsTable.id),
  role: userRoleEnum("role").notNull(),
}, (table) => [
  index("users_tenant_id_idx").on(table.tenantId),
  index("users_role_idx").on(table.role),
]);
```

### Filters

Use `parseListParams` and `buildWhereClause` from `@/lib/filters`:

| Type | URL | Behavior |
|------|-----|----------|
| Single | `role=admin` | `eq()` |
| Multiple | `role=admin,owner` | `inArray()` |
| Date range | `createdAt=2025-01-01,2025-01-31` | `gte() AND lte()` |
| Search | `search=john` | `ilike()` on searchable fields |
