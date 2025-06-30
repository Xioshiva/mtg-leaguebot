# Guide des commandes du Bot MTG League

Ce document liste toutes les commandes disponibles pour le Bot MTG League. Utilisez ces commandes pour gérer les résultats de tournois, consulter les classements et suivre les scores des joueurs.

## Vue d'ensemble des commandes

Toutes les commandes commencent par une barre oblique (`/`) dans Discord.

## Commandes administratives

### `/parseeventlink`
Ajoute les résultats d'un tournoi à la base de données à partir d'un rapport de classement EventLink collé.

- **Utilisation**: `/parseeventlink [rapport]`
- **Paramètres**:
  - `rapport` (obligatoire): Collez le texte complet du rapport de classement EventLink
- **Exemple**: `/parseeventlink EventLink 12/06/2025, 13:52
Rapport: Classement par rang
Événement: Draft Final Fantasy (8993570)
[...]`

### `/uploadstandings`
Ajoute les résultats d'un tournoi à la base de données à partir d'un fichier texte de classement EventLink téléchargé.

- **Utilisation**: `/uploadstandings [fichier]`
- **Paramètres**:
  - `fichier` (obligatoire): Un fichier .txt contenant le rapport de classement EventLink
- **Exemple**: `/uploadstandings [joindre un fichier tournament-results.txt]`

### `/exportscores`
Exporte les scores sous forme de fichier CSV pour un format spécifique pendant une année de ligue.

- **Utilisation**: `/exportscores [format] [année]`
- **Paramètres**:
  - `format` (obligatoire): Le format Magic pour lequel exporter les scores
  - `année` (obligatoire): L'année au format AAAA (exporte de juin AAAA-1 à mai AAAA)
- **Exemple**: `/exportscores Modern 2025` - Exporte tous les scores du format Modern de juin 2024 à mai 2025 sous forme de fichier CSV

### `/deleteevent`
Supprime un tournoi et tous les scores de joueurs associés par ID d'événement.

- **Utilisation**: `/deleteevent [eventid] [confirm]`
- **Paramètres**:
  - `eventid` (obligatoire): L'identifiant unique du tournoi à supprimer
  - `confirm` (obligatoire): Doit être défini sur `true` pour confirmer la suppression
- **Exemple**: `/deleteevent 8993570 confirm:true` - Supprime le tournoi ID 8993570 et tous ses scores
- **Avertissement**: Cette action ne peut pas être annulée

## Commandes de consultation

### `/tournament`
Affiche les résultats d'un tournoi spécifique par ID d'événement.

- **Utilisation**: `/tournament [eventid]`
- **Paramètres**:
  - `eventid` (obligatoire): L'identifiant unique du tournoi
- **Exemple**: `/tournament 8993570` - Affiche les résultats du tournoi ID 8993570

### `/findevents`
Recherche des tournois par format et/ou date.

- **Utilisation**: `/findevents [format] [date]`
- **Paramètres**:
  - `format` (optionnel): Le format Magic (Limited, Standard, etc.)
  - `date` (optionnel): La date de l'événement au format AAAA-MM-JJ ou AAAA-MM
- **Remarque**: Au moins un paramètre doit être fourni
- **Exemples**: 
  - `/findevents format:Limited` - Trouve tous les tournois Limited
  - `/findevents date:2025-06-15` - Trouve tous les tournois tenus le 15 juin 2025
  - `/findevents format:Modern date:2025-06` - Trouve les tournois Modern en juin 2025

### `/formatleaders`
Affiche les 10 meilleurs joueurs pour un format spécifique pendant une année de ligue (juin à mai).

- **Utilisation**: `/formatleaders [format] [année]`
- **Paramètres**:
  - `format` (obligatoire): Le format Magic pour lequel afficher les classements
  - `année` (obligatoire): L'année au format AAAA (affiche de juin AAAA-1 à mai AAAA)
- **Exemple**: `/formatleaders Limited 2025` - Affiche les 10 meilleurs joueurs Limited de juin 2024 à mai 2025
- **Remarque**: Inclut maintenant le nombre d'événements auxquels chaque joueur a participé

## Formats supportés

Le bot reconnaît et catégorise ces formats Magic: The Gathering:

- **Limited**: Inclut les événements Draft et Sealed
- **Standard**: Format construit Standard
- **Modern**: Format construit Modern
- **Pioneer**: Format construit Pioneer
- **Commander**: Format Commander multijoueur
- **Duel Commander**: Format Commander 1 contre 1
- **Legacy**: Format construit Legacy
- **Vintage**: Format construit Vintage

## Détection de format

Le bot détecte automatiquement les formats à partir des noms de tournois lors de l'analyse des rapports EventLink. Par exemple:
- "Draft Final Fantasy" sera catégorisé comme "Limited"
- "Duel Commander Weekly" sera catégorisé comme "Duel Commander"

## Années de ligue

Les années de ligue s'étendent de juin d'une année à mai de l'année suivante. Par exemple, l'année de ligue 2025 s'étend de juin 2024 à mai 2025.

## Exemples de référence rapide

- `/formatleaders Limited 2025` - Affiche les meilleurs joueurs Limited de juin 2024 à mai 2025
- `/findevents format:Limited date:2025-06-15` - Trouve les événements Limited du 15 juin 2025
- `/tournament 8993570` - Affiche les résultats du tournoi ID 8993570
- `/exportscores Modern 2025` - Exporte tous les scores Modern de juin 2024 à mai 2025
- `/parseeventlink [coller le rapport EventLink]` - Ajoute les résultats d'un tournoi à partir d'un rapport EventLink
- `/uploadstandings [fichier]` - Télécharge et traite un fichier de classement EventLink
- `/deleteevent 8993570 confirm:true` - Supprime le