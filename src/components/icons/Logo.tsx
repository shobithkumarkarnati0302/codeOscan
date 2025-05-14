
import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 50" // Consistent viewBox
      width="176"      // Consistent default width (maintains 220/50 aspect ratio for height 40)
      height="40"     // Consistent default height
      aria-label="CodeOscan Logo"
      {...props} // Allows overriding width/height for specific instances like on the homepage
    >
      <style>
        {`
          .logo-text-main { 
            font-family: 'Geist Sans', var(--font-geist-sans), Arial, sans-serif;
            font-size: 28px; 
            font-weight: 600;
            fill: hsl(var(--foreground)); 
            letter-spacing: -0.5px;
          }
          .logo-text-highlight { 
            fill: hsl(var(--primary)); 
            font-weight: 700;
          }
        `}
      </style>
      <text x="10" y="36" className="logo-text-main">
        Code<tspan className="logo-text-highlight">O</tspan>scan
      </text>
    </svg>
  );
}
