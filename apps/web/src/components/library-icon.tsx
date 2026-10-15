import { createContext, useContext, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { iconUrl, type IconStyle } from '@/lib/catalog';

export const IconStyleContext = createContext<IconStyle>('filled');

// Use the library's own SVGs as alpha masks, retaining the duotone secondary layer.
export function LibraryIcon({ name, className, style, ...props }: ComponentProps<'span'> & { name: string }) {
  const variant = useContext(IconStyleContext);
  return <span {...props} aria-hidden="true" className={cn('inline-block size-4 shrink-0 bg-current', className)}
    style={{ mask: `url("${iconUrl(name, variant)}") center / contain no-repeat`, ...style }} />;
}

export function XIcon({ className, ...props }: ComponentProps<'span'>) {
  return <LibraryIcon name="x" className={className} {...props} />;
}
