# Faire tourner Wield pour de vrai

Trente minutes, dans cet ordre. À chaque étape, `npm run doctor` te dit où tu
en es.

```bash
npm install
cp .env.example .env.local
npm run doctor      # tout est rouge, c'est normal
```

> **Si tes variables sont chez l'hébergeur et pas en local**, `npm run doctor`
> te dira toujours que tout manque : il lit `.env.local`. Pour interroger le
> déploiement :
>
> ```bash
> npm run doctor -- https://ton-domaine
> ```
>
> Il faut pour cela une valeur identique de `DIAGNOSTIC_TOKEN` des deux côtés.
> Sans elle, `/api/sante` est désactivé en production — la carte de ce qui est
> branché est déjà une information utile à qui cherche une faille.

> **Sur Vercel, une variable ajoutée ne s'applique pas au déploiement en
> cours.** Il faut redéployer. Les variables `NEXT_PUBLIC_*` sont même figées
> dans le JavaScript au moment de la compilation : sans nouveau build, elles
> n'existent pas côté navigateur. C'est la cause numéro un de « j'ai tout mis
> et rien ne marche ».

Le principe qui vaut partout : **rien ne casse quand une brique manque.** Le
site tourne dès maintenant, il affiche simplement « non mesuré » à la place
d'un résultat, et il le dit. Tu peux donc t'arrêter après n'importe quelle
étape.

---

## 1. Supabase — comptes, historique, plafond

### Créer le projet

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Nom : `wield`. **Choisis une région européenne** — Frankfurt ou Paris. Le
   site promet un hébergement européen ; autant que ce soit vrai.
3. Note le mot de passe de la base : il n'est plus affiché ensuite.
4. Deux minutes de provisionnement.

### Récupérer les trois valeurs

Le plus rapide : le bouton vert **Connect**, en haut du tableau de bord. Il
affiche l'URL du projet et les clés, prêtes à copier.

Sinon, **Settings → API Keys**. Supabase a changé de format de clés ; les deux
fonctionnent, prends celles du premier onglet.

**Onglet « Publishable and secret API keys »** — le format actuel :

| Tableau de bord | Variable |
|---|---|
| Publishable key — `sb_publishable_…` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Secret key — `sb_secret_…` | `SUPABASE_SERVICE_ROLE_KEY` |

**Onglet « Legacy anon, service_role API keys »** — l'ancien format, encore
accepté :

| Tableau de bord | Variable |
|---|---|
| `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` |

L'URL du projet se trouve sous **Settings → Data API**, ou dans le panneau
**Connect**.

> **Les deux clés se ressemblent et sont côte à côte.** Les intervertir est
> l'erreur la plus facile à faire, et la plus grave : une clé secrète placée
> dans une variable `NEXT_PUBLIC_` part dans le JavaScript envoyé à chaque
> visiteur, et elle contourne RLS — n'importe qui lit et modifie toute ta
> base. `npm run doctor` refuse de passer si les clés sont interverties ou si
> la clé secrète est exposée.

Colle-les dans `.env.local`.

### Créer les tables

**SQL Editor → New query**, colle tout le contenu de
`supabase/migrations/0001_init.sql`, **Run**. Puis recommence avec
`supabase/migrations/0002_audit_seo.sql`.

Les deux scripts sont rejouables : si tu n'es pas sûr d'être allé au bout,
recolle-les, ils ne casseront rien.

Ça crée les tables, active RLS partout, et installe le compteur de limite de
débit.

```bash
npm run doctor   # Supabase doit passer au vert
```

### Le lien e-mail

Il marche sans rien configurer. Supabase limite fortement les envois par
défaut : pour la production, branche un vrai expéditeur SMTP dans
**Authentication → Emails**, sinon les liens partiront au compte-gouttes.

### Brancher Google, pas à pas

Trois écrans, dans cet ordre. L'ordre compte : Supabase te donne l'URL que
Google réclame.

**1. Récupérer l'URL de rappel.** Supabase → **Authentication → Providers →
Google**. Active-le. La page affiche une URL de rappel du type
`https://<ton-projet>.supabase.co/auth/v1/callback`. Copie-la, laisse
l'onglet ouvert.

**2. Créer l'identifiant chez Google.**
[console.cloud.google.com](https://console.cloud.google.com) :

- Crée un projet si tu n'en as pas.
- **APIs & Services → OAuth consent screen** : type *External*, remplis le nom
  de l'application et l'e-mail de contact. Tant que l'écran est en *Testing*,
  seuls les comptes que tu ajoutes en *Test users* peuvent se connecter —
  c'est le piège classique. Passe-le en *Production* quand tu ouvres au
  public.
- **APIs & Services → Credentials → Create credentials → OAuth client ID**,
  type *Web application*.
- **Authorized redirect URIs** : colle l'URL de l'étape 1. **Celle de
  Supabase, pas celle de ton site.**
- Récupère *Client ID* et *Client secret*.

**3. Recoller dans Supabase.** Retour sur l'onglet Providers → Google : colle
les deux valeurs, enregistre.

**4. Autoriser le retour vers ton site.** Supabase → **Authentication → URL
Configuration → Redirect URLs** :

```
http://localhost:3000/auth/callback
https://<ton-domaine>/auth/callback
```

Deux URL différentes, deux rôles distincts : celle de l'étape 2 dit à Google
où renvoyer Supabase ; celle-ci dit à Supabase où il a le droit de te
renvoyer. Oublier la seconde donne une connexion qui part et ne revient
jamais.

**5. Côté application.** `NEXT_PUBLIC_AUTH_PROVIDERS=google` et
`NEXT_PUBLIC_SITE_URL=https://<ton-domaine>`, puis **redéploie**.

### Brancher Microsoft

Même logique, chez [entra.microsoft.com](https://entra.microsoft.com) →
**App registrations → New registration** :

- *Supported account types* : « Accounts in any organizational directory and
  personal Microsoft accounts », sinon seuls les comptes de ton propre
  annuaire pourront se connecter.
- *Redirect URI* : plateforme **Web**, valeur = l'URL de rappel Supabase.
- **Certificates & secrets → New client secret** : note la **valeur**, pas
  l'identifiant. Elle n'est affichée qu'une fois.
- Supabase → Providers → **Azure** : colle l'identifiant d'application et le
  secret. Renseigne l'URL de l'annuaire si la page la demande.

Puis `NEXT_PUBLIC_AUTH_PROVIDERS=google,azure` et redéploie.

### Choisir les autres moyens de connexion

`NEXT_PUBLIC_AUTH_PROVIDERS` décide des boutons affichés, dans l'ordre :

```bash
NEXT_PUBLIC_AUTH_PROVIDERS=google,azure
```

| Valeur | Fournisseur | Ce que ça coûte |
|---|---|---|
| `google` | Google Workspace | gratuit |
| `azure` | Microsoft 365 | gratuit, appli à déclarer sur Entra |
| `linkedin_oidc` | LinkedIn | gratuit, appli à déclarer |
| `github` | GitHub | gratuit |
| `apple` | Apple | **99 €/an** de compte développeur |

Chaque valeur doit **aussi** être activée dans **Authentication → Providers**.
Le code n'affiche que ce que tu listes : un bouton qui mène à une erreur fait
croire que le site est cassé.

- Variable **absente** → `google` seul.
- Variable **vide** → lien e-mail uniquement.

> **Deux ou trois boutons, pas cinq.** Au-delà, le mur de connexion devient
> un menu et la conversion baisse. Pour des dirigeants de PME françaises,
> `google,azure` couvre la quasi-totalité du parc — Apple et GitHub ne
> servent presque jamais dans ce contexte, et Apple se paie.

---

## 2. Les moteurs de réponse

Une seule clé suffit à voir le produit fonctionner. Le score s'affiche
« cités / mesurés » : avec une clé, tu verras `1/1` ou `0/1` — vrai.

| Moteur | Où prendre la clé | Variable |
|---|---|---|
| Claude | console.anthropic.com | `ANTHROPIC_API_KEY` |
| ChatGPT | platform.openai.com | `OPENAI_API_KEY` |
| Perplexity | perplexity.ai/settings/api | `PERPLEXITY_API_KEY` |
| Gemini | aistudio.google.com | `GOOGLE_AI_API_KEY` |

```bash
npm run doctor   # chaque clé est vérifiée sur un endpoint gratuit
```

> **Un audit coûte de l'argent.** Quatre moteurs × six questions avec
> recherche web : compte **0,50 à 2 € par audit**. Le plafond est fixé à
> 3 audits par heure et par adresse IP — et il n'est appliqué que si Supabase
> est branché. Commence avec une seule clé le temps de mesurer.

---

### Changer de modèle sans toucher au code

Chaque moteur accepte une variable qui remplace le modèle par défaut. Utile
quand un compte n'a pas accès au palier visé, ou pour baisser la facture :

| Variable | Défaut |
|---|---|
| `OPENAI_AUDIT_MODEL` | `gpt-5` |
| `ANTHROPIC_AUDIT_MODEL` | `claude-opus-5` |
| `PERPLEXITY_AUDIT_MODEL` | `sonar` |
| `GEMINI_AUDIT_MODEL` | `gemini-2.5-flash` |

Un modèle refusé par le compte fait échouer le moteur, jamais l'audit : les
trois autres répondent, et le score se lit sur ce qui a été mesuré.

## 3. Lancer

```bash
npm run dev
```

Le parcours complet :

1. `http://localhost:3000` → saisis un secteur **et ton domaine** (sans le
   domaine, on voit qui est cité, pas si c'est toi).
2. « Tester ma visibilité » → l'audit tourne pour de vrai.
3. « Continuer avec Google » → tu es connecté.
4. `/espace` → l'audit lancé avant ta connexion s'y retrouve, rattaché.

---

## 4. Stripe — les paiements

Optionnel : sans clé, les boutons d'achat le disent au lieu d'échouer en
silence.

1. [dashboard.stripe.com](https://dashboard.stripe.com) → reste en **mode
   test** tant que tu n'as pas vérifié le parcours.
2. **Developers → API keys** → copie la clé secrète `sk_test_…` dans
   `STRIPE_SECRET_KEY`.
3. **Developers → Webhooks → Add endpoint** :
   - URL : `https://<ton-domaine>/api/stripe/webhook`
   - Événement : `checkout.session.completed`
   - Copie le secret `whsec_…` dans `STRIPE_WEBHOOK_SECRET`.

> **Sans le webhook, aucun achat ne sera jamais marqué payé.** La page de
> succès n'est qu'un affichage : n'importe qui peut l'atteindre en tapant
> l'URL. Seule la signature de Stripe fait foi. `npm run doctor` traite un
> webhook manquant comme un échec, pas comme un avertissement.

En local, pour recevoir les webhooks sans domaine public :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

La commande affiche un secret `whsec_…` temporaire à mettre dans
`.env.local`. Cartes de test : `4242 4242 4242 4242`, n'importe quelle date
future, n'importe quel CVC.

**Les prix vivent dans `src/lib/catalog.ts`**, et nulle part ailleurs. La
session de paiement lit le même fichier que les pages : impossible
d'afficher 2,99 € et d'encaisser autre chose. Pour changer un prix, tu
changes une ligne.

---

## 5. Mettre en ligne

Sur Vercel : importe le dépôt, puis **Settings → Environment Variables** —
recopie tout `.env.local`, en changeant `NEXT_PUBLIC_SITE_URL` pour ton vrai
domaine. Ajoute ensuite ce domaine dans les *Redirect URLs* de Supabase.

Vercel héberge aux États-Unis par défaut. Si tu tiens à la promesse
d'hébergement européen affichée sur le site, choisis une région européenne
dans **Settings → Functions**, ou change le texte.

---

## Ce qui n'est pas encore branché

- **Resend** — le formulaire d'infrastructure n'envoie pas d'e-mail.
- **Le rapport détaillé** — il est écrit en base, et l'achat est enregistré,
  mais le contenu payant n'est pas encore servi à l'écran.
- **L'audit automatique mensuel** du pack.

---

## Quand ça ne marche pas

**`npm run doctor` d'abord.** Il nomme la variable manquante, la table
absente, la clé refusée.

| Symptôme | Cause probable |
|---|---|
| **J'ai tout mis chez l'hébergeur et rien ne marche** | pas redéployé — les `NEXT_PUBLIC_*` sont figées au build |
| Tous les moteurs « non mesuré » | aucune clé de moteur, ou pas redéployé |
| L'audit n'est pas enregistré | schéma non appliqué, ou clé de service absente |
| Aucun bouton de connexion | `NEXT_PUBLIC_AUTH_PROVIDERS` mise à vide, ou pas redéployé |
| `redirect_uri_mismatch` chez Google | l'URI autorisée chez Google doit être celle de **Supabase**, pas celle de ton site |
| « Access blocked » chez Google | écran de consentement encore en *Testing* : ajoute le compte en *Test user* ou passe en *Production* |
| La connexion part et ne revient jamais | `https://<domaine>/auth/callback` absent des *Redirect URLs* Supabase |
| Connecté mais compte sans e-mail | Microsoft sans la portée `email` — déjà demandée par le code, vérifie l'appli Entra |
| « moteur momentanément indisponible » | clé refusée ou quota dépassé — le détail est dans les journaux du serveur |
| Le plafond ne s'applique pas | Supabase non branché ; le serveur l'écrit dans ses journaux |

En cas de doute, `npm run doctor -- https://ton-domaine` dit ce que le
serveur voit réellement.
