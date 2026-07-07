# Mindenit Schedule

Web application for viewing university schedules at NURE.

## Requirements

- Node.js 22+
- pnpm 11+ (version is pinned in `packageManager` field)

## Setup

```bash
pnpm install
pnpm dev        # dev server on http://localhost:3000
```

## Commands

```bash
pnpm dev            # development server
pnpm build          # production build → .output/
pnpm generate       # static generation
pnpm preview        # preview production build

pnpm lint           # ESLint
pnpm lint:fix       # ESLint with auto-fix
pnpm format         # Prettier + ESLint fix

pnpm deps:check     # interactive report of available updates (taze)
pnpm deps:upgrade   # write major updates + reinstall
```

## UI components

UI Thing component library lives in `app/components/Ui/`. Add new components via:

```bash
npx ui-thing@latest add <component-name>
```

Never edit files inside `app/components/Ui/` directly — they are ESLint-ignored and scaffolded by the CLI.

## Environment

Copy `.env.example` to `.env` for local overrides. Required variables are documented inside the example file.

## Supply-chain security

Dependency updates are constrained by a 7-day minimum release age (see `pnpm-workspace.yaml`). Newly published package versions are not installed until they have been live for at least 7 days, which covers the detection window for most compromised packages.

Postinstall scripts for transitive dependencies are blocked by default (`onlyBuiltDependencies: []`). Only add a package to that list after reviewing what its build script does.

Automated dependency PRs are managed by Renovate (see `renovate.json`). Patch updates auto-merge via branch. Minor/major updates are grouped and opened weekly.
