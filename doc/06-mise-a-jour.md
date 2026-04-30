# 06 — Mise à jour incrémentale, overrides et versioning

## Les 3 cas d'usage

### Cas 1 — Ajout d'une nouvelle zone

Étendre l'app à une nouvelle région (ex : Charente après Aquitaine), sans toucher à l'existant.

**Pipeline complet scopé géographiquement** :
- Téléchargement de l'extrait Geofabrik de la zone
- Filtre + parse + enrich + categorize + score
- Dédoublonnage en 3 niveaux (détecte les POI partagés à la frontière)
- Insertion en mode "ajout" : pas de delete sur l'existant

**Trigger** : commande manuelle (`ingest --region=poitou-charentes`).

### Cas 2 — Mise à jour ponctuelle d'un POI

Un POI a évolué, on veut corriger sans attendre le mois prochain.

**Sous-cas 2a — Correction OSM déjà en place**
- `osmium getid` ciblé sur le POI
- Relance des 7 étapes du pipeline juste sur lui
- Update en BDD
- Trigger : commande admin (`refresh-poi --id=<uuid>` ou `--osm=<type/id>`)

**Sous-cas 2b — Donnée fausse côté OSM**
On ne peut pas auto-corriger. Soit :
- Corriger sur OSM directement (et attendre la prochaine ingestion)
- Créer un **override éditorial** en BDD qui prime sur les données OSM

→ d'où l'intérêt du système d'overrides ci-dessous.

### Cas 3 — Enrichissement éditorial

Ajout de tags ambiance, photos custom, descriptions soignées sur les top POI.

→ géré entièrement via les overrides.

## Système d'overrides ✅

### Principe

**Séparer la donnée OSM brute des enrichissements humains** dans le schéma BDD :

```
Table pois              ← données OSM/Wikidata (rewritable à chaque refresh)
Table poi_overrides     ← données éditoriales (préservées à vie)
```

### Règles d'application

À l'**affichage** :
```
display_value = override.value ?? poi.value
```
L'override prend toujours le dessus s'il existe.

À l'**ingestion** :
- On rewrite uniquement la table `pois`
- On ne touche **jamais** la table `poi_overrides`
- → tout enrichissement manuel survit aux refresh mensuels

### Champs override-ables

- Nom (par langue)
- Descriptions multilingues
- Tags transversaux (ambiance surtout)
- Photos custom
- Durée de visite calibrée
- Score boosté ou pénalisé manuellement
- Statut (publié, archivé, signalé)

## Versioning

### Niveau ingestion

- Chaque ingestion porte un **`ingestion_id`** (timestamp + zone)
- Chaque ligne de la table `pois` a un `last_ingestion_id` qui dit "qui m'a écrit en dernier"
- Logs d'ingestion conservés (créations, merges, archivages)
- Permet de revenir au snapshot précédent si une ingestion casse tout

### Pas de versioning fin par champ

Trop coûteux pour le MVP. On a juste le snapshot global.

## Mécanisme de diff à l'ingestion

```
Pour chaque POI candidat :
  1. Recherche en BDD via 3 niveaux de dédoublonnage
  2. Si trouvé → comparer champ par champ
       - Si identique : skip (rien à faire)
       - Si différent : update + log de la modif dans ingestion_logs
  3. Si pas trouvé : insert + log
  4. POI archivé qui revient : restaurer (status=active)
```

**Avantages** :
- On sait ce qui a changé entre l'ingestion d'avril et celle de mai
- Utile pour debug et pour notifier les users dont les agendas contiennent un POI modifié

## Notifications utilisateur

Quand un POI dans l'agenda d'un user change significativement :
- Horaires modifiés → "Le Musée Basque a de nouveaux horaires, ton planning peut être impacté"
- POI archivé → "Le restaurant X a été retiré, voici des alternatives"
- Score changé : pas de notif (silencieux)

⚠️ Pas pour le MVP, mais le schéma BDD doit prévoir les logs nécessaires.

## Synthèse des décisions

| Élément | Décision |
|---|---|
| Stratégie globale | Overrides + diff + versioning ✅ |
| Système d'overrides | Prévu dès le schéma BDD ✅ |
| Champs override-ables | Tous les champs sensibles à l'éditorial |
| POI disparu | Soft delete uniquement ✅ |
| Versioning | Au niveau ingestion (snapshot global), pas par champ |
| Notifications user | Logs prévus en BDD, exécution post-MVP |
