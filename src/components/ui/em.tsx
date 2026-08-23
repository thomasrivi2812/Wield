import { cn } from "@/lib/cn";

/**
 * Mot-clé mis en avant dans un titre : italique + cobalt.
 * Le seul endroit où l'accent entre dans la typographie.
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
    <em
      className={cn(
        "italic",
        onDark ? "text-cobalt-light" : "text-cobalt",
        className,
      )}
    >
      {children}
    </em>
  );
}
