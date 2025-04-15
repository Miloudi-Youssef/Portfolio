Version Francaise : 
# Contact Management System - API REST

Ce projet est une API backend développée en **Java** avec **Spring Boot** et **MySQL**, permettant de gérer des contacts. Elle offre une architecture RESTful claire et modulaire, idéale pour une intégration avec des applications web ou mobiles.

---

## Présentation du Projet

L’objectif de cette application est de permettre la gestion de contacts via des opérations CRUD (Create, Read, Update, Delete). Chaque contact peut contenir les informations suivantes :
- Nom complet
- Numéro de téléphone
- Adresse e-mail
- Détails d’adresse (optionnels)

Le projet est conçu pour être évolutif et permettre l’ajout futur de fonctionnalités telles que :
- Recherche et filtres
- Authentification utilisateur (JWT ou OAuth2)
- Export des contacts (CSV, PDF)
- Groupes ou étiquettes
- Notifications ou rappels

---

## Technologies Utilisées

| Technologie        | Description                                      |
|--------------------|--------------------------------------------------|
| Java               | Langage principal de développement               |
| Spring Boot        | Framework backend pour l’architecture REST       |
| MySQL              | Base de données relationnelle                    |
| Maven              | Outil de gestion de projet et des dépendances    |
| Lombok             | Réduction du code Java répétitif                 |
| Postman            | Outil de test d’API                              |
| Git & GitHub       | Contrôle de version et hébergement du code       |

---

## Architecture de l’Application

- **Contrôleur (Controller)** : gère les requêtes HTTP et les réponses.
- **Service** : contient la logique métier.
- **Dépôt (Repository)** : interagit avec la base de données via Spring Data JPA.
- **Modèles (Models)** : classes représentant les entités (contacts).
- **Validation** : vérifie la validité des données entrantes.

---

## Points de Terminaison (Endpoints) de l’API

| Méthode | Endpoint                | Description                      |
|---------|-------------------------|----------------------------------|
| GET     | `/api/contacts`         | Récupérer tous les contacts      |
| GET     | `/api/contacts/{id}`    | Récupérer un contact par ID      |
| POST    | `/api/contacts`         | Créer un nouveau contact         |
| PUT     | `/api/contacts/{id}`    | Mettre à jour un contact existant|
| DELETE  | `/api/contacts/{id}`    | Supprimer un contact             |

Les réponses de l’API sont renvoyées au format **JSON**.

---
English Version : 
#  Contact Management System API

A full-featured, scalable backend API developed using **Java**, **Spring Boot**, and **MySQL**, designed to manage and store user contact information. This RESTful API follows clean architecture principles, making it extensible and easy to integrate with any frontend or mobile client.

---

##  Project Overview

This application allows users to perform typical CRUD operations on contact records. It can serve as the backend for a contact management web or mobile application.

Each contact can contain:
- Full name
- Phone number
- Email address
- Location details (optional)

Future-ready design makes it easy to plug in features like:
- Search & filter
- User authentication (JWT or OAuth2)
- Export to CSV or PDF
- Contact tags or groups
- Email notifications or reminders

---

##  Technologies Used

| Technology        | Description                               |
|-------------------|-------------------------------------------|
| Java              | Core programming language                 |
| Spring Boot       | Backend framework (RESTful architecture) |
| MySQL             | Relational database                       |
| Maven             | Build automation tool                     |
| Lombok            | Simplifies Java boilerplate code          |
| Postman           | API testing tool                          |
| Git & GitHub      | Version control                           |

---

##  Architecture

- **Controller layer** handles incoming HTTP requests and sends responses.
- **Service layer** contains the business logic.
- **Repository layer** interacts with the MySQL database using Spring Data JPA.
- **Model layer** defines entity classes for contact data.
- **Validation layer** ensures input correctness.

---

##  REST API Endpoints

| Method | Endpoint           | Description             |
|--------|--------------------|-------------------------|
| GET    | `/api/contacts`     | Fetch all contacts      |
| GET    | `/api/contacts/{id}`| Fetch a single contact  |
| POST   | `/api/contacts`     | Add a new contact       |
| PUT    | `/api/contacts/{id}`| Update a contact        |
| DELETE | `/api/contacts/{id}`| Delete a contact        |

 endpoints return data in **JSON** format.

------*