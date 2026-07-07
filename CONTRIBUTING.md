# Contributing

## Requirements

- Node 22+ (enforced via `.node-version`)
- pnpm 11+ (`corepack enable` or install from https://pnpm.io)

## Setup

```bash
pnpm install   # installs deps + git hooks + generates .nuxt/
pnpm dev       # dev server at http://localhost:3000
```

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint (exit 0 on no errors) |
| `pnpm lint:fix` | ESLint auto-fix |
| `pnpm format` | Prettier + ESLint fix |
| `pnpm prettier` | Prettier check (no write) |
| `pnpm deps:check` | Show outdated packages (taze) |
| `pnpm deps:upgrade` | Upgrade to latest + install |

## Branches

- `main` — production
- `dev` — integration branch, PRs target this
- Feature branches: `feat/<name>`, `fix/<name>`, `chore/<name>`

## Commits

This repo follows [Conventional Commits](https://www.conventionalcommits.org/). Enforced via `commitlint` on the `commit-msg` hook.

```
feat(calendar): add year view navigation
fix(filters): clear button resets all active filters
chore: update dependencies
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

To bypass hooks in emergencies: `git commit --no-verify` (document why in the commit body).

## Code style

- **Formatting**: Prettier (tabs, no semis, double quotes). Runs automatically on staged files via pre-commit hook.
- **Linting**: ESLint with `@nuxt/eslint`. No errors, no warnings before merging.
- **Tailwind**: utility classes via `cn()` (outside `Ui/`) or `tv()` (inside `Ui/`). No inline styles.

## Component system

UI Thing components live in `app/components/Ui/` — **never edit these manually**. Re-scaffold via:

```bash
npx ui-thing@latest add <name>
```

For dev tooling and AI assistance conventions, see [`AGENTS.md`](./AGENTS.md).

## Pull requests

- One logical change per PR
- Keep diffs small and reviewable
- `pnpm lint` and `pnpm build` must pass
- Attach screenshots for any UI change
