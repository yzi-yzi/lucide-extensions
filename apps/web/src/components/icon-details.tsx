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
      className="z-40 h-[var(--details-height)] gap-0 rounded-t-2xl border-t p-0 shadow-[0_-8px_32px_#00000010] data-[state=open]:duration-200 md:left-68"
      onOpenAutoFocus={event => event.preventDefault()}
      onInteractOutside={event => event.preventDefault()}
      onCloseAutoFocus={event => { event.preventDefault(); if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true }); else document.querySelector<HTMLInputElement>('#search')?.focus({ preventScroll: true }); }}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="min-w-0"><SheetTitle tabIndex={-1} data-detail-title className="truncate text-base outline-none">{icon?.name}</SheetTitle><SheetDescription className="mt-0.5 text-xs">Select another icon to compare. Keep browsing while this panel is open.</SheetDescription></div>
        <Button variant="ghost" size="icon-sm" aria-label="Close icon details" onClick={onClose}><LibraryIcon name="x" /></Button>
      </div>
      <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-4 sm:p-5 md:grid-cols-[128px_minmax(0,1fr)] xl:grid-cols-[160px_minmax(220px,0.8fr)_minmax(0,1.4fr)]">
        <div className="preview-grid relative flex h-28 items-center justify-center rounded-lg border md:h-full" aria-label="Icon preview">
          {svg ? <div className="icon-preview" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} /> : <Skeleton className="size-16 rounded-lg" />}
          <span className="absolute right-2 bottom-2 text-[10px] text-muted-foreground">{settings.size} × {settings.size}</span>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <StylePicker value={settings.style} onChange={onStyle} />
          <div className="grid grid-cols-2 gap-2"><Button disabled={!svg} onClick={() => copyCode(svg)}><LibraryIcon name="copy" />Copy SVG</Button><Button variant="outline" disabled={!svg} onClick={download}><LibraryIcon name="download" />Download</Button></div>
          {error && <div role="alert" className="text-xs text-destructive">{error} <button className="underline" onClick={() => setRetry(value => value + 1)}>Try again</button></div>}
          <div className="flex flex-wrap gap-1.5">{icon?.categories.map(id => <Badge key={id} variant="outline" asChild><button onClick={() => onCategory(id)}>{categories.find(category => category.id === id)?.title || id}</button></Badge>)}</div>
          <Button variant="link" size="sm" className="mt-auto h-auto justify-start self-start p-0 text-xs" onClick={onGuide}>Installation guide<LibraryIcon name="arrow-up-right" /></Button>
        </div>
        <Tabs value={codeTab} onValueChange={setCodeTab} className="min-w-0 gap-2 md:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between"><TabsList aria-label="Code format"><TabsTrigger value="react">React</TabsTrigger><TabsTrigger value="svg">SVG</TabsTrigger></TabsList><Button size="sm" variant="ghost" disabled={codeTab === 'svg' && !svg} onClick={() => copyCode(codeTab === 'react' ? react : svg)}><LibraryIcon name="copy" />Copy code</Button></div>
          <TabsContent value="react" className="min-h-0"><pre tabIndex={0} className="h-36 overflow-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs leading-relaxed md:h-full"><code>{react}</code></pre></TabsContent>
          <TabsContent value="svg" className="min-h-0"><pre tabIndex={0} className="h-36 overflow-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs leading-relaxed md:h-full"><code>{svg || 'Loading SVG…'}</code></pre></TabsContent>
        </Tabs>
      </div>
    </SheetContent>
  </Sheet>;
}
