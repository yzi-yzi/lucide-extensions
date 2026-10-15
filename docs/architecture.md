# One catalog, one repository, one website

Decision date: 2026-10-15.

## Research

| Library | Observed organization | Useful pattern |
| --- | --- | --- |
| [Lucide](https://github.com/lucide-icons/lucide) | Shared `icons`, `categories`, `packages`, `docs`, and `scripts` in one monorepo; framework adapters generated from common source | Keep names, geometry, metadata, adapters, and documentation synchronized |
| [Heroicons](https://github.com/tailwindlabs/heroicons) | `src`, `optimized`, `react`, `vue`, and build scripts in one repository; style/size-specific import entry points | Separate imports by style while sharing one release and project |
| [Phosphor Core](https://github.com/phosphor-icons/core) | A core repository containing raw SVGs, assets grouped by weight, and catalog metadata consumed by framework ports and search | Use one canonical catalog and clear style directories |

## Decision

Use one monorepo with a single distributable package and style-specific entry points. Both approved sets share icon names, categories, tags, sizing, provenance, and the same website. Splitting Filled and Duotone into separate repositories would duplicate release automation, bug fixes, documentation, and metadata and make parity harder to maintain.

The initial npm-compatible package contains raw SVGs, per-icon JavaScript SVG strings, and React adapters. Explicit exports (`react/filled`, `react/duotone`, individual icon modules) allow bundlers to eliminate unused icons. React is an optional peer, so raw SVG users do not need it. TypeScript declarations and CommonJS accompany ESM.

The package is distributed as a built GitHub Release tarball. It does not claim to be published on the npm registry. A future npm publication can use the same package without changing its API.

The website lives under `apps/web` and builds from these exact SVGs and metadata. It uses a static Vite app, with no backend required for browsing, search, customizations, copying, or downloads. Icon masks retain the source alpha and current color; category sections load masks near the viewport. This avoids embedding the full SVG catalog in the initial JavaScript bundle.

## Release integrity

`metadata/icons.json` records the SHA-256 of every approved vector. The validation suite checks hashes, category counts, all generated component geometry, accessibility options, CommonJS/ESM exports, and the size of a tree-shaken single-icon bundle. Changing approved artwork requires updating the corresponding hash deliberately after review.

## Future growth

Vue, Svelte, or other adapters can join `packages/` and expose new entry points. If adapters eventually need independent release cadences, the same monorepo can introduce separate publishable workspace packages without moving the source catalog. A second website or style-specific repository is unnecessary.
