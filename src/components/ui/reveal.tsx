"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Révèle son contenu quand il entre dans le champ.
 *
 * Trois précautions, dans l'ordre d'importance :
 *
 * 1. Sans JavaScript, le contenu doit rester visible. La règle `.reveal` le
 *    masque au départ ; une balise `noscript` dans la mise en page annule ce
 *    masquage. Un site dont le texte disparaît quand un script échoue est
 *    cassé, pas animé.
 * 2. Une seule fois. Un élément qui rejoue son animation à chaque passage
 *    devient un tic.
 * 3. L'observation s'arrête dès que l'élément est montré : rien ne continue
 *    à tourner en fond sur une page longue.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: React.ReactNode;
  /** Décalage en millisecondes, pour échelonner une série. */
  delay?: number;
  as?: "div" | "section" | "li" | "article" | "p" | "header" | "figure" | "ul";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || shown) return;

    // Navigateur sans IntersectionObserver : on montre, sans animer.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const reached = entries.some(
          (entry) =>
            entry.isIntersecting ||
            // Déjà dépassé. Un défilement rapide — une inertie sur mobile, un
            // saut par ancre — peut faire entrer puis sortir un élément entre
            // deux relevés : sans ce test, il reste invisible pour de bon.
            entry.boundingClientRect.bottom < 0,
        );
        if (reached) {
          setShown(true);
          observer.disconnect();
        }
      },
      // La marge basse déclenche un peu avant l'entrée réelle : le mouvement
      // est terminé quand le lecteur arrive dessus.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-shown={shown ? "true" : "false"}
      className={cn("reveal", className)}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
