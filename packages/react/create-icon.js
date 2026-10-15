import { createElement, forwardRef } from 'react';

/** Builds an accessible, ref-forwarding component from the approved SVG nodes. */
export function createIcon(name, nodes) {
  const Icon = forwardRef(function Icon({ size = 24, color = 'currentColor', secondaryOpacity = 0.22, title, children, ...props }, ref) {
    const labeled = title || props['aria-label'] || props['aria-labelledby'];
    const renderNode = ([tag, attributes, children], key) => createElement(tag, {
      ...attributes,
      ...(attributes.opacity === '0.22' ? { opacity: secondaryOpacity } : {}),
      key,
    }, ...children.map(renderNode));
    return createElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: '0 0 24 24',
      color, 'aria-hidden': labeled ? undefined : true, role: labeled ? 'img' : undefined,
      'aria-label': title || undefined, focusable: 'false', ...props, ref,
    }, title ? createElement('title', null, title) : null, ...nodes.map(renderNode), children);
  });
  Icon.displayName = name;
  return Icon;
}
