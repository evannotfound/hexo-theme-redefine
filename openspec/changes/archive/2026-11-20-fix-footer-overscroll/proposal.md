## Why

The gradient footer becomes visually unfinished when native browser overscroll exposes the page background below its transparent lower edge. The footer should keep native overscroll while presenting a clean, continuous bottom boundary in light and dark themes.

## What Changes

- Give the footer an opaque, theme-aware background matching the gradient's base color.
- Preserve the existing gradient, layout, height calculation, and native overscroll behavior.

## Capabilities

### New Capabilities
- `footer-background`: Define the footer's opaque visual boundary during overscroll.

### Modified Capabilities
- None.

## Impact

- Affects `styles/components/footer.css` only.
- No configuration, API, dependency, or generated-file changes.
