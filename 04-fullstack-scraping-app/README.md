


Version Francaise : 
# Web Scraper utilisant React et Node

## Aperçu

Ce projet est un web scraper full-stack composé d’un frontend React et d’un backend Node.js. Le frontend est construit avec [React](https://react.dev/) et initialisé avec [Vite](https://vitejs.dev/) pour un développement rapide, tandis que le backend utilise **Express.js**, **Axios**, **Cheerio** et **Puppeteer** pour gérer la fonctionnalité de scraping.

Les utilisateurs peuvent saisir une URL cible depuis le frontend, qui est ensuite traitée par le backend pour scraper et renvoyer les données pertinentes de la page.

---

## Structure du projet

Le code source est organisé en deux dossiers principaux :

- `client/` – Contient le code du frontend construit avec React + Vite.
- `server/` – Contient la logique backend et le moteur de scraping utilisant Node.js et Express.

---

## Technologies utilisées

- **Frontend** : React, Vite
- **Backend** : Node.js, Express.js, Axios, Cheerio, Puppeteer

---


## Exécution de l'application

### Backend (Serveur) :

Pour lancer le serveur backend en mode développement :
```bash
cd server
npm start
```

---

### Frontend (Client) :

Accédez au répertoire client/ et exécutez :
```bash
npm run dev
```

---

## Construction pour la production :

```bash
npm run build
```

---

## Prévisualiser la version de production localement :

```bash
npm run preview
```




English Version :

#  Web Scraper using React and node : 

## Overview

This project is a full-stack web scraper consisting of a React frontend and a Node.js backend. The frontend is built using [React](https://react.dev/) and bootstrapped with [Vite](https://vitejs.dev/) for fast development, while the backend leverages **Express.js**, **Axios**, **Cheerio**, and **Puppeteer** to handle the web scraping functionality.

Users can input a target URL from the frontend, which is then processed by the backend to scrape and return relevant page data.

---

## Project Structure

The codebase is organized into two main directories:

- `client/` – Contains the frontend application built with React + Vite.
- `server/` – Contains the backend logic and scraping engine using Node.js and Express.

---

## Technologies Used

- **Frontend**: React, Vite
- **Backend**: Node.js, Express.js, Axios, Cheerio, Puppeteer

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js (version 14 or higher)
- npm or yarn

---

### Installation


. Install backend dependencies:
cd server
npm install

. Install frontend dependencies:

cd ../client
npm install
. Running the Application
Backend (Server) : 
To start the backend server in development mode:
cd server
npm start
Frontend (Client)
Navigate to the client/ directory and run:
npm run dev

. Building for Production : 
npm run build

. To preview the production build locally:
npm run preview


