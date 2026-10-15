import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LibraryIcon } from '@/components/library-icon';
import { defaults, type Customization, type IconStyle } from '@/lib/catalog';

export function StylePicker({ value, onChange }: { value: IconStyle; onChange: (style: IconStyle) => void }) {
  return <Tabs value={value} onValueChange={value => onChange(value as IconStyle)}>
    <TabsList className="grid w-full grid-cols-2" aria-label="Icon style">
      <TabsTrigger value="filled">Filled</TabsTrigger>
      <TabsTrigger value="duotone">Duotone</TabsTrigger>
    </TabsList>
  </Tabs>;
}

export function Customizer({ settings, onChange }: { settings: Customization; onChange: (settings: Customization) => void }) {
  const id = useId();
  const [draftColor, setDraftColor] = useState(settings.color);
  const [colorError, setColorError] = useState(false);
  useEffect(() => { setDraftColor(settings.color); setColorError(false); }, [settings.color]);
  function updateColor(value: string) {
    setDraftColor(value);
    const valid = !value || /^#[\da-f]{6}$/i.test(value);
    setColorError(!valid);
    if (valid) onChange({ ...settings, color: value });
  }
  return <section className="space-y-5" aria-label="Icon customizer">
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold">Customizer</h2>
      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Reset style" onClick={() => { onChange({ ...defaults, style: settings.style }); setDraftColor(''); setColorError(false); }}><LibraryIcon name="rotate-ccw" /></Button></TooltipTrigger><TooltipContent>Reset customization</TooltipContent></Tooltip>
    </div>
    <div className="space-y-2"><Label>Style</Label><StylePicker value={settings.style} onChange={style => onChange({ ...settings, style })} /></div>
    <div className="space-y-2">
      <Label htmlFor={`${id}-color`}>Color</Label>
      <div className="flex gap-2">
        <Input className="size-9 shrink-0 p-1" aria-label="Choose icon color" type="color" value={settings.color || '#404040'} onChange={event => updateColor(event.target.value)} />
        <Input id={`${id}-color`} aria-label="Icon color hex value" aria-invalid={colorError} aria-describedby={colorError ? `${id}-color-error` : undefined} value={draftColor} onChange={event => updateColor(event.target.value.trim())} placeholder="currentColor" maxLength={7} spellCheck={false} className="min-w-0 font-mono text-xs" />
      </div>
      {colorError && <p id={`${id}-color-error`} className="text-xs text-destructive">Use a six-digit hex, e.g. #e76e6e.</p>}
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between"><Label htmlFor={`${id}-size`}>Size</Label><output className="text-xs tabular-nums text-muted-foreground">{settings.size}px</output></div>
      <Slider id={`${id}-size`} aria-label="Icon size" min={16} max={48} step={1} value={[settings.size]} onValueChange={([size]) => onChange({ ...settings, size })} />
    </div>
    {settings.style === 'duotone' && <div className="space-y-3">
      <div className="flex items-center justify-between"><Label htmlFor={`${id}-opacity`}>Secondary opacity</Label><output className="text-xs tabular-nums text-muted-foreground">{settings.opacity}%</output></div>
      <Slider id={`${id}-opacity`} aria-label="Secondary opacity" min={5} max={60} step={1} value={[settings.opacity]} onValueChange={([opacity]) => onChange({ ...settings, opacity })} />
    </div>}
    <div className="flex items-center justify-between"><Label htmlFor={`${id}-names`}>Show names</Label><Switch id={`${id}-names`} checked={settings.names} onCheckedChange={names => onChange({ ...settings, names })} /></div>
  </section>;
}
