# wynnlootrun

Real-time lootrun beacon advisor for Wynncraft. Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (base-nova) + Upstash Redis.

## Commands

- `npm run dev` — dev server (Turbopack by default in Next 16)
- `npm run build` — production build
- `npm run lint` — ESLint via flat config (`eslint.config.mjs`); `next lint` does not exist in Next 16
- No test runner configured

## Environment

Required in `.env.local` (see `.env.local.example`):
- `UPSTASH_REDIS_REST_URL_GUILD`
- `UPSTASH_REDIS_REST_TOKEN_GUILD`

Without these, `redis.ts` falls back to placeholder URLs and auth/data APIs fail silently.

## Architecture

```
src/
  app/
    page.tsx                # Landing page ('use client')
    run/page.tsx            # Main lootrun advisor ('use client', all state lives here)
    login/page.tsx          # Login/register ('use client')
    api/user/auth/route.ts  # POST ?action=login|register
    api/user/data/route.ts  # GET/POST/DELETE user & guild data
    layout.tsx              # Root layout, dark theme, next/font/google
    globals.css             # Tailwind v4 @theme inline + Wynncraft color palette
  lib/
    lootrun/
      engine.ts             # Core: phase detection, beacon scoring, state management
      types.ts              # All domain types (BeaconColor, LootrunState, RunPhase, etc.)
      beacons.ts            # 13 beacon definitions
      missions.ts           # Mission definitions with combo roles
      trials.ts             # Trial definitions with tiers
      combos.ts             # Combo detection logic
      constraints.ts        # Constraint validation
      strategy.ts           # Strategy scoring
      recommendations.ts    # Mission/beacon recommendation engine
    auth.ts                 # PBKDF2 password hashing (100k iterations, SHA-256)
    auth-middleware.ts       # Extracts user from x-username header or ?username= query
    redis.ts                # Upstash Redis client init
    utils.ts                # cn() utility (clsx + tailwind-merge)
  components/
    lootrun/                # Domain components (AdvisorPanel, BeaconCard, etc.)
    ui/                     # shadcn/ui primitives (base-nova style)
```

## Next.js 16 specifics

This is Next.js 16 — not 14/15. Key differences:

- **Async request APIs**: `cookies()`, `headers()`, `draftMode()` must be `await`-ed. `params` and `searchParams` in pages/layouts are Promises.
- **Turbopack is default**: `next dev` and `next build` use Turbopack. Custom `webpack` configs will break; use `--webpack` flag to opt out.
- **`next lint` removed**: Use `eslint` CLI directly.
- **Caching**: `cacheLife`/`cacheTag` stable (drop `unstable_` prefix). `revalidateTag()` now requires second `cacheLife` arg.
- **Node.js 20.9+** required; Node 18 dropped.

## Auth model

No session/cookie auth. Username identity comes from:
1. `x-username` header, or
2. `?username=` query parameter

Login page stores current user in `localStorage`. The `/run` page redirects to `/login` if no `currentUser` in localStorage. Password auto-migrates from legacy simple hash to PBKDF2 on login.

## Conventions

- **Path alias**: `@/*` → `./src/*`
- **All pages are `'use client'`** — no server components beyond layout. `components.json` has `rsc: true` but the app is entirely client-rendered.
- **shadcn/ui style**: `base-nova` (not `default` or `new-york`). Add via `npx shadcn@latest add <name>`.
- **Tailwind v4**: `@theme inline` block and CSS custom properties in `globals.css` — no `tailwind.config.ts`. PostCSS uses `@tailwindcss/postcss`.
- **Fonts**: `next/font/google` (Chakra Petch, Russo One) with CSS variable classes — not `<link>` tags.
- **No tests, no CI, no Docker.**
