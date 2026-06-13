# Migration Guide: shadcn-nuxt → UI Thing

This project is migrating from `shadcn-nuxt@2.1.0` to UI Thing. This document covers the
practical differences, per-component mapping, and known issues in this specific codebase.

---

## Core differences

### Component location and naming

```
shadcn-nuxt                          UI Thing
───────────────────────────────────────────────────────────────
app/components/ui/button/Button.vue  app/components/Ui/Button.vue
<Button>                             <UiButton>
<DialogContent>                      <UiDialogContent>
<SelectTrigger>                      <UiSelectTrigger>
```

The `Ui` prefix comes from Nuxt auto-importing everything under `app/components/Ui/`. You never
write import statements for Ui components.

### Styling system

```ts
// Old (shadcn-nuxt) — CVA + cn()
import { cva } from "class-variance-authority"
import { cn } from "~/utils"
const buttonVariants = cva("base-classes", {
  variants: { variant: { default: "..." } }
})
// used as: :class="cn(buttonVariants({ variant }), className)"

// New (UI Thing) — tailwind-variants
import { tv } from "tailwind-variants"
const button = tv({
  base: "base-classes",
  variants: { variant: { default: "..." } }
})
// used as: :class="button({ variant })"
```

Key consequence: **`buttonVariants` does not exist in UI Thing**. Any code that imported
`buttonVariants` from the old button (like `AuthorsDialog.vue`) needs reworking.

### No more `cn()` in Ui/ components

`app/utils/cn.ts` remains in the project for use in non-Ui components but is not used by
any scaffolded UI Thing components — they use `tv()` for all variant handling.

### No `shadcn-nuxt` module in nuxt.config

The `shadcn-nuxt` module and its `shadcn: { prefix, componentDir }` config key are removed
as part of the migration. UI Thing uses `ui-thing.config.ts` instead.

---

## Component mapping (old → new CLI command)

All of these exist as 1:1 equivalents in UI Thing — install via CLI:

| Old component(s) | CLI command |
|---|---|
| Button | `add button` |
| Dialog, DialogContent, DialogHeader, etc. | `add dialog` |
| Drawer, DrawerContent, etc. | `add drawer` |
| DropdownMenu, DropdownMenuItem, etc. | `add dropdown-menu` |
| Select, SelectTrigger, SelectContent, etc. | `add select` |
| Tabs, TabsList, TabsTrigger, TabsContent | `add tabs` |
| Accordion, AccordionItem, etc. | `add accordion` |
| Popover, PopoverContent, etc. | `add popover` |
| ScrollArea, ScrollBar | `add scroll-area` |
| Table, TableHeader, TableBody, etc. | `add table` |
| Badge | `add badge` |
| Alert, AlertTitle, AlertDescription | `add alert` |
| AlertDialog + sub-components | `add alert-dialog` |
| Calendar (the date-picker widget) | `add calendar` |
| Checkbox | `add checkbox` |
| Input | `add input` |
| Sonner / Toaster | `add sonner` |

For the always-current full list: `npx ui-thing@latest add` (interactive)

---

## Known issues in this codebase (fix before/during migration)

### 1. `buttonVariants` import in AuthorsDialog (migration blocker)
**File:** `app/components/AuthorsDialog.vue:3,43`

```vue
<!-- Old — uses buttonVariants to style a NuxtLink -->
import { buttonVariants } from "./ui/button"
:class="buttonVariants({ variant: 'ghost', size: 'icon' })"
```

Fix with UI Thing's `as-child` pattern (Reka UI polymorphism):
```vue
<UiButton variant="ghost" size="icon" as-child>
  <NuxtLink :to="author.linkedin" target="_blank">
    <AppIcon name="lucide:linkedin" />
  </NuxtLink>
</UiButton>
```

### 2. `cn()` calls in SidebarEvent
**File:** `app/components/SidebarEvent.vue:24,41`

```ts
// Old
:class="cn('h-5 w-0.5 rounded-full', EVENT_TYPE_COLORS[type as TEventType])"

// New — plain Vue :class array, no import needed
:class="['h-5 w-0.5 rounded-full', EVENT_TYPE_COLORS[type as TEventType]]"
```

### 3. Manual UI imports in DataTable
**File:** `app/components/links/DataTable.vue:17-38`

This file explicitly imports `Button`, `Checkbox`, `Input`, `DropdownMenu*`, `Table*`, `Badge`
from `~/components/ui/*`. After migration those paths no longer exist — the imports will break.

Fix: remove all the explicit import statements. After running `npx ui-thing@latest add` for
the equivalent components, Nuxt auto-imports them as `<UiButton>`, `<UiCheckbox>`, etc.
Also update every template usage from `<Button>` → `<UiButton>`, etc.

The `valueUpdater` helper from `app/components/ui/table/utils.ts` is shadcn-specific.
UI Thing's `datatable`/`tanstack-table` component includes its own equivalent — read the
scaffolded source to find it after running `npx ui-thing@latest add tanstack-table`.

### 4. `hsl(var(--border))` in AddDialog styles
**File:** `app/components/schedule/AddDialog.vue`

```css
/* Old — wrapping in hsl() is wrong for Tailwind v4 OKLCH tokens */
scrollbar-color: hsl(var(--border)) transparent;

/* New — use the token directly */
scrollbar-color: var(--color-border) transparent;
```

---

## Migration order (recommended)

1. Run `npx ui-thing@latest init` — sets up the config; does not touch existing Ui files yet
2. Fix `AuthorsDialog.vue` (buttonVariants blocker) independently
3. Scaffold each component group via `npx ui-thing@latest add <names>`
4. For each component group: update templates (`<Button>` → `<UiButton>`), remove old files
5. Remove `shadcn-nuxt` from `package.json` and `modules` array in `nuxt.config.ts`
6. Run `pnpm nuxt prepare` + `vue-tsc` + `pnpm build` after each group to catch regressions
7. Fix DataTable explicit imports last (it's the most complex)

Do one component group at a time, not all at once. The build + typecheck gate after each group
makes regressions easy to attribute.
