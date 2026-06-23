# UX Backlog — Mindenit Schedule

Generated from a full codebase audit on 2026-06-21.
Each item is self-contained so it can be picked up and shipped independently.

Legend: ✅ shipped · 🚧 in progress · ⏳ queued · 💤 deferred

---

## Tier 1 — High Impact, Low/Medium Effort

### 1.1 PWA / Installability 💤
> Deferred — native Android app covers mobile. Revisit if a desktop/iOS install story becomes relevant.

- Add `@vite-pwa/nuxt` with `manifest.webmanifest`
- Icons: 192×192, 512×512, `apple-touch-icon`
- Service worker (see 1.2 for cache strategy)
- "Install app" in-app prompt gated on `beforeinstallprompt`
- **Prerequisite for 1.2 offline notifications**

---

### 1.2 Offline / Persisted Query Cache ⏳
> Survive reload and brief offline windows. Students open the app in the metro.

- `persistQueryClient` with IndexedDB via `idb-keyval` + `@tanstack/query-persist-client-core`
- Restore cache before first `useQuery` executes to avoid empty-render flash
- Cache busting tied to deploy `buildId` (set in `runtimeConfig.public` at build time)
- `AppOfflineBanner.vue` — fixed top banner using VueUse `useOnline()`:
  "Без зв'язку — показано збережені дані от {timestamp}". Auto-dismisses + toast when reconnected.
- Related files: `app/plugins/vue-query.ts`, `app/app.vue`

---

### 1.3 Keyboard Shortcuts ⏳
> Power users navigate the calendar faster; shortcuts are standard for calendar apps.

Proposed bindings:

| Key | Action |
|---|---|
| `←` / `→` | Prev / next period (view-aware) |
| `T` | Jump to today |
| `D` / `W` / `M` | Switch view: day / week / month |
| `?` (Shift+/) | Open shortcuts help dialog |
| `/` | Focus search in AddDialog (when open) |

- `app/composables/useKeyboardShortcuts.ts` — `useEventListener` on `document`, ignores events inside inputs/textareas/dialogs with focus trap
- `app/components/AppShortcutsDialog.vue` — `UiDialog` with 2-column key→action table
- `app/constants/shortcuts.ts` — single source of truth, also consumed by help dialog
- Call `useKeyboardShortcuts()` from `app/app.vue`

---

### 1.4 First-Run Onboarding 💤
> Deferred — decide after measuring drop-off in analytics.

Options evaluated:
- **Minimal:** primary "Обрати розклад" CTA button inside the `AppEmptyState` overlay (opens `ScheduleAddDialog`), pulsing dot on the FAB/sidebar button on first visit
- **Full tour:** multi-step coachmark (driver.js or hand-rolled): pick schedule → change view → open event → filter. Shown once, tracked in localStorage via existing `shown-dialogs` `DialogManager` infrastructure.

---

### 1.5 Save-Shared-Schedule Banner ⏳
> A URL-shared schedule is ephemeral. The user has no prompt to persist it and loses it on reload.

- Add `isEphemeralActive` getter to `app/stores/schedule.ts`
  (active id+type not present in the saved list)
- `app/components/ScheduleEphemeralBanner.vue` — banner shown when `isEphemeralActive === true` and a schedule is loaded
  - "Цей розклад відкрито за посиланням. Зберегти його?"
  - Actions: **Зберегти** (calls `scheduleStore.add(activeSchedule)`) + **×** dismiss (session-scoped, `sessionStorage`)
- Mount inside the calendar shell above the grid
- Analytics: track `schedule_saved_from_url` event

---

## Tier 2 — Quality of Life Features

### 2.6 Active Filters Indicator ⏳
> `filtersStore.hasActive` exists but is invisible. Users forget filters are on and wonder why events are missing.

- `filtersStore.getActiveCount(scheduleKey)` — total number of active toggle values across all dimensions
- Filter trigger button (in sidebar + drawer): `UiBadge` with count when `> 0`, icon tinted `text-primary`
- `BigCalendarEmptyStateOverlay`: when empty AND filters active, add "Скинути фільтри" secondary button calling `filtersStore.clearAllFilters(scheduleKey)`

---

### 2.7 Filter Select All / Clear All per Dimension ⏳
> Toggling 12 teachers one-by-one is painful. Needed before the app handles large schedules.

- Per-accordion section header: ghost "Усі" + "Жодного" buttons
- `filtersStore.setAllForDimension(scheduleKey, dimension, valueIds)` and `clearDimension(scheduleKey, dimension)`
- Each bulk action bumps `version` **once** (not once per item) to coalesce the refetch into a single network call
- "Усі" selects only the currently loaded options for that dimension

---

### 2.8 Year View 💤
> `VIEW_CONFIGS` in `app/constants/calendar.ts` already has a dead `year` entry hinting at this.

- 12-month compact grid; event density shown as heatmap dot (count → color scale) per day cell
- Clicking a day navigates to day view
- Good for semester planning; low priority until month/week/day are polished

---

### 2.9 Search / Command Palette Inside Loaded Schedule 💤
> No way to find "when is the next lecture on subject X". Becomes painful with 100+ events.

- `Cmd+K` / `Ctrl+K` command palette
- Searches subjects, teachers, auditoriums within current schedule
- Jumps to next occurrence (scrolls calendar + selects date)
- Could reuse the `ScheduleAddDialog` search field component

---

### 2.10 Lesson Notifications 💤
> Opt-in "next lesson in 15 min" push via Web Notifications API (requires PWA / service worker from 1.1).

- Settings: enable notifications + lead time (5 / 10 / 15 / 30 min) + quiet hours
- Registered via service worker `self.registration.showNotification`
- Payload from persisted TanStack Query cache (works offline)
- **Hard dependency on 1.1 (PWA) and 1.2 (offline cache)**

---

### 2.11 Print Stylesheet 💤
> Students do print weekly schedules. No `@media print` exists at all.

- Targeted at week view: hide sidebar, navbar, FAB; expand grid to full page width
- Force light theme (print is paper)
- Page-break: one week per page
- Print button in week view header or Settings
- Low implementation effort, medium user value

---

## Tier 3 — Bug Fixes Found During Audit

These are real defects, not feature requests. All are safe, small, and narrowly scoped.

### 3.1 Cache key typo — auditorium URL sharing broken 💤
**File:** `app/composables/useUrlState.ts:54`
```ts
// Bug: stores under "auditories" but query uses "auditoriums"
queryClient.setQueryData(["auditories"], list)
```
Fix: change `"auditories"` → `"auditoriums"` to match `app/queries/auditoriums.ts:11`.
Shared auditorium URLs currently trigger a redundant API call and never warm the AddDialog cache.

---

### 3.2 "Today" button date captured at mount time 💤
**File:** `app/components/calendar/shared/TodayButton.vue:7`
```ts
const today = new Date()  // captured once, never updated
```
If a user leaves the tab open past midnight, clicking "Today" navigates to yesterday.
Fix: compute `today` lazily inside the click handler, or use `useNow()` from VueUse.

---

### 3.3 `event.auditorium.name` without null guard 💤
**File:** `app/components/SidebarTodayEvents.vue:59`
```ts
:auditorium="event.auditorium.name"  // crashes for online lessons (null auditorium)
```
Rest of codebase uses `event.auditorium?.name || "Не вказана"`. Apply the same guard here.

---

### 3.4 SidebarTodayEvents makes a redundant API call 💤
**File:** `app/components/SidebarTodayEvents.vue:29`
Calls `useScheduleQuery` with today's timestamps, producing a different cache key from the full-year query already loaded by the page. Results in an extra network request every session.
Fix: filter `calendarStore.allEvents` by today's date range instead of issuing a new query.

---

### 3.5 `window.confirm()` in DataTable instead of UiAlertDialog 💤
**File:** `app/components/links/DataTable.vue:99`
Native `confirm()` blocks the main thread and is visually inconsistent with the rest of the codebase.
Fix: replace with `UiAlertDialog` pattern used in `ScheduleDeleteButton.vue`.

---

### 3.6 Links import count always 0 for object-format backup 💤
**File:** `app/components/SettingsLinksManagement.vue:91-92`
```ts
const count = Array.isArray(parsed) ? parsed.length : 0
```
If the file is the full-backup object format, `count` is always 0. Analytics fires with wrong count, success toast text is misleading.
Fix: derive count from the actual imported result returned by `linksStore.importLinks()`.

---

### 3.7 Ukrainian plural forms incomplete 💤
Manual 2-form ternaries (`=== 1 ? "посилання" : "посилань"`) throughout the codebase.
Ukrainian requires 3 grammatical forms: 1, 2–4, 5+.
Occurrences: `links/ShareLinksDialog.vue:69`, `pages/share/links/[id].vue:96`, `ScheduleAddDialog.vue:249`.
Fix: add `app/utils/pluralUk.ts` helper `pluralUk(count, one, few, many)` and replace all instances.

---

### 3.8 ThemeSwitcher icon button has no aria-label 💤
Screen readers announce it as an unlabeled button.
Fix: add `aria-label="Змінити тему"` (or dynamic `aria-label` based on current/next theme).

---

### 3.9 Month-view mobile event count badge has no aria-label 💤
The circle with a number has no accessible description. Screen reader: "3" with no context.
Fix: `aria-label="\`3 заняття\`"` on the badge element.

---

### 3.10 Calendar fixed hour window 07:00–19:00 clips evening events 💤
**File:** `app/constants/calendar.ts:3-8`
Exams and consultations can be scheduled outside this range. They silently disappear.
Options:
- Widen to a fixed 06:00–21:00
- Auto-fit: derive `startHour = min(event.startHour) - 1` and `endHour = max(event.endHour) + 1` from loaded events for the current view

---

### 3.11 Week view has no swipe gesture 💤
Day view and month view both have `useSwipe` + `motion-v` slide animations.
Week view scrolls horizontally instead of navigating — this is intentional for the column grid,
but a horizontal-scroll-end-then-swipe pattern could still advance the week.
Lower priority; the chevron buttons work fine.

---

### 3.12 Skip-navigation link missing 💤
No `<a href="#main-content">Skip to content</a>` for keyboard/screen reader users.
Reka UI handles focus trapping inside dialogs, but the main page has no skip link.

---

## Tier 4 — Cleanup / Dead Weight

### 4.1 `@nuxt/image` installed but unused 💤
Module adds bundle weight, zero benefit today.
Option A: start using `<NuxtImg>` for `public/authors/*.{jpg,png}` and the logo.
Option B: remove the module if image optimization is not a priority.

---

### 4.3 ICS export missing `VTIMEZONE` block 💤
The `.ics` file declares `X-WR-TIMEZONE:Europe/Kyiv` but has no `VTIMEZONE` component.
Outlook Desktop and some older clients require an explicit `VTIMEZONE` to interpret the timezone correctly.
Fix: generate a `VTIMEZONE:Europe/Kyiv` block per RFC 5545 §3.6.5.

---

### 4.4 TelegramButton text is English 💤
"Join us on Telegram" in an otherwise all-Ukrainian UI.
Fix: translate to "Приєднатися до Telegram" or "Telegram-спільнота".

---

### 4.5 No runtime error tracking (Sentry) 💤
Production JS errors, unhandled rejections, and Vue component errors are invisible.
Self-hosted analytics (Rybbit) captures page events but not exceptions.
Options: Sentry (hosted or self-hosted), Highlight.io, or a simple `window.onerror` webhook.

---

### 4.6 `SEO_KEYWORDS` constant defined but never injected 💤
**File:** `app/constants/seo.ts`
The constant exists but no `<meta name="keywords">` tag is generated.
Low SEO impact (Google ignores keywords), but the constant is dead code.
Either inject it or delete the constant.

---

### 4.7 "Debug" tab label is English and always visible 💤
**File:** `app/components/SettingsMainView.vue:135`
```html
<UiTabsTrigger value="bug">Debug</UiTabsTrigger>
```
Options:
- Gate behind `?debug=1` URL param or a dev-only runtime flag
- Translate to "Діагностика" and keep visible for self-service support
- Current decision: leave as-is

---

## Notes

- All keyboard shortcut keys in 1.3 should be ignored when a dialog/popover has focus (Reka UI's focus trap handles this naturally via `e.target` guard).
- Items marked 💤 are not abandoned — they need a trigger (user feedback, analytics data, or a sprint slot).
- The `DialogManager` / `shown-dialogs` infrastructure already supports "show once" and `minShowInterval` — useful for any future onboarding prompts (1.4) or notification opt-ins (2.10).
