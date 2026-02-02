"use client";

import { useEffect, useRef } from "react";

export function AfricanPattern({ className = "" }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const paths = svgRef.current?.querySelectorAll("path, line, circle");
    paths?.forEach((path, index) => {
      path.setAttribute(
        "style",
        `animation: draw-line 2s ease-out forwards; animation-delay: ${index * 0.1}s; stroke-dasharray: 1000; stroke-dashoffset: 1000;`
      );
    });
  }, []);

  return (
    <svg
      ref={svgRef}
      className={`pointer-events-none ${className}`}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Geometric African-inspired pattern */}
      <g stroke="currentColor" strokeWidth="1" opacity="0.2">
        {/* Concentric diamonds */}
        <path d="M200 50 L350 200 L200 350 L50 200 Z" />
        <path d="M200 80 L320 200 L200 320 L80 200 Z" />
        <path d="M200 110 L290 200 L200 290 L110 200 Z" />
        <path d="M200 140 L260 200 L200 260 L140 200 Z" />
        
        {/* Cross lines */}
        <line x1="200" y1="0" x2="200" y2="400" />
        <line x1="0" y1="200" x2="400" y2="200" />
        
        {/* Corner triangles */}
        <path d="M0 0 L80 0 L0 80 Z" />
        <path d="M400 0 L320 0 L400 80 Z" />
        <path d="M0 400 L80 400 L0 320 Z" />
        <path d="M400 400 L320 400 L400 320 Z" />
        
        {/* Zigzag patterns */}
        <path d="M20 150 L40 130 L60 150 L80 130 L100 150" />
        <path d="M300 150 L320 130 L340 150 L360 130 L380 150" />
        <path d="M20 250 L40 270 L60 250 L80 270 L100 250" />
        <path d="M300 250 L320 270 L340 250 L360 270 L380 250" />
        
        {/* Decorative circles */}
        <circle cx="200" cy="200" r="30" />
        <circle cx="200" cy="200" r="15" fill="currentColor" fillOpacity="0.1" />
        
        {/* Additional lines */}
        <line x1="50" y1="50" x2="150" y2="150" />
        <line x1="350" y1="50" x2="250" y2="150" />
        <line x1="50" y1="350" x2="150" y2="250" />
        <line x1="350" y1="350" x2="250" y2="250" />
      </g>
    </svg>
  );
}
