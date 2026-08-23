import { cn } from "@/lib/cn";

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Bloc verrouillé : on laisse voir la forme du contenu, jamais sa valeur.
 * Le contenu masqué est retiré de l'ordre de tabulation et de l'arbre
 * d'accessibilité — un lecteur d'écran ne doit pas lire ce qui est payant.
 */
export function Masked({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("relative select-none overflow-hidden", className)}
      aria-hidden="true"
    >
      <div className="pointer-events-none blur-[5px] saturate-0 opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/40 to-surface" />
    </div>
  );
}

export function TierBadge({
  tone,
  children,
}: {
  tone: "free" | "paid";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "eyebrow inline-flex items-center gap-1.5 rounded-xs px-2.5 py-1.5",
        tone === "free"
          ? "bg-cobalt-soft text-cobalt"
          : "border border-line text-ink-soft",
      )}
    >
      {children}
    </span>
  );
}
