import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconBase({ size = 22, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HelicopterIcon(props: IconProps) {
  return <IconBase {...props}><path d="M4 15h11.5a4.5 4.5 0 0 0 4.2-2.9L20 11H9.5L7.6 8.4A1 1 0 0 0 6.8 8H5l1.8 3H4a2 2 0 0 0 0 4Z"/><path d="M13 11 10 6h3l4 5"/><path d="M12 6V3"/><path d="M7 3h10"/><path d="M7 15l-2 3"/><path d="M16 15l2 3"/><path d="M3 18h16"/></IconBase>;
}

export function OffshorePlusLogo({ size = 28, ...props }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" {...props}>
    <path d="M7 34h34M11 34l4-14h18l4 14M13 27h22M18 20v14M30 20v14" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 20h20l-4-5H18l-4 5Z" fill="currentColor"/>
    <path d="M27 15V8h4v7" fill="currentColor"/>
    <path d="M29 8c-2-2.8.2-4.3 1.7-5.7-.1 2 2.3 2.8 1.7 5.7" fill="var(--accent)" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M39 7v9M34.5 11.5h9" stroke="var(--accent)" strokeWidth="3.4" strokeLinecap="round"/>
    <path d="M9 39h30" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" opacity=".7"/>
  </svg>;
}
export function FlameIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 22c4.4 0 7-3 7-7 0-3.4-2-5.8-4.4-8.4.2 2.4-.8 3.8-2.1 4.7.2-3.5-1.7-6.2-4.8-9.3.2 4.3-2.7 6.2-2.7 10.5C5 18.1 8.1 22 12 22Z"/><path d="M9.5 16.5c0 2 1 3.5 2.5 3.5s2.5-1.2 2.5-3c0-1.3-.7-2.3-1.6-3.2 0 1-.4 1.7-1 2.1-.1-1.3-.8-2.4-2-3.6.1 1.6-.4 2.6-.4 4.2Z"/></IconBase>;
}
export function CalendarIcon(props: IconProps) {
  return <IconBase {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></IconBase>;
}
export function SettingsIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.4.25.75.6 1 1 .25.35.39.78.4 1.2V11h.2v4h-.09a1.7 1.7 0 0 0-1.51 0Z"/></IconBase>;
}
export function HomeIcon(props: IconProps) {
  return <IconBase {...props}><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M9 21v-7h6v7"/></IconBase>;
}
export function InfoIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></IconBase>;
}
export function SunIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></IconBase>;
}
export function MoonIcon(props: IconProps) {
  return <IconBase {...props}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8Z"/></IconBase>;
}
export function ChevronRightIcon(props: IconProps) {
  return <IconBase {...props}><path d="m9 18 6-6-6-6"/></IconBase>;
}
