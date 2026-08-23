"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Sku } from "@/lib/catalog";

/**
 * Bouton d'achat. Ouvre une session Stripe et redirige.
 *
 * Trois refus possibles, trois messages distincts : pas connecté, paiement
 * pas encore activé, ou panne. Un bouton qui ne fait rien est le pire cas.
 */
export function CheckoutButton({
  sku,
  auditId,
  label,
  variant = "primary",
  size = "lg",
  className,
  onDemo,
}: {
  sku: Sku;
  auditId?: string | null;
  label: string;
  variant?: "primary" | "outline";
  size?: "md" | "lg";
  className?: string;
  /** Utilisé quand le paiement n'est pas branché : déroule la démonstration. */
  onDemo?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, auditId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        url?: string;
        error?: string;
        signIn?: boolean;
      } | null;

      if (response.ok && payload?.url) {
        window.location.assign(payload.url);
        return;
      }

      if (payload?.signIn) {
        router.push("/espace");
        return;
      }

      if (response.status === 503 && onDemo) {
        onDemo();
        setError("Paiement non branché : aperçu de démonstration.");
        return;
      }

      setError(payload?.error ?? "Le paiement n’a pas pu s’ouvrir.");
    } catch {
      setError("Le paiement n’a pas pu s’ouvrir. Réessaie dans un instant.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={className}>
      <Button
        onClick={buy}
        disabled={pending}
        variant={variant}
        size={size}
        className="w-full"
      >
        {pending ? "Ouverture…" : label}
      </Button>
      {error ? (
        <p role="status" className="mt-3 text-[0.8125rem] leading-relaxed text-ink-soft">
          {error}
        </p>
      ) : null}
    </div>
  );
}
