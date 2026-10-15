import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { DOMParser } from '@xmldom/xmldom';
const icons = JSON.parse(await readFile('metadata/icons.json', 'utf8'));
export const componentName = name => name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
const toNode = element => [element.tagName, Object.fromEntries(Array.from(element.attributes).map(a => [a.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), a.value])), Array.from(element.childNodes).filter(n => n.nodeType === 1).map(toNode)];
await rm('dist', { recursive: true, force: true });
await mkdir('dist/react', { recursive: true });
const runtime = await readFile('packages/react/create-icon.js', 'utf8');
await writeFile('dist/react/create-icon.js', runtime);
await writeFile('dist/react/create-icon.cjs', runtime.replace("import { createElement, forwardRef } from 'react';", "const { createElement, forwardRef } = require('react');").replace('export function createIcon', 'function createIcon') + '\nexports.createIcon = createIcon;\n');
await cp('packages/react/types.d.ts', 'dist/react/types.d.ts');
for (const style of ['filled', 'duotone']) {
  await mkdir(`dist/react/${style}`, { recursive: true });
  await mkdir(`dist/core/${style}`, { recursive: true });
  const esm = [], cjs = [], types = [];
  for (const icon of icons) {
    const name = componentName(icon.name);
    const svg = await readFile(`icons/${style}/${icon.name}.svg`, 'utf8');
    const root = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
    const nodes = JSON.stringify(Array.from(root.childNodes).filter(n => n.nodeType === 1).map(toNode));
    await writeFile(`dist/react/${style}/${icon.name}.js`, `import { createIcon } from '../create-icon.js';\nconst ${name} = /* @__PURE__ */ createIcon('${name}', ${nodes});\nexport { ${name} };\nexport default ${name};\n`);
    await writeFile(`dist/react/${style}/${icon.name}.cjs`, `const { createIcon } = require('../create-icon.cjs');\nconst ${name} = createIcon('${name}', ${nodes});\nexports.${name} = ${name};\nexports.default = ${name};\n`);
    await writeFile(`dist/react/${style}/${icon.name}.d.ts`, `import type { IconComponent } from '../types.js';\nexport declare const ${name}: IconComponent;\nexport default ${name};\n`);
    await writeFile(`dist/core/${style}/${icon.name}.js`, `export default ${JSON.stringify(svg)};\n`);
    await writeFile(`dist/core/${style}/${icon.name}.cjs`, `module.exports = ${JSON.stringify(svg)};\n`);
    await writeFile(`dist/core/${style}/${icon.name}.d.ts`, 'declare const svg: string;\nexport default svg;\n');
    esm.push(`export { default as ${name} } from './${icon.name}.js';`);
    cjs.push(`exports.${name} = require('./${icon.name}.cjs').default;`);
    types.push(`export { default as ${name} } from './${icon.name}.js';`);
  }
  await writeFile(`dist/react/${style}/index.js`, esm.join('\n'));
  await writeFile(`dist/react/${style}/index.cjs`, cjs.join('\n'));
  await writeFile(`dist/react/${style}/index.d.ts`, types.join('\n') + "\nexport type { IconProps, IconComponent } from '../types.js';\n");
}
console.log(`Built ${icons.length * 2} React components and SVG modules (ESM, CommonJS, TypeScript declarations).`);
