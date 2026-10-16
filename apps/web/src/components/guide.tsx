import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { LibraryIcon } from '@/components/library-icon';
import { copyCode } from '@/components/icon-details';
import { install, repo } from '@/lib/catalog';

export function Guide({ page, onClose }: { page: 'guide' | 'packages' | null; onClose: () => void }) {
  return <Dialog open={!!page} onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[90svh] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-2xl">
    <DialogHeader><DialogTitle className="text-xl">{page === 'packages' ? 'One library. Two styles.' : 'Make it yours.'}</DialogTitle><DialogDescription>1,890 icons on a 24 × 24 grid. Use them in React, or download SVGs for any project.</DialogDescription></DialogHeader>
    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Install from npm</h2><Button size="sm" variant="ghost" onClick={() => copyCode(install)}><LibraryIcon name="copy" />Copy</Button></div><p className="text-sm text-muted-foreground">One package includes both icon styles, tree-shakable React components, SVGs, and JavaScript modules.</p><pre tabIndex={0} className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] rounded-lg border bg-muted/50 p-4 text-xs"><code>{install}</code></pre></section>
    <Separator />
    <section className="space-y-3"><h2 className="text-sm font-semibold">Use with React</h2><pre tabIndex={0} className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] rounded-lg border bg-muted/50 p-4 text-xs leading-relaxed"><code>{`import { Heart } from '@yzi-yzi/lucide-extensions/react/filled';\nimport { Sparkles } from '@yzi-yzi/lucide-extensions/react/duotone';\n\n<Heart size={24} color="#e76e6e" aria-label="Favorite" />\n<Sparkles size={24} secondaryOpacity={0.22} />`}</code></pre><p className="text-sm text-muted-foreground">Named imports are tree-shakable. Individual imports such as <code className="text-xs">…/react/duotone/heart</code> work too. React 18 or newer is supported.</p></section>
    <Separator />
    <section className="space-y-2"><h2 className="text-sm font-semibold">SVG for any framework</h2><p className="text-sm leading-relaxed text-muted-foreground">Choose an icon and select Copy SVG or Download SVG. The exported file includes your chosen size, color, and secondary opacity. Transparent cutouts work in light and dark themes.</p></section>
    <section className="space-y-2"><h2 className="text-sm font-semibold">Accessible by default</h2><p className="text-sm leading-relaxed text-muted-foreground">Decorative React icons are hidden from assistive technology. Add a title or aria-label for meaningful icons. Label icon-only buttons on the button itself.</p></section>
    <section className="space-y-2"><h2 className="text-sm font-semibold">Open source, with credit</h2><p className="text-sm leading-relaxed text-muted-foreground">This independent extension is not affiliated with Lucide Icons. Original names, categories, and base designs come from <a href="https://lucide.dev" className="underline underline-offset-4">Lucide</a>. Original ISC and Feather MIT notices are included.</p></section>
    <div className="flex flex-wrap gap-2"><Button asChild><a href="https://www.npmjs.com/package/@yzi-yzi/lucide-extensions" target="_blank" rel="noreferrer">View on npm<LibraryIcon name="arrow-up-right" /></a></Button><Button variant="outline" asChild><a href={repo} target="_blank" rel="noreferrer">View source<LibraryIcon name="arrow-up-right" /></a></Button></div>
  </DialogContent></Dialog>;
}
