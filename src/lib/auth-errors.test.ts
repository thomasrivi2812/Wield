import assert from "node:assert/strict";
import test from "node:test";
import { explainAuthError } from "./auth-errors";

test("le plafond d'envoi ne propose pas de réessayer tout de suite", () => {
  const failure = explainAuthError({ code: "over_email_send_rate_limit" });
  assert.equal(failure.retryable, false);
  assert.match(failure.message, /par heure/);
});

test("le statut 429 suffit quand le code manque", () => {
  assert.match(explainAuthError({ status: 429 }).message, /Trop d’e-mails/);
});

test("l'ancien message « For security purposes » est reconnu", () => {
  assert.match(
    explainAuthError({
      message: "For security purposes, you can only request this after 51 seconds.",
    }).message,
    /Trop d’e-mails/,
  );
});

test("inscription désactivée : on nomme le réglage à changer", () => {
  assert.match(
    explainAuthError({ code: "signup_disabled" }).message,
    /Allow new users to sign up/,
  );
  assert.match(
    explainAuthError({ message: "Signups not allowed for otp" }).message,
    /Allow new users to sign up/,
  );
});

test("panne d'expéditeur : on pointe le SMTP à moitié configuré", () => {
  assert.match(explainAuthError({ code: "unexpected_failure" }).message, /SMTP/);
  assert.match(
    explainAuthError({ message: "Error sending magic link email" }).message,
    /SMTP/,
  );
});

test("adresse de retour refusée : on nomme l'écran Supabase", () => {
  assert.match(
    explainAuthError({ message: "Invalid redirect URL" }).message,
    /Redirect URLs/,
  );
});

test("cause inconnue : on renvoie vers les journaux plutôt que de deviner", () => {
  const failure = explainAuthError({ message: "quelque chose d’inédit" });
  assert.match(failure.message, /Vercel → Logs/);
  assert.equal(failure.retryable, true);
});

test("erreur absente : message neutre, réessai possible", () => {
  assert.equal(explainAuthError(null).retryable, true);
});
