# 07 — Décisions en suspens

Ce qui reste à trancher pour finir la spec technique avant le code.

## Stack technique

| Sujet | Options | Notes |
|---|---|---|
| Framework API | Hono / Fastify | Hono = moderne, edge-compatible. Fastify = mature, écosystème large. |
| Authentification | Better Auth / Clerk | Better Auth = open source, self-hosted, gratuit. Clerk = SaaS payant, UI prête, zéro friction. |
| Hébergement frontend | Vercel / autre | Vercel = optimal pour Next.js. |
| Hébergement backend + BDD | Railway / Fly.io / VPS Hetzner | À voir selon budget et besoin de contrôle. |

## Schéma BDD

À spécifier en détail (17 tables prévues, regroupées en 5 groupes) :

### Groupe 1 — POI & Catalogue (5 tables)
- `pois` — données OSM/Wikidata brutes
- `poi_translations` — noms/descriptions multilingues
- `poi_subcategories` — relation POI → sous-catégories
- `poi_tags` — tags transversaux
- `poi_overrides` — enrichissements éditoriaux

### Groupe 2 — Référentiels (3 tables)
- `categories` — 8 catégories principales
- `subcategories` — 41 sous-catégories
- `ingestion_logs` — historique des ingestions

### Groupe 3 — Utilisateurs (2 tables)
- `users` — comptes
- `user_preferences` — profil voyageur

### Groupe 4 — Voyages (4 tables)
- `trips`
- `trip_days`
- `trip_items`
- `trip_shares`

### Groupe 5 — Interactions (3 tables)
- `swipes`
- `notes`
- `ads`

## Flux à spécifier

### Découverte / Swipe
- Algorithme de tri (score popularité × préférences user × distance)
- Pagination du deck
- Logique de "proposition intelligente"
- Filtres serveur vs client

### Planification / Agenda
- Algorithme d'optimisation (clustering + ordre)
- Gestion des contraintes horaires (ouverture, durée moyenne)
- Recalcul partiel vs total
- Intégration GraphHopper pour les temps de trajet

### Temps réel / GPS
- Fréquence de polling GPS
- Seuil de recalcul (retard de combien déclenche un ajustement)
- Stratégie de notifications push (Web Push API)
- Gestion offline (mode hors ligne pendant la visite)

### Partage
- Format du lien (UUID public ou slug ?)
- Expiration éventuelle
- Affichage : auth requise ou public ?

## Monétisation

- Schéma BDD pour les annonces
- Règles d'affichage (fréquence dans le swipe, ciblage)
- Régie publicitaire ? (Google AdSense, régie maison…)

## UX / Maquette

À définir en parallèle de la spec technique :
- Liste des écrans clés
- Wireframes / maquettes Figma
- Charte graphique
- Identité visuelle (nom, logo)

## Périmètre maquette de test (niveau 2)

Décidé : maquette **fonctionnelle avec données réelles**, ville pilote **Bayonne**.

Écrans minimums pour la maquette :
- Création d'un trip (formulaire simple)
- Swipe avec POI réels de Bayonne
- Agenda généré (basique : tri géographique + horaires)
- Carte avec POI affichés

Tables BDD minimales pour la maquette :
- `users`, `pois`, `poi_translations`, `trips`, `trip_items`, `swipes`
- + référentiels `categories` et `subcategories`

Soit ~8 tables sur les 17 prévues. Le reste peut attendre.
