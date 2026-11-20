## Context

The footer uses a radial gradient pseudo-element that fades to transparency, while the footer element itself has no background. During normal rendering the page background fills that transparent area; during native bottom overscroll, the same transparency makes the footer appear to extend or break visually.

## Goals / Non-Goals

**Goals:**

- Make the footer's bottom edge visually opaque during native overscroll.
- Keep the existing gradient transition and light/dark theme behavior.
- Keep the change scoped to source CSS.

**Non-Goals:**

- Disable native overscroll.
- Change footer spacing, height calculations, markup, or configuration.

## Decisions

Set `.footer` to `background: var(--rd-background-200)`, the same theme-aware token used as the gradient's opaque color stop. This creates a solid footer surface beneath the existing pseudo-element without altering the gradient itself.

Using `overscroll-behavior` was rejected because it changes scrolling mechanics and is not a reliable visual fix across mobile browsers. Changing the pseudo-element's gradient endpoints was rejected because it would alter the intended fade rather than establish a stable footer surface.

## Risks / Trade-offs

- **[Risk]** The footer may look slightly more solid than before at its lower edge. → **Mitigation:** use the existing gradient base token so the surface matches the established palette.
