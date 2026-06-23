# Mindenit Schedule — Agent Instructions

Repo-specific only. Global rules live in `~/.config/opencode/AGENTS.md`.

---

## Commands

```bash
pnpm dev              # dev server (port 3000)
pnpm build            # production build → .output/
pnpm generate         # static generation
pnpm preview          # preview .output/

pnpm lint             # eslint (exit 0 on warnings-only)
pnpm lint:fix         # eslint --fix
pnpm prettier:fix     # prettier --write
pnpm format           # prettier:fix + lint:fix

pnpm nuxt prepare     # regenerate .nuxt/ (required before first lint in a fresh clone)
```

**No `test` or `typecheck` script.** Verification gate is `pnpm build` + `pnpm lint`.  
`postinstall` runs `nuxt prepare` automatically, but re-run it manually after changing `nuxt.config.ts`.  
ESLint extends generated `.nuxt/eslint.config.mjs` — lint fails if `.nuxt/` is missing.

---

## Project layout

Nuxt 4 — all app code lives under `app/` (not project root):

```
app/
  app.vue             # root shell + Toaster
  pages/              # file-based routing
  layouts/
  components/
    Ui/               # UI Thing — generated, ESLint-ignored, prefixed <Ui*>
    calendar/         # prefix BigCalendar*
    schedule/         # prefix Schedule*
    filters/          # prefix Filters*
    links/            # prefix Links*
    *.vue             # unprefixed global components
  composables/
  constants/          # auto-imported globally (no import needed in .vue/.ts)
  queries/            # auto-imported globally — TanStack Query queryOptions factories
  stores/             # Pinia stores
  types/              # auto-imported globally
  utils/
    cn.ts             # clsx + tailwind-merge — for non-Ui components only
    tanstack-table.ts # valueUpdater helper for @tanstack/vue-table
    tw-helper.ts      # tw() tagged template for Tailwind autocomplete
  assets/css/
    tailwind.css      # single canonical CSS — Tailwind v4 + UI Thing base + full token/palette set
server/
  api/[...any].ts     # dev-only proxy → https://sh.mindenit.org/api (404 in prod)
```

---

## Auto-imports

Beyond Nuxt's defaults, `nuxt.config` adds:

- **Dirs**: `~/types`, `~/constants`, `~/queries` — everything exported from these is globally available without an import statement.
- **Named**: `tv`, `VariantProps` (from `tailwind-variants`); `useSonner` (alias of `toast` from `vue-sonner`).

---

## Component system — UI Thing (migrated from shadcn-nuxt)

- UI Thing components live in `app/components/Ui/` and are registered with **`prefix: "Ui"`** (path-based, not flat). Sub-components inherit the directory as part of their name: `Ui/Dialog/Content.vue` → `<UiDialogContent>`.
- **Never edit `app/components/Ui/` files for lint compliance** — they are ESLint-ignored. Re-scaffold via `npx ui-thing@latest add <name>` (config: `ui-thing.config.ts`, pnpm, `app/components/Ui`).
- Add new UI components: `npx ui-thing@latest add button dialog select ...`
- Styling inside `Ui/` uses **`tv()` from `tailwind-variants`**, not `cn()`/CVA. `cn()` is for everything outside `Ui/`.
- For components used inside `h()` render functions, use `resolveComponent("UiButton")` — Nuxt auto-import cannot resolve through `h()`.
- `app/components/Ui/Calendar.vue` wraps **v-calendar** (not reka-ui). Key props: `expanded`, `locale="uk"`, `:attributes`, `@dayclick` (payload has `.date: Date`). The old reka-ui `DateValue` / `:weekday-format` API does not apply.

---

## Styling / theme

- **Tailwind v4** (CSS-first). No `tailwind.config.js`. All theme tokens live in `@theme` / `@theme inline` blocks inside the CSS files.
- **Never wrap OKLCH tokens in `hsl()`** — the tokens are already OKLCH values; `hsl(var(--border))` produces invalid CSS here.
- **Single CSS file:** `~/assets/css/tailwind.css` (`@import "tailwindcss"` + `tw-animate-css` + `@tailwindcss/forms`). Defines `:root` / `.dark` token blocks, the full palette scales (`fiord`, `royal-blue`, `amaranth`, `christi`), `--font-accent` (used by `TheLogo`), and the `.hide-scrollbar` / `no-scrollbar` utilities. Edit only this file when changing theme tokens.
- Palette variables (`--color-fiord-*`, `--color-royal-blue-*`, etc.) must be defined in `@theme inline` before they can be referenced in `:root`/`.dark` blocks and used as Tailwind utilities.
- Dark mode class: `.dark` (no suffix). Set via `@nuxtjs/color-mode`, `storageKey: "nuxt-color-mode"`.
- `.prettierrc`: **tabs**, no semis, double quotes, `printWidth: 100`, `tailwindFunctions: ["clsx", "cn", "tv"]`.

---

## Data layer

- **`$nurekit`** — injected by `app/plugins/nurekit.ts`. In dev it points at `window.location.origin/api` (proxied by `server/api/[...any].ts`); in prod it uses the SDK's default (`https://sh.mindenit.org/api`). Always access via `useNuxtApp().$nurekit` inside query factories.
- **Server state**: TanStack Vue Query. Query factories are in `app/queries/` (`groupsOptions`, `teacherGroupsOptions`, etc.) using `queryOptions()`. Components call `useQuery(computedOptions)`.
- **Client state**: Pinia stores in `app/stores/` (`useCalendarStore`, `useScheduleStore`, `useFiltersStore`, `useLinksStore`, `useSettingsStore`).

---

## Feature flags & env

- `MAINTENANCE=true` env → enables maintenance mode (checked in `runtimeConfig.public.maintenance`).
- `SHOW_HIRING_BANNER` — boolean const in `app/constants/index.ts`. Set to `false` to hide the hiring banner without deleting code.
- Analytics script (`analytics.mindenit.org`) is injected in `nuxt.config` `app.head` — leave it.
- `/blocked` route is intentionally in robots `disallow` and sitemap `exclude` — leave it.
