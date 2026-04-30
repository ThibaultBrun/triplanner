# 03 — Taxonomie

## Modèle

Taxonomie **sur-mesure**, hiérarchique à 2 niveaux + tags transversaux.

| Niveau | Contenu | Cardinalité par POI |
|---|---|---|
| Catégorie principale | 8 catégories | **1** (priorité figée en cas de conflit) |
| Sous-catégorie | 41 sous-catégories | **1+** (plusieurs possibles) |
| Tags transversaux | 9 axes | **1+** par axe |

## Catégories principales et sous-catégories

### 1. Patrimoine & Monuments
- Châteaux & forteresses
- Édifices religieux
- Sites archéologiques & préhistoriques
- Monuments & mémoriaux
- Architecture remarquable
- Villages & cités historiques

### 2. Musées & Art
- Beaux-arts & art classique
- Art contemporain & galeries
- Histoire & civilisations
- Sciences & techniques
- Écomusées & traditions locales
- Street art & art urbain

### 3. Nature & Paysages
- Plages & littoral
- Forêts & sentiers
- Points de vue & panoramas
- Grottes & formations rocheuses
- Lacs, rivières & cascades
- Réserves naturelles & faune
- Dunes & sites géologiques

### 4. Sport & Aventure
- Surf & sports de glisse
- Randonnée & trek
- Vélo & VTT
- Sports nautiques
- Sports aériens
- Escalade & via ferrata
- Sports équestres

### 5. Gastronomie & Terroir
- Restaurants
- Cafés & salons de thé
- Caves & dégustation de vins
- Marchés & halles
- Producteurs & fermes
- Spécialités régionales

### 6. Loisirs & Famille
- Parcs d'attractions
- Zoos & parcs animaliers
- Aquariums
- Parcs aquatiques
- Mini-golf & jeux
- Parcs & jardins
- Activités enfants

### 7. Bien-être
- Spas & instituts
- Thalassothérapie
- Thermalisme & sources chaudes
- Yoga & retraites

### 8. Vie nocturne & Spectacles
- Bars & pubs
- Boîtes de nuit & clubs
- Salles de concert & live music
- Théâtres
- Cinémas
- Opéras & spectacles classiques

## Tags transversaux (9 axes)

| Axe | Valeurs possibles | Source |
|---|---|---|
| Public cible | famille, couple, enfants OK, solo, adulte uniquement, entre amis | déduit de la sous-cat |
| Conditions | intérieur, extérieur, pluie OK, beau temps requis, saisonnier, nocturne | déduit de la sous-cat |
| Durée | <30min, 30min-1h, 1-2h, 2-4h, ½ journée, journée | déduit de la sous-cat |
| Coût | gratuit, <10€, 10-25€, >25€ | OSM `fee`, `charge` |
| Accessibilité | PMR complet, PMR partiel, non accessible, poussette, audio-description, LSF | OSM `wheelchair`, `wheelchair:description` |
| Effort physique | aucun, marche modérée, randonnée, sportif | déduit de la sous-cat |
| Ambiance | romantique, insolite, branché, authentique, photogénique, paisible, animé | éditorial (POI majeurs) |
| Réservation | sans, recommandée, obligatoire | OSM `reservation` |
| Type de cuisine | française, italienne, japonaise, fruits de mer, fast food… | OSM `cuisine` |

## Mapping OSM → Taxonomie

Règles à **priorité figée** : la première règle qui matche assigne la catégorie principale. Pour les sous-catégories, plusieurs peuvent matcher (cumul autorisé).

### 1. Patrimoine & Monuments

| Tags OSM | Sous-catégorie |
|---|---|
| `historic=castle`, `historic=fort`, `historic=fortification` | Châteaux & forteresses |
| `amenity=place_of_worship`, `building=church`, `building=cathedral`, `building=monastery`, `building=chapel` | Édifices religieux |
| `historic=archaeological_site`, `historic=ruins`, `historic=megalith`, `historic=tomb` | Sites archéologiques & préhistoriques |
| `historic=monument`, `historic=memorial`, `historic=wayside_cross` | Monuments & mémoriaux |
| `man_made=lighthouse`, `man_made=bridge`, `historic=building`, `building=historic` | Architecture remarquable |
| `place=village` ET `historic=*`, ou listes éditoriales | Villages & cités historiques |

### 2. Musées & Art

| Tags OSM | Sous-catégorie |
|---|---|
| `tourism=museum` + `museum=art` | Beaux-arts & art classique |
| `tourism=gallery`, `tourism=museum` + `museum=modern_art\|contemporary` | Art contemporain & galeries |
| `tourism=museum` + `museum=history\|local\|archaeological` | Histoire & civilisations |
| `tourism=museum` + `museum=science\|technology\|transport\|aviation` | Sciences & techniques |
| `tourism=museum` + `museum=ethnography\|open_air` | Écomusées & traditions locales |
| `tourism=artwork` (groupé géographiquement) | Street art & art urbain |

### 3. Nature & Paysages

| Tags OSM | Sous-catégorie |
|---|---|
| `natural=beach`, `leisure=beach_resort` | Plages & littoral |
| `route=hiking`, `highway=path` + `tourism=*` | Forêts & sentiers |
| `tourism=viewpoint`, `natural=peak` | Points de vue & panoramas |
| `natural=cave_entrance`, `natural=arch`, `natural=cliff`, `natural=rock` | Grottes & formations rocheuses |
| `natural=waterfall`, `water=lake`, `natural=spring` | Lacs, rivières & cascades |
| `boundary=protected_area`, `leisure=nature_reserve` | Réserves naturelles & faune |
| `natural=dune`, `natural=sand` | Dunes & sites géologiques |

### 4. Sport & Aventure

| Tags OSM | Sous-catégorie |
|---|---|
| `sport=surfing`, `sport=kitesurfing`, `leisure=surf_school` | Surf & sports de glisse |
| `route=hiking`, `tourism=trail_riding_station` | Randonnée & trek |
| `route=bicycle`, `route=mtb`, `sport=cycling` | Vélo & VTT |
| `sport=canoe`, `sport=sailing`, `sport=scuba_diving`, `leisure=marina` | Sports nautiques |
| `sport=paragliding`, `sport=parachuting` | Sports aériens |
| `sport=climbing`, `sport=via_ferrata` | Escalade & via ferrata |
| `sport=equestrian`, `leisure=horse_riding` | Sports équestres |

### 5. Gastronomie & Terroir

| Tags OSM | Sous-catégorie |
|---|---|
| `amenity=restaurant`, `amenity=fast_food`, `amenity=food_court` | Restaurants |
| `amenity=cafe`, `amenity=ice_cream`, `shop=tea` | Cafés & salons de thé |
| `craft=winery`, `shop=wine`, `tourism=wine_cellar` | Caves & dégustation de vins |
| `amenity=marketplace`, `shop=marketplace` | Marchés & halles |
| `shop=farm`, `tourism=farm`, `craft=cheesemaker` | Producteurs & fermes |
| `craft=confectionery`, `craft=chocolate`, `craft=distillery` | Spécialités régionales |

### 6. Loisirs & Famille

| Tags OSM | Sous-catégorie |
|---|---|
| `tourism=theme_park`, `attraction=*` | Parcs d'attractions |
| `tourism=zoo`, `attraction=animal` | Zoos & parcs animaliers |
| `tourism=aquarium` | Aquariums |
| `leisure=water_park` | Parcs aquatiques |
| `leisure=miniature_golf`, `leisure=amusement_arcade` | Mini-golf & jeux |
| `leisure=park`, `leisure=garden`, `leisure=botanical_garden` | Parcs & jardins |
| `leisure=escape_game`, `leisure=adventure_park` | Activités enfants |

### 7. Bien-être

| Tags OSM | Sous-catégorie |
|---|---|
| `leisure=spa`, `shop=massage` | Spas & instituts |
| `tourism=hotel` + `thalasso=yes` | Thalassothérapie |
| `amenity=public_bath`, `natural=hot_spring` | Thermalisme & sources chaudes |
| `sport=yoga`, `amenity=yoga_centre` | Yoga & retraites |

### 8. Vie nocturne & Spectacles

| Tags OSM | Sous-catégorie |
|---|---|
| `amenity=bar`, `amenity=pub`, `amenity=biergarten` | Bars & pubs |
| `amenity=nightclub` | Boîtes de nuit & clubs |
| `amenity=music_venue`, `amenity=concert_hall` | Salles de concert & live music |
| `amenity=theatre` | Théâtres |
| `amenity=cinema` | Cinémas |
| `amenity=opera_house` | Opéras & spectacles classiques |

## Extraction automatique des tags transversaux

| Tag transversal | Source |
|---|---|
| Coût | `fee=yes/no`, `charge=*` |
| Accessibilité | `wheelchair=yes/limited/no`, `wheelchair:description` |
| Type de cuisine | `cuisine=*` (multi-valeurs possibles) |
| Réservation | `reservation=required/recommended/no` |
| Conditions | déduit de la sous-catégorie |
| Durée | déduit de la sous-catégorie (durée moyenne calibrée) |
| Public cible | déduit (zoo/aquarium = "famille") |
| Effort physique | déduit (randonnée/escalade = "sportif") |
| Ambiance | éditorial uniquement (peu auto-extractible) |

## Conflits de mapping

Stratégie : **priorité figée**. L'ordre des règles dans la liste de catégorisation détermine qui gagne. Premier match = catégorie principale.

Exemple : un château qui héberge un musée → `historic=castle` est testé avant `tourism=museum` → catégorisé en "Patrimoine & Monuments / Châteaux & forteresses". Le caractère "musée" peut être conservé via une sous-catégorie additionnelle.
