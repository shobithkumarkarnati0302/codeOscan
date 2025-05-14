
import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="120"
      height="30"
      aria-label="Code Complexity Analyzer Logo"
      {...props}
    >
      <style>
        {`
          .logo-text { font-family: 'Geist Mono', 'Consolas', 'Monaco', monospace; font-size: 24px; fill: hsl(var(--primary)); }
          .logo-highlight { fill: hsl(var(--foreground)); }
        `}
      </style>
      <text x="10" y="35" className="logo-text">
        <tspan className="logo-highlight">&lt;/&gt;</tspan> CCA
      </text>
    </svg>
  );
}