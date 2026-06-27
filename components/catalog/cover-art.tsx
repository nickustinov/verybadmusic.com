import { cn } from "@/lib/utils";

/** Cover image, or a brutalist diagonal-hatch placeholder when none is set. */
export function CoverArt({
  src,
  className,
}: {
  src?: string;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        loading="lazy"
        className={cn("size-full object-cover", className)}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        "size-full bg-muted bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,var(--border)_5px,var(--border)_6px)]",
        className,
      )}
    />
  );
}
