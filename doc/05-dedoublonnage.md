# 05 — Dédoublonnage

Sujet sous-estimé qui pollue toutes les bases de POI mal entretenues. Sur OSM + Wikidata, les doublons ont plusieurs origines et chaque type doit être traité différemment.

## Les 4 types de doublons

### Type 1 — Doublon OSM intra-extraction (le plus fréquent)
Un même POI représenté plusieurs fois dans OSM :
- Un `node` (point) **et** un `way` (polygone du bâtiment) avec les mêmes tags
- Ex : Cathédrale Saint-André de Bordeaux a un point central + le polygone du bâtiment

### Type 2 — POI fragmenté
Un grand site découpé en plusieurs entités OSM :
- Château avec `way` séparés pour donjon, remparts, jardins
- Zoo avec plusieurs `tourism=zoo` pour différentes zones

### Type 3 — Doublon entre extractions
Lors d'une mise à jour mensuelle, un POI dont l'OSM ID a changé revient comme "nouveau" alors qu'il existait déjà.

### Type 4 — Faux doublons "logiques"
- Deux restaurants au même endroit (rez-de-chaussée + étage)
- Une église dans un château (deux POI distincts mais imbriqués)

## Stratégie : matching en 3 niveaux en cascade

Pour chaque POI candidat à l'ingestion, on cherche un doublon en BDD via 3 stratégies dans cet ordre :

### Niveau 1 — Match exact par Wikidata (le plus fiable)

```sql
SELECT id FROM pois WHERE wikidata_qid = $qid
```

Si match → c'est le même POI, on update.

### Niveau 2 — Match géo + nominal

```sql
SELECT id FROM pois 
WHERE ST_DWithin(geom, $geom, 50)  -- 50m
  AND similarity(name_normalized, $name) > 0.85
  AND main_category = $cat
```

Utilise `pg_trgm` (extension prévue) pour la similarité de chaînes.

### Niveau 3 — Match OSM ID stable

```sql
SELECT id FROM pois WHERE osm_type = $type AND osm_id = $id
```

Pour les POI sans wikidata avec un OSM ID stable d'une extraction à l'autre.

**Si les 3 niveaux échouent → nouveau POI, on insère.**

## Stratégie de merge

Lors d'un match :
- On garde l'**ID interne stable** (UUID), distinct de `osm_id`
- On met à jour les tags depuis la nouvelle extraction
- On **préserve les enrichissements manuels** (notes éditoriales, ambiance, photos custom) — voir [06-mise-a-jour.md](./06-mise-a-jour.md) pour le système d'overrides
- On loggue le merge dans `ingestion_logs` pour audit

## POI disparu d'OSM

✅ **Soft delete** : marqué `status=archived`, jamais supprimé physiquement.

Justification : préserver les agendas utilisateurs existants — on ne casse jamais les voyages.

## Implications BDD

La table `pois` doit contenir :
- ID interne stable (UUID)
- `osm_type` (`node` / `way` / `relation`) + `osm_id`
- `wikidata_qid` (indexé)
- `name_normalized` (lowercase + unaccent)
- `geom` (PostGIS, index GiST)
- `status` (`active` / `archived`)

Index nécessaires :
- `geom` → GiST pour les recherches de proximité
- `name_normalized` → GIN trigram pour le match nominal
- `wikidata_qid` → btree
- `(osm_type, osm_id)` → unique partiel

Extensions Postgres requises :
- `postgis`
- `pg_trgm`
- `unaccent`

## Cas tordus à anticiper

| Cas | Risque | Mitigation |
|---|---|---|
| POI qui change de nom | Match nominal échoue | Wikidata QID ou OSM ID sauvent la mise |
| POI qui change de coordonnées | Doublon créé par erreur | Seuil 50m volontairement large |
| POI supprimé d'OSM | Perte de données utilisateur | Soft delete, jamais de hard delete |
| Faux doublons mergés à tort | Données mélangées | Logs détaillés permettent de revenir en arrière + interface admin "split" à prévoir plus tard |

## Critères de différenciation (pour ne PAS fusionner)

Cas Type 4 — on garde 2 POI distincts si :
- Tags principaux **différents** (resto + église à la même adresse)
- Wikidata QID différents (s'ils existent)
- Names très différents
