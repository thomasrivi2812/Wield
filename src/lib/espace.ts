import type { User } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import {
  TIER_LABELS,
  type Audit,
  type EspaceData,
  type Message,
  type Resource,
} from "@/components/espace/data";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Charge l'espace d'un compte. Toutes les lectures passent par le client
 * utilisateur : c'est RLS qui garantit le cloisonnement, pas ce fichier.
 */
export async function loadEspace(user: User): Promise<EspaceData> {
  const client = await supabaseServer();
  if (!client) throw new Error("Supabase non configuré");

  const [audits, purchases, thread] = await Promise.all([
    loadAudits(client),
    loadResources(client),
    loadThread(client),
  ]);

  const profile = await client
    .from("profiles")
    .select("company")
    .eq("id", user.id)
    .maybeSingle();

  return {
    account: {
      name: user.email ?? "Ton compte",
      company: profile.data?.company ?? user.email ?? "Ton entreprise",
      plan: purchases.length ? "Achats en cours" : "Aucun achat",
    },
    audits,
    resources: purchases,
    thread,
    demo: false,
  };
}

type Client = NonNullable<Awaited<ReturnType<typeof supabaseServer>>>;

async function loadAudits(client: Client): Promise<Audit[]> {
  const { data, error } = await client
    .from("audits")
    .select("id, created_at, query, cited_count, measured_count, tier, is_automatic")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[espace] audits", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    date: DATE.format(new Date(row.created_at as string)),
    query: row.query as string,
    score: (row.cited_count as number | null) ?? 0,
    max: (row.measured_count as number | null) ?? 0,
    tier: TIER_LABELS[row.tier as string] ?? (row.tier as string),
    auto: Boolean(row.is_automatic),
  }));
}

async function loadResources(client: Client): Promise<Resource[]> {
  const { data, error } = await client
    .from("purchases")
    .select("sku, created_at, status")
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[espace] achats", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    kind: (row.sku as string).startsWith("guide") ? "Guide" : "Rapport",
    title: row.sku as string,
    meta: `Acheté le ${DATE.format(new Date(row.created_at as string))}`,
    action: "Télécharger",
  }));
}

async function loadThread(client: Client): Promise<Message[]> {
  const { data: thread } = await client
    .from("threads")
    .select("id")
    .maybeSingle();

  if (!thread) return [];

  const { data, error } = await client
    .from("messages")
    .select("author, body, created_at")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("[espace] messages", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    from: row.author === "user" ? "me" : "team",
    author: row.author === "user" ? "Toi" : "Équipe Wield",
    time: DATE.format(new Date(row.created_at as string)),
    body: row.body as string,
  }));
}
