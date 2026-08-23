import { NextResponse } from "next/server";
import { CATALOG, isSku } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";
import { getSession } from "@/lib/session";
import { stripeClient } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Ouvre une session de paiement.
 *
 * Le prix vient du catalogue, jamais du corps de la requête : sinon
 * n'importe qui achèterait le pack à un centime.
 */
export async function POST(request: Request) {
  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json(
      { error: "Le paiement n’est pas encore activé sur ce déploiement." },
      { status: 503 },
    );
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Base indisponible : impossible d’enregistrer l’achat." },
      { status: 503 },
    );
  }

  const session = await getSession();
  if (session.state !== "signed-in") {
    return NextResponse.json(
      { error: "Connecte-toi avant d’acheter.", signIn: true },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!isSku(body?.sku)) {
    return NextResponse.json({ error: "Référence inconnue." }, { status: 400 });
  }

  const product = CATALOG[body.sku];
  const auditId = typeof body.auditId === "string" ? body.auditId : null;

  // La ligne est créée avant la redirection : le webhook doit pouvoir la
  // retrouver même si le client ferme son onglet en cours de paiement.
  const { data: purchase, error } = await admin
    .from("purchases")
    .insert({
      user_id: session.user.id,
      audit_id: auditId,
      sku: product.sku,
      amount_cents: product.amountCents,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !purchase) {
    console.error("[checkout] création de l’achat", error?.message);
    return NextResponse.json(
      { error: "Impossible d’ouvrir le paiement." },
      { status: 500 },
    );
  }

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: product.mode,
      customer_email: session.user.email ?? undefined,
      client_reference_id: purchase.id,
      // Repris tel quel dans le webhook : c'est le lien entre Stripe et la base.
      metadata: { purchaseId: purchase.id, sku: product.sku },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: product.amountCents,
            product_data: {
              name: product.name,
              description: product.description,
            },
            ...(product.mode === "subscription"
              ? { recurring: { interval: "month" as const } }
              : {}),
          },
        },
      ],
      success_url: `${siteUrl}/espace?achat=ok`,
      cancel_url: `${siteUrl}/espace?achat=annule`,
    });

    if (!checkout.url) throw new Error("Stripe n’a pas renvoyé d’URL");

    await admin
      .from("purchases")
      .update({ stripe_session_id: checkout.id })
      .eq("id", purchase.id);

    return NextResponse.json({ url: checkout.url });
  } catch (cause) {
    console.error("[checkout] session Stripe", cause);
    await admin.from("purchases").delete().eq("id", purchase.id);
    return NextResponse.json(
      { error: "Impossible d’ouvrir le paiement." },
      { status: 502 },
    );
  }
}
