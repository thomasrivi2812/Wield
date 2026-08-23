"use client";

const KEY = "wield.anon-id";

/**
 * Identifiant local du visiteur, avant tout compte.
 *
 * Il sert à une seule chose : rattacher au compte les audits lancés avant
 * l'inscription. Il ne quitte jamais le navigateur autrement que joint à un
 * audit, et il est effacé dès que le rattachement a eu lieu.
 */
export function anonId(): string {
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(KEY, created);
    return created;
  } catch {
    // Navigation privée ou stockage bloqué : l'audit tourne quand même,
    // il ne sera simplement pas rattaché plus tard.
    return "";
  }
}

export function forgetAnonId(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // rien à faire
  }
}
