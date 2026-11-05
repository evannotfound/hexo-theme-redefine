---
description: Generate repository-grounded bilingual notes for a Redefine release
model: openai/gpt-6.1-sol
variant: high
---

Generate `release-notes.md` for the hexo-theme-redefine release tagged
`$ARGUMENTS`.

If `release-notes.md` already exists, ignore its contents completely. Do not
preserve, merge, or reuse text from it.

Before writing:

- Work autonomously. Use `gh`, Git commands, repository search, and file reads
  as needed.
- Use GitHub release metadata to find the latest non-draft release before the
  target tag. The target release may not exist yet.
- Inspect the commits and real diffs from the previous release to the target. If
  the target tag does not exist, treat the current checkout as the target.
- Inspect relevant PRs and issues that is resolved by the target release, keep them in context as you will need them in the generated summary.
- Read relevant theme source, `_config.yml`, configuration deprecations,
  language files, documentation, and pull request descriptions when needed to
  understand user-visible behavior and migration requirements.
- Use commit messages and pull request descriptions as context, but treat the
  inspected implementation as authoritative. Ground every retained claim in a
  real change.
- Treat documentation-only, test-only, CI-only, generated-artifact, and
  internal refactor changes as release-note material only when they produce a
  real user or operator outcome.

Output contract:

- Write only `release-notes.md`. Do not write, edit, or publish any other file.
- Start with `## 更新日志`, then an English `## Release Notes` block after a
  `---` separator.
- Use only these section pairs, in this order, and include a pair only when it
  has a notable entry:
  - `### 新增` / `### Features`
  - `### 修复` / `### Fixes`
  - `### 优化` / `### Improvements`
  - `### Breaking Changes` / `### Breaking Changes` (yeah you read it right, two versions should both be in english)
  - `### 更新方法` / `### How to update`
- Keep every section non-empty. Put all entries in `* ` Markdown bullets and
  leave a blank line between headings and bullets.
- Use one bullet for each distinct user-visible or operator-visible change.
  Combine commits that deliver one change and separate unrelated changes.
- Start each change bullet with a concise bold area or feature label followed by
  a direct user-facing result. Start the sentence with a capitalized Chinese
  phrase or a direct English verb such as `Add`, `Improve`, `Fix`, `Prevent`,
  `Support`, or `Keep`.
- Keep bullets concise and skimmable. Omit implementation details, raw commit
  prefixes, hashes, generated-by notices, contributor roll calls, and vague
  filler.
- For chinese related points, omit the period symbol `。` at the end of the bullet point
- If a certain bullet change is related to a specific issue or PR, include the issue number or PR number at the end of the bullet point. It should be in the format of `(Issue #<issue_number>)` or `(PR #<pr_number>)`. If it is contributed not by `evannotfound` or `evnluo`, include a mention at the end of the bullet point directly. e.g. `@username`
- Include npm/Git update commands, the Redefine update documentation link, CDN
  synchronization guidance, or configuration-migration instructions only when
  the inspected release makes them relevant. When included, put the guidance
  in the paired update-instruction sections.
- Do not add release-banner images, promotional sections such as `## 更多 🔥`,
  or unrelated advertising.
- Do not add an opening summary unless the release has a clear overall theme
  and the sentence does not repeat the bullets.

Example shape only; do not copy entries unless the inspected release contains
those changes:

```markdown
## 更新日志

### 新增

* **Callout 模块**：新增 `{% callout %}` 标签并保持旧标签兼容

### 修复

* **文章页移动端**：修复封面图与正文容器的圆角显示，保持小屏外观一致 (PR #666) @username
* **CDN 日志**：关闭 CDN 时不再输出可用性检查日志与状态更新 (Issue #123)

### 更新方法

执行

```
# pnpm
pnpm install hexo-theme-redefine@latest

# npm
npm install hexo-theme-redefine@latest
```

本版本无需迁移配置文件

---

## Release Notes

### Features

* **Callout module**: Add the `{% callout %}` tag while keeping legacy tags compatible.

### Fixes

* **Mobile article layout**: Fix rounded corners for post covers and containers on small screens.  (PR #666) @username
* **CDN logging**: Prevent CDN availability logs and status updates when CDN is disabled. (Issue #123)


### How to update

```
# pnpm
pnpm install hexo-theme-redefine@latest

# npm
npm install hexo-theme-redefine@latest
```

This version does not require configuration migration.
```
