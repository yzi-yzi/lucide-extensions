# Release process

1. Update the version in `package.json` and run `npm install --package-lock-only`.
2. Run `npm ci && npm run check` on the reviewed commit.
3. Run `npm pack`. Install that tarball in a clean consumer and check React, SVG, and type exports.
4. Archive `icons/`, `metadata/`, `LICENSE`, and `NOTICE.md` as `lucide-extensions-svg-VERSION.zip`.
5. Create a Git tag and GitHub Release and attach the package tarball and SVG archive.
6. Update the gallery installation URL and README for the new release version.
7. Deploy the same reviewed commit through the connected Vercel project and verify category navigation, search, both styles, SVG downloads, and mobile layout.

npm registry publication is a separate optional distribution channel; the initial release uses GitHub-hosted npm-compatible tarballs.
