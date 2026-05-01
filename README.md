# Tri'planner

> Compagnon de voyage façon "Waze du tourisme" — découvrir des lieux, construire un itinéraire jour par jour, le suivre sur place.

🌐 **Maquette en ligne** : https://thibaultbrun.github.io/triplanner/

## La maquette

Maquette UI fonctionnelle, déployée en statique sur GitHub Pages. Données réelles issues d'OSM + Wikidata, périmètre **Pays Basque français**.

### Routes

| Route | Quoi |
|---|---|
| [`/`](https://thibaultbrun.github.io/triplanner/) | Accueil — accès aux 3 modules |
| [`/decouverte`](https://thibaultbrun.github.io/triplanner/decouverte/) | Sélection des sous-catégories, swipe pondéré (style Tinder) avec undo, drag, badge prix |
| [`/itineraire`](https://thibaultbrun.github.io/triplanner/itineraire/) | Agenda jour par jour à partir des likes — vue Liste **ou** Carte, drag-n-drop intra-jour, déplacement entre jours, durée par visite (pas de 15 min), heure de départ, pauses repas configurables par jour |
| [`/carte`](https://thibaultbrun.github.io/triplanner/carte/) | Carte MapLibre des 662 POI, popups avec photo + description |

### Catalogue

**662 POI** sur le Pays Basque français, répartis :

| Catégorie | Nombre |
|---|---|
| Patrimoine & Monuments | 120 |
| Gastronomie & Terroir | 150 |
| Sport & Aventure | 100 (surf, rando, VTT, escalade, golf, skatepark…) |
| Nature & Paysages | 80 |
| Loisirs & Famille | 80 (parcs, aquariums, escape, playgrounds nommés…) |
| Vie nocturne & Spectacles | 60 (bars, théâtres, casinos, centres culturels…) |
| Musées & Art | 50 |
| Bien-être | 22 (plafond max sur OSM dans la zone) |

Couverture enrichissement : **272/662 ont un QID Wikidata** (image Wikimedia + description multilingue), le reste tombe sur un placeholder coloré par catégorie.

### Stack

- **Next.js 16** (App Router, `output: 'export'` static)
- **TypeScript** + **Tailwind CSS v4**
- **MapLibre GL JS** + tuiles raster OSM
- **motion** (drag-n-drop, swipe animations)
- **GitHub Actions** → GitHub Pages

Tout dans [`web/`](./web). Voir [web/README.md](./web/README.md) pour le dev.

## Documentation de cadrage

Toute la spec initiale est dans [`doc/`](./doc) :

| Fichier | Sujet |
|---|---|
| [00-overview.md](./doc/00-overview.md) | Concept, périmètre MVP, stack technique |
| [01-flux-donnees.md](./doc/01-flux-donnees.md) | Les 5 flux de données identifiés |
| [02-ingestion.md](./doc/02-ingestion.md) | Pipeline d'ingestion OSM/Wikidata |
| [03-taxonomie.md](./doc/03-taxonomie.md) | Catégories, sous-catégories, tags transversaux |
| [04-scoring.md](./doc/04-scoring.md) | Formule de scoring de popularité |
| [05-dedoublonnage.md](./doc/05-dedoublonnage.md) | Stratégie de détection et merge des doublons |
| [06-mise-a-jour.md](./doc/06-mise-a-jour.md) | Mise à jour incrémentale, overrides, versioning |
| [07-decisions-en-suspens.md](./doc/07-decisions-en-suspens.md) | Sujets à finaliser |

## Statut

- ✅ Concept, périmètre, stack technique
- ✅ Phase d'ingestion spécifiée et **implémentée en pipeline réduit** dans [`web/scripts/`](./web/scripts) (Overpass + Wikidata REST)
- ✅ Maquette UI fonctionnelle (3 modules : découverte, itinéraire, carte)
- 🚧 Backend, BDD réelle, auth, persistance multi-device — pas dans la maquette
- 🚧 Création de trip (formulaire dates / résidence / vol), partage read-only — pas dans la maquette
