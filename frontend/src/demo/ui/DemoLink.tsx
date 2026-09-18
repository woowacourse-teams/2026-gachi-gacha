import type { AnchorHTMLAttributes, MouseEvent } from 'react';

export interface DemoLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  navigate: (href: string) => void;
}

export function DemoLink({
  href,
  navigate,
  children,
  onClick,
  ...props
}: DemoLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target === '_blank'
    )
      return;
    event.preventDefault();
    navigate(href);
  }
  return (
    <a {...props} href={href} onClick={handleClick}>
      {children}
    </a>
  );
}
