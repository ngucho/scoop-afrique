"use client";

interface MarqueeBandProps {
  text: string;
  direction?: "left" | "right";
  className?: string;
  speed?: number;
}

export function MarqueeBand({
  text,
  direction = "left",
  className = "",
  speed = 20,
}: MarqueeBandProps) {
  const repeatedText = Array(10).fill(text).join(" — ");

  return (
    <div
      className={`overflow-hidden whitespace-nowrap border-y border-border bg-secondary py-4 ${className}`}
    >
      <div
        className="inline-flex"
        style={{
          animation: `marquee ${speed}s linear infinite`,
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
      >
        <span className="font-sans text-sm font-bold uppercase tracking-[0.3em] text-foreground">
          {repeatedText}
        </span>
        <span className="ml-8 font-sans text-sm font-bold uppercase tracking-[0.3em] text-foreground">
          {repeatedText}
        </span>
      </div>
    </div>
  );
}
