# 01 — Flux de données

L'application repose sur 5 grands flux de données. Chacun a ses propres caractéristiques (fréquence, source, criticité).

## Vue d'ensemble

```
┌───────────────────┐
│ 1. INGESTION      │ offline, mensuel
│ OSM + Wikidata    │ → alimente le catalogue
└───────────────────┘
         │
         ▼
┌───────────────────┐
│ 2. DÉCOUVERTE     │ temps réel, par user
│ POI candidats →   │ → swipe + filtres
│ swipe + reco      │
└───────────────────┘
         │
         ▼
┌───────────────────┐
│ 3. PLANIFICATION  │ à la demande
│ POI sélectionnés  │ → agenda jour par jour
│ → agenda          │
└───────────────────┘
         │
         ▼
┌───────────────────┐
│ 4. TEMPS RÉEL     │ pendant le voyage
│ GPS + agenda →    │ → recalcul + notifs
│ ajustements       │
└───────────────────┘
         │
         ▼
┌───────────────────┐
│ 5. PARTAGE        │ ponctuel
│ Trip → lien       │ → consultation read-only
│ read-only         │
└───────────────────┘
```

## 1. Flux d'ingestion 🚧

OSM/Overpass + Wikidata → pipeline d'extraction → BDD (table `pois` enrichie).

C'est le flux qui alimente tout le catalogue. Périodique (mensuel) avec mise à jour incrémentale possible.

📄 Voir [02-ingestion.md](./02-ingestion.md) pour le détail complet.

## 2. Flux de découverte ❓

User ouvre un voyage → filtres (ville, dates, prix, PMR…) + profil/historique → API renvoie un deck de POI ordonnés → swipe (like/dislike) → mise à jour des préférences user.

**À spécifier** :
- Algorithme de tri (score popularité × préférences user × distance)
- Pagination du deck
- Logique de "proposition intelligente"

## 3. Flux de planification ❓

Liste de POI likés + contraintes (jours, mode transport, vol arrivée/départ, résidence) → moteur d'optimisation (clustering géo + TSP simplifié + horaires d'ouverture) → agenda jour par jour.

**À spécifier** :
- Algorithme d'optimisation
- Gestion des contraintes horaires (ouverture, durée moyenne)
- Recalcul partiel vs total

## 4. Flux temps réel ❓

Position GPS user + agenda en cours → recalcul si retard/avance → notifications push.

**Décisions prises** :
- Déclenchement : automatique via GPS en arrière-plan ✅

**À spécifier** :
- Fréquence de polling GPS
- Seuil de recalcul (retard de combien déclenche un ajustement)
- Stratégie de notifs push (web push API ?)

## 5. Flux de partage ❓

**Décisions prises** :
- Mode : lien read-only (pas de collaboration) ✅

**À spécifier** :
- Format du lien (UUID public ? slug ?)
- Expiration éventuelle
- Affichage public (auth ou non)
