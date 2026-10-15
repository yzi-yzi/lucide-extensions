import { useEffect, useState, type RefObject } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  return <Dialog open={!!icon} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl" onCloseAutoFocus={event => { event.preventDefault(); if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true }); else document.querySelector<HTMLInputElement>('#search')?.focus({ preventScroll: true }); }}>
      <DialogHeader><DialogTitle className="pr-6 text-xl">{icon?.name}</DialogTitle><DialogDescription>Customize, copy, or download this {settings.style} icon.</DialogDescription></DialogHeader>
      <div className="flex flex-wrap gap-1.5">{icon?.categories.map(id => <Badge key={id} variant="outline" asChild><button onClick={() => onCategory(id)}>{categories.find(category => category.id === id)?.title || id}</button></Badge>)}</div>
      <div className="preview-grid relative flex h-44 items-center justify-center rounded-lg border" aria-label="Icon preview">
        {svg ? <div className="icon-preview" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} /> : error ? <div className="space-y-2 text-center"><p className="text-sm text-destructive">{error}</p><Button variant="outline" size="sm" onClick={() => setRetry(value => value + 1)}>Try again</Button></div> : <Skeleton className="size-20 rounded-lg" />}
        <span className="absolute right-3 bottom-3 text-xs text-muted-foreground">{settings.size} × {settings.size}</span>
      </div>
      <StylePicker value={settings.style} onChange={onStyle} />
      <div className="grid grid-cols-2 gap-2"><Button disabled={!svg} onClick={() => copyCode(svg)}><LibraryIcon name="copy" />Copy SVG</Button><Button variant="outline" disabled={!svg} onClick={download}><LibraryIcon name="download" />Download SVG</Button></div>
      <Tabs value={codeTab} onValueChange={setCodeTab} className="min-w-0">
        <div className="flex items-center justify-between"><TabsList aria-label="Code format"><TabsTrigger value="react">React</TabsTrigger><TabsTrigger value="svg">SVG</TabsTrigger></TabsList><Button size="sm" variant="ghost" disabled={codeTab === 'svg' && !svg} onClick={() => copyCode(codeTab === 'react' ? react : svg)}><LibraryIcon name="copy" />Copy code</Button></div>
        <TabsContent value="react"><pre tabIndex={0} className="max-h-48 overflow-auto rounded-lg border bg-muted/50 p-4 text-xs leading-relaxed"><code>{react}</code></pre></TabsContent>
        <TabsContent value="svg"><pre tabIndex={0} className="max-h-48 overflow-auto rounded-lg border bg-muted/50 p-4 text-xs leading-relaxed"><code>{svg || 'Loading SVG…'}</code></pre></TabsContent>
      </Tabs>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{icon?.deprecated ? 'Upstream deprecated · retained for completeness' : '24 × 24 viewBox · currentColor'}</span><Button variant="link" size="sm" onClick={onGuide}>Installation guide<LibraryIcon name="arrow-up-right" /></Button></div>
    </DialogContent>
  </Dialog>;
}
