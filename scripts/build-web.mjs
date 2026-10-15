import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
const metadata = JSON.parse(await readFile('metadata/icons.json', 'utf8'));
await mkdir('apps/web/public', { recursive: true });
await cp('icons', 'apps/web/public/icons', { recursive: true });
await cp('LICENSE', 'apps/web/public/LICENSE.txt');
await cp('apps/web/favicon.svg', 'apps/web/public/favicon.svg');
await writeFile('apps/web/public/catalog.json', JSON.stringify(metadata.map(({ sha256, ...icon }) => icon)));
await cp('metadata/categories.json', 'apps/web/public/categories.json');
console.log('Gallery assets prepared.');
