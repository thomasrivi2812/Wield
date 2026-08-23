import Link from "next/link";
import { cn } from "@/lib/cn";
import { WieldMark } from "./icons";

export function Logo({
  onDark = false,
  className,
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="Wield — accueil"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <WieldMark className={cn("h-[1.375rem] w-[1.375rem] text-cobalt")} />
      <span
        className={cn(
          "font-display text-[1.3125rem] font-bold tracking-[-0.03em]",
          onDark ? "text-ink-invert" : "text-ink",
        )}
      >
        Wield
      </span>
    </Link>
  );
}
