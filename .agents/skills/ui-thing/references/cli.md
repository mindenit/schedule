# UI Thing CLI Reference

Full reference for `npx ui-thing@latest` commands.

---

## `init`

Initializes UI Thing in a Nuxt project. Run once per project.

```bash
npx ui-thing@latest init
npx ui-thing@latest init --yes          # skip all prompts, use defaults
npx ui-thing@latest init --force        # overwrite existing config
npx ui-thing@latest init -n 4           # specify Nuxt major version
```

**What it does:**
- Installs required dependencies (`reka-ui`, `tailwind-variants`, `@vueuse/core`, etc.)
- Creates `ui-thing.config.ts` with paths for components, composables, plugins, utils
- Updates `nuxt.config.ts` with necessary module config
- Adds/updates your Tailwind CSS file with the base theme

**Interactive prompts:**
```
✔ Which theme do you want to start with?          › Violet
✔ Where is your tailwind.css file located?        › app/assets/css/tailwind.css
✔ Where should your components be stored?         › app/components/Ui
✔ Where should your composables be stored?        › app/composables
✔ Where should your plugins be stored?            › app/plugins
✔ Where should your utils be stored?              › app/utils
✔ Should we replace component files if they exist? › yes
✔ Use default filename when adding components?     › yes
✔ Which package manager do you use?               › pnpm
```

---

## `add`

Scaffolds one or more components into the project.

```bash
npx ui-thing@latest add                          # interactive multi-select
npx ui-thing@latest add button                   # single component
npx ui-thing@latest add button dialog select     # multiple at once
```

**What it does per component:**
- Copies the component source into `app/components/Ui/`
- Copies any required composables, utils, and plugins
- Installs missing npm dependencies
- Updates `nuxt.config.ts` if needed

**Component names** are lowercase-with-hyphens. Examples:
```bash
# Layout & containers
npx ui-thing@latest add card container sidebar sheet drawer

# Form inputs
npx ui-thing@latest add button input textarea select checkbox switch
npx ui-thing@latest add radio-group number-field pin-input tags-input
npx ui-thing@latest add datepicker date-field color-picker autocomplete

# Overlays
npx ui-thing@latest add dialog alert-dialog popover tooltip hover-card
npx ui-thing@latest add dropdown-menu context-menu menubar

# Data display
npx ui-thing@latest add table datatable tanstack-table badge avatar
npx ui-thing@latest add accordion tabs collapsible list timeline

# Navigation
npx ui-thing@latest add breadcrumbs navigation-menu nav navbar
npx ui-thing@latest add pagination scrollspy

# Feedback
npx ui-thing@latest add sonner progress loader skeleton alert
npx ui-thing@latest add circular-progress stepper

# Misc
npx ui-thing@latest add calendar carousel slider rating command
npx ui-thing@latest add toggle toggle-group separator divider heading
```

The interactive selector (`npx ui-thing@latest add` with no args) always shows the current
full list — use it when unsure of a component's exact name.

---

## `theme`

Adds a pre-made shadcn/ui theme to the project.

```bash
npx ui-thing@latest theme
```

⚠️ **This overwrites your `tailwind.css` file.** Any manual theme customizations (custom tokens,
event-type colors, etc.) will be lost. In this project, back up `app/assets/css/tailwind.css`
first and manually merge afterward.

Available themes (from https://ui.shadcn.com/themes):
Zinc, Slate, Stone, Gray, Neutral, Red, Rose, Orange, Green, Blue, Yellow, Violet

---

## `shortcuts`

Adds the `defineShortcuts` composable to `app/composables/shortcuts.ts`.

```bash
npx ui-thing@latest shortcuts
```

After running, `defineShortcuts` and `useKbd` are available globally via Nuxt auto-import.

---

## `prettier`

Adds an opinionated prettier config to the project root.

```bash
npx ui-thing@latest prettier
```

Creates `.prettierrc`:
```json
{
  "plugins": ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
  "tailwindFunctions": ["tv"],
  "vueIndentScriptAndStyle": true,
  "printWidth": 100,
  "singleQuote": false,
  "semi": true
}
```

Note: this project already has a custom `.prettierrc` — don't run this without reviewing
the diff. The important thing to borrow: `"tailwindFunctions": ["tv"]` should be in the
existing config so Tailwind classes inside `tv()` calls get sorted correctly.
