import { supabaseServer } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type Session =
  /** Supabase n'est pas branché : les écrans montrent la démonstration. */
  | { state: "unconfigured" }
  | { state: "anonymous" }
  | { state: "signed-in"; user: User };

export async function getSession(): Promise<Session> {
  const client = await supabaseServer();
  if (!client) return { state: "unconfigured" };

  // getUser() revalide le jeton auprès de Supabase ; getSession() se contente
  // de lire le cookie, qu'un navigateur peut avoir falsifié.
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { state: "anonymous" };

  return { state: "signed-in", user: data.user };
}
