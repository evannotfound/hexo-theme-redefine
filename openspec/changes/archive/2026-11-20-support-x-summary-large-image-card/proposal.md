## Why

Posts currently declare X/Twitter cards as `summary`, so X renders the small
thumbnail layout even though the theme already provides an Open Graph image.
Using the large-image card will make shared posts more prominent without
requiring new configuration.

## What Changes

- Emit `summary_large_image` for X/Twitter cards.
- Reuse the configured Open Graph image for `twitter:image`.
- Add generated-site coverage for the card type and shared image URL.
- Document the X card behavior alongside the existing Open Graph setting in
  both supported documentation locales.

## Capabilities

### New Capabilities

- `x-summary-large-image-card`: Posts use a large-image X card with the same
  image selected for Open Graph metadata.

### Modified Capabilities

## Impact

- Updates the theme head metadata template and its generated-site test.
- Updates the English and Chinese global configuration documentation.
- No new dependencies, configuration keys, or public API changes.
