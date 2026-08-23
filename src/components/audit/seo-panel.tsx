"use client";

import { useEffect, useState } from "react";
import type { Check, SeoScan } from "@/lib/seo/scan";

/**
 * Le scan technique, lancé à la demande après paiement.
 *
 * Il sort du serveur vers le site audité, ce qui prend une dizaine de
 * secondes : le déclencher au chargement de la page bloquerait l'affichage
 * juste après le paiement, au pire moment.
 */
export function SeoPanel({
  auditId,
  initial,
}: {
  auditId: string;
  initial: SeoScan | null;
}) {
  const [scan, setScan] = useState<SeoScan | null>(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scan) return;

    const controller = new AbortController();
    fetch(`/api/audit/${auditId}/seo`, {
      method: "POST",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            (payload as { error?: string } | null)?.error ??
              "Le scan n’a pas abouti.",
          );
        }
        setScan(payload as SeoScan);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Le scan n’a pas abouti.");
      });

    return () => controller.abort();
  }, [auditId, scan]);

  if (error) {
    return (
      <p role="status" className="text-[0.9375rem] leading-relaxed text-ink-soft">
        {error} Ton achat est enregistré : recharge la page pour relancer le scan.
      </p>
    );
  }

  if (!scan) {
    return (
      <p
        aria-live="polite"
        className="text-[0.9375rem] leading-relaxed text-ink-soft"
      >
        Analyse technique de ton site en cours… Une dizaine de secondes.
      </p>
    );
  }

  if (!scan.reachable) {
    return (
      <div>
        <p className="text-[0.9375rem] leading-relaxed text-ink">
          Ton site n’a pas pu être analysé.
        </p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
          {scan.failure} Aucune vérification n’est affichée : un rapport qui
          invente des défauts ne vaut rien. Écris-nous depuis ton espace, on
          regarde à la main.
        </p>
      </div>
    );
  }

  return <ChecksList checks={scan.checks} url={scan.url} scannedAt={scan.scannedAt} />;
}

const TONE: Record<Check["status"], { label: string; className: string }> = {
  ok: { label: "Conforme", className: "text-cobalt" },
  warn: { label: "À améliorer", className: "text-ink-soft" },
  fail: { label: "Manquant", className: "font-semibold text-ink" },
  unknown: { label: "Non vérifié", className: "text-absent" },
};

export function ChecksList({
  checks,
  url,
  scannedAt,
}: {
  checks: Check[];
  url: string;
  scannedAt: string;
}) {
  const failing = checks.filter((c) => c.status === "fail").length;

  return (
    <div>
      <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
        {url} — {checks.length} vérifications,{" "}
        <span className={failing > 0 ? "font-display font-semibold text-ink" : ""}>
          {failing} bloquante{failing > 1 ? "s" : ""}
        </span>
        .
      </p>

      <ul className="mt-6 divide-y divide-line border-y border-line">
        {checks.map((check) => {
          const tone = TONE[check.status];
          return (
            <li key={check.id} className="py-4">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-display text-[1rem] font-semibold text-ink">
                  {check.label}
                </span>
                <span
                  className={`ml-auto shrink-0 text-[0.8125rem] ${tone.className}`}
                >
                  {tone.label}
                </span>
              </div>
              <p className="mt-1.5 max-w-[70ch] text-[0.875rem] leading-relaxed text-ink-soft">
                {check.note}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-[0.75rem] text-absent">
        Relevé le{" "}
        {new Date(scannedAt).toLocaleString("fr-FR", {
          dateStyle: "long",
          timeStyle: "short",
        })}
        .
      </p>
    </div>
  );
}
