# 04 — Scoring de popularité

Le score de popularité détermine **dans quel ordre les POI remontent** dans le swipe et la découverte. C'est le rempart principal contre le bruit (kebab du coin vs Dune du Pilat).

## Échelle

Score stocké en **float entre 0.0 et 1.0**.

Avantages vs échelle 1-7 d'OpenTripMap :
- Plus de granularité pour le tri
- Facile à mixer avec d'autres signaux (distance, fraîcheur, préférences user)
- Conversion en étoiles triviale pour l'affichage

## Formule

```
score_brut = 
    (wikidata_present ? 10 : 0)
  + (wikipedia_langs * 3)        # plafond ~17 langues
  + (unesco ? 30 : 0)
  + (heritage_national ? 15 : 0)
  + (heritage_local ? 5 : 0)
  + (osm_completeness * 5)       # 0-1 selon la richesse des tags
  + (has_image ? 5 : 0)
  + (has_opening_hours ? 3 : 0)

boost_catégorie = 
    sous_cat in [UNESCO, Châteaux, Beaux-arts]   : *1.2
    sous_cat in [Bars, Cafés, Restaurants]       : *0.7
    autres                                        : *1.0

score_final = min(100, score_brut * boost_catégorie) / 100
```

## Signaux pris en compte

### Forts (poids élevé)

| Signal | Source | Justification |
|---|---|---|
| Présence Wikidata QID | OSM tag `wikidata=*` | Indique un POI référencé |
| Article Wikipedia (par langue) | Wikidata sitelinks | Bon proxy de notoriété |
| Nombre de langues Wikipedia | Wikidata | 1-3 = local, 4-10 = national, 10+ = mondial |
| Statut UNESCO | Wikidata `P1435` ou `heritage:operator=whc` | Bonus majeur |
| Monument historique national | OSM `heritage`, base Mérimée | Bonus important |

### Moyens

| Signal | Source |
|---|---|
| Densité des tags OSM | présence de `description`, `wikipedia`, `image`, `website`, `opening_hours` |
| Image Wikimedia Commons | Wikidata `P18` |
| Type de POI | sous-catégorie (boost ou pénalité) |
| Surface du POI | géométrie OSM (way, relation) |

### Boucle de feedback utilisateur (prévue, pas exploitée MVP)

| Signal | Source |
|---|---|
| Swipes droite reçus | table `swipes` |
| Ajouts à des agendas | table `trip_items` |
| Visites réelles confirmées par GPS | logs de présence (futur) |

✅ Le champ `score_user_signal` est prévu en BDD dès le départ.

## Exemples concrets

| POI | Composantes | Score brut | Score final |
|---|---|---|---|
| Dune du Pilat | UNESCO + ~50 langues Wiki + image + completion | ~95 | 0.95 |
| Château de Bonaguil | National + 10 langues + image | ~60 | 0.65 |
| Musée Basque (Bayonne) | 5 langues + image | ~35 | 0.42 |
| Café "Le Comptoir" | resto basique, pas de wiki | ~5 | 0.04 |

## Quand recalculer ?

- À chaque **full refresh d'ingestion** : recalcul complet
- À l'ingestion incrémentale : recalcul des POI touchés uniquement
- Les pondérations sont des **valeurs de départ** à ajuster après tests réels

## Stockage en BDD

Champs prévus dans la table `pois` :
- `score_base` : float [0,1] — issu de la formule ci-dessus
- `score_user_signal` : float [0,1] — alimenté par les interactions user (futur)
- `score_combined` : float [0,1] — score affiché final, calculé/cached selon la stratégie

À la diffusion (API découverte), on pourra modulariser :
```
score_affiche = α × score_base + β × score_user_signal + γ × pertinence_user
```

Avec α, β, γ ajustables selon la stratégie de reco.
