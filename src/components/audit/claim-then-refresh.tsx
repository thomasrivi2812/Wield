"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { claimAudits } from "@/app/auth/actions";
import { anonId, forgetAnonId } from "@/lib/anon-id";

/**
 * Rattache l'audit lancé avant l'inscription, puis rafraîchit la page.
 *
 * Sans ça, quelqu'un qui lance un audit, se connecte, et revient sur cette
 * page reste devant le mur de connexion alors qu'il vient de créer son compte.
 */
export function ClaimThenRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = anonId();
    if (!id) return;

    let cancelled = false;
    claimAudits(id)
      .then((count) => {
        if (cancelled) return;
        forgetAnonId();
        if (count > 0) router.refresh();
      })
      .catch(() => {
        // Le score reste visible : on ne casse pas la page pour ça.
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
