import { createRef } from 'react';
import { Heart, type IconProps } from '@yzi-yzi/lucide-extensions/react/filled';
import Star from '@yzi-yzi/lucide-extensions/react/duotone/star';
import svg from '@yzi-yzi/lucide-extensions/core/filled/heart';
const props: IconProps = { size: 32, secondaryOpacity: 0.4, color: 'red', title: 'Favorite' };
const ref = createRef<SVGSVGElement>();
export const icons = [<Heart {...props} ref={ref} />, <Star aria-label="Star" />];
export const raw: string = svg;
