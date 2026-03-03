# Mobil Alkalmazásfejlesztés Projekt - Eseménykezelő

Ez a projekt a 2025/26-os tavaszi félév "Mobilfejlesztési keretrendszerek" kurzusára készült. Az alkalmazás egy offline-first eseményszervező naptár, amely lehetővé teszi események kezelését, kategorizálását és helyszínek hozzárendelését.

## 📱 Technológiák
A projekt "Hibrid" megközelítéssel készült:
* **Keretrendszer:** [Capacitor](https://capacitorjs.com/) (Webes kód futtatása natív környezetben)
* **Frontend:** [Next.js](https://nextjs.org/) (React) + TypeScript
* **Stílus:** [Tailwind CSS](https://tailwindcss.com/)
* **Adatbázis:** SQLite (lokális adattárolás a készüléken `@capacitor-community/sqlite`)
* **Tesztelés:** Vitest

## 🚀 Funkciók
* **CRUD:** Események létrehozása, listázása, szerkesztése, törlése.
* **Adatmodellek (5 db):** 1. Users (Felhasználók)
    2. Events (Események)
    3. Categories (Kategóriák)
    4. Locations (Helyszínek)
    5. Registrations (Jelentkezések - Kapcsolótábla)
* **Nézetek:** * 📋 Lista nézet (Részletes kártyák)
    * 📅 Naptár nézet (Sávos idővonal, mint a Google Calendar)
    * 🌍 Publikus nézet (Mások eseményeinek megtekintése)
* **Szerepkörök:** * **Admin:** Új felhasználó létrehozása, Adatbázis resetelése.
    * **User:** Saját események kezelése, Csatlakozás más eseményekhez.
* **Meeting integráció:** Automatikus Jitsi meeting link generálás.

## 🛠️ Telepítés és Futtatás

Előfeltétel: Node.js, Android Studio és Java JDK telepítése.

### 1. Függőségek telepítése
Lépj be a frontend könyvtárba:
```bash
cd frontend
npm install
