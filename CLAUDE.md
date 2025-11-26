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

## Tailwind
- Use v4 + shadcn/ui
- Prefer built-in values
