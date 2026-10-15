import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fetchSvg, iconUrl, type Customization, type Icon } from '@/lib/catalog';

function Glyph({ name, settings, visible }: { name: string; settings: Customization; visible: boolean }) {
  const { style, opacity } = settings;
  const [customMask, setCustomMask] = useState<{ key: string; url: string } | null>(null);
  const key = `${name}/${style}/${opacity}`;
  useEffect(() => {
    if (!visible || style !== 'duotone' || opacity === 22) return;
    let cancelled = false;
    fetchSvg(name, style).then(svg => {
      if (!cancelled) setCustomMask({ key, url: `data:image/svg+xml,${encodeURIComponent(svg.replaceAll('opacity="0.22"', `opacity="${opacity / 100}"`))}` });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [name, style, opacity, key, visible]);
  const url = style === 'duotone' && opacity !== 22 && customMask?.key === key ? customMask.url : iconUrl(name, style);
  return <span aria-hidden="true" className="inline-block shrink-0 bg-current" style={{ width: 'var(--icon-size)', height: 'var(--icon-size)', color: 'var(--icon-color)', mask: visible ? `url("${url}") center / contain no-repeat` : undefined, backgroundColor: visible ? 'currentColor' : 'transparent' }} />;
}

const IconChunk = memo(function IconChunk({ icons, settings, onOpen }: { icons: Icon[]; settings: Customization; onOpen: (name: string, trigger: HTMLButtonElement) => void }) {
  const element = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { rootMargin: '500px' });
    if (element.current) observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={element} className={cn('icon-grid-chunk grid gap-2', settings.names ? 'grid-cols-[repeat(auto-fill,minmax(108px,1fr))]' : 'grid-cols-[repeat(auto-fill,minmax(64px,1fr))]')}>
    {icons.map(icon => <Button key={icon.name} variant="ghost" aria-label={icon.name} title={icon.name} onClick={event => onOpen(icon.name, event.currentTarget)}
      className={cn('group w-full min-w-0 flex-col gap-2 rounded-lg border border-transparent bg-muted/50 px-2 py-3 hover:border-border hover:bg-accent', settings.names ? 'h-24' : 'h-16')}>
      <Glyph name={icon.name} settings={settings} visible={visible} />
      {settings.names && <span className="w-full truncate text-center text-[10px] font-normal text-muted-foreground group-hover:text-foreground">{icon.name}</span>}
    </Button>)}
  </div>;
});

export const GallerySection = memo(function GallerySection({ id, title, icons, settings, onOpen }: { id: string; title: string; icons: Icon[]; settings: Customization; onOpen: (name: string, trigger: HTMLButtonElement) => void }) {
  const chunks: Icon[][] = [];
  for (let i = 0; i < icons.length; i += 84) chunks.push(icons.slice(i, i + 84));
  return <section id={id} data-gallery-section className="scroll-mt-48 space-y-4" aria-labelledby={`heading-${id}`}>
    <div className="flex items-center gap-3"><h2 id={`heading-${id}`} className="text-base font-semibold tracking-tight">{title}</h2><Badge variant="secondary" className="tabular-nums">{icons.length}</Badge></div>
    <div className="space-y-2" style={{ '--icon-size': `${settings.size}px`, '--icon-color': settings.color || 'var(--foreground)' } as CSSProperties}>
      {chunks.map((chunk, index) => <IconChunk key={index} icons={chunk} settings={settings} onOpen={onOpen} />)}
    </div>
  </section>;
});
