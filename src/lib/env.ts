/**
 * Accès typé à l'environnement.
 *
 * Principe : rien ne casse quand une clé manque. Chaque brique expose un
 * booléen `configured` ; le code appelant bascule en démonstration et le dit,
 * plutôt que de renvoyer un résultat inventé.
 * Ce module ne doit jamais être importé depuis un composant client.
 */

function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : undefined;
}

export const siteUrl =
  read("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000";

export const supabase = {
  url: read("NEXT_PUBLIC_SUPABASE_URL"),
  anonKey: read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  serviceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
  get configured() {
    return Boolean(this.url && this.anonKey);
  },
  get adminConfigured() {
    return Boolean(this.url && this.serviceRoleKey);
  },
};

export const engineKeys = {
  anthropic: read("ANTHROPIC_API_KEY"),
  openai: read("OPENAI_API_KEY"),
  perplexity: read("PERPLEXITY_API_KEY"),
  google: read("GOOGLE_AI_API_KEY"),
};

export const stripe = {
  secretKey: read("STRIPE_SECRET_KEY"),
  webhookSecret: read("STRIPE_WEBHOOK_SECRET"),
  publishableKey: read("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  get configured() {
    return Boolean(this.secretKey);
  },
};

export const resend = {
  apiKey: read("RESEND_API_KEY"),
  from: read("RESEND_FROM") ?? "Wield <bonjour@wield.fr>",
  contactInbox: read("CONTACT_INBOX"),
  get configured() {
    return Boolean(this.apiKey);
  },
};

export const cronSecret = read("CRON_SECRET");
