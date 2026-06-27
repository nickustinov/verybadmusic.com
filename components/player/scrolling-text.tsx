"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Shows text on one line; if it doesn't fit, it scrolls (marquee) instead of
 * being cut off. Measurement happens in a ResizeObserver callback so it adapts
 * to container/text changes. Uses only spans so it's valid inside a button.
 */
export function ScrollingText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLSpanElement>(null);
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = React.useState(false);

  React.useEffect(() => {
    const update = () => {
      const container = containerRef.current;
      const text = textRef.current;
      if (container && text) {
        setOverflow(text.scrollWidth > container.clientWidth + 2);
      }
    };
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    if (textRef.current) observer.observe(textRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={containerRef} className={cn("block overflow-hidden", className)}>
      <span
        className={cn("inline-flex w-max whitespace-nowrap", overflow && "marquee")}
      >
        <span ref={textRef} className={cn(overflow && "pr-10")}>
          {children}
        </span>
        {overflow ? (
          <span aria-hidden className="pr-10">
            {children}
          </span>
        ) : null}
      </span>
    </span>
  );
}
