# 00 — Overview

## Concept

Application de planification de voyages intelligente et proactive. Génère des itinéraires sur mesure en fonction des contraintes réelles (temps, budget, transport) et du profil de l'utilisateur.

Web responsive en priorité, futur portage mobile natif possible.

**Objectif** : être le meilleur compagnon de voyage de l'utilisateur, façon "Waze du tourisme" — simple, accessible à tous.

## Fonctionnalités clés

### 1. Découverte et sélection
- **Mode swipe** (style Tinder) : système de cartes pour valider/rejeter des lieux
- Priorisation **lieux populaires** pour les nouveaux visiteurs
- Priorisation **lieux locaux/culturels** pour ceux ayant déjà visité la ville
- **Filtres personnalisables** : prix, horaires, popularité, accessibilité PMR
- **Carte interactive** : sélection manuelle de POI sur carte
- **Barre de recherche** sur les POI de la ville et alentours
- **Proposition automatique** : bouton pour laisser l'app sélectionner les meilleurs POI et construire un agenda

### 2. Organisation dynamique
- Création d'agenda automatique basée sur durée moyenne de visite + temps de trajet
- Modes de transport : pied, voiture, transports en commun
- Réarrangement dynamique : si l'utilisateur reste plus longtemps, l'agenda se recalcule
- Multi-voyages : gestion de plusieurs projets en parallèle

### 3. Assistance proactive
- Notifications de guidage : "C'est l'heure de partir", "2h sur place pour profiter"
- Rappels de sécurité et de timing

### 4. Social et notes
- Partage d'itinéraires (read-only)
- Notes personnelles sur chaque POI

### 5. Proposition intelligente
- Affinage des préférences via swipe et historique de voyages
- Modification manuelle des préférences possible

### 6. Données de voyage
- Saisie vol arrivée / vol départ / lieu de résidence

## Périmètre MVP

| Élément | Décision |
|---|---|
| Plateforme cible | Web responsive (un seul codebase) |
| Échelle visée | Centaines à milliers d'utilisateurs |
| Comptes utilisateurs | Auth + profils dès le début |
| Périmètre géographique | Nouvelle-Aquitaine |
| Ville pilote pour la maquette | Bayonne |
| Langues | FR, EN, ES, DE, PT, IT, ZH, JA, VI (9 langues) |

## Stack technique

| Couche | Choix | Statut |
|---|---|---|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS | ✅ |
| Backend | API découplée (Node) | ✅ |
| Framework API | Hono ou Fastify | ❓ |
| BDD | PostgreSQL + PostGIS | ✅ |
| ORM | Drizzle | ✅ |
| Auth | Better Auth ou Clerk | ❓ |
| Cartographie | MapLibre GL JS + tuiles OSM | ✅ |
| Calcul d'itinéraires | GraphHopper API (MVP) → OSRM self-hosted | ✅ |
| Hébergement | Vercel + VPS/Railway | ❓ |
| Containers | Docker Compose en dev local | ✅ |

## Modèle économique

- **Bannières publicitaires** sur les vues Agenda, Favoris, Carte
- **Publicité native** dans le flux de swipe (cartes sponsorisées)

## Disponibilité

- Ordinateur (planification)
- Téléphone (planification + suivi sur place)
