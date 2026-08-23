"use server";

import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { safeNext } from "@/lib/safe-next";

export type AuthResult = { ok: boolean; message: string };

const UNCONFIGURED: AuthResult = {
  ok: false,
  message:
    "La connexion n’est pas encore branchée sur ce déploiement. Ajoute les clés Supabase pour l’activer.",
};

/** Lien magique par e-mail. Aucun mot de passe à retenir ni à fuiter. */
export async function signInWithEmail(
  _previous: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const client = await supabaseServer();
  if (!client) return UNCONFIGURED;

  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { ok: false, message: "Indique une adresse e-mail valide." };
  }

  const next = safeNext(String(formData.get("next") ?? ""));
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error("[auth] lien e-mail", error.message);
    return {
      ok: false,
      message: "L’envoi a échoué. Réessaie dans un instant.",
    };
  }

  return {
    ok: true,
    message: `Lien envoyé à ${email}. Ouvre-le depuis cet appareil.`,
  };
}

/** OAuth Google. Redirige vers le fournisseur, qui revient sur /auth/callback. */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const client = await supabaseServer();
  if (!client) redirect("/espace?auth=unconfigured");

  const next = safeNext(String(formData.get("next") ?? ""));
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    console.error("[auth] google", error?.message);
    redirect("/espace?auth=failed");
  }

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const client = await supabaseServer();
  if (client) await client.auth.signOut();
  redirect("/");
}

/**
 * Rattache au compte les audits lancés avant la création de celui-ci.
 *
 * Passe par la clé de service : la politique RLS interdit — volontairement —
 * à un utilisateur de s'attribuer une ligne dont il n'est pas encore
 * propriétaire. On ne réclame que les audits encore orphelins.
 */
export async function claimAudits(anonId: string): Promise<number> {
  if (!anonId) return 0;

  const client = await supabaseServer();
  const admin = supabaseAdmin();
  if (!client || !admin) return 0;

  const { data } = await client.auth.getUser();
  if (!data.user) return 0;

  const { data: claimed, error } = await admin
    .from("audits")
    .update({ user_id: data.user.id })
    .eq("anon_id", anonId)
    .is("user_id", null)
    .select("id");

  if (error) {
    console.error("[auth] rattachement des audits", error.message);
    return 0;
  }

  return claimed?.length ?? 0;
}
