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
