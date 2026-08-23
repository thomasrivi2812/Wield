import { buildPlan, type Action } from "./plan";
import { isUuid } from "@/lib/uuid";
import type { SeoScan } from "@/lib/seo/scan";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Lecture d'un audit enregistré, avec ses trois niveaux d'accès.
 *
 * Ce module lit avec la clé de service, qui contourne RLS. C'est assumé : la
 * page doit pouvoir montrer le score à quelqu'un qui n'a pas encore de compte.
 * En contrepartie, chaque niveau au-dessus du score est refusé ici, en clair,
 * et le contenu correspondant n'est même pas chargé — ce qui n'est pas lu ne
 * peut pas fuiter dans le HTML.
 */

export type Access = {
  /** Connecté et propriétaire de l'audit : donne le détail des six questions. */
  owner: boolean;
  /** A payé le plan d'action pour cet audit. */
  plan: boolean;
  /** A payé l'audit SEO + GEO, ou le pack. */
  seo: boolean;
};

export type StoredEngine = {
  engine: string;
  label: string;
  status: string;
  detail: string;
};

export type StoredPrompt = {
  engine: string;
  prompt: string;
  cited: boolean;
  position: number | null;
  winners: string[];
};

export type StoredAudit = {
  id: string;
  query: string;
  brand: string | null;
  domain: string | null;
  citedCount: number;
  measuredCount: number;
  createdAt: string;
  engines: StoredEngine[];
  /** Null quand le visiteur n'est pas propriétaire : rien n'est chargé. */
  prompts: StoredPrompt[] | null;
  plan: Action[] | null;
  seo: SeoScan | null;
  /** Vrai quand le SEO est payé mais que le scan n'a pas encore tourné. */
  seoPending: boolean;
  access: Access;
};

const LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  perplexity: "Perplexity",
  gemini: "Gemini",
};

/** Ce qui donne droit au plan d'action, et ce qui donne droit au SEO. */
const PLAN_SKUS = ["report_geo", "audit_seo_geo", "pack"];
const SEO_SKUS = ["audit_seo_geo", "pack"];

export type PaidPurchase = { sku: string; audit_id: string | null };

/**
 * La décision d'accès, isolée du reste pour être vérifiable.
 *
 * Elle ne reçoit que des achats déjà filtrés sur `status = 'paid'` : un achat
 * en attente ne débloque rien, et c'est le webhook Stripe — pas la page de
 * retour — qui fait passer une ligne en payé.
 */
export function grantAccess(
  auditOwnerId: string | null,
  auditId: string,
  userId: string | null,
  paidPurchases: PaidPurchase[],
): Access {
  const owner = Boolean(userId && auditOwnerId && auditOwnerId === userId);
  const access: Access = { owner, plan: false, seo: false };
  if (!owner) return access;

  for (const purchase of paidPurchases) {
    // Le pack couvre tous les audits du compte ; un rapport à l'unité ne
    // couvre que l'audit auquel il a été rattaché au moment du paiement.
    const covers = purchase.sku === "pack" || purchase.audit_id === auditId;
    if (!covers) continue;
    if (PLAN_SKUS.includes(purchase.sku)) access.plan = true;
    if (SEO_SKUS.includes(purchase.sku)) access.seo = true;
  }

  return access;
}

export async function loadAudit(id: string): Promise<StoredAudit | null> {
  if (!isUuid(id)) return null;

  const admin = supabaseAdmin();
  if (!admin) return null;

  const { data: audit } = await admin
    .from("audits")
    .select(
      "id, user_id, query, brand, domain, cited_count, measured_count, created_at, seo_scan, seo_scanned_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!audit) return null;

  const session = await getSession();
  const userId = session.state === "signed-in" ? session.user.id : null;
  let paidPurchases: PaidPurchase[] = [];
  if (userId && audit.user_id === userId) {
    const { data } = await admin
      .from("purchases")
      .select("sku, audit_id")
      .eq("user_id", userId)
      .eq("status", "paid");
    paidPurchases = (data ?? []) as PaidPurchase[];
  }

  const access = grantAccess(audit.user_id, id, userId, paidPurchases);

  const { data: engineRows } = await admin
    .from("audit_engines")
    .select("engine, status, detail")
    .eq("audit_id", id);

  const engines: StoredEngine[] = (engineRows ?? []).map((row) => ({
    engine: row.engine,
    label: LABELS[row.engine] ?? row.engine,
    status: row.status,
    // Les messages d'erreur des fournisseurs restent en base, jamais à l'écran.
    detail: row.status === "error" ? "moteur momentanément indisponible" : (row.detail ?? ""),
  }));
  engines.sort((a, b) => a.label.localeCompare(b.label));

  let prompts: StoredPrompt[] | null = null;
  if (access.owner) {
    const { data: promptRows } = await admin
      .from("audit_prompts")
      .select("engine, prompt, cited, position, winners")
      .eq("audit_id", id)
      .order("id", { ascending: true });

    prompts = (promptRows ?? []).map((row) => ({
      engine: row.engine,
      prompt: row.prompt,
      cited: row.cited,
      position: row.position,
      winners: row.winners ?? [],
    }));
  }

  const plan =
    access.plan && prompts
      ? buildPlan({
          query: audit.query,
          brand: audit.brand,
          citedCount: audit.cited_count ?? 0,
          measuredCount: audit.measured_count ?? 0,
          engines,
          prompts,
        })
      : null;

  const seo = access.seo ? ((audit.seo_scan as SeoScan | null) ?? null) : null;

  return {
    id: audit.id,
    query: audit.query,
    brand: audit.brand,
    domain: audit.domain,
    citedCount: audit.cited_count ?? 0,
    measuredCount: audit.measured_count ?? 0,
    createdAt: audit.created_at,
    engines,
    prompts,
    plan,
    seo,
    seoPending: access.seo && !audit.seo_scanned_at && Boolean(audit.domain),
    access,
  };
}

/**
 * Un audit sans moteur mesuré n'a pas de plan à vendre.
 * La page s'en sert pour retirer les boutons d'achat plutôt que d'encaisser
 * pour un rapport vide.
 */
export function isSellable(audit: StoredAudit): boolean {
  return audit.measuredCount > 0;
}

