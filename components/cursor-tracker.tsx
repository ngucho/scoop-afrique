"use client";

import { useEffect, useState, useCallback } from "react";

interface TrailDot {
  id: number;
  x: number;
  y: number;
  opacity: number;
}

export function CursorTracker() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<TrailDot[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
    setIsVisible(true);
    
    setTrail(prev => {
      const newTrail = [
        { id: Date.now(), x: e.clientX, y: e.clientY, opacity: 1 },
        ...prev.slice(0, 8).map(dot => ({ ...dot, opacity: dot.opacity * 0.85 }))
      ].filter(dot => dot.opacity > 0.1);
      return newTrail;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    const checkHover = () => {
      const hoveredElements = document.querySelectorAll(
        "a:hover, button:hover, [data-hover]:hover"
      );
      setIsHovering(hoveredElements.length > 0);
    };

    const interval = setInterval(checkHover, 50);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearInterval(interval);
    };
  }, [handleMouseMove, handleMouseLeave]);

  if (typeof window === "undefined") return null;

  return (
    <>
      {/* Trail dots */}
      {trail.map((dot, index) => (
        <div
          key={dot.id}
          className="pointer-events-none fixed z-[9998] rounded-full bg-primary mix-blend-difference"
          style={{
            left: dot.x,
            top: dot.y,
            width: 8 - index * 0.5,
            height: 8 - index * 0.5,
            opacity: dot.opacity * 0.5,
            transform: "translate(-50%, -50%)",
            transition: "opacity 0.1s ease-out",
          }}
        />
      ))}

      {/* Main cursor */}
      <div
        className={`pointer-events-none fixed z-[9999] mix-blend-difference transition-all duration-150 ease-out ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Outer ring */}
        <div
          className={`absolute rounded-full border-2 border-primary transition-all duration-300 ${
            isHovering ? "h-16 w-16 opacity-100" : "h-10 w-10 opacity-70"
          }`}
          style={{
            transform: "translate(-50%, -50%)",
            left: "50%",
            top: "50%",
          }}
        />
        
        {/* Inner dot */}
        <div
          className={`absolute rounded-full bg-primary transition-all duration-150 ${
            isHovering ? "h-3 w-3" : "h-2 w-2"
          }`}
          style={{
            transform: "translate(-50%, -50%)",
            left: "50%",
            top: "50%",
          }}
        />
      </div>
    </>
  );
}
