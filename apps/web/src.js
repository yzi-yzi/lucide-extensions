import './style.css';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const base = import.meta.env.BASE_URL;
const repo = 'https://github.com/yzi-yzi/lucide-extensions';
const install = `npm install ${repo}/releases/download/v0.1.0/yzi-yzi-lucide-extensions-0.1.0.tgz`;
const params = new URLSearchParams(location.search);
const state = { style: params.get('style') === 'duotone' ? 'duotone' : 'filled', view: params.get('view') === 'all' ? 'all' : 'categories', color: '', size: 24, opacity: 22, query: params.get('q') || '', selected: null, code: 'react' };
let icons = [], categories = [], observer, activeObserver, toastTimer, detailRequest = 0;
const svgCache = new Map();
const iconUrl = name => `${base}icons/${state.style}/${name}.svg`;
const pascal = name => name.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join('');
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2400); }
function syncUrl() {
  const url = new URL(location.href);
  for (const [key, value] of Object.entries({ style: state.style === 'filled' ? '' : state.style, view: state.view === 'categories' ? '' : state.view, q: state.query, icon: state.selected?.name || '' })) value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
  history.replaceState(null, '', url);
}
function setTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('#theme').textContent = dark ? '☾' : '☼';
  $('#theme').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
}
let theme; try { theme = localStorage.getItem('theme'); } catch {}
setTheme(theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
$('#theme').addEventListener('click', () => setTheme(document.documentElement.dataset.theme !== 'dark'));

function applyStyle() {
  document.documentElement.style.setProperty('--icon-size', `${state.size}px`);
  document.documentElement.style.setProperty('--icon-color', state.color || 'var(--ink)');
  $('[data-style="filled"]').setAttribute('aria-pressed', state.style === 'filled');
  $('[data-style="duotone"]').setAttribute('aria-pressed', state.style === 'duotone');
  $('#opacity-control').hidden = state.style !== 'duotone';
  $('#size-value').textContent = `${state.size}px`;
  $('#opacity-value').textContent = `${state.opacity}%`;
  $('#catalog-status').textContent = `${state.style === 'filled' ? 'Filled' : 'Duotone'} · ${icons.length.toLocaleString()} icons`;
  $$('.icon-section.loaded .glyph').forEach(setGlyph);
  if (state.selected) renderDetail();
  syncUrl();
}
function setGlyph(node) {
  // The original SVG alpha is preserved by the CSS mask. Only nondefault opacity needs a customized SVG.
  const url = iconUrl(node.dataset.icon);
  node.style.maskImage = `url("${url}")`;
  if (state.style === 'duotone' && state.opacity !== 22) {
    const opacity = state.opacity;
    fetchSvg(node.dataset.icon, 'duotone').then(svg => {
      if (state.style === 'duotone' && state.opacity === opacity && node.isConnected) node.style.maskImage = `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/opacity="0\.22"/g, `opacity="${opacity / 100}"`))}")`;
    }).catch(() => {});
  }
}
function setStyle(style) { state.style = style; applyStyle(); }
$$('[data-style], [data-detail-style]').forEach(button => button.addEventListener('click', () => setStyle(button.dataset.style || button.dataset.detailStyle)));
$('#size').addEventListener('input', e => { state.size = Number(e.target.value); applyStyle(); });
$('#opacity').addEventListener('input', e => { state.opacity = Number(e.target.value); applyStyle(); });
$('#color').addEventListener('input', e => { state.color = e.target.value; $('#color-text').value = state.color; applyStyle(); });
$('#color-text').addEventListener('input', e => {
  const value = e.target.value.trim();
  if (/^#[\da-f]{6}$/i.test(value)) { state.color = value; $('#color').value = value; applyStyle(); }
});
$('#color-text').addEventListener('change', e => {
  const value = e.target.value.trim();
  if (/^#[\da-f]{6}$/i.test(value)) { state.color = value; $('#color').value = value; }
  else if (!value || value === '[default]') state.color = '';
  else { toast('Use a six-digit hex color, such as #e76e6e.'); e.target.value = state.color || '[default]'; return; }
  applyStyle();
});
$('#names').addEventListener('change', e => document.body.classList.toggle('show-names', e.target.checked));
$('#reset').addEventListener('click', () => {
  state.color = ''; state.size = 24; state.opacity = 22;
  $('#color').value = '#3c3c43'; $('#color-text').value = '[default]'; $('#size').value = 24; $('#opacity').value = 22; $('#names').checked = false;
  document.body.classList.remove('show-names'); applyStyle();
});
function closeSidebar() { document.body.classList.remove('sidebar-open'); $('#mobile-menu').setAttribute('aria-expanded', 'false'); }
$('#mobile-menu').addEventListener('click', () => { const open = document.body.classList.toggle('sidebar-open'); $('#mobile-menu').setAttribute('aria-expanded', String(open)); });
function setView(view) { state.view = view; state.query = ''; $('#search').value = ''; renderGallery(); syncUrl(); closeSidebar(); window.scrollTo({ top: 0 }); }
$('#all-view').addEventListener('click', () => setView('all'));
$('#category-view').addEventListener('click', () => setView('categories'));
function navigateCategory(id) {
  state.query = ''; state.view = 'categories'; $('#search').value = ''; renderGallery(); syncUrl(); closeSidebar();
  history.replaceState(null, '', `${location.pathname}${location.search}#${id}`);
  document.getElementById(id)?.scrollIntoView({ block: 'start' });
  $$('#categories a').forEach(a => a.classList.toggle('active', a.dataset.category === id));
}
$('#categories').addEventListener('click', e => { const a = e.target.closest('[data-category]'); if (a) { e.preventDefault(); navigateCategory(a.dataset.category); } });
$('#search').value = state.query;
$('#search').addEventListener('input', e => { state.query = e.target.value; renderGallery(); syncUrl(); });
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' || e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); $('#search').focus(); $('#search').select(); }
  if (e.key === 'Escape') closeSidebar();
});
function card(icon) { return `<button class="icon-card" data-name="${icon.name}" aria-label="${icon.name}" title="${icon.name}"><span class="glyph" data-icon="${icon.name}" aria-hidden="true"></span><span class="icon-name">${icon.name}</span></button>`; }
function renderGallery() {
  observer?.disconnect(); activeObserver?.disconnect();
  const query = state.query.toLowerCase().trim();
  const words = query.split(/[\s-]+/).filter(Boolean);
  const matches = query ? icons.filter(icon => words.every(word => icon.search.includes(word))) : icons;
  $('#all-view').classList.toggle('active', state.view === 'all' && !query);
  $('#category-view').classList.toggle('active', state.view === 'categories' && !query);
  const sections = query || state.view === 'all' ? [{ id: 'all-icons', title: query ? `${matches.length.toLocaleString()} results for “${state.query}”` : 'All icons', icons: matches }] : categories.map(category => ({ ...category, icons: icons.filter(icon => icon.categories.includes(category.id)) }));
  $('#gallery').innerHTML = matches.length ? sections.map(section => `<section id="${section.id}" class="icon-section"><h2><a href="#${section.id}" aria-label="${escape(section.title)} category">${escape(section.title)}</a><span>${section.icons.length}</span></h2><div class="icon-grid">${section.icons.map(card).join('')}</div></section>`).join('') : '<div class="empty-state"><span aria-hidden="true">⌕</span><h2>No icons found</h2><p>Try a different name, category, or keyword.</p><button id="clear-search">Clear search</button></div>';
  $('#gallery').setAttribute('aria-busy', 'false');
  $('#clear-search')?.addEventListener('click', () => { state.query = ''; $('#search').value = ''; renderGallery(); syncUrl(); $('#search').focus(); });
  observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('loaded'); entry.target.querySelectorAll('.glyph').forEach(setGlyph); observer.unobserve(entry.target); } }), { rootMargin: '600px' });
  $$('.icon-section').forEach(section => observer.observe(section));
  activeObserver = new IntersectionObserver(() => {
    const line = $('.search-area').getBoundingClientRect().bottom + 20;
    const visible = $$('.icon-section').find(section => section.getBoundingClientRect().bottom > line);
    if (visible) $$('#categories a').forEach(a => a.classList.toggle('active', a.dataset.category === visible.id));
  }, { rootMargin: '-170px 0px -65% 0px' });
  $$('.icon-section').forEach(section => activeObserver.observe(section));
}
$('#gallery').addEventListener('click', e => { const card = e.target.closest('[data-name]'); if (card) openIcon(card.dataset.name); });
async function fetchSvg(name, style = state.style) {
  const key = `${style}/${name}`;
  if (!svgCache.has(key)) svgCache.set(key, fetch(`${base}icons/${key}.svg`).then(response => { if (!response.ok) throw new Error('SVG unavailable'); return response.text(); }).catch(error => { svgCache.delete(key); throw error; }));
  return svgCache.get(key);
}
async function customSvg() {
  const { selected, style, size, color, opacity } = state;
  let svg = await fetchSvg(selected.name, style);
  svg = svg.replace('width="24"', `width="${size}"`).replace('height="24"', `height="${size}"`);
  if (color) svg = svg.replaceAll('currentColor', color);
  return svg.replace(/opacity="0\.22"/g, `opacity="${opacity / 100}"`);
}
function reactCode() {
  const name = pascal(state.selected.name);
  return `import { ${name} } from '@yzi-yzi/lucide-extensions/react/${state.style}';\n\n<${name}\n  size={${state.size}}${state.color ? `\n  color="${state.color}"` : ''}${state.style === 'duotone' && state.opacity !== 22 ? `\n  secondaryOpacity={${state.opacity / 100}}` : ''}\n  aria-label="${state.selected.name.replaceAll('-', ' ')}"\n/>`;
}
async function renderDetail() {
  const request = ++detailRequest;
  const icon = state.selected;
  $('#icon-title').textContent = icon.name;
  $('#detail-tags').innerHTML = icon.categories.map(id => `<button data-jump-category="${id}">${escape(categories.find(c => c.id === id)?.title || id)}</button>`).join('');
  $$('[data-detail-style]').forEach(button => button.setAttribute('aria-pressed', button.dataset.detailStyle === state.style));
  $$('[data-code]').forEach(button => button.classList.toggle('active', button.dataset.code === state.code));
  $('#detail-dimensions').textContent = `${state.size} × ${state.size}`;
  $('#detail-note').textContent = icon.deprecated ? 'Upstream deprecated · retained for completeness' : '24 × 24 viewBox · currentColor';
  $('#copy-svg').disabled = true; $('#download-svg').disabled = true;
  try {
    const svg = await customSvg();
    if (request !== detailRequest || !state.selected) return;
    $('#detail-preview').innerHTML = svg;
    $('#code-preview').textContent = state.code === 'react' ? reactCode() : svg;
    $('#copy-svg').disabled = false; $('#download-svg').disabled = false;
  } catch { $('#detail-preview').textContent = 'Could not load this icon. Please try again.'; $('#code-preview').textContent = ''; }
}
function openIcon(name) { state.selected = icons.find(icon => icon.name === name); if (!state.selected) return; renderDetail(); syncUrl(); if (!$('#icon-dialog').open) $('#icon-dialog').showModal(); }
$('#icon-dialog').addEventListener('close', () => { state.selected = null; ++detailRequest; syncUrl(); });
$$('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', e => { if (e.target === dialog) { const rect = dialog.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close(); } }));
$('#detail-tags').addEventListener('click', e => { const tag = e.target.closest('[data-jump-category]'); if (tag) { $('#icon-dialog').close(); navigateCategory(tag.dataset.jumpCategory); } });
$$('[data-code]').forEach(button => button.addEventListener('click', () => { state.code = button.dataset.code; renderDetail(); }));
async function copy(text) { try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); } catch { toast('Clipboard unavailable. Select and copy the code below.'); } }
$('#copy-svg').addEventListener('click', async () => { try { await copy(await customSvg()); } catch { toast('Unable to load SVG. Try again.'); } });
$('#copy-code').addEventListener('click', () => copy($('#code-preview').textContent));
$('#download-svg').addEventListener('click', async () => {
  try { const name = `${state.selected.name}-${state.style}.svg`; const url = URL.createObjectURL(new Blob([await customSvg()], { type: 'image/svg+xml' })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('SVG downloaded'); } catch { toast('Download failed. Please try again.'); }
});
function showDocs(page) {
  $('#docs-body').innerHTML = `<h1 id="docs-title">${page === 'packages' ? 'One library. Two styles.' : 'Make it yours.'}</h1><p class="docs-lead">1,890 familiar icons, reimagined in filled and duotone. Every icon shares a 24 × 24 grid and follows the color of your interface.</p><h2>Install the release</h2><p>The package is available directly from GitHub Releases. It includes React components, SVG files, and plain JavaScript modules.</p><pre>${escape(install)}</pre><h2>Use with React</h2><pre>${escape("import { Heart } from '@yzi-yzi/lucide-extensions/react/filled';\nimport { Sparkles } from '@yzi-yzi/lucide-extensions/react/duotone';\n\n<Heart size={24} color=\"#e76e6e\" aria-label=\"Favorite\" />\n<Sparkles size={24} secondaryOpacity={0.22} />")}</pre><p>Named imports are tree-shakable. Individual imports such as <code>…/react/duotone/heart</code> work too. React 18 or newer is supported.</p><h2>SVG for any framework</h2><p>Choose an icon and use <strong>Copy SVG</strong> or <strong>Download SVG</strong>. The copied file includes your selected size, color, and secondary opacity. Transparent cutouts work on light and dark backgrounds.</p><h2>Accessible by default</h2><p>Decorative React icons are hidden from assistive technology. Add an <code>aria-label</code> or <code>title</code> for meaningful icons. When an icon is inside a button, give the button an accessible name.</p><h2>Open source, with credit</h2><p>This is an independent extension, not an official Lucide project. The original icon names, categories, and base designs come from <a href="https://lucide.dev" target="_blank" rel="noreferrer">Lucide</a>. Original ISC and Feather MIT notices are included.</p><div class="docs-links"><a class="primary" href="${repo}/releases/tag/v0.1.0" target="_blank" rel="noreferrer">Download the release ↗</a><a href="${repo}" target="_blank" rel="noreferrer">Explore the source ↗</a></div>`;
  $('#docs-dialog').showModal();
}
$$('[data-doc]').forEach(button => button.addEventListener('click', () => showDocs(button.dataset.doc)));
async function init() {
  try {
    [icons, categories] = await Promise.all([`${base}catalog.json`, `${base}categories.json`].map(url => fetch(url).then(response => { if (!response.ok) throw new Error('Catalog unavailable'); return response.json(); })));
    icons.sort((a, b) => a.name.localeCompare(b.name, 'en'));
    icons.forEach(icon => icon.search = [icon.name, ...icon.tags, ...icon.categories.map(id => categories.find(c => c.id === id)?.title || id), ...icon.aliases.map(a => typeof a === 'string' ? a : a.name || '')].join(' ').toLowerCase().replaceAll('-', ' '));
    $('#categories').innerHTML = categories.map(c => `<a href="#${c.id}" data-category="${c.id}"><span>${escape(c.title)}</span><span class="count">${c.count}</span></a>`).join('');
    renderGallery(); applyStyle();
    const hash = location.hash.slice(1);
    if (categories.some(c => c.id === hash)) document.getElementById(hash)?.scrollIntoView();
    if (params.get('icon')) openIcon(params.get('icon'));
  } catch { $('#gallery').innerHTML = '<div class="empty-state"><h2>Unable to load the catalog</h2><p>Check your connection and reload to try again.</p><button id="retry">Try again</button></div>'; $('#retry').addEventListener('click', init); $('#gallery').setAttribute('aria-busy', 'false'); }
}
init();
