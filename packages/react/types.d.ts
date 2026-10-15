import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';
export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  secondaryOpacity?: number;
  title?: string;
}
export type IconComponent = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
