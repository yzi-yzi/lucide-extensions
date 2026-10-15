# Framework-neutral entry points

The canonical source is `../../icons/{filled,duotone}`. `scripts/build.mjs` emits one SVG string module per icon in `dist/core`, in ESM and CommonJS with TypeScript declarations. Keeping each icon separate avoids loading the full catalog for one icon. The package also exports raw SVG files and metadata.
