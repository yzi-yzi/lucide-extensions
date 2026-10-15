import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Customizer } from '@/components/customizer';
import { GallerySection } from '@/components/gallery';
import { IconDetails } from '@/components/icon-details';
import { Guide } from '@/components/guide';
import { IconStyleContext, LibraryIcon } from '@/components/library-icon';
import { base, defaults, loadCatalog, paper, repo, type Category, type Customization, type Icon } from '@/lib/catalog';
import { cn } from '@/lib/utils';

function readRoute() {
  const params = new URLSearchParams(location.search);
  return { style: params.get('style') === 'duotone' ? 'duotone' as const : 'filled' as const, query: params.get('q') || '', view: params.get('view') === 'all' ? 'all' : 'categories', selected: params.get('icon') || null };
}
function initialTheme() {
  try { const saved = localStorage.getItem('theme'); if (saved === 'dark' || saved === 'light') return saved; } catch { /* Use the system theme when storage is unavailable. */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

type SidebarProps = {
  settings: Customization; onSettings: (settings: Customization) => void;
  categories: Category[]; count: number; view: string; query: string; active: string;
  onView: (view: string) => void; onCategory: (id: string) => void;
};
function Sidebar({ settings, onSettings, categories, count, view, query, active, onView, onCategory }: SidebarProps) {
  return <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-6 p-5">
        <Customizer settings={settings} onChange={onSettings} />
        <Separator />
        <div className="space-y-1">
          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">Browse</p>
          <Button variant={view === 'all' && !query ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => onView('all')}><LibraryIcon name="grid-2x2" />All icons<span className="ml-auto text-xs tabular-nums text-muted-foreground">{count.toLocaleString()}</span></Button>
          <Button variant={view === 'categories' && !query ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => onView('categories')}><LibraryIcon name="list" />Categories<span className="ml-auto text-xs tabular-nums text-muted-foreground">{categories.length}</span></Button>
        </div>
        <nav aria-label="Icon categories" className="space-y-0.5">{categories.map(category => <Button key={category.id} variant="ghost" size="sm" asChild className={cn('w-full justify-between gap-2 text-xs font-normal', !query && view === 'categories' && active === category.id && 'bg-accent font-medium text-accent-foreground')}>
          <a href={`#${category.id}`} aria-current={!query && view === 'categories' && active === category.id ? 'location' : undefined} onClick={event => { event.preventDefault(); onCategory(category.id); }}><span className="truncate">{category.title}</span><span className="text-[11px] tabular-nums text-muted-foreground">{category.count}</span></a>
        </Button>)}</nav>
      </div>
    </ScrollArea>
    <div className="flex items-center justify-between border-t px-5 py-4"><Badge variant="outline" className="text-[10px]">v0.1.0</Badge><span className="text-xs text-muted-foreground">3,780 SVGs</span></div>
  </div>;
}

export default function App() {
  const [route] = useState(readRoute);
  const [settings, setSettings] = useState<Customization>({ ...defaults, style: route.style });
  const [query, setQuery] = useState(route.query);
  const deferredQuery = useDeferredValue(query);
  const [view, setView] = useState(route.view);
  const [selectedName, setSelectedName] = useState<string | null>(route.selected);
  const [theme, setTheme] = useState(initialTheme);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [guide, setGuide] = useState<'guide' | 'packages' | null>(null);
  const [catalog, setCatalog] = useState<{ icons: Icon[]; categories: Category[] }>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [activeCategory, setActiveCategory] = useState(location.hash.slice(1) || 'accessibility');
  const [pendingCategory, setPendingCategory] = useState<string | null>(location.hash.slice(1) || null);
  const search = useRef<HTMLInputElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const iconTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    loadCatalog().then(data => { if (!cancelled) setCatalog(data); }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [retry]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch { /* Theme remains usable without persistent storage. */ }
  }, [theme]);

  useEffect(() => {
    const url = new URL(location.href);
    const values = { style: settings.style === 'duotone' ? 'duotone' : '', q: query, view: view === 'all' ? 'all' : '', icon: selectedName || '' };
    Object.entries(values).forEach(([key, value]) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
    history.replaceState(null, '', url);
  }, [settings.style, query, view, selectedName]);

  useEffect(() => {
    function restoreRoute() {
      const next = readRoute(); setSettings(current => ({ ...current, style: next.style })); setQuery(next.query); setView(next.view); setSelectedName(next.selected);
      if (location.hash) setPendingCategory(location.hash.slice(1));
    }
    function keyboard(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      if (((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') || (event.key === '/' && !target.matches('input, textarea, [contenteditable="true"]'))) {
        event.preventDefault(); search.current?.focus(); search.current?.select();
      }
    }
    window.addEventListener('popstate', restoreRoute); document.addEventListener('keydown', keyboard);
    return () => { window.removeEventListener('popstate', restoreRoute); document.removeEventListener('keydown', keyboard); };
  }, []);

  const groups = useMemo(() => {
    if (!catalog) return [];
    const words = deferredQuery.trim().toLowerCase().split(/[\s-]+/).filter(Boolean);
    if (words.length || view === 'all') {
      const matches = words.length ? catalog.icons.filter(icon => words.every(word => icon.search.includes(word))) : catalog.icons;
      return [{ id: 'all-icons', title: words.length ? `${matches.length.toLocaleString()} results for “${deferredQuery}”` : 'All icons', icons: matches }];
    }
    return catalog.categories.map(category => ({ ...category, icons: catalog.icons.filter(icon => icon.categories.includes(category.id)) }));
  }, [catalog, deferredQuery, view]);

  useEffect(() => {
    if (!catalog || !pendingCategory || query || deferredQuery || view !== 'categories') return;
    const element = document.getElementById(pendingCategory);
    if (element) { element.scrollIntoView({ block: 'start' }); setActiveCategory(pendingCategory); }
    setPendingCategory(null);
  }, [catalog, pendingCategory, query, deferredQuery, view]);

  useEffect(() => {
    if (view !== 'categories' || deferredQuery) return;
    let frame = 0;
    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const line = (document.getElementById('search-area')?.getBoundingClientRect().bottom || 180) + 24;
        const section = [...document.querySelectorAll<HTMLElement>('[data-gallery-section]')].find(element => element.getBoundingClientRect().bottom > line);
        if (section) setActiveCategory(section.id);
      });
    }
    update(); window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [groups, view, deferredQuery]);

  const openIcon = useCallback((name: string, trigger: HTMLButtonElement) => { iconTrigger.current = trigger; setSelectedName(name); }, []);
  function navigateCategory(id: string) {
    setSelectedName(null); setQuery(''); setView('categories'); setMobileOpen(false); setPendingCategory(id);
    const url = new URL(location.href); url.hash = id; history.replaceState(null, '', url);
  }
  function changeView(next: string) { setView(next); setQuery(''); setMobileOpen(false); window.scrollTo({ top: 0 }); }
  const sidebarProps: SidebarProps = { settings, onSettings: setSettings, categories: catalog?.categories || [], count: catalog?.icons.length || 1890, view, query, active: activeCategory, onView: changeView, onCategory: navigateCategory };
  const selected = catalog?.icons.find(icon => icon.name === selectedName);
  const themeLabel = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  return <IconStyleContext value={settings.style}><TooltipProvider delayDuration={300}>
    <a href="#content" className="sr-only z-100 rounded-md bg-background p-3 text-sm shadow-lg focus:not-sr-only focus:fixed focus:top-2 focus:left-2">Skip to icons</a>
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
      <a href={base} aria-label="Lucide Extensions home" className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="relative flex size-8 -rotate-6 items-center justify-center rounded-lg border-2 border-brand text-brand"><span className="relative size-4 overflow-hidden rounded-sm bg-current/20"><span className="absolute inset-y-0 left-0 w-1/2 bg-current" /></span></span>
        <span className="text-base leading-tight font-semibold tracking-tight">Lucide<span className="block text-[10px] font-medium tracking-[0.12em] text-muted-foreground">EXTENSIONS</span></span>
      </a>
      <nav aria-label="Main navigation" className="flex items-center gap-1 md:gap-2">
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild><a href={base} aria-current="page">Icons</a></Button>
        <Button variant="ghost" size="sm" onClick={() => setGuide('guide')}>Guide</Button>
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => setGuide('packages')}>Packages</Button>
        <Button variant="ghost" size="sm" className="hidden lg:inline-flex" asChild><a href={paper} target="_blank" rel="noreferrer">Paper<LibraryIcon name="arrow-up-right" /></a></Button>
        <Separator orientation="vertical" className="mx-1 hidden h-5! sm:block" />
        <Tooltip><TooltipTrigger asChild><Button id="theme" variant="ghost" size="icon-sm" aria-label={themeLabel} onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}><LibraryIcon name={theme === 'dark' ? 'moon' : 'sun'} className="size-[18px]" /></Button></TooltipTrigger><TooltipContent>{themeLabel}</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" asChild className="hidden sm:inline-flex"><a href={repo} target="_blank" rel="noreferrer" aria-label="GitHub repository"><LibraryIcon name="code-xml" className="size-[18px]" /></a></Button></TooltipTrigger><TooltipContent>View on GitHub</TooltipContent></Tooltip>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetTrigger asChild><Button ref={menuTrigger} variant="outline" size="icon-sm" className="md:hidden" aria-label="Open customizer and categories"><LibraryIcon name="sliders-horizontal" /></Button></SheetTrigger><SheetContent side="left" className="w-80 gap-0 p-0" onCloseAutoFocus={event => { event.preventDefault(); menuTrigger.current?.focus({ preventScroll: true }); }}><SheetHeader className="border-b px-5 py-4 text-left"><SheetTitle>Customize & browse</SheetTitle><SheetDescription>Choose a style and explore the catalog.</SheetDescription></SheetHeader><div className="min-h-0 flex-1"><Sidebar {...sidebarProps} /></div></SheetContent></Sheet>
      </nav>
    </header>
    <aside aria-label="Customizer and categories" className="fixed top-16 bottom-0 left-0 hidden w-68 border-r md:block"><Sidebar {...sidebarProps} /></aside>
    <main id="content" tabIndex={-1} className="min-h-svh min-w-0 pt-16 outline-none md:ml-68">
      <div id="search-area" className="sticky top-16 z-30 space-y-3 border-b bg-background/95 px-4 py-5 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="relative"><LibraryIcon name="search" className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted-foreground" /><Input ref={search} id="search" type="search" aria-label="Search icons" placeholder="Search 1,890 icons…" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" className="h-11 bg-background pr-16 pl-10 text-sm shadow-xs" /><kbd className="pointer-events-none absolute top-3 right-3 hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">⌘ K</kbd></div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><p>Familiar icons. Two new dimensions.</p><p className="capitalize">{settings.style}<span className="mx-2 text-border">/</span>{(catalog?.icons.length || 1890).toLocaleString()} icons</p></div>
      </div>
      <div id="gallery" aria-busy={!catalog && !error} className={cn('space-y-10 px-4 py-7 sm:px-6 lg:px-8', query !== deferredQuery && 'opacity-60')}>
        {error ? <div className="py-20 text-center"><h1 className="text-lg font-semibold">Unable to load the catalog</h1><p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p><Button className="mt-5" onClick={() => setRetry(value => value + 1)}>Try again</Button></div>
          : !catalog ? <div className="space-y-4" role="status" aria-label="Loading icon catalog"><Skeleton className="h-6 w-36" /><div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{Array.from({ length: 32 }, (_, index) => <Skeleton key={index} className="h-16" />)}</div></div>
          : groups[0]?.icons.length === 0 ? <div className="py-20 text-center"><LibraryIcon name="search" className="size-10 text-muted-foreground" /><h1 className="mt-4 text-lg font-semibold">No icons found</h1><p className="mt-2 text-sm text-muted-foreground">Try a different name, category, or keyword.</p><Button variant="outline" className="mt-5" onClick={() => { setQuery(''); search.current?.focus(); }}>Clear search</Button></div>
          : groups.map(group => <GallerySection key={group.id} id={group.id} title={group.title} icons={group.icons} settings={settings} onOpen={openIcon} />)}
      </div>
      <footer className="mx-4 mt-6 space-y-4 border-t py-8 text-xs text-muted-foreground sm:mx-6 lg:mx-8"><div className="flex flex-wrap gap-x-5 gap-y-2"><button className="hover:text-foreground" onClick={() => setGuide('guide')}>Guide</button><button className="hover:text-foreground" onClick={() => setGuide('packages')}>Packages</button><a className="hover:text-foreground" href={`${base}LICENSE.txt`} target="_blank" rel="noreferrer">License</a><a className="hover:text-foreground" href={`${repo}/releases`}>Releases</a><a className="hover:text-foreground" href={`${repo}/issues`}>Feedback</a></div><p className="max-w-xl leading-relaxed">An independent extension of <a href="https://lucide.dev" className="underline underline-offset-4">Lucide</a>. Not affiliated with Lucide Icons. Released under ISC, with upstream Lucide and Feather notices preserved.</p></footer>
    </main>
    <IconDetails icon={selected} settings={settings} categories={catalog?.categories || []} onClose={() => setSelectedName(null)} onStyle={style => setSettings(current => ({ ...current, style }))} onCategory={navigateCategory} onGuide={() => setGuide('packages')} trigger={iconTrigger} />
    <Guide page={guide} onClose={() => setGuide(null)} />
    <Toaster theme={theme as 'light' | 'dark'} closeButton icons={{ success: <LibraryIcon name="circle-check" />, error: <LibraryIcon name="circle-alert" />, close: <LibraryIcon name="x" /> }} style={{ '--normal-bg': 'var(--popover)', '--normal-text': 'var(--popover-foreground)', '--normal-border': 'var(--border)', '--border-radius': 'var(--radius)' } as React.CSSProperties} />
  </TooltipProvider></IconStyleContext>;
}
