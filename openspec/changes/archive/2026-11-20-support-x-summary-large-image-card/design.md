## Context

The theme renders Open Graph metadata through Hexo's `open_graph` helper in
`layout/components/head.ejs`. The helper supports both `twitter:card` and
`twitter:image`; the theme already passes the configured Open Graph image as
the Twitter image, but selects the `summary` card type.

## Goals / Non-Goals

**Goals:**

- Select X's `summary_large_image` card type for pages where Open Graph metadata
  is enabled.
- Preserve the existing image selection and ensure the X image remains the
  same image as `og:image`.
- Verify the generated HTML and document the behavior.

**Non-Goals:**

- Add a new X-specific configuration option.
- Change Open Graph image fallback or page front matter behavior.
- Add X account metadata such as `twitter:site` or `twitter:creator`.

## Decisions

- Change the existing `twitter_card` option value from `summary` to
  `summary_large_image` rather than adding a separate metadata block. This
  keeps all metadata generation in the existing Hexo helper and avoids
  duplicate or conflicting tags.
- Keep passing `ogImage` through `twitter_image`. This explicitly preserves
  the same configured or page-specific image for both protocols; removing it
  would rely on the helper's content-image fallback and could diverge from the
  theme's configured default.
- Assert the rendered metadata in the canonical generated-site test. This
  verifies the public HTML contract rather than only checking the template
  source.

## Risks / Trade-offs

- [Risk] X may cache an existing card preview after deployment. → Mitigation:
  the generated HTML will contain the correct metadata; refreshed previews are
  controlled by X's crawler.
