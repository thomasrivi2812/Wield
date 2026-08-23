import { cn } from "@/lib/cn";

/**
 * Mot-clé mis en avant dans un titre.
 * Le mot reste à l'encre ; c'est un trait de cobalt tiré dessous qui le marque —
 * le geste de l'atelier, pas l'italique bleue de toutes les pages d'IA.
 */
export function Em({
  children,
  onDark = false,
  className,
}: {
  children: React.ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "underline decoration-[0.07em] underline-offset-[0.16em]",
        "[text-decoration-skip-ink:none]",
        onDark
          ? "text-ink-invert decoration-cobalt-light"
          : "text-ink decoration-cobalt",
        className,
      )}
    >
      {children}
    </span>
  );
}
