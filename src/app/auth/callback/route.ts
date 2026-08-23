import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

/**
 * Retour d'authentification : OAuth (paramètre `code`) et lien e-mail
 * (`token_hash` + `type`) arrivent tous les deux ici.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));

  const client = await supabaseServer();
  if (!client) {
    return NextResponse.redirect(new URL("/espace?auth=unconfigured", url));
  }

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url));
    console.error("[auth] échange du code", error.message);
  } else if (tokenHash && type) {
    const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, url));
    console.error("[auth] vérification du lien", error.message);
  }

  return NextResponse.redirect(new URL("/espace?auth=failed", url));
}
