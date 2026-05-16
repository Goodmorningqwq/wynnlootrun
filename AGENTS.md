# wynnlootrun

Real-time lootrun beacon advisor for Wynncraft. Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (base-nova) + Upstash Redis.

## Commands

- `npm run dev` — dev server (Turbopack by default in Next 16)
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`; `next lint` command removed in v16)
- No test runner configured

## Environment

Required in `.env.local`:
- `UPSTASH_REDIS_REST_URL_GUILD` — Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN_GUILD` — Upstash Redis REST token

See `.env.local.example`.

## Architecture

```
src/
  app/
    page.tsx              # Landing page (static, client)
    run/page.tsx          # Main lootrun advisor (client component, full state)
    login/page.tsx        # Login/register (client)
    api/user/auth/route.ts  # POST ?action=login|register
    api/user/data/route.ts  # GET/POST/DELETE user & guild data
    layout.tsx            # Root layout, dark theme, Google Fonts
    globals.css           # Tailwind v4 @theme, Wynncraft color palette
  lib/
    lootrun/
      engine.ts           # Core: phase detection, combo detection, beacon scoring, state management
      types.ts            # All domain types (BeaconColor, LootrunState, RunPhase, etc.)
      beacons.ts          # 13 beacon definitions
      missions.ts         # 21 mission definitions with combo roles
      trials.ts           # 12 trial definitions with tiers
    auth.ts               # PBKDF2 password hashing (100k iterations, SHA-256)
    auth-middleware.ts     # Extracts user from x-username header or ?username= query
    redis.ts              # Upstash Redis client init
    utils.ts              # cn() utility (clsx + tailwind-merge)
  components/
    lootrun/              # Domain components (AdvisorPanel, BeaconCard, BeaconOfferGrid, etc.)
    ui/                   # shadcn/ui primitives (base-nova style)
```

## Next.js 16 specifics

This is Next.js 16 — not 14/15. Read `node_modules/next/dist/docs/` before changing App Router patterns. Key differences:

- **Async request APIs**: `cookies()`, `headers()`, `draftMode()` must be `await`-ed. `params` and `searchParams` in pages/layouts/routes are Promises.
- **Turbopack is default**: `next dev` and `next build` use Turbopack. Custom `webpack` configs will break; use `--webpack` flag to opt out.
- **`middleware.ts` → `proxy.ts`**: Deprecated in v16. This project has no middleware file currently.
- **`next lint` removed**: Use `eslint` CLI directly (already configured).
- **Caching**: `cacheLife`/`cacheTag` stable (drop `unstable_` prefix). `revalidateTag()` now requires second `cacheLife` arg.
- **Node.js 20.9+** required; Node 18 dropped.

## Auth model

No session/cookie auth. Username identity comes from:
1. `x-username` header, or
2. `?username=` query parameter

Login page stores current user in `localStorage`. The `/run` page redirects to `/login` if no `currentUser` in localStorage. Password auto-migrates from legacy simple hash to PBKDF2 on login.

## Conventions

- Path alias: `@/*` → `./src/*`
- shadcn/ui style: `base-nova` (not `default` or `new-york`). Add new components via `npx shadcn@latest add <name>`.
- Tailwind v4 with `@theme inline` block and CSS custom properties — no `tailwind.config.ts`.
- Fonts loaded via `<link>` in layout `<head>`, not `next/font`.
- No tests, no CI, no Docker.
- API routes do not use dynamic segments, so async `params` breaking change doesn't affect them currently.
