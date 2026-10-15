import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { DOMParser } from '@xmldom/xmldom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'vite';
const require = createRequire(import.meta.url);
const icons = JSON.parse(await readFile('metadata/icons.json', 'utf8'));
const categories = JSON.parse(await readFile('metadata/categories.json', 'utf8'));
const parse = svg => new DOMParser().parseFromString(svg, 'image/svg+xml');

test('all 3,780 approved SVGs match their hashes and safe SVG structure', async () => {
  assert.equal(icons.length, 1890);
  assert.equal(new Set(icons.map(i => i.name)).size, 1890);
  for (const style of ['filled', 'duotone']) {
    assert.equal((await readdir(`icons/${style}`)).length, 1890);
    for (const icon of icons) {
      const svg = await readFile(`icons/${style}/${icon.name}.svg`, 'utf8');
      assert.equal(createHash('sha256').update(svg).digest('hex'), icon.sha256[style], `${style}/${icon.name}`);
      const root = parse(svg).documentElement;
      assert.equal(root.tagName, 'svg');
      assert.equal(root.getAttribute('viewBox'), '0 0 24 24');
      assert.equal(root.getElementsByTagName('script').length, 0);
      assert.equal(root.getElementsByTagName('foreignObject').length, 0);
      assert.ok(!/\bon\w+=|href=|url\(/i.test(svg), `${icon.name} must be self-contained`);
      assert.ok(root.getElementsByTagName('path').length || root.childNodes.length);
    }
  }
});
test('42 categories retain their exact memberships and counts', () => {
  assert.equal(categories.length, 42);
  assert.equal(categories.reduce((sum, c) => sum + c.count, 0), 3767);
  for (const c of categories) assert.equal(icons.filter(i => i.categories.includes(c.id)).length, c.count, c.id);
  for (const i of icons) assert.ok(i.categories.every(id => categories.some(c => c.id === id)));
});
test('every React component retains approved path geometry and opacity', async () => {
  for (const style of ['filled', 'duotone']) {
    const components = await import(`../dist/react/${style}/index.js`);
    assert.equal(Object.keys(components).length, 1890);
    for (const icon of icons) {
      const name = icon.name.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join('');
      const output = parse(renderToStaticMarkup(createElement(components[name])));
      const source = parse(await readFile(`icons/${style}/${icon.name}.svg`, 'utf8'));
      const geometry = document => Array.from(document.getElementsByTagName('*')).filter(n => n.tagName !== 'svg').map(n => [n.tagName, Array.from(n.attributes).map(a => [a.name, a.value]).sort()]);
      assert.deepEqual(geometry(output), geometry(source), `${style}/${icon.name}`);
    }
  }
});
test('React ESM and CommonJS honor size, color, title, accessibility, secondary opacity', async () => {
  const { Heart } = await import('../dist/react/duotone/index.js');
  const svg = parse(renderToStaticMarkup(createElement(Heart, { size: 32, color: '#ff0000', secondaryOpacity: .4, title: 'Favorite' })));
  assert.equal(svg.documentElement.getAttribute('width'), '32');
  assert.equal(svg.documentElement.getAttribute('color'), '#ff0000');
  assert.equal(svg.documentElement.getAttribute('role'), 'img');
  assert.equal(svg.getElementsByTagName('title')[0].textContent, 'Favorite');
  assert.ok(svg.toString().includes('opacity="0.4"'));
  const { Heart: CjsHeart } = require('../dist/react/filled/heart.cjs');
  assert.match(renderToStaticMarkup(createElement(CjsHeart)), /aria-hidden="true"/);
  assert.match(renderToStaticMarkup(createElement(Heart, { 'aria-label': 'Love' })), /aria-label="Love"/);
});
test('plain SVG module exports match the source in ESM and CommonJS', async () => {
  const expected = await readFile('icons/duotone/heart.svg', 'utf8');
  assert.equal((await import('../dist/core/duotone/heart.js')).default, expected);
  assert.equal(require('../dist/core/duotone/heart.cjs'), expected);
});
test('a named React import tree-shakes the complete catalog', async () => {
  const result = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: true, lib: { entry: 'scripts/fixtures/single-icon.js', formats: ['es'] }, rollupOptions: { external: ['react'] } } });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(build => build.output);
  const size = outputs.filter(o => o.type === 'chunk').reduce((total, chunk) => total + Buffer.byteLength(chunk.code), 0);
  assert.ok(size < 6000, `Single-icon bundle should be small, received ${size} bytes`);
  console.log(`Single icon bundle: ${size} bytes, React external.`);
});
