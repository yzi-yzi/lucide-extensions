# Gallery UI

React + TypeScript, Vite, Tailwind CSS v4, and shadcn/ui (New York, Radix primitives, neutral base).

## Conventions

- Compose the source-owned components in `src/components/ui`. Buttons, dialogs, sheets, tabs, inputs, sliders, switches, labels, badges, separators, scroll areas, tooltips, and skeletons come from the official shadcn registry.
- Use semantic Tailwind tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `ring-ring`) rather than hardcoded colors. The light/dark OKLCH palette and radius scale live in `src/index.css`. Lucide’s coral `#f56565` is the primary color, with white text on filled buttons. Geist Sans and Geist Mono are self-hosted variable fonts with `font-display: swap`; their OFL notices are included in `FONT-LICENSES.txt`.
- Preserve shadcn defaults for component spacing, focus rings, disabled states, and interaction behavior. Use `cn` for class composition and existing component variants for visual hierarchy.
- Radix handles modal guide/customizer focus trapping, Escape dismissal, keyboard navigation, and ARIA behavior. Icon details use a non-modal bottom Sheet without an overlay or scroll lock; outside interactions keep it open so the catalog, search, and customizer remain usable. Keyboard selection moves focus to the detail title; closing restores focus to the selected tile when available. Keep labels and descriptions on form controls and dialogs. The single-thumb slider explicitly forwards its accessible label to its thumb.
- `LibraryIcon` uses this repository's Filled/Duotone SVGs for interface controls, including the theme switcher and dialog close buttons. It follows the selected style while inheriting the UI foreground color.
- Sonner provides live feedback for copying and downloading. The gallery mounts only chunks near the viewport and reserves exact row heights for offscreen chunks. Focused chunks stay mounted for keyboard users. Category navigation waits for measured layout before scrolling. Preview paths load in cached category batches (or 64-icon batches for search/all); CSS controls secondary opacity without new network requests. All paths come unchanged from canonical SVGs. Visible tiles use shadcn tooltips for hover and keyboard focus. The full 3,780 SVG collection is not bundled into JavaScript.
- UI dependencies remain development dependencies of the root package, so consumers of the published icon library do not install the website's component stack.

`components.json` records the shadcn configuration. Components were imported from `https://ui.shadcn.com/r/styles/new-york-v4/{name}.json`, with local `cn` imports and library close icons substituted. See [SHADCN-LICENSE.md](SHADCN-LICENSE.md).

## Development

Run from the repository root:

```sh
npm run dev
npm run typecheck:web
npm run build:web
npm run build:pages
```

Vercel deploys `main` with `build:web`. GitHub Pages uses the `/lucide-extensions/` base path. The same catalog, categories, and SVG assets support both.

## References

- [shadcn Vite setup](https://ui.shadcn.com/docs/installation/vite)
- [shadcn theming](https://ui.shadcn.com/docs/theming)
- [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite)
