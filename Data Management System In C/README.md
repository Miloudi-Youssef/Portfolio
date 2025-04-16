# Système de Gestion de Cinéma en C

Ce projet est une application en langage C permettant de gérer de manière complète les opérations d’un cinéma, notamment la gestion des films, des salles, des clients, des guichets, des réservations, des diffusions et de l’historique de visionnage.

## Tables de Données

- **Film :** Enregistre les informations liées aux films (titre, réalisateur, année de sortie, genre, etc.).
- **Salle :** Contient les données des salles (numéro, capacité, type de projection, etc.).
- **Client :** Stocke les informations personnelles des clients (nom, adresse, téléphone, etc.).
- **Guichet :** Gère les données des guichets de billetterie (identifiant, emplacement, etc.).
- **Réservation :** Regroupe les réservations effectuées pour les séances.
- **Historique (Visionnage) :** Archive les films consultés par chaque client.
- **Diffusion :** Gère les diffusions programmées (film, salle, date, heure, etc.).

## Fonctionnalités

- **Affichage :** Visualisation des enregistrements présents dans les différentes tables.
- **Ajout :** Ajout de nouveaux films, clients, salles, réservations, etc.
- **Suppression :** Retrait des éléments enregistrés (clients, films, salles...).
- **Recherche :** Consultation ciblée à partir de critères définis.
- **Requêtes avancées :** Extraction de données spécifiques via des filtres personnalisés.

## Structures de Données Utilisées

- **Tableaux :** Pour la gestion simple et linéaire des données.
- **Listes chaînées :** Pour une insertion et suppression dynamiques plus efficaces.
- **Arbres :** Pour structurer et organiser les données hiérarchiquement.

## Guide d’Utilisation

1. Clonez ce dépôt sur votre poste local.
2. Compilez le projet à l’aide d’un compilateur C.
3. Lancez l’exécutable généré.
4. Suivez les instructions affichées à l’écran pour accéder aux différentes options du menu.