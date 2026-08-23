import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe as config } from "@/lib/env";
import { stripeClient } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Retour de Stripe.
 *
 * C'est ici, et nulle part ailleurs, qu'un achat devient payé. La page de
 * succès n'est qu'un affichage : un utilisateur peut l'atteindre sans avoir
 * payé, en tapant l'URL. Seule la signature de Stripe fait foi.
 */
export async function POST(request: Request) {
  const stripe = stripeClient();
  if (!stripe || !config.webhookSecret) {
    return NextResponse.json({ error: "webhook inactif" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "signature absente" }, { status: 400 });
  }

  // Le corps doit être lu brut : la signature porte sur les octets exacts.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      config.webhookSecret,
    );
  } catch (cause) {
    // Signature invalide : soit une erreur de configuration, soit quelqu'un
    // qui tente de s'offrir le catalogue. Dans les deux cas, on refuse.
    console.error("[stripe] signature refusée", cause);
    return NextResponse.json({ error: "signature invalide" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    // Les autres événements sont acquittés sans traitement : renvoyer une
    // erreur ferait rejouer Stripe indéfiniment.
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const purchaseId =
    session.metadata?.purchaseId ?? session.client_reference_id ?? null;

  if (!purchaseId) {
    console.error("[stripe] session sans référence d’achat", session.id);
    return NextResponse.json({ received: true });
  }

  const admin = supabaseAdmin();
  if (!admin) {
    // On répond en erreur pour que Stripe rejoue : l'achat est payé mais pas
    // encore enregistré, le perdre serait pire qu'un doublon.
    return NextResponse.json({ error: "base indisponible" }, { status: 500 });
  }

  // `eq status pending` rend l'opération idempotente : Stripe rejoue parfois
  // le même événement, le second passage ne change rien.
  const { error } = await admin
    .from("purchases")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", purchaseId)
    .eq("status", "pending");

  if (error) {
    console.error("[stripe] mise à jour de l’achat", error.message);
    return NextResponse.json({ error: "échec d’enregistrement" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
