# Projekt Specifikáció - Eseménykezelő

## Projekt leírása
Az alkalmazás egy mobil naptár és eseményszervező rendszer, amely "offline-first" szemlélettel készült. Segítségével a felhasználók saját eseményeket hozhatnak létre, kategorizálhatják azokat, és helyszíneket rendelhetnek hozzájuk, akár internetkapcsolat nélkül is.

## Technológiai döntések (Nem-funkcionális követelmények)
* **Keretrendszer:** Capacitor (Hibrid megközelítés a natív teljesítményért)
* **Frontend:** Next.js (React) TypeScript alapokon a típusbiztonságért
* **Adattárolás:** Helyi SQLite adatbázis (@capacitor-community/sqlite) a perzisztencia és az offline működés érdekében
* **Megjelenítés:** Tailwind CSS az adaptív és modern UI-ért

## Felhasználói szerepkörök
1.  **Admin:** Felhasználókat hozhat létre, és jogosult az adatbázis teljes alaphelyzetbe állítására (Maintenance).
2.  **User:** Saját eseményeket kezelhet (létrehozás, módosítás, törlés) és jelentkezhet mások által létrehozott publikus eseményekre.

## Képernyőlista és Navigáció
* **Bejelentkezés (`/login`):** Felhasználói azonosítás.
* **Főoldal/Lista (`/`):** Az események áttekintése kártyás elrendezésben.
* **Naptár nézet:** Idővonalas ábrázolás a napi teendőkről.
* **Dashboard (`/dashboard`):** Kezelőfelület az események szerkesztéséhez és adminisztrációhoz (Guard-dal védve).
