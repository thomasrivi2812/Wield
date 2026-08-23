import Stripe from "stripe";
import { stripe as config } from "@/lib/env";

/**
 * Client Stripe. Null quand la clé manque : les boutons le disent au lieu
 * d'échouer en silence.
 *
 * La version d'API n'est pas épinglée : on suit celle du SDK installé, la
 * seule dont les types sont garantis cohérents avec le code écrit ici.
 */
let cached: Stripe | null = null;

export function stripeClient(): Stripe | null {
  if (!config.secretKey) return null;
  if (!cached) cached = new Stripe(config.secretKey);
  return cached;
}
