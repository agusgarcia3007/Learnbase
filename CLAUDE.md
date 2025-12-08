# LMS Monorepo

## Structure

```
apps/
├── client/   # React + Vite + Tailwind v4 + shadcn/ui
└── server/   # Elysia + Bun + Drizzle + PostgreSQL
```

## Commands

### Client (`apps/client`)
- **Dev**: `bun run dev` - Start development server
- **Build**: `bun run build` - Build for production (also type checks)
- **Lint**: `bun run lint` - Run ESLint
- **Preview**: `bun run preview` - Preview production build

### Server (`apps/server`)
- **Dev**: `bun run dev` - Start with hot reload
- **Start**: `bun run start` - Start production server
- **DB Generate**: `bun run db:generate` - Generate Drizzle migrations
- **DB Migrate**: `bun run db:migrate` - Run migrations
- **DB Push**: `bun run db:push` - Push schema directly
- **DB Studio**: `bun run db:studio` - Open Drizzle Studio

Note: No direct `tsc` - use IDE diagnostics or `bun run build` for type checking

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

## AI Video Analysis

Generates title and description from video content using Groq.

### Flow

```
Video (S3) → FFmpeg (extract audio) → Groq Whisper → Llama 70b → { title, description }
```

### Components

| File | Purpose |
|------|---------|
| `lib/ai/groq.ts` | Groq SDK client |
| `lib/ai/models.ts` | Model IDs (whisper-large-v3-turbo, llama-3.3-70b-versatile) |
| `lib/ai/prompts.ts` | System prompt for content generation |
| `routes/ai.ts` | POST `/ai/videos/:id/analyze` endpoint |

### FFmpeg Audio Extraction

```bash
ffmpeg -i <video_url> -vn -ac 1 -ar 16000 -filter:a atempo=2.0 -f mp3 -b:a 32k -
```

| Flag | Effect |
|------|--------|
| `-vn` | No video |
| `-ac 1` | Mono |
| `-ar 16000` | 16kHz sample rate |
| `-filter:a atempo=2.0` | 2x speed (halves duration) |
| `-b:a 32k` | 32kbps bitrate |
| `-` | Output to stdout |

Result: ~1-2MB per hour of video, streamed directly to Groq.

### Deployment (Railway)

FFmpeg required via environment variable (Railpack):

```
RAILPACK_DEPLOY_APT_PACKAGES=ffmpeg
```

### Environment

```
GROQ_API_KEY=gsk_xxxxx
RAILPACK_DEPLOY_APT_PACKAGES=ffmpeg
```
