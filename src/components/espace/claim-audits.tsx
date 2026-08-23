"use client";

import { useEffect, useState } from "react";
import { claimAudits } from "@/app/auth/actions";
import { anonId, forgetAnonId } from "@/lib/anon-id";

/**
 * Rattache au compte les audits lancés avant l'inscription, une seule fois.
 */
export function ClaimAudits() {
  const [claimed, setClaimed] = useState(0);

  useEffect(() => {
    const id = anonId();
    if (!id) return;

    let cancelled = false;
    claimAudits(id)
      .then((count) => {
        if (cancelled) return;
        forgetAnonId();
        if (count > 0) setClaimed(count);
      })
      .catch(() => {
        // Sans rattachement, l'espace reste utilisable : on ne bloque rien.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (claimed === 0) return null;

  return (
    <p
      role="status"
      className="rounded-sm border border-cobalt bg-cobalt-soft px-5 py-3.5 text-[0.9375rem] text-cobalt"
    >
      {claimed} audit{claimed > 1 ? "s" : ""} lancé{claimed > 1 ? "s" : ""} avant
      ton inscription {claimed > 1 ? "ont" : "a"} été rattaché
      {claimed > 1 ? "s" : ""} à ce compte.
    </p>
  );
}
