export type IconStyle = 'filled' | 'duotone';
export type Icon = {
  name: string;
  categories: string[];
  tags: string[];
  aliases: (string | { name: string })[];
  deprecated?: boolean;
  search: string;
  previewBatch: number;
};
export type Category = { id: string; title: string; count: number };
export type Customization = { style: IconStyle; color: string; size: number; opacity: number; names: boolean };
export const base = import.meta.env.BASE_URL;
export const repo = 'https://github.com/yzi-yzi/lucide-extensions';
export const paper = 'https://app.paper.design/file/01M4X7ABDPS9FKKG3FTC271A46';
export const install = 'npm install @yzi-yzi/lucide-extensions';
export const defaults: Customization = { style: 'filled', color: '', size: 24, opacity: 22, names: false };
export const iconUrl = (name: string, style: IconStyle) => `${base}icons/${style}/${name}.svg`;
export const pascal = (name: string) => name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
const svgCache = new Map<string, Promise<string>>();

export function fetchSvg(name: string, style: IconStyle) {
  const url = iconUrl(name, style);
  if (!svgCache.has(url)) {
    svgCache.set(url, fetch(url).then(response => {
      if (!response.ok) throw new Error('SVG unavailable');
      return response.text();
    }).catch(error => { svgCache.delete(url); throw error; }));
  }
  return svgCache.get(url)!;
}

export function customizeSvg(svg: string, settings: Customization) {
  const resized = svg.replace('width="24"', `width="${settings.size}"`).replace('height="24"', `height="${settings.size}"`);
  const colored = settings.color ? resized.replaceAll('currentColor', settings.color) : resized;
  return colored.replaceAll('opacity="0.22"', `opacity="${settings.opacity / 100}"`);
}

export function reactCode(icon: Icon, settings: Customization) {
  const name = pascal(icon.name);
  return `import { ${name} } from '@yzi-yzi/lucide-extensions/react/${settings.style}';\n\n<${name}\n  size={${settings.size}}${settings.color ? `\n  color="${settings.color}"` : ''}${settings.style === 'duotone' && settings.opacity !== 22 ? `\n  secondaryOpacity={${settings.opacity / 100}}` : ''}\n  aria-label="${icon.name.replaceAll('-', ' ')}"\n/>`;
}

export async function loadCatalog() {
  async function readJson<T>(path: string): Promise<T> {
    const response = await fetch(`${base}${path}`);
    if (!response.ok) throw new Error('Catalog unavailable');
    return response.json();
  }
  const [icons, categories] = await Promise.all([readJson<Icon[]>('catalog.json'), readJson<Category[]>('categories.json')]);
  const titles = new Map(categories.map(category => [category.id, category.title]));
  return {
    categories,
    icons: icons.sort((a, b) => a.name.localeCompare(b.name, 'en')).map((icon, index) => ({ ...icon, previewBatch: Math.floor(index / 64),
      search: [icon.name, ...icon.tags, ...icon.categories.map(id => titles.get(id) || id), ...icon.aliases.map(alias => typeof alias === 'string' ? alias : alias.name)].join(' ').toLowerCase().replaceAll('-', ' '),
    })),
  };
}

const previewCache = new Map<string, Promise<Record<string, string>>>();
export function fetchPreviews(style: IconStyle, batch: number | string) {
  const key = `${style}-${batch}`;
  if (!previewCache.has(key)) {
    previewCache.set(key, fetch(`${base}previews/${key}.json`).then(response => {
      if (!response.ok) throw new Error('Preview unavailable');
      return response.json() as Promise<Record<string, string>>;
    }).catch(error => { previewCache.delete(key); throw error; }));
  }
  return previewCache.get(key)!;
}
