"use client";

import { useEffect, useState } from "react";

/**
 * Compte de 0 jusqu'à la valeur, une fois.
 *
 * Le chiffre est le cœur de la page : le voir se poser attire l'œil dessus
 * mieux que n'importe quel encadré. Trois précautions : c'est court (560 ms),
 * la valeur finale est toujours atteinte exactement, et le rendu serveur
 * affiche déjà le bon nombre — un lecteur sans JavaScript, ou un robot
 * d'indexation, ne doit jamais lire zéro.
 */
export function CountUp({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  // On part de la valeur finale : c'est ce que voit le HTML servi.
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (value <= 0) {
      setShown(value);
      return;
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(value);
      return;
    }

    const DURATION = 560;
    const started = performance.now();
    let frame = 0;

    setShown(0);

    const step = (now: number) => {
      const progress = Math.min((now - started) / DURATION, 1);
      // Décélération : le chiffre arrive vite puis se pose.
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className={className}>{shown}</span>;
}
