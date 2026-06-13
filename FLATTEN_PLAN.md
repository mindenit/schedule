# Flatten Layer Architecture into app/

## Goal
Dissolve `core/` and all `layers/*` into a single `app/` source tree (standard Nuxt 4).
Keep component prefixes via config (no template edits). Remove `@source` hack and `~`/`@` alias override.

## Status
- [ ] Phase 1 — Safety (branch + baseline)
- [ ] Phase 2 — Move files
- [ ] Phase 3 — Rewrite imports
- [ ] Phase 4 — Rewrite nuxt.config.ts
- [ ] Phase 5 — Update CSS + shadcn config
- [ ] Phase 6 — Cleanup
- [ ] Phase 7 — Verify

---

## Target Structure

```
app/
├── app.vue
├── error.vue                    ← layers/site/error.vue
├── assets/css/main.css          ← core/assets/css/main.css
├── components/
│   ├── ui/                      ← core/components/ui/       (unprefixed)
│   ├── OgImage/                 ← core/components/OgImage/  (unprefixed)
│   ├── *.vue                    ← core/components/*.vue     (unprefixed)
│   ├── calendar/                ← layers/calendar/components/  (prefix BigCalendar)
│   ├── schedule/                ← layers/schedule/components/  (prefix Schedule)
│   ├── filters/                 ← layers/filters/components/   (prefix Filters)
│   └── links/                   ← layers/links/components/     (prefix Links)
├── composables/                 ← core/composables/ + calendar + links (9 files)
├── constants/
│   ├── index.ts                 ← core/constants/index.ts
│   ├── dialogs.ts               ← core/constants/dialogs.ts
│   ├── calendar.ts              ← layers/calendar/constants/index.ts
│   ├── filters.ts               ← layers/filters/constants/index.ts
│   └── schedule.ts              ← layers/schedule/constants/index.ts
├── layouts/                     ← layers/site/layouts/
├── middleware/                  ← core/middleware/
├── pages/                       ← layers/site/pages/ + layers/links/pages/
├── plugins/                     ← core/plugins/
├── queries/                     ← core/queries/
├── stores/                      ← all 5 stores (settings, calendar, filters, links, schedule)
├── types/
│   ├── calendar.ts              ← layers/calendar/types/index.ts
│   └── schedule.ts              ← layers/schedule/types/index.ts
└── utils/                       ← core/utils/{cn.ts,index.ts} + calendar/utils/helpers.ts
public/                          ← layers/site/public/ → project ROOT
```

---

## Phase 2 — File Moves (git mv)

### Assets
- core/assets/css/main.css → app/assets/css/main.css

### UI components (114 files)
- core/components/ui/ → app/components/ui/

### Core app-level components (22 files + OgImage/)
- core/components/AppDialog.vue → app/components/
- core/components/AppIcon.vue → app/components/
- core/components/AuthorsDialog.vue → app/components/
- core/components/DialogManager.vue → app/components/
- core/components/HiringInfo.vue → app/components/
- core/components/OgImage/ → app/components/OgImage/
- core/components/PlayMarketButton.vue → app/components/
- core/components/SearchField.vue → app/components/
- core/components/SettingsDialog.vue → app/components/
- core/components/SettingsLinksManagement.vue → app/components/
- core/components/SettingsMainView.vue → app/components/
- core/components/SidebarCalendar.vue → app/components/
- core/components/SidebarEvent.vue → app/components/
- core/components/SidebarTodayEvents.vue → app/components/
- core/components/SnowEffect.vue → app/components/
- core/components/TelegramButton.vue → app/components/
- core/components/TheLoader.vue → app/components/
- core/components/TheLogo.vue → app/components/
- core/components/ThemeSwitcher.vue → app/components/
- core/components/TheNavbar.vue → app/components/
- core/components/TheSidebar.vue → app/components/
- core/components/WaitHand.vue → app/components/

### Layer components (keep subfolders)
- layers/calendar/components/ → app/components/calendar/ (15 files: day/, month/, shared/, week/, Root.vue)
- layers/schedule/components/ → app/components/schedule/
- layers/filters/components/ → app/components/filters/
- layers/links/components/ → app/components/links/

### Composables (9 files, no name collisions)
- core/composables/*.ts → app/composables/
- layers/calendar/composables/*.ts → app/composables/
- layers/links/composables/useSharableLinks.ts → app/composables/

### Queries
- core/queries/*.ts → app/queries/

### Plugins + Middleware
- core/plugins/*.ts → app/plugins/
- core/middleware/*.ts → app/middleware/

### Stores (5 files, no name collisions)
- core/stores/settings.ts → app/stores/
- layers/calendar/stores/calendar.ts → app/stores/
- layers/filters/stores/filters.ts → app/stores/
- layers/links/stores/links.ts → app/stores/
- layers/schedule/stores/schedule.ts → app/stores/

### Utils
- core/utils/cn.ts → app/utils/cn.ts
- core/utils/index.ts → app/utils/index.ts
- layers/calendar/utils/helpers.ts → app/utils/helpers.ts

### Constants (rename index.ts → named files)
- core/constants/index.ts → app/constants/index.ts
- core/constants/dialogs.ts → app/constants/dialogs.ts
- layers/calendar/constants/index.ts → app/constants/calendar.ts
- layers/filters/constants/index.ts → app/constants/filters.ts
- layers/schedule/constants/index.ts → app/constants/schedule.ts

### Types (rename index.ts → named files)
- layers/calendar/types/index.ts → app/types/calendar.ts
- layers/schedule/types/index.ts → app/types/schedule.ts

### Pages + Layouts + Error
- layers/site/pages/index.vue → app/pages/index.vue
- layers/site/pages/faggots.vue → app/pages/faggots.vue
- layers/site/pages/maintenance.vue → app/pages/maintenance.vue
- layers/links/pages/share/links/[id].vue → app/pages/share/links/[id].vue
- layers/site/layouts/default.vue → app/layouts/default.vue
- layers/site/layouts/maintenance.vue → app/layouts/maintenance.vue
- layers/site/layouts/withoutNavbar.vue → app/layouts/withoutNavbar.vue
- layers/site/error.vue → app/error.vue

### Public assets
- layers/site/public/ → public/ (root level)

---

## Phase 3 — Import Rewrites

### Cross-alias imports (48 occurrences)

| Old | New |
|-----|-----|
| `@/core/utils` | `~/utils` |
| `@/core/components/ui/button` | `~/components/ui/button` |
| `@/core/components/ui/checkbox` | `~/components/ui/checkbox` |
| `@/core/components/ui/input` | `~/components/ui/input` |
| `@/core/components/ui/dropdown-menu` | `~/components/ui/dropdown-menu` |
| `@/core/components/ui/table` | `~/components/ui/table` |
| `@/core/components/ui/badge` | `~/components/ui/badge` |
| `~/core/components/ui/table/utils` | `~/components/ui/table/utils` |
| `~/core/components/AppIcon.vue` | `~/components/AppIcon.vue` |
| `~/core/queries/groups` | `~/queries/groups` |
| `~/core/queries/teachers` | `~/queries/teachers` |
| `~/core/queries/auditoriums` | `~/queries/auditoriums` |
| `~/core/constants` | `~/constants` |
| `~/core/composables/useScheduleQuery` | `~/composables/useScheduleQuery` |
| `~/core/stores/settings` | `~/stores/settings` (if explicit) |
| `~/layers/links/stores/links` | `~/stores/links` |
| `~/layers/links/components/ShareLinksDialog.vue` | `~/components/links/ShareLinksDialog.vue` |
| `~/layers/links/composables/useSharableLinks` | `~/composables/useSharableLinks` |
| `~/layers/calendar/types` | `~/types/calendar` |
| `~/layers/calendar/constants` | `~/constants/calendar` |
| `~/layers/schedule/constants` | `~/constants/schedule` |
| `@/core/stores/settings` | `~/stores/settings` |

### Relative imports (30 occurrences)

| File location | Old | New |
|---------------|-----|-----|
| calendar components (day/,month/,week/) | `../../constants` | `~/constants/calendar` |
| calendar components (day/,month/,week/) | `../../types` | `~/types/calendar` |
| calendar components (shared/) | `../../constants` | `~/constants/calendar` |
| calendar composables/ | `../constants` | `~/constants/calendar` |
| calendar composables/ | `../types` | `~/types/calendar` |
| calendar stores/ | `../constants` | `~/constants/calendar` |
| calendar stores/ | `../types` | `~/types/calendar` |
| calendar utils/ | `../constants` | `~/constants/calendar` |
| calendar utils/ | `../types` | `~/types/calendar` |
| calendar constants/calendar.ts | `../types` | `~/types/calendar` |
| schedule components/ | `../constants` | `~/constants/schedule` |
| schedule components/ | `../types` | `~/types/schedule` |
| schedule stores/ | `../types` | `~/types/schedule` |
| filters components/ | `../constants` | `~/constants/filters` |
| core components (AuthorsDialog) | `../constants` | `~/constants` |
| core components (SidebarTodayEvents) | `../composables/useScheduleQuery` | `~/composables/useScheduleQuery` |
| core composables (useDialogManager) | `../constants/dialogs` | `~/constants/dialogs` |

---

## Phase 4 — nuxt.config.ts Rewrite

Remove:
- `extends` array
- `import { fileURLToPath } from "node:url"` (top)
- `alias` block
- Old `imports.dirs` with layer paths

Add/change:
- `css: ["~/assets/css/main.css"]`
- `imports.dirs`: `["~/types", "~/constants", "~/queries"]`
- `pinia.storesDirs`: `["~/stores"]` (or remove, Nuxt 4 auto-discovers app/stores)
- `components` config block (replacing layer configs):
  ```ts
  components: [
    { path: "~/components/ui", pathPrefix: false },
    { path: "~/components/calendar", prefix: "BigCalendar", pathPrefix: false },
    { path: "~/components/schedule", prefix: "Schedule", pathPrefix: false },
    { path: "~/components/filters", prefix: "Filters", pathPrefix: false },
    { path: "~/components/links", prefix: "Links", pathPrefix: false },
    { path: "~/components", pathPrefix: false, extensions: [".vue"] },
  ]
  ```
- `shadcn.componentDir`: `"./app/components/ui"` (relative to rootDir)

---

## Phase 5 — CSS + shadcn config

### main.css
Remove the three `@source` directives (Tailwind auto-scans `app/` now).

### components.json
```json
{
  "tailwind": { "css": "app/assets/css/main.css" },
  "aliases": {
    "components": "@/components",
    "composables": "@/composables",
    "utils": "@/utils",
    "ui": "@/components/ui",
    "lib": "@/lib"
  }
}
```

---

## Phase 6 — Cleanup

Delete:
- core/nuxt.config.ts
- layers/calendar/nuxt.config.ts
- layers/filters/nuxt.config.ts
- layers/links/nuxt.config.ts
- layers/schedule/nuxt.config.ts
- layers/site/nuxt.config.ts
- core/ (entire dir, should be empty)
- layers/ (entire dir, should be empty)

Update tsconfig.json include: remove `core/**/*` and `layers/**/*` entries.

---

## Phase 7 — Verify

1. `pnpm nuxt prepare` — types regenerate, no warnings
2. `npx vue-tsc --noEmit` — zero errors
3. Check Tailwind: `curl` generated CSS, verify `.flex` present (no @source needed)
4. `pnpm lint`
5. `pnpm build` — clean build
6. Manual smoke test (you run dev): calendar, dialogs, drawer, dark mode, schedule, links, layouts
