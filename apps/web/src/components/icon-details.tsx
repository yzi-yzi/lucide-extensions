import { useEffect, useState, type RefObject } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { LibraryIcon } from '@/components/library-icon';
import { StylePicker } from '@/components/customizer';
import { customizeSvg, fetchSvg, reactCode, type Category, type Customization, type Icon, type IconStyle } from '@/lib/catalog';

export async function copyCode(text: string) {
  try { await navigator.clipboard.writeText(text); toast.success('Copied to clipboard'); }
  catch { toast.error('Clipboard unavailable. Select and copy the code instead.'); }
}

export function IconDetails({ icon, settings, categories, onClose, onStyle, onCategory, onGuide, trigger }: {
  icon: Icon | undefined; settings: Customization; categories: Category[]; onClose: () => void;
  onStyle: (style: IconStyle) => void; onCategory: (category: string) => void; onGuide: () => void;
  trigger: RefObject<HTMLButtonElement | null>;
}) {
  const [resource, setResource] = useState<{ key: string; svg?: string; error?: string }>();
  const [codeTab, setCodeTab] = useState('react');
  const [retry, setRetry] = useState(0);
  const key = `${icon?.name}/${settings.style}`;
  useEffect(() => {
    if (!icon) return;
    let cancelled = false;
    fetchSvg(icon.name, settings.style).then(svg => { if (!cancelled) setResource({ key, svg }); })
      .catch(() => { if (!cancelled) setResource({ key, error: 'Could not load this icon.' }); });
    return () => { cancelled = true; };
  }, [icon, settings.style, key, retry]);
  const svg = resource?.key === key && resource.svg ? customizeSvg(resource.svg, settings) : '';
  const error = resource?.key === key ? resource.error : undefined;
  const react = icon ? reactCode(icon, settings) : '';
  function download() {
    if (!svg || !icon) return;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const link = document.createElement('a'); link.href = url; link.download = `${icon.name}-${settings.style}.svg`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); toast.success('SVG downloaded');
  }
  return <Sheet modal={false} open={!!icon} onOpenChange={open => { if (!open) onClose(); }}>
    <SheetContent id="icon-details" side="bottom" showOverlay={false} showCloseButton={false}
      className="inset-x-auto bottom-3 left-1/2 z-40 h-[var(--details-height)] w-[calc(100%-1.5rem)] max-w-[800px] -translate-x-1/2 gap-0 overflow-hidden rounded-2xl border p-0 shadow-xl data-[state=open]:duration-200 md:bottom-4 md:left-[calc(50%+8.5rem)] md:w-[calc(100%-19rem)]"
      onOpenAutoFocus={event => event.preventDefault()}
      onInteractOutside={event => event.preventDefault()}
      onCloseAutoFocus={event => { event.preventDefault(); if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true }); else document.querySelector<HTMLInputElement>('#search')?.focus({ preventScroll: true }); }}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-5 py-3">
        <div className="min-w-0"><SheetTitle tabIndex={-1} data-detail-title className="truncate text-base outline-none">{icon?.name}</SheetTitle><SheetDescription className="mt-0.5 text-xs">24 × 24 grid · {settings.style === 'filled' ? 'Filled' : 'Duotone'}</SheetDescription></div>
        <Button variant="ghost" size="icon-sm" aria-label="Close icon details" onClick={onClose}><LibraryIcon name="x" /></Button>
      </div>
      <div className="grid min-h-0 flex-1 content-start gap-5 overflow-y-auto p-5 sm:grid-cols-[144px_minmax(0,1fr)] lg:grid-cols-[160px_minmax(0,1fr)]">
        <div className="mx-auto w-36 min-w-0 space-y-2 sm:w-full">
          <StylePicker value={settings.style} onChange={onStyle} />
          <div className="preview-grid relative flex aspect-square w-full items-center justify-center rounded-xl border" aria-label="Icon preview">
            {svg ? <div className="icon-preview" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} /> : <Skeleton className="size-16 rounded-lg" />}
            <span className="absolute right-2 bottom-2 text-[10px] text-muted-foreground">{settings.size} × {settings.size}</span>
          </div>
        </div>
        <div className="min-w-0 space-y-3">
          <Tabs value={codeTab} onValueChange={setCodeTab} className="min-w-0 gap-2">
            <div className="flex items-center justify-between gap-2"><TabsList aria-label="Code format"><TabsTrigger value="react">React</TabsTrigger><TabsTrigger value="svg">SVG</TabsTrigger></TabsList><Button size="sm" variant="ghost" disabled={codeTab === 'svg' && !svg} onClick={() => copyCode(codeTab === 'react' ? react : svg)}><LibraryIcon name="copy" />Copy code</Button></div>
            <TabsContent value="react" className="min-w-0"><pre tabIndex={0} aria-label="React code" className="h-36 lg:h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/50 p-3 font-mono text-xs leading-relaxed [overflow-wrap:anywhere]"><code>{react}</code></pre></TabsContent>
            <TabsContent value="svg" className="min-w-0"><pre tabIndex={0} aria-label="SVG code" className="h-36 lg:h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/50 p-3 font-mono text-xs leading-relaxed [overflow-wrap:anywhere]"><code>{svg || 'Loading SVG…'}</code></pre></TabsContent>
          </Tabs>
          <div className="flex flex-wrap items-center gap-1.5" aria-label="Icon categories"><span className="mr-1 text-xs text-muted-foreground">Categories</span>{icon?.categories.map(id => <Badge key={id} variant="secondary" asChild><button onClick={() => onCategory(id)}>{categories.find(category => category.id === id)?.title || id}</button></Badge>)}</div>
          {error && <div role="alert" className="text-xs text-destructive">{error} <button className="underline" onClick={() => setRetry(value => value + 1)}>Try again</button></div>}
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-2 items-center gap-2 border-t bg-muted/20 px-4 py-3 sm:flex sm:justify-end sm:px-5">
        <Button variant="ghost" size="sm" className="col-span-2 justify-self-start sm:mr-auto" onClick={onGuide}>How to use<LibraryIcon name="arrow-up-right" /></Button>
        <Button size="sm" variant="outline" disabled={!svg} onClick={download}><LibraryIcon name="download" />Download SVG</Button>
        <Button size="sm" disabled={!svg} onClick={() => copyCode(svg)}><LibraryIcon name="copy" />Copy SVG</Button>
      </div>
    </SheetContent>
  </Sheet>;
}
