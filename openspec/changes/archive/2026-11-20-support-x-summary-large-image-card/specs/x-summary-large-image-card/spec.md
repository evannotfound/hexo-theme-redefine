## ADDED Requirements

### Requirement: Pages expose a large-image X card

When Open Graph metadata is enabled, the theme SHALL emit
`twitter:card` with the value `summary_large_image`.

#### Scenario: Open Graph is enabled

- **WHEN** a generated page uses the default enabled Open Graph configuration
- **THEN** its head contains `<meta name="twitter:card" content="summary_large_image">`

#### Scenario: Open Graph is disabled

- **WHEN** a generated page disables Open Graph metadata
- **THEN** the theme does not emit the X card metadata block

### Requirement: X reuses the Open Graph image

When Open Graph metadata is enabled, the theme SHALL emit `twitter:image`
using the same selected image URL as `og:image`.

#### Scenario: Configured default image

- **WHEN** a page has no page-specific Open Graph image and the theme has a
  configured default image
- **THEN** `twitter:image` and `og:image` contain the same absolute image URL

#### Scenario: Page-specific image

- **WHEN** a page provides a page-specific Open Graph image
- **THEN** `twitter:image` and `og:image` contain that same absolute image URL
