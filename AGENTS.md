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
pnpm prettier         # prettier --check
pnpm prettier:fix     # prettier --write
pnpm format           # prettier:fix + lint:fix

pnpm typecheck        # nuxt typecheck (tsc via tsconfig + .nuxt/tsconfig.json)

pnpm nuxt prepare     # regenerate .nuxt/ (required before first lint in a fresh clone)

pnpm deps:check       # taze -r  (show outdated deps)
pnpm deps:upgrade     # taze major -r -w + pnpm install
```

**Verification gate:** `pnpm build` + `pnpm lint` + `pnpm typecheck`.  
`postinstall` runs `nuxt prepare` automatically, but re-run it manually after changing `nuxt.config.ts`.  
ESLint extends generated `.nuxt/eslint.config.mjs` — lint fails if `.nuxt/` is missing.  
`preinstall` enforces pnpm via `only-allow pnpm`. `prepare` installs `simple-git-hooks` (commitlint + lint-staged).

---

## Project layout

Nuxt 4 — all app code lives under `app/` (not project root):

```
app/
  app.vue             # root shell + Toaster
  error.vue           # error boundary (Nuxt error page)
  pages/
    index.vue
    blocked.vue       # intentionally excluded from robots/sitemap
    maintenance.vue
    share/            # shared schedule routes
  layouts/
    default.vue
    without-navbar.vue
    maintenance.vue
  middleware/
    blocked.global.ts      # /blocked route guard
    maintenance.global.ts  # maintenance mode redirect
  components/
    Ui/               # UI Thing — generated, ESLint-ignored, prefixed <Ui*>
    calendar/         # prefix BigCalendar*
    schedule/         # prefix Schedule*
    filters/          # prefix Filters*
    links/            # prefix Links*
    *.vue             # unprefixed global components (AppDialog, TheNavbar, etc.)
  composables/        # 16 domain composables (useScheduleQuery, useTimezone, etc.)
  constants/          # auto-imported globally (no import needed in .vue/.ts)
    index.ts          # SHOW_HIRING_BANNER, AUTHORS, SWIPE_* consts
    calendar.ts       # CALENDAR_START_HOUR, VIEW_OPTIONS, STALE_TIME_*, etc.
    dialogs.ts        # dialog IDs / enums
    features.ts       # feature flags
    filters.ts        # filter constants
    schedule.ts       # schedule entity constants
    seo.ts            # site name, description (mirrored from nuxt.config site block)
    shortcuts.ts      # keyboard shortcuts
    storage.ts        # STORAGE_KEYS (localStorage key names)
    timezones.ts      # timezone list
  queries/            # auto-imported globally — TanStack Query queryOptions factories
    _factories.ts     # listOptions(), scheduleOptions(), metadataOptions()
    groups.ts         # groupsOptions, groupScheduleOptions, ...
    teachers.ts       # teachersOptions, teacherScheduleOptions, ...
    auditoriums.ts    # auditoriumsOptions, auditoriumScheduleOptions, ...
  stores/             # Pinia stores
    schedule.ts       # useScheduleStore — saved schedules, selection, ephemeral state
    calendar.ts       # useCalendarStore — selectedDate, currentView, allEvents
    filters.ts        # useFiltersStore — active filter state per schedule
    settings.ts       # useSettingsStore — timezone, snow, URL-sync prefs
    links.ts          # useLinksStore — shared link cache
  types/              # auto-imported globally
    analytics.ts
    calendar.ts       # TCalendarView, TEventType, date/event types
    schedule.ts       # GenericScheduleItem, schedule entity types
  utils/
    cn.ts             # clsx + tailwind-merge — for non-Ui components only
    tanstack-table.ts # valueUpdater helper for @tanstack/vue-table
    tw-helper.ts      # tw() tagged template for Tailwind autocomplete
  plugins/
    nurekit.ts        # provides $nurekit (dev: /api proxy; prod: sh.mindenit.org/api)
    vue-query.ts      # TanStack Query client + IndexedDB persistence
  assets/css/
    tailwind.css      # single canonical CSS — Tailwind v4 + UI Thing base + full token/palette set
server/
  api/[...any].ts     # dev-only reverse proxy → https://sh.mindenit.org/api (404 in prod)
  routes/             # server routes (currently empty)
```

---

## Auto-imports

Beyond Nuxt's defaults, `nuxt.config` adds:

- **Dirs**: `~/types`, `~/constants`, `~/queries` — everything exported from these is globally available without an import statement.
- **Named**: `tv`, `VariantProps` (from `tailwind-variants`); `useSonner` (alias of `toast` from `vue-sonner`).

---

## Modules

```
@nuxt/scripts             # third-party script loading (includes useScriptGoogleAnalytics)
@nuxt/eslint              # ESLint with generated .nuxt/eslint.config.mjs
@nuxt/icon                # icon component, iconify provider, lucide bundled
@nuxtjs/color-mode        # dark/light/system mode via .dark class
@vueuse/nuxt              # VueUse composables auto-imported
@pinia/nuxt               # Pinia state management
@nuxt/fonts               # Inter + Afacad (400/600/700, latin + cyrillic, Google)
@nuxtjs/seo               # unified SEO: sitemap, robots, schema-org, og-image
@yuta-inoue-ph/nuxt-vcalendar  # v-calendar integration module
vue-sonner/nuxt           # toast notifications

# Dev-only (NOT included in production builds):
@nuxt/hints               # browser performance observer overlay
@nuxt/a11y                # accessibility hints overlay
```

`@nuxtjs/seo` bundles: sitemap (`/sitemap.xml`), robots, nuxt-schema-org, og-image (1200×630, 7-day cache). All configured in `nuxt.config`.

---

## Component system — UI Thing (migrated from shadcn-nuxt)

- UI Thing components live in `app/components/Ui/` and are registered with **`prefix: "Ui"`** (path-based, not flat). Sub-components inherit the directory as part of their name: `Ui/Dialog/Content.vue` → `<UiDialogContent>`.
- **Never edit `app/components/Ui/` files for lint compliance** — they are ESLint-ignored. Re-scaffold via `npx ui-thing@latest add <name>` (config: `ui-thing.config.ts`, pnpm, `app/components/Ui`).
- **Exception — `Ui/Tree/Item.vue`**: After any re-scaffold of the `tree` component, remove the `data-slot="tree-item"` attribute from the `<TreeItem>` element in `Item.vue`. This attribute causes a Volar/reka-ui@2.9.x generic-constraint type error (upstream bug). The attribute is unused in our CSS — removing it is safe and required for `pnpm typecheck` to pass.
- **Exception — `Ui/Button.vue`**: After any re-scaffold of the `button` component, change `:disabled="disabled || loading"` (line ~15) to `:disabled="disabled || loading || undefined"`. Without `|| undefined`, Vue SSR omits the `disabled` attribute on `<a>` elements (correct), but the client-side hydration writes `disabled="false"` as a DOM string attribute, producing a hydration mismatch for every `<UiButton as="a">` usage (e.g., `TelegramButton`).
- Add new UI components: `npx ui-thing@latest add button dialog select ...`
- Styling inside `Ui/` uses **`tv()` from `tailwind-variants`**, not `cn()`/CVA. `cn()` is for everything outside `Ui/`.
- For components used inside `h()` render functions, use `resolveComponent("UiButton")` — Nuxt auto-import cannot resolve through `h()`.
- `app/components/Ui/Calendar.vue` wraps **v-calendar** loaded via the `@yuta-inoue-ph/nuxt-vcalendar` module (not a manual import). Key props: `expanded`, `locale="uk"`, `:attributes`, `@dayclick` (payload has `.date: Date`). The old reka-ui `DateValue` / `:weekday-format` API does not apply.

---

## Styling / theme

- **Tailwind v4** (CSS-first). No `tailwind.config.js`. All theme tokens live in `@theme` / `@theme inline` blocks inside the CSS files.
- **Never wrap OKLCH tokens in `hsl()`** — the tokens are already OKLCH values; `hsl(var(--border))` produces invalid CSS here.
- **Single CSS file:** `~/assets/css/tailwind.css` (`@import "tailwindcss"` + `tw-animate-css` + `@tailwindcss/forms`). Defines `:root` / `.dark` token blocks, the full palette scales (`fiord`, `royal-blue`, `amaranth`, `christi`), `--font-accent` (used by `TheLogo`), and the `.hide-scrollbar` / `no-scrollbar` utilities. Edit only this file when changing theme tokens.
- Palette variables (`--color-fiord-*`, `--color-royal-blue-*`, etc.) must be defined in `@theme inline` before they can be referenced in `:root`/`.dark` blocks and used as Tailwind utilities.
- Dark mode class: `.dark` (no suffix). Set via `@nuxtjs/color-mode`, `storageKey: "nuxt-color-mode"`, default preference: `"system"`.
- `.prettierrc`: **tabs**, no semis, double quotes, `printWidth: 100`, `tailwindFunctions: ["clsx", "cn", "tv"]`.

---

## Data layer

### API client — `$nurekit`

Injected by `app/plugins/nurekit.ts`. In dev it points at `window.location.origin/api` (proxied by `server/api/[...any].ts` to `https://sh.mindenit.org/api`); in prod it uses the SDK's default. Always access via `useNuxtApp().$nurekit` inside query factories.

### Server state — TanStack Vue Query

- Query factories live in `app/queries/` and use `queryOptions()` from `@tanstack/vue-query`.
- Factory helpers in `_factories.ts`: `listOptions()`, `scheduleOptions()`, `metadataOptions()` — shared base for all entity types (groups, teachers, auditoriums).
- Per-query `staleTime` controlled by `STALE_TIME_*` constants from `app/constants/calendar.ts`. Global defaults (fallback): `staleTime: 1h`, `gcTime: 7d`.
- **SSR hydration**: server dehydrates query state into `useState("vue-query")`; client hydrates from it before first render (no loading flash).
- **IndexedDB persistence** (`app/plugins/vue-query.ts`): query cache survives page reloads via `idb-keyval` (`mindenit-schedule` DB, `query-cache` store, `tanstack-query` key). `maxAge` = 7 days. Cache is **automatically busted on every deploy** via `buster: config.public.buildId` (timestamp set at build time in `nuxt.config` `runtimeConfig.public.buildId`).

### Client state — Pinia

| Store | File | Responsibility |
|-------|------|----------------|
| `useScheduleStore` | `stores/schedule.ts` | Saved schedules list, selected schedule, ephemeral (URL-loaded) selection |
| `useCalendarStore` | `stores/calendar.ts` | Selected date, current view (`day`/`week`/`month`/`year`), events cache |
| `useFiltersStore` | `stores/filters.ts` | Active filter state per schedule (lessonTypes, teachers, auditoriums, subjects, groups) |
| `useSettingsStore` | `stores/settings.ts` | Timezone, snow effect toggle, URL-sync preference |
| `useLinksStore` | `stores/links.ts` | Shared link cache and CRUD |

All localStorage-backed refs use the **`skipHydrate()` + `useStorage()` pattern** to prevent SSR/client hydration mismatch:

```ts
import { defineStore, skipHydrate } from "pinia"
import { useStorage } from "@vueuse/core"

const myRef = skipHydrate(useStorage(STORAGE_KEYS.myKey, defaultValue))
```

`STORAGE_KEYS` constants live in `app/constants/storage.ts` (auto-imported).

---

## Feature flags & env

| Var / Const | Where | Purpose |
|---|---|---|
| `MAINTENANCE=true` | env | Enables maintenance mode (`runtimeConfig.public.maintenance`) |
| `NUXT_OG_IMAGE_SECRET` | env | **Required in production** — server refuses to start if missing (checked in `server/plugins/env-check.ts` at runtime, not build time) |
| `NUXT_PUBLIC_GA_MEASUREMENT_ID` | env | GA4 measurement ID (`G-XXXXXXXXXX`). Empty = analytics disabled, no script loaded. |
| `SHOW_HIRING_BANNER` | `constants/index.ts` | Set to `false` to hide hiring banner without deleting code |

**Runtime config public keys** (accessible anywhere as `useRuntimeConfig().public.*`):
- `buildId` — `Date.now()` string stamped at build time; busts IndexedDB query cache on deploy.
- `appVersion` — from `package.json` version field.
- `commitSha` — random 4-char build tag for diagnostics.
- `maintenance` — boolean, toggled by `MAINTENANCE` env.

**Route exclusions** — `/blocked`, `/maintenance`, `/share/**` are excluded from robots and sitemap via `routeRules` in `nuxt.config`. Leave them.

---

## Release workflow

### Branch responsibilities

| Branch | Environment | Purpose |
|--------|-------------|---------|
| `dev` | Staging | Integration branch — all feature work lands here |
| `main` | Production | Release ledger — only receives tagged releases |

### Feature → `dev` (day-to-day)

- Open a PR from your feature/fix branch into `dev`.
- PR title must follow Conventional Commits: `feat(scope): description`, `fix(scope): description`, etc.
- Merge method: **Squash and merge** only.
- Result on `dev`: `feat(notifications): handle all 9 backend types (#179)`

### `dev` → `main` (release)

1. Open a PR from `dev` into `main`.
2. **PR title** (becomes the merge commit title):
   ```
   chore(release): v<major>.<minor>.<patch>
   ```
3. **PR body** — use the release PR template (`.github/PULL_REQUEST_TEMPLATE/release.md`).
   Fill in 3-6 highlight bullets from squashed commits since the last release and the compare URL.
4. Get approval, ensure CI passes.
5. Merge method: **Create a merge commit** only.
6. After merging: create a GitHub Release targeting `main` → tag `v<major>.<minor>.<patch>` → paste the PR body as release notes (or click "Generate release notes").

### Rulesets (configured in GitHub Settings → Rules → Rulesets)

**`main`:**
- Require PR before merging ✅ | Required approvals: 1
- Allowed merge method: **Create a merge commit** only
- Require linear history: ❌ (merge commits are two-parent — must be off)
- Require status checks (CI, build, lint, typecheck) ✅
- Block force pushes ✅ | Restrict deletions ✅

**`dev`:**
- Require PR before merging ✅ | Required approvals: 1
- Allowed merge method: **Squash and merge** only
- Require linear history ✅
- Require status checks ✅
- Block force pushes ✅ | Restrict deletions ✅

**Required repo setting:** Settings → General → Pull Requests → enable
**"Default to PR title and description for merge commit messages"** — makes the PR title/body
auto-populate the merge commit message without extra manual steps.

---

## Analytics

Google Analytics 4 via `@nuxt/scripts` `useScriptGoogleAnalytics()`. No separate Nuxt module — GA is loaded dynamically in `app/composables/useAnalytics.ts`.

- **Enabled only when** `NUXT_PUBLIC_GA_MEASUREMENT_ID` is set. Empty = no script, no banner, no data.
- **Consent Mode v2:** GA4 script initialises with `analytics_storage: "denied"`. Data only flows after the user accepts the consent banner (`ConsentBanner.vue`).
- **Consent state** persisted in `localStorage` under `STORAGE_KEYS.analyticsConsent` (`"mindenit:analytics-consent"`). Banner is shown once; choice is honoured on all subsequent visits.
- **Anonymous user_id:** a stable UUID is stored in `localStorage` under `STORAGE_KEYS.analyticsId` (`"mindenit:anon-id"`). Migrates the old `op-anon-id` key on first load.
- **Auto-tracking** (page_view, outbound clicks, scroll, file_download, video) via GA4 Enhanced Measurement — must be enabled in GA4 dashboard: Admin → Data Streams → Web stream → Enhanced measurement → all on.
- **Custom events** — all tracked via `useAnalytics().trackEvent(name, properties)`. Type registry in `app/types/analytics.ts` (32 event kinds). The composable no-ops when consent is not granted or when the measurement ID is empty.

Do not add a manual `<script>` for gtag to `app.head` — `useScriptGoogleAnalytics` handles injection.

---

## Local skills

`.agents/skills/` at repo root contains project-specific agent skills. Load proactively when a task matches:

| Skill | When to load |
|---|---|
| `motion` | Adding animations with `motion-v` |
| `nuxt` | Any Nuxt-specific patterns, SSR, middleware, modules |
| `pinia` | Store definitions, state management |
| `pnpm` | Workspace, dependency management |
| `reka-ui` | Headless component primitives (used inside UI Thing) |
| `ui-thing` | Adding / scaffolding UI components |
| `vue` | Vue 3 Composition API, `script setup`, reactivity |
