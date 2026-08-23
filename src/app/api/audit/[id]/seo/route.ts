import { NextResponse } from "next/server";
import { loadAudit } from "@/lib/audit/store";
import { clientIp, consume } from "@/lib/rate-limit";
import { scanSite } from "@/lib/seo/scan";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Le scan enchaîne plusieurs requêtes vers le site audité. */
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Lance le scan technique d'un site, une fois l'audit SEO payé.
 *
 * Il tourne à la demande plutôt qu'au moment du paiement : le webhook Stripe
 * doit rester court, et un scan peut prendre une quinzaine de secondes.
 * Le résultat est écrit en base : il est payé une fois, pas à chaque visite.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const audit = await loadAudit(id);
  if (!audit) {
    return NextResponse.json({ error: "Audit introuvable." }, { status: 404 });
  }

  // Un audit qu'on ne possède pas est traité comme inexistant : répondre
  // « accès refusé » confirmerait au passage que l'identifiant est valide.
  if (!audit.access.seo) {
    return NextResponse.json({ error: "Audit introuvable." }, { status: 404 });
  }

  if (audit.seo) return NextResponse.json(audit.seo);

  if (!audit.domain) {
    return NextResponse.json(
      { error: "Aucun domaine n’a été fourni au lancement de l’audit." },
      { status: 400 },
    );
  }

  // Le scan sort du serveur vers un site tiers : on borne, même pour un client
  // qui a payé.
  const verdict = await consume(`seo:${clientIp(request)}`, 10, 60 * 60);
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: "Trop de scans depuis cette adresse. Réessaie dans une heure." },
      { status: 429 },
    );
  }

  const scan = await scanSite(audit.domain);

  const admin = supabaseAdmin();
  if (admin) {
    // Un site injoignable est enregistré tel quel : sans cette trace, chaque
    // rechargement relancerait le scan sur un site qui ne répond pas.
    const { error } = await admin
      .from("audits")
      .update({ seo_scan: scan, seo_scanned_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.error("[seo] enregistrement du scan", error.message);
  }

  return NextResponse.json(scan);
}
