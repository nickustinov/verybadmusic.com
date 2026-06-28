import { cn } from "@/lib/utils";

/**
 * Vintage cassette built on the optimised HF-S90 photo (public/cassette.webp):
 * the photo is the shell, two CSS hubs sit over the reel windows and spin while
 * playing. Hub size/positions are CSS vars on `.cassette` (see globals.css) so
 * they can be nudged without touching markup. Only rendered in the cassette skin.
 */
export function Cassette({
  playing,
  label,
  className,
}: {
  playing?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("cassette", playing && "is-playing", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/cassette.webp" alt="" className="cassette-shell" />
      {label ? <span className="cassette-label">{label}</span> : null}
      <span className="cassette-reel cassette-reel--l" aria-hidden />
      <span className="cassette-reel cassette-reel--r" aria-hidden />
    </div>
  );
}
