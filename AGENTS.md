# AGENTS.md

This pnpm monorepo contains the published Hexo theme, a private Hexo demo, and
a private Next.js documentation site. Work from the repository root unless a
package-specific command says otherwise.

## Scope and ownership

- Root theme: `_config.yml`, `languages/`, `layout/`, `scripts/`, and `source/`.
- Demo fixtures and site configuration: `dev/site/`. Never edit the generated
  link at `dev/site/themes/redefine/`.
- Theme defaults belong in the root `_config.yml`. Keep
  `dev/site/_config.redefine.yml` limited to intentional demo-only overrides;
  do not copy unchanged defaults into it.
- Documentation content: `docs/content/docs/{zh,en}/`; documentation app code:
  `docs/src/`. Follow `docs/AGENTS.md` for all `docs/**` work.
- Keep changes in the owning package. For cross-package behavior, run each
  affected package's checks.
- Use pnpm `11.20.0` and Node.js 24.x. Change dependencies in the owning
  `package.json`; let pnpm update the root `pnpm-lock.yaml`.

## Worktree workflow

- For isolated work, use a detached worktree instead of creating a task branch.
  After finishing and verifying the edits, merge the worktree commit directly
  into the main development branch (`dev`), return to the repository worktree,
  and remove the temporary worktree.

## Documentation is part of the change

- When adding a configuration option, adding a user-visible feature, or
  changing/removing existing behavior, update the relevant documentation in
  the same change whenever users or contributors need to know about it. Do not
  leave documentation as an assumed follow-up.
- User docs are bilingual under `docs/content/docs/{zh,en}/`. Keep the two
  locales aligned and treat `zh` as canonical unless the task explicitly limits
  locale scope. Update the matching `meta.json` when adding or moving pages.
- Update developer docs when commands, package boundaries, build output, or
  contributor workflows change. Update this file and nested `AGENTS.md` files
  when agent guidance changes.

## Commands and verification

- Install: `pnpm install --frozen-lockfile`.
- Theme source or configuration: `pnpm build` creates all production assets.
- Theme tests: `pnpm test` uses Node's built-in test runner, builds CSS, tests
  Hexo helpers, and generates the canonical demo site with default and optional
  feature configurations.
- Theme validation: `pnpm check` runs the tests and production build.
- Generated theme and demo output: `pnpm clean` removes all generated theme
  assets and demo state.
- Interactive theme preview: `pnpm dev` serves Hexo at
  `http://127.0.0.1:4000`, resets and links the demo site, and watches CSS and
  an unminified development JavaScript bundle. Refresh the browser manually
  after JavaScript changes.
- One-off demo generation: run `pnpm clean`, `pnpm build`,
  `node dev/link-theme.mjs`, then `pnpm --dir dev/site exec hexo generate`.
- Demo-only change: use the one-off generation above or `pnpm dev`.
- Docs code or MDX: run `pnpm --dir docs check`. The docs package has no test
  runner or single-test command.

## Theme implementation

- Browser JavaScript under `source/js/**` uses ES modules. Hexo integration
  under `scripts/**` uses CommonJS, starts with `"use strict";`, and registers
  through `hexo.extend.*` APIs.
- Keep required Hexo entries at the `layout/` root, reusable rendered partials
  in `layout/components/`, and route-owned markup in `layout/pages/`. Retain
  subdirectories only for cohesive multi-file families such as comments, home,
  and post. Custom page layouts are selected only by documented `template`
  front matter and dispatched explicitly in `layout/pages/router.ejs`.
- Core CSS and Tailwind input is `styles/theme.css`. Keep global and rendered
  content rules in `styles/base/`, focused theme rules in `styles/components/`,
  and optional third-party assets in `styles/plugins/`. Import core files
  explicitly; plugin files are copied as named assets and loaded conditionally.
- The theme no longer uses Stylus or a consumer stylesheet renderer. Do not add
  `.styl` inputs or configuration-time CSS compilation.
- Use Tailwind's default spacing and border-radius scales for theme-owned
  layout. Do not introduce parallel fixed scales or override the `--radius-*`
  namespace.
- Add theme defaults to `_config.yml`. If browser code needs a value, also
  export it through `scripts/config-export.js` and consume it with a default.
- Add user-facing theme strings to the relevant files under `languages/`.

## Generated files

Do not edit generated output directly:

- Theme builds: `source/css/build/theme.css`,
  `source/css/build/plugins/`, and `source/js/build/`.
- Demo state: `dev/site/_multiconfig.yml`, `dev/site/db.json`,
  `dev/site/public/`, and `dev/site/themes/`.
- Docs output: `docs/.source/`, `docs/.next/`, `docs/out/`,
  `docs/next-env.d.ts`.
- Release-note preview: `release-notes.md`.

Build outputs may be generated for verification, but ordinary PRs must not
commit `source/css/build/` or `source/js/build/`; CI rejects them.

## Release and contribution

- Pull requests target `dev`. Commit messages use `[section]: [brief info]`,
  for example `footer: optimize style`.
- Preview release notes with
  `RELEASE_LLM_URL=... RELEASE_LLM_KEY=... pnpm release:notes -- v2.10.0`, then
  run `pnpm release:notes:check`. This does not publish a release.
- Release tags are `vX.Y.Z` and must match `package.json`; pushing one runs the
  release workflow. Version bumps and tag creation are manual.
