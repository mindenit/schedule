# Dependency Update Plan

## Decisions
- Hold: `typescript@6`, `eslint@10` (too new, decide later)
- Hold: `shadcn-nuxt` (replaced by UI Thing later)
- No self-commits — developer commits manually
- All versions normalized to `^`

## Gate (run after every wave)
1. `pnpm install`
2. `pnpm postinstall` (nuxt prepare)
3. `npx vue-tsc --noEmit`
4. `pnpm build`
Stop and report if any gate step fails.

## Held packages (not updated)
| Package | Current | Latest | Reason |
|---|---|---|---|
| typescript | 5.8.3 | 6.0.3 | Brand-new major, Nuxt toolchain not validated |
| eslint | 9.28.0 | 10.5.0 | Too new, flat-config + Nuxt chain breakage risk |
| shadcn-nuxt | 2.1.0 | 2.7.4 | Replaced by UI Thing soon |

## Already latest (no action)
@pinia/nuxt, class-variance-authority, clsx, nuxt, pinia,
vaul-vue, vue, vue-router, @tanstack/vue-table

---

## Wave 1 — Safe minors/patches (batch)
**Status:** [ ]

| Package | Current | Target |
|---|---|---|
| @internationalized/date | 3.8.2 | ^3.12.2 |
| @nuxt/eslint | 1.3.0 | ^1.16.0 |
| @tailwindcss/vite | 4.3.0 | ^4.3.1 |
| @tanstack/vue-query | 5.80.6 | ^5.101.0 |
| date-fns | 4.1.0 | ^4.4.0 |
| nurekit | 0.6.7 | ^0.6.9 |
| tailwind-merge | 3.3.0 | ^3.6.0 |
| tailwindcss | 4.1.8 | ^4.3.1 |
| tw-animate-css | 1.3.4 | ^1.4.0 |
| vue-sonner | 2.0.2 | ^2.0.9 |
| eslint-config-prettier | 10.1.5 | ^10.1.8 |
| eslint-plugin-prettier | 5.4.1 | ^5.5.6 |
| prettier | 3.5.3 | ^3.8.4 |
| prettier-plugin-merge | 0.7.4 | ^0.10.1 |

Gate: typecheck + build.

---

## Wave 2 — reka-ui (UI primitive foundation)
**Status:** [ ]

| Package | Current | Target |
|---|---|---|
| reka-ui | 2.3.1 | ^2.9.10 |

Manual smoke: dialogs, drawer, select, popover, calendar, dropdown, accordion, tabs, checkbox.

---

## Wave 3 — Nuxt module majors (one at a time)
**Status:** [ ]

### 3a — @nuxt/icon 1 → 2
| Package | Current | Target |
|---|---|---|
| @nuxt/icon | 1.12.0 | ^2.2.3 |

Manual smoke: AppIcon renders, all `lucide:` icon names work in app.

### 3b — @nuxt/image 1 → 2
| Package | Current | Target |
|---|---|---|
| @nuxt/image | 1.10.0 | ^2.0.0 |

Manual smoke: AppDialog images, AppIcon NuxtImg usage.

### 3c — @nuxtjs/color-mode 3 → 4
| Package | Current | Target |
|---|---|---|
| @nuxtjs/color-mode | 3.5.2 | ^4.0.1 |

Manual smoke: dark/light toggle works, preference persists on reload.

---

## Wave 4 — @nuxtjs/seo 3 → 5 (highest risk)
**Status:** [ ]

| Package | Current | Target |
|---|---|---|
| @nuxtjs/seo | 3.1.0 | ^5.3.0 |

Manual smoke:
- OG image renders at `/__og-image__/image/og.png`
- `/sitemap.xml` returns valid XML
- `/robots.txt` includes sitemap, disallows /faggots
- `<meta>` og/twitter tags present in page source
- faggots + maintenance pages excluded from sitemap

---

## Wave 5 — @vueuse 13 → 14 (core + nuxt together)
**Status:** [ ]

| Package | Current | Target |
|---|---|---|
| @vueuse/core | 13.3.0 | ^14.3.0 |
| @vueuse/nuxt | 13.1.0 | ^14.3.0 |

APIs in use: `reactiveOmit`, `StorageSerializers`, `useInfiniteScroll`,
`useLocalStorage`, `useRafFn`, `useStorage`, `useWindowSize`

Manual smoke: localStorage persistence (schedule/calendar/filters/links/settings),
infinite scroll in schedule AddDialog.

---

## Wave 6 — motion-v 1 → 2
**Status:** [ ]

| Package | Current | Target |
|---|---|---|
| motion-v | 1.6.1 | ^2.3.0 |

APIs in use: `motion`, `AnimatePresence` in DayView + MonthView.

Manual smoke: swipe animation when navigating calendar day/month views
left and right.

---

## Wave 7 — lucide-vue-next 0 → @lucide/vue 1
**Status:** [x]

| Package | Current | Target | Note |
|---|---|---|---|
| lucide-vue-next | 0.507.0 | removed | deprecated, renamed |
| @lucide/vue | — | ^1.18.0 | canonical replacement |

`lucide-vue-next@1.0.0` is deprecated with message "use @lucide/vue instead".
Migrated to `@lucide/vue@1.18.0`. All imports rewritten (13 files).
API identical — same named exports (ChevronDown, Check, X, Circle, etc.).

---

## Wave 8 — Prettier formatting plugins
**Status:** [ ]

| Package | Current | Target |
|---|---|---|
| prettier-plugin-classnames | 0.7.8 | ^0.10.2 |
| prettier-plugin-tailwindcss | 0.6.12 | ^0.8.0 |

Run `pnpm format` and review diff for unwanted reformatting.
No gate needed — formatting only.

---

## Final check
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] Report held packages for later decision
