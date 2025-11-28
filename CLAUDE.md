# LMS Monorepo

## Structure
```
apps/
├── client/   # React + Vite + Tailwind v4 + shadcn/ui
└── server/   # Elysia + Bun + Drizzle + PostgreSQL
```

## Multi-Tenant
- Each tenant has subdomain: `tenant1.domain.com`
- Users isolated by tenant
- Superadmin has global access
- Dev: use `X-Tenant-Slug` header

## TypeScript
- Create abstractions only when needed
- Clear names over comments
- No emojis, no `any` casts, minimal `try/catch`

## React
- Small composable components
- Colocate related code
- Avoid `useEffect`

## Button Component
- Use `isLoading` prop to show spinner
- On mobile, hides children when loading (shows only spinner)

## TanStack Query
- Global `onError` handler (`catchAxiosError`) for all mutations
- No try/catch or custom onError needed in components
- Mutations: `const {mutate, isPending} = useMyMutation()`
- Queries: `const {data, isLoading} = useMyQuery()`
- Use `isPending` for loading states in forms/buttons

## Services Structure
Each service in `apps/client/src/services/` follows this pattern:
```
services/
└── [resource]/
    ├── service.ts    # Types, QUERY_KEYS, and HTTP calls (ResourceService)
    ├── options.ts    # queryOptions and mutationOptions
    ├── queries.ts    # useQuery hooks (useGetResource, etc.)
    └── mutations.ts  # useMutation hooks (useUpdateResource, etc.)
```

## Tailwind
- Use v4 + shadcn/ui
- Prefer built-in values

## Elysia API (Server)
All route handlers use `withHandler` wrapper for consistent error handling and logging:

```typescript
import { withHandler } from "@/lib/handler";

routes.get("/", (ctx) =>
  withHandler(ctx, async () => {
    if (!ctx.user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }
    return { data: ctx.user };
  })
);
```

- `withHandler` automatically logs errors with endpoint context: `[GET /profile] Error: ...`
- Throw `AppError` for expected errors (sets status code)
- Unknown errors become 500 with generic message
- Never use manual try/catch in routes
