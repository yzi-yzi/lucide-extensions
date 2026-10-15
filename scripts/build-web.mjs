import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
const metadata = JSON.parse(await readFile('metadata/icons.json', 'utf8'));
await mkdir('apps/web/public', { recursive: true });
await cp('icons', 'apps/web/public/icons', { recursive: true });
await cp('LICENSE', 'apps/web/public/LICENSE.txt');
await cp('apps/web/favicon.svg', 'apps/web/public/favicon.svg');
await cp('apps/web/social', 'apps/web/public/social', { recursive: true });
await cp('apps/web/robots.txt', 'apps/web/public/robots.txt');
await cp('apps/web/sitemap.xml', 'apps/web/public/sitemap.xml');
await cp('apps/web/OCTICONS-LICENSE.md', 'apps/web/public/OCTICONS-LICENSE.txt');
const fontLicenses = await Promise.all(['geist', 'geist-mono'].map(font => readFile(`node_modules/@fontsource-variable/${font}/LICENSE`, 'utf8')));
await writeFile('apps/web/public/FONT-LICENSES.txt', fontLicenses.join('\n\n'));
await writeFile('apps/web/public/catalog.json', JSON.stringify(metadata.map(({ sha256, ...icon }) => icon)));
await cp('metadata/categories.json', 'apps/web/public/categories.json');
const categories = JSON.parse(await readFile('metadata/categories.json', 'utf8'));
// Category and search batches avoid one HTTP request per visible gallery icon.
const sorted = [...metadata].sort((a, b) => a.name.localeCompare(b.name, 'en'));
await mkdir('apps/web/public/previews', { recursive: true });
for (const style of ['filled', 'duotone']) {
  const sources = new Map(await Promise.all(sorted.map(async icon => {
    const svg = await readFile(`icons/${style}/${icon.name}.svg`, 'utf8');
    return [icon.name, svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'))];
  })));
  for (const category of categories) {
    const entries = sorted.filter(icon => icon.categories.includes(category.id)).map(icon => [icon.name, sources.get(icon.name)]);
    await writeFile(`apps/web/public/previews/${style}-category-${category.id}.json`, JSON.stringify(Object.fromEntries(entries)));
  }
  for (let index = 0; index < sorted.length; index += 64) {
    const entries = sorted.slice(index, index + 64).map(icon => [icon.name, sources.get(icon.name)]);
    await writeFile(`apps/web/public/previews/${style}-${index / 64}.json`, JSON.stringify(Object.fromEntries(entries)));
  }
}
console.log('Gallery assets, fonts notices, and category/search preview batches prepared.');
