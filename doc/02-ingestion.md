# 02 — Pipeline d'ingestion

## Architecture du pipeline

```
[Aquitaine.osm.pbf] (Geofabrik mensuel)
        │
        ▼
┌───────────────────┐
│ 1. FILTER         │ osmium-tool : filtrage par tags pertinents
└───────────────────┘     output : aquitaine-poi.osm.pbf (allégé)
        │
        ▼
┌───────────────────┐
│ 2. PARSE          │ pyosmium : extraction nodes/ways/relations → POI
└───────────────────┘     output : table staging.poi_raw
        │
        ▼
┌───────────────────┐
│ 3. ENRICH         │ Wikidata SPARQL en batch
└───────────────────┘     output : table staging.wikidata_cache
        │
        ▼
┌───────────────────┐
│ 4. CATEGORIZE     │ tags OSM → taxonomie unifiée
└───────────────────┘     + durée de visite moyenne par sous-cat
        │
        ▼
┌───────────────────┐
│ 5. SCORE          │ calcul rating 0.0 - 1.0
└───────────────────┘     (cf. 04-scoring.md)
        │
        ▼
┌───────────────────┐
│ 6. DEDUPE         │ matching 3 niveaux + merge soft
└───────────────────┘     (cf. 05-dedoublonnage.md)
        │
        ▼
┌───────────────────┐
│ 7. SWAP           │ INSERT/UPDATE en table prod `pois`
└───────────────────┘     transaction atomique
```

## Choix techniques

| Élément | Choix |
|---|---|
| Source OSM | Geofabrik (`.osm.pbf`) |
| Filtrage | `osmium-tool` |
| Parsing | `pyosmium` (Python) |
| Enrichissement | Wikidata SPARQL endpoint |
| Fréquence | Full refresh mensuel + incrémental ponctuel |
| Worker | Python containerisé, hors API |
| Stockage temporaire | Volume Docker pour les `.osm.pbf` |

## Tags OSM ciblés

Le filtrage initial conserve uniquement les POI avec au moins un de ces tags :

- `tourism=*` (museum, attraction, viewpoint, gallery, artwork…)
- `historic=*` (monument, castle, ruins, archaeological_site…)
- `amenity=*` filtré (restaurant, cafe, bar, place_of_worship, theatre, cinema, nightclub…)
- `leisure=*` (park, garden, beach_resort, water_park, theme_park, spa…)
- `natural=*` (peak, beach, waterfall, cave_entrance, dune…)
- `shop=*` filtré (marketplace, wine, farm, chocolate…)
- `craft=*` (winery, distillery, chocolate, cheesemaker…)
- `sport=*` (surfing, climbing, equestrian…)

## Enrichissement Wikidata

Pour chaque POI ayant un tag `wikidata=Qxxx`, on récupère via SPARQL :

| Propriété | Wikidata | Usage |
|---|---|---|
| Description multilingue | `schema:description` | Texte affiché par langue |
| Image | `P18` | Photo principale |
| Date de construction | `P571` | Métadonnée |
| Architecte | `P84` | Métadonnée |
| Style architectural | `P149` | Tag transversal |
| Instance of | `P31` | Affinage de catégorisation |
| Site officiel | `P856` | Lien externe |
| Statut patrimonial | `P1435`, UNESCO | Bonus de scoring |
| Wikipedia sitelinks | toutes langues | Compteur popularité |

POI **sans** wikidata : on se rabat sur les tags OSM (`name:xx`, `description`, `wikipedia`, `website`).

## Stratégie de filtrage qualité

✅ **Garder large à l'ingestion**.

On inclut tout ce qui matche les règles de catégorisation. Le filtrage qualité se fait **à la diffusion** (côté API), via le score de popularité, la distance et les filtres user.

**Estimation de volume** sur Aquitaine : 80 000 à 120 000 POI. Volume gérable pour Postgres+PostGIS.

## Périmètre géographique

- MVP : **Nouvelle-Aquitaine**
- Ville pilote pour maquette : **Bayonne**
- Extension future : autres régions françaises, puis Europe

## Multilingue

9 langues prévues : **FR, EN, ES, DE, PT, IT, ZH, JA, VI**.

Sources de traduction (pas de traduction maison) :
1. Tags OSM `name:fr`, `name:en`, etc.
2. Wikidata labels + descriptions multilingues
3. Wikipedia abstracts via Wikidata sitelinks

Les POI majeurs auront 9/9 langues. Les POI moyens 3-5. Les petits POI souvent FR seul. Fallback à l'affichage : FR > EN > langue user.
