# Wield

Site de **Wield** — maîtriser l'IA sur les deux fronts : être **vu par elle**
(GEO/AEO) et savoir la **manier** en interne.

Cible : dirigeants de PME françaises.

## Stack

| Couche | Choix | Pourquoi |
| --- | --- | --- |
| Front | Next.js 16 (App Router), TypeScript | Rendu serveur obligatoire — un site qui n'apparaît qu'après exécution du JS est invisible pour GPTBot, ClaudeBot, PerplexityBot |
| Styles | Tailwind CSS v4 (tokens dans `src/app/globals.css`) | Design system tenu en un seul fichier |
| Typo | Space Grotesk (titres) + Inter (corps), via `next/font` | Auto-hébergées, zéro requête tierce |
| Rendu | SSG (toute la home est prérendue) | Crawlable, rapide, citable |

Le reste du plan (Supabase, Stripe, Route Handler du testeur de visibilité,
MDX pour les playbooks) n'est pas encore branché : la home est pour l'instant
une maquette statique et interactive.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
npm run typecheck
```

## Direction artistique

Anti-cliché IA : **pas** de violet, pas de dégradé néon, pas d'orbe, pas de
cerveau qui brille. Univers : maîtrise, artisanat de précision, l'outil en main.

| Rôle | Valeur |
| --- | --- |
| Fond principal (blanc froid) | `#F6F7F9` |
| Cartes / surfaces | `#FFFFFF` |
| Encre principale | `#15171C` |
| Encre secondaire | `#55585F` |
| Bordures | `#E4E6EB` |
| Accent unique (cobalt) | `#2947E0` |
| Cobalt sur ardoise | `#7D92F2` |
| Sections contrastées (ardoise) | `#15171C` |
| État « présent » | `#2947E0` |
| État « absent » | `#A3A7AF` |

Règles : un seul accent, jamais en glow ni en dégradé. Les mots-clés des titres
passent en italique cobalt (`<Em>`). Une action par section. Bordures nettes,
rayons de 2 à 6 px.

## Structure

```
src/
  app/
    layout.tsx        polices, metadata, Open Graph
    page.tsx          assemblage des sections
    globals.css       tokens + base + composants utilitaires
    robots.ts         autorise explicitement GPTBot, ClaudeBot, PerplexityBot, Google-Extended
    sitemap.ts
  components/
    site-header.tsx   nav collante + menu mobile
    site-footer.tsx   capture e-mail du Brief + colonnes de liens
    json-ld.tsx       Organization, WebSite, Service ×2, FAQPage
    sections/         hero · problem · citation-test · method · proof
                      offers · trust · about · final-cta
    ui/               button · container · em · icons · logo · section
public/
  llms.txt
```

## Couche GEO du site lui-même

Le site doit être son propre cas d'école :

- JSON-LD (`Organization`, `WebSite`, `Service`, `FAQPage`) sur la home.
- `robots.txt` autorisant nommément les crawlers des moteurs de réponse.
- `sitemap.xml`.
- `llms.txt` dans `public/`.
- Contenu *answer-first* : la réponse d'abord, le détail ensuite.

## À raffiner

- Le testeur de visibilité est simulé côté client. La version réelle passera par
  un Route Handler serveur (clés API côté serveur uniquement + rate-limiting).
- Chiffres, témoignage, logos clients et photo de la section « Derrière Wield »
  sont des placeholders.

## Backend

### Mise en route

```bash
cp .env.example .env.local   # remplis ce dont tu as besoin
npm run dev
npm test                      # tests du moteur d'audit
```

Rien n'est obligatoire dans `.env.local` : chaque brique absente bascule en
mode démonstration et le dit à l'écran, au lieu de casser le site ou —
pire — d'inventer un résultat.

### Base de données

Le schéma vit dans `supabase/migrations/`. À appliquer avec
`supabase db push`, ou collé dans l'éditeur SQL du tableau de bord.

RLS est actif sur toutes les tables. Le navigateur ne lit que ce qui
appartient au compte connecté ; les écritures d'audit et d'achat passent par
la clé de service, côté serveur uniquement.

### Moteur d'audit

```
src/lib/audit/
  prompts.ts            les six questions posées, en langage d'acheteur
  detect.ts             la marque est-elle citée ? (domaine, puis nom)
  run.ts                orchestration, tolérance aux pannes, score
  providers/
    anthropic.ts        Claude — écrit et testé
    pending.ts          ChatGPT, Perplexity, Gemini — à écrire
```

`POST /api/audit` avec `{ query, brand?, domain? }`. Limité à 3 audits par
heure et par adresse IP : un audit consomme de vrais jetons chez quatre
fournisseurs.

**Un moteur non branché n'est jamais compté comme « absent ».** Il ressort en
`not_configured` ou `not_implemented` et sort du score, qui se lit toujours
« cités / mesurés ».

### Ce que l'audit mesure vraiment

Il interroge les **API** des moteurs, pas leurs applications grand public.
Une API n'a ni mémoire, ni personnalisation, ni le même routage que
chatgpt.com ou claude.ai : c'est un substitut reproductible et comparable
dans le temps, pas une capture d'écran de ce que verra un client donné.
Le site doit le dire tel quel — c'est la moindre des choses pour une offre
qui vend de la méthode plutôt que de la magie.

### Authentification

Supabase Auth, sans mot de passe : Google, ou un lien envoyé par e-mail.

```
src/lib/supabase/client.ts   client navigateur
src/lib/supabase/server.ts   client serveur, adossé aux cookies
src/middleware.ts            rafraîchit le jeton à chaque navigation
src/app/auth/actions.ts      connexion, déconnexion, rattachement
src/app/auth/callback/       retour OAuth et lien e-mail
src/lib/safe-next.ts         filtre anti-redirection ouverte
```

La session est lue avec `getUser()`, jamais `getSession()` : le premier
revalide le jeton auprès de Supabase, le second se contente de lire un cookie
qu'un navigateur peut avoir falsifié.

**Rattachement des audits.** Un visiteur peut lancer un audit avant d'avoir un
compte. Le navigateur garde un identifiant local, joint à chaque audit ; à la
première connexion, `/espace` réclame les audits encore orphelins portant cet
identifiant, puis l'oublie. La réclamation passe par la clé de service : RLS
interdit — volontairement — à un compte de s'attribuer une ligne qui ne lui
appartient pas encore.

**Côté Supabase**, il reste à activer le fournisseur Google et à déclarer
l'URL de retour `https://<ton-domaine>/auth/callback` (et
`http://localhost:3000/auth/callback` pour le développement).

Sans clés Supabase, `/espace` affiche le compte de démonstration et le dit ;
les boutons de connexion déroulent le parcours de maquette au lieu de laisser
croire qu'un compte a été créé.
