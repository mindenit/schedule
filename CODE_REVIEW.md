# Mindenit Schedule — Code Review & Refactor Plan

Generated from a full-codebase audit (Nuxt 4, Vue 3.5, Pinia 3, TanStack Query 5, Tailwind v4, UI Thing). Tasks below are scoped to maintainability, code quality, and component usability. Verification gate: `pnpm lint` + `pnpm build`.

Each task lists **what**, **why**, **how**, and the **files touched**.

---

## P0 — Correctness & cleanup

### P0.1 Delete `app/components/links/DataTable.vue` (approved)
- **What:** Delete the file. It is broken (references undefined `Button`, `Badge`, `DropdownMenu*` directly inside `h()`), 511 LOC, and no longer used.
- **Files:** `app/components/links/DataTable.vue`.

### P0.3 Collapse two CSS files into one (approved)
- **What:** `app/assets/css/main.css` and `app/assets/css/tailwind.css` are both `@import "tailwindcss"`'d and both redefine `:root` / `.dark` / the full palette scales (`fiord`, `royal-blue`, `amaranth`, `christi`). Keep one file with the union of both, preserving old colors.
- **Why:** Double Tailwind import, double `@theme` blocks, double palette definitions — slows the dev server, doubles emitted CSS, and makes theme-token changes ambiguous.
- **How:** Make `tailwind.css` the canonical one (later/post-migration), merge any unique tokens/palette ramps from `main.css` into it, drop `~/assets/css/main.css` from `nuxt.config.ts` `css: []`, then delete `main.css` (or rename `main.shadcn.css` style to a backup). Verify dark/light + every palette colour utility still resolves.
- **Files:** `app/assets/css/main.css`, `app/assets/css/tailwind.css`, `nuxt.config.ts`.

### P0.4 Drop `version` ref in filters store
- **What:** `useFiltersStore` has a `version` ref bumped on every toggle, appended to query keys (`useScheduleQuery` does `[...queryKey, version.value]`).
- **Why:** Filter arrays are already in the query key, and TanStack does structural comparison. The version ref defeats structural sharing and causes unnecessary refetches.
- **How:** Remove `version` from the store and from the key concat in `useScheduleQuery`.
- **Files:** `app/stores/filters.ts`, `app/composables/useScheduleQuery.ts`.

### P0.5 `toValue()` raw refs inside query keys
- **What:** All `*ScheduleOptions` and 6 metadata factories embed `MaybeRefOrGetter` arguments raw into the `queryKey` array.
- **Why:** A `Ref` object inside a key serializes as `{value: …}` and does not stay reactive for cache lookup. `toValue()` (or a `computed()` wrapping) is the canonical pattern.
- **How:** Wrap factory return in `computed()` or use `toValue()` on each argument inside the key + `enabled`/`queryFn`.
- **Files:** `app/queries/groups.ts`, `app/queries/teachers.ts`, `app/queries/auditoriums.ts`.

### P0.6 Unwrap unnecessary `ref(...)` in `useScheduleIcsExport`
- **What:** `useScheduleIcsExport` calls `groupScheduleOptions(ref(scheduleId), ref(startTimestamp), ref(endTimestamp))` even though the values are already scalars and the factories accept `MaybeRefOrGetter`.
- **How:** Pass the scalars directly.
- **Files:** `app/composables/useScheduleIcsExport.ts`.

---

## P1 — Architecture & duplication

### P1.7 Unify swipe views via `useSwipeNavigator`
- **What:** `DayView`, `WeekView`, `MonthView`, `YearView` each implement the same swipe/drag-to-navigate state machine: `buildPanel`, `currentPanel`/`incomingPanel`, `inflightControls`, `cancelInflight`, `navigateTo`, drag handlers (Week missing them). ~1200 LOC of near-duplicated logic.
- **How:** Extract a `useSwipeNavigator<TPanel>({ buildPanel, navigateBy, axis })` composable. Each view passes its `buildPanel(date)` and `navigateBy(date, dir)` impl and renders `<motion.div>`s using the composable's `panels`/`drag*` handlers.
- **Add to WeekView** the missing drag handlers in the same pass.
- **Files:** new `app/composables/useSwipeNavigator.ts`; refactor `app/components/calendar/{day,week,month,year}/*View.vue`.

### P1.8 Collapse filters store duplication
- **What:** 5 parallel arrays (`lessonTypes/teachers/auditoriums/subjects/groups`) with 5 `toggle*` and 5 `is*Active` methods.
- **How:** Internal `Record<TFilterKey, ApiFilter[]>` + generic `toggle(key, item)` / `isActive(key, item)` exposed as a thin facade preserving the public API.
- **Files:** `app/stores/filters.ts` (consumers untouched).

### P1.9 Dedup query factories
- **What:** `groups.ts`, `teachers.ts`, `auditoriums.ts` follow identical shapes (list + schedule + 3 metadata). Same `if (val && val.length > 0)` filter-resolution copy-paste.
- **How:** Internal `createScheduleQuery({ entity, fetch })` and `createMetadataQuery({ entity, key, fetch })` helpers; thin wrappers export public names so call sites do not change.
- **Files:** `app/queries/groups.ts`, `app/queries/teachers.ts`, `app/queries/auditoriums.ts`; new `app/queries/_internal.ts`.

### P1.10 Invert `useScheduleQuery` filter ownership
- **What:** Today `useScheduleQuery` builds a `filterOptions` object duplicating what `*ScheduleOptions` already declares.
- **How:** `useScheduleQuery` should read filters from the store via `computed()` and pass them through as named getters; the duplicate mapping disappears.
- **Files:** `app/composables/useScheduleQuery.ts`.

### P1.11 Resolve `useEventGrouping` duplication
- **What:** File exports plain functions and ALSO wraps them inside `useEventGrouping()` for back-compat — two callable surfaces with the same behaviour.
- **How:** Pick one (recommend module-level functions only since they're pure). Update the few component call sites that use the composable form.
- **Files:** `app/composables/useEventGrouping.ts` + grep call sites.

### P1.12 Inline `helpers.ts` NEXT/PREV/COMPARE maps
- **What:** `navigateDate(date, view, dir)` uses three static maps that just dispatch to `date-fns` `add/sub/isSame*`.
- **How:** Replace with a `switch (view)` directly inside the function. Smaller, no indirection, same behaviour.
- **Files:** `app/utils/helpers.ts`.

### P1.13 Centralize storage keys + migrate schedule store to `useStorage`
- **What:** Storage keys are scattered (`all-schedules`, `selected-schedule`, `snow-effect-enabled`, `url-sync-enabled`, `timezone`, `calendar-view`, `shown-dialogs`, `schedule-links`, `devAccess`, `filters-${type}-${id}`).
- **How:**
  1. New `app/constants/storage.ts` exposing a `STORAGE_KEYS` const with a consistent prefix scheme: `mindenit:` namespace + kebab-case (e.g. `mindenit:schedules`, `mindenit:schedules:selected`, `mindenit:settings:snow`, `mindenit:filters:<type>:<id>`).
  2. Replace `localStorage.getItem/setItem` in `useScheduleStore` with VueUse `useStorage<Schedule[]>` and `useStorage<Schedule | null>` referencing those keys. Drop the manual `initializeStore()` / `isInitialized` race (`useStorage` is reactive synchronously).
  3. Update every consumer to read from `STORAGE_KEYS`.
  4. **Drop old key support** (deployed v3 frontend uses old keys — acceptable per user).
- **Files:** new `app/constants/storage.ts`; `app/stores/{schedule,filters,settings,links,calendar}.ts`; `app/composables/useDialogManager.ts`; `app/middleware/maintenance.global.ts`; `app/plugins/vue-query.ts` (cache key namespace).

### P1.14 Maintenance middleware via `useCookie`
- **What:** `maintenance.global.ts` has a hand-rolled `parseCookies()` plus dual `useLocalStorage` + `useCookie` for `devAccess`.
- **How:** Single `useCookie<boolean>("mindenit:dev-access")`, SSR-safe; drop the `parseCookies` helper.
- **Files:** `app/middleware/maintenance.global.ts`.

### P1.17 SnowEffect async
- **What:** 506-LOC `SnowEffect.vue` is statically auto-imported; gated only via `v-if`. Lives in the main bundle.
- **How:** Wrap into `defineAsyncComponent(() => import("~/components/SnowEffect.vue"))` in the consumer; or use `<LazySnowEffect />` (Nuxt's lazy prefix).
- **Files:** `app/app.vue` (consumer).

### P1.18 Extract `useAppShell`
- **What:** `app.vue` mixes analytics init, keyboard shortcuts, schema, snow toggle, Sonner mount, color-mode hookup.
- **How:** New `useAppShell()` composable that orchestrates init side-effects; `app.vue` becomes a thin template.
- **Files:** new `app/composables/useAppShell.ts`; `app/app.vue`.

### P1.21 Document AppIcon `!important` workaround
- **What:** `AppIcon` uses `!size-*` to override `@nuxt/icon` injecting its own `width/height`. Add a top-of-file comment explaining why so nobody removes it.
- **Files:** `app/components/AppIcon.vue`.

### P1.22 Move string utils
- **What:** `capitalize` and `getFirstLetters` live in `useEventFormatting` despite being pure string utilities. Drags `date-fns`/timezone/nurekit imports into anything consuming them.
- **How:** Move to `app/utils/strings.ts`; auto-imported via Nuxt utils convention. Re-export from `useEventFormatting` only if needed for compat (preferable: remove).
- **Files:** new `app/utils/strings.ts`; `app/composables/useEventFormatting.ts`; consumers.

### P1.24 Swipe magic numbers → constants
- **What:** `COMMIT_OFFSET_RATIO = 0.25` and `COMMIT_VELOCITY = 400` duplicated across views.
- **How:** Move to `app/constants/index.ts` alongside `SWIPE_*`.
- **Files:** `app/constants/index.ts`; consumers (folds into P1.7).

### P1.25 LRU eviction in `useCalendarCells`
- **What:** Cache evicts FIFO (`Map` insertion-order); should re-insert on hit so frequently-used dates survive.
- **How:** On hit: `cache.delete(key); cache.set(key, value)`. Same 24-entry cap.
- **Files:** `app/composables/useCalendarCells.ts`.

### P1.26 Conditional route.query watch in `useUrlState`
- **What:** A deep `watch` on `route.query` runs even when URL sync is OFF.
- **How:** Guard with `if (!urlSyncEnabled.value) return` inside the handler, or build the watcher inside an `effect` that re-runs when `urlSyncEnabled` flips.
- **Files:** `app/composables/useUrlState.ts`.

### P1.30 `NuxtErrorBoundary` on calendar root
- **What:** Calendar crashes (bad event data, network parse fail) bubble up and blank the page.
- **How:** Wrap `<BigCalendar>` (or the page slot in `default.vue`) with `<NuxtErrorBoundary>` and render a fallback with retry CTA.
- **Files:** `app/layouts/default.vue` or `app/pages/index.vue`.

---

## Skipped (per user)

- P0.2: keep `useScheduleStore` API compatible with deployed v3 frontend (P1.13 handles key unification by dropping old support cleanly).
- P1.15: keep `useDialogManager` (still used for PlayMarket newcomer dialog).
- P1.16: keep VTIMEZONE EET/EEST DAYLIGHT block (Ukraine still uses DST).
- P1.19, P1.20, P1.27, P1.28: out-of-scope or covered by DataTable deletion.
- P1.29: accessibility audit deferred.
- P2.23: user will fix themselves.
- No tests, no i18n.

---

## Verification

After each task: `pnpm lint`. Final gate: `pnpm build`.
