# Tri'planner — maquette web

Maquette UI Next.js, déployée en statique sur GitHub Pages.

## Dev

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build statique → out/
npm run lint
```

## Régénérer le catalogue de POI

Le catalogue (`src/data/pois.json`) est généré par un mini-pipeline qui combine **Overpass API** (OSM) et **Wikidata REST API** :

```bash
npm run extract-poi
```

Étapes :
1. **Overpass** : récupère ~20 000 elements OSM dans la bbox du Pays Basque français (bbox dans [scripts/lib/overpass.ts](./scripts/lib/overpass.ts))
2. **Filter taxonomie** : ~5 400 candidats matchent une catégorie (règles dans [scripts/lib/taxonomy.ts](./scripts/lib/taxonomy.ts))
3. **Wikidata** : enrichit ~700 entités (description FR/EN, image Commons, sitelinks Wikipedia) — voir [scripts/lib/wikidata.ts](./scripts/lib/wikidata.ts)
4. **Score** : formule simplifiée de [doc/04-scoring.md](../doc/04-scoring.md) — voir [scripts/lib/score.ts](./scripts/lib/score.ts)
5. **Quotas par catégorie** + tri par score → 662 POI (`src/data/pois.json`)

Quotas modifiables dans [scripts/extract-poi.ts](./scripts/extract-poi.ts).

## Architecture

```
src/
├── app/
│   ├── layout.tsx           # Root layout (fonts, metadata)
│   ├── page.tsx             # Home (/)
│   ├── decouverte/page.tsx  # Swipe (/decouverte)
│   ├── itineraire/page.tsx  # Agenda (/itineraire)
│   └── carte/page.tsx       # Carte globale (/carte)
├── components/
│   ├── SwipeDeck.tsx        # State du swipe + onboarding picker + undo
│   ├── SwipeCard.tsx        # Carte drag, drag avec rotation/tint, badge prix
│   ├── CategoryPicker.tsx   # 8 cat × N sous-cats dépliables
│   ├── Itinerary.tsx        # Container itinéraire (state global, Liste/Carte toggle)
│   ├── ItineraryMap.tsx     # MapLibre + markers numérotés + lignes + popup-driven swap
│   └── Map.tsx              # Carte globale /carte
├── lib/
│   ├── poi.ts               # Type Poi, Category labels
│   └── itinerary.ts         # Algo (TSP greedy, split, time slots, meals)
└── data/
    └── pois.json            # 662 POI générés par le script

scripts/
├── extract-poi.ts           # Orchestration
└── lib/
    ├── overpass.ts          # Requête Overpass
    ├── wikidata.ts          # API REST Wikidata
    ├── taxonomy.ts          # Mapping OSM tags → catégorie/sous-cat
    └── score.ts             # Formule de score
```

## Déploiement

Push sur `main` → GitHub Actions builde avec `NEXT_PUBLIC_BASE_PATH=/triplanner` et déploie sur GitHub Pages.

Workflow : [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

## Persistance utilisateur (localStorage)

| Clé | Contenu |
|---|---|
| `triplanner.subcategories` | Liste des sous-catégories filtrées |
| `triplanner.likes` | POI aimés (IDs) |
| `triplanner.passes` | POI passés (IDs) |
| `triplanner.pace` | Rythme (`express` / `standard` / `tranquille`) |

Les overrides d'itinéraire (réordre, déplacement entre jours, durées custom, pauses repas par jour) sont **en mémoire seulement** — au refresh on repart de la proposition auto.

## Limites connues

- Tuiles `tile.openstreetmap.org` : OK pour dev et faible trafic, à remplacer par MapTiler ou self-hosted pour usage public sérieux (tile usage policy)
- Catégorie **bien-être** plafonnée à 22 POI (peu mappés au Pays Basque dans OSM)
- Couverture **ville** : 185/662 ont `addr:city` directement ; le reste est sans ville (à compléter via Nominatim reverse-geocoding si besoin)
- Couverture **prix** : `fee=yes/no` sur 46/662 (~7%) ; pas de montant exact
