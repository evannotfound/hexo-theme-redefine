## ADDED Requirements

### Requirement: Footer has an opaque theme-aware bottom surface

The footer SHALL provide an opaque background using the theme's `--rd-background-200` token, while preserving the existing gradient decoration and native overscroll behavior.

#### Scenario: Footer reaches the bottom of a page
- **WHEN** the user scrolls to the bottom of a page and native overscroll reveals the area below the document
- **THEN** the visible footer boundary remains continuous with the footer's theme-aware background instead of exposing a transparent gradient edge

#### Scenario: Theme changes
- **WHEN** the site switches between light and dark themes
- **THEN** the footer's opaque surface uses the corresponding `--rd-background-200` value
