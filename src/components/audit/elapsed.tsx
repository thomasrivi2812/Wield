"use client";

import { useEffect, useState } from "react";

/**
 * Le temps écoulé depuis le début de l'audit.
 *
 * C'est la seule information honnête qu'on puisse donner sur l'attente : on
 * ne connaît pas la durée totale, elle dépend des moteurs. Afficher un
 * pourcentage inventé serait plus rassurant et plus faux.
 */
export function Elapsed() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(
      () => setSeconds(Math.floor((Date.now() - started) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  if (seconds < 1) return null;

  const minutes = Math.floor(seconds / 60);
  return (
    <span className="tabular-nums">
      {minutes > 0 ? `${minutes} min ${seconds % 60} s` : `${seconds} s`}
    </span>
  );
}
