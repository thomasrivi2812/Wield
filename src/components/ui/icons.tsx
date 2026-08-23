import { cn } from "@/lib/cn";

export function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("h-4 w-4", className)}>
      <path
        d="M3 8.5 6.2 12 13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function IconCross({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("h-4 w-4", className)}>
      <path
        d="m4 4 8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function IconArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn("h-4 w-4", className)}>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="square"
      />
    </svg>
  );
}

/** Marque Wield : le biseau du ciseau à bois — un outil, pas un cerveau. */
export function WieldMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("h-6 w-6", className)}>
      <path d="M2 2h11.5L22 22H10.5L2 2Z" fill="currentColor" />
      <path d="M2 2h11.5L22 22" fill="none" stroke="currentColor" strokeWidth="0" />
      <path d="M8.6 8.2 14.9 22h-4.4L6.1 11.7l2.5-3.5Z" fill="#F6F7F9" opacity="0.22" />
    </svg>
  );
}
