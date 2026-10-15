import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { fetchPreviews, iconUrl, type Customization, type Icon, type IconStyle } from '@/lib/catalog';

type OpenIcon = (name: string, trigger: HTMLButtonElement, keyboard: boolean) => void;

function ChunkContents({ icons, category, style, names, selectedName, onOpen }: { icons: Icon[]; category?: string; style: IconStyle; names: boolean; selectedName: string | null; onOpen: OpenIcon }) {
  const [previews, setPreviews] = useState<{ style: IconStyle; paths: Record<string, string> }>();
  useEffect(() => {
    let cancelled = false;
    Promise.all((category ? [`category-${category}`] : [...new Set(icons.map(icon => icon.previewBatch))]).map(batch => fetchPreviews(style, batch)))
      .then(batches => { if (!cancelled) setPreviews({ style, paths: Object.assign({}, ...batches) }); })
      .catch(() => { if (!cancelled) setPreviews({ style, paths: {} }); });
    return () => { cancelled = true; };
  }, [icons, category, style]);
  return icons.map(icon => {
    const paths = previews?.style === style ? previews.paths[icon.name] : undefined;
    return <Tooltip key={icon.name} delayDuration={250}><TooltipTrigger asChild>
      <Button variant="ghost" aria-label={icon.name} aria-pressed={selectedName === icon.name} aria-controls="icon-details" data-icon-tile
        onClick={event => onOpen(icon.name, event.currentTarget, event.detail === 0)}
        className={cn('group w-full min-w-0 flex-col gap-2 rounded-lg border border-transparent bg-muted/50 px-2 py-3 hover:border-primary/40 hover:bg-primary/10', names ? 'h-24' : 'h-16', selectedName === icon.name && 'border-primary bg-primary/10 ring-1 ring-primary/30')}>
        {paths ? <svg aria-hidden="true" viewBox="0 0 24 24" className="gallery-glyph shrink-0" style={{ width: 'var(--icon-size)', height: 'var(--icon-size)', color: 'var(--icon-color)' }} dangerouslySetInnerHTML={{ __html: paths }} />
          : <span aria-hidden="true" className="inline-block shrink-0 bg-current" style={{ width: 'var(--icon-size)', height: 'var(--icon-size)', color: 'var(--icon-color)', opacity: previews?.style === style ? 1 : 0.08, mask: previews?.style === style ? `url("${iconUrl(icon.name, style)}") center / contain no-repeat` : undefined }} />}
        {names && <span className="w-full truncate text-center text-[10px] font-normal text-muted-foreground group-hover:text-foreground">{icon.name}</span>}
      </Button>
    </TooltipTrigger><TooltipContent side="top" sideOffset={8}>{icon.name}</TooltipContent></Tooltip>;
  });
}

// Keep exact-height placeholders so category anchors remain stable, but mount
// interactive tiles only near the viewport. Preserve focused chunks for keyboard users.
const IconChunk = memo(function IconChunk({ icons, category, columns, settings, selectedName, onOpen }: { icons: Icon[]; category?: string; columns: number; settings: Customization; selectedName: string | null; onOpen: OpenIcon }) {
  const element = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const height = Math.ceil(icons.length / columns) * ((settings.names ? 96 : 64) + 8) - 8;
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting || !node.contains(document.activeElement)) setVisible(entry.isIntersecting);
    }, { rootMargin: '280px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={element} data-icon-chunk className="grid gap-2" style={{ height, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
    {visible && <ChunkContents icons={icons} category={category} style={settings.style} names={settings.names} selectedName={selectedName} onOpen={onOpen} />}
  </div>;
});

export const GallerySection = memo(function GallerySection({ id, title, icons, settings, selectedName, onOpen }: { id: string; title: string; icons: Icon[]; settings: Customization; selectedName: string | null; onOpen: OpenIcon }) {
  const grid = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const node = grid.current;
    if (!node) return;
    setWidth(node.clientWidth);
    const resize = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    resize.observe(node);
    return () => resize.disconnect();
  }, []);
  const columns = width ? Math.max(1, Math.floor((width + 8) / ((settings.names ? 108 : 64) + 8))) : 0;
  const chunks = useMemo(() => {
    const result: Icon[][] = [];
    if (!columns) return result;
    for (let i = 0; i < icons.length; i += columns * 4) result.push(icons.slice(i, i + columns * 4));
    return result;
  }, [icons, columns]);
  return <section id={id} data-gallery-section className="scroll-mt-56 space-y-4 md:scroll-mt-48" aria-labelledby={`heading-${id}`}>
    <div className="flex items-center gap-3"><h2 id={`heading-${id}`} className="text-base font-semibold tracking-tight">{title}</h2><Badge variant="secondary" className="tabular-nums">{icons.length}</Badge></div>
    <div ref={grid} className="space-y-2" style={{ '--icon-size': `${settings.size}px`, '--icon-color': settings.color || 'var(--foreground)', '--secondary-opacity': settings.opacity / 100 } as CSSProperties}>
      {chunks.map((chunk, index) => <IconChunk key={index} columns={columns} category={id === "all-icons" ? undefined : id} icons={chunk} settings={settings} selectedName={selectedName && chunk.some(icon => icon.name === selectedName) ? selectedName : null} onOpen={onOpen} />)}
    </div>
  </section>;
});
