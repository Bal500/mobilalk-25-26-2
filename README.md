# Mobil Alkalmazásfejlesztés Projekt - Eseménykezelő

Ez a projekt a 2025/26-os tavaszi félév "Mobil alkalmazásfejlesztés" kurzusára készült. Az alkalmazás egy offline-first eseményszervező naptár, amely lehetővé teszi események kezelését, kategorizálását és helyszínek hozzárendelését.

## 📱 Technológiák
A projekt "Hibrid" megközelítéssel készült:
* **Keretrendszer:** [Capacitor](https://capacitorjs.com/) (Webes kód futtatása natív környezetben)
* **Frontend:** [Next.js](https://nextjs.org/) (React) + TypeScript
* **Stílus:** [Tailwind CSS](https://tailwindcss.com/)
* **Adatbázis:** SQLite (lokális adattárolás a készüléken `@capacitor-community/sqlite`)
* **Tesztelés:** Vitest

## 🛡️ Biztonság és Hozzáférés
Az alkalmazás többszintű védelmet és jogosultságkezelést alkalmaz a biztonsági előírásoknak megfelelően:
* **Védett képernyők (Guards):** A belső funkciók, mint például a **Dashboard** (`/dashboard`), védettek a jogosulatlan hozzáférés ellen. Érvényes bejelentkezési munkamenet hiányában a rendszer automatikusan visszairányítja a felhasználót a bejelentkezési oldalra (`/login`).
* **Szerepkör-alapú UI:** * **Admin:** Hozzáférés az adminisztrációs funkciókhoz, mint az új felhasználók létrehozása vagy az adatbázis resetelése.
    * **User:** Saját események kezelése és jelentkezés más eseményekre.
* **Input validáció:** Kliensoldali ellenőrzés biztosítja az adatok integritását minden űrlapnál (pl. dátumok sorrendje, cím hossza).

## 🚀 Funkciók
* **CRUD műveletek:** Események létrehozása, listázása, szerkesztése és törlése megerősítő dialógussal.
* **Adatmodellek (5 db):**
    1. Users (Felhasználók)
    2. Events (Események)
    3. Categories (Kategóriák)
    4. Locations (Helyszínek)
    5. Registrations (Jelentkezések - Kapcsolótábla)
* **Nézetek:** * 📋 Lista nézet (Részletes kártyák)
    * 📅 Naptár nézet (Sávos idővonal)
    * 🌍 Publikus nézet (Mások eseményeinek megtekintése)
* **Meeting integráció:** Automatikus Jitsi meeting link generálás az eseményekhez.

## 🛠️ Telepítés és Futtatás
Előfeltétel: Node.js, Android Studio és Java JDK telepítése.

### 1. Telepítés
```bash
cd frontend
npm install
npm run build
npx cap sync
npx cap open android
