# Contributing

1. Install Node 24 and run `npm ci`.
2. Edit the canonical SVG under `icons/filled` and/or `icons/duotone`. Use the existing 24 × 24 viewBox, `currentColor`, and 0.22 default secondary opacity. Do not add scripts, external references, embedded images, or background-colored cutouts.
3. Keep names and categories aligned between both styles. Update metadata, category counts, and SHA-256 checksums only after the artwork has been reviewed.
4. Run `npm run check`. Preview with `npm run dev` and inspect both styles on light/dark backgrounds at 16, 24, and 48 pixels.
5. Include before/after images and explain any breaking name or geometry changes in the pull request.

Generated `dist/` and website `public/` content are ignored. Change source files and rebuild instead.

Keep upstream Lucide/Feather attribution and include appropriate attribution for new contributions. Do not represent this project as an official Lucide release.
