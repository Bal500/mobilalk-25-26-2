# AI Prompt Napló - Eseménykezelő Projekt

**Hallgató:** Fábián Balás
**Neptun kód:** LGXKWD

## 1. Adatbázis Tervezés
**Dátum:** 2026.03.01.
**Prompt:** "Segíts megtervezni egy SQLite adatbázis sémát egy eseménykezelő apphoz Capacitorban. Kell felhasználó, esemény és résztvevők."
**AI Válasz:** Javasolt három táblát (Users, Events, Participants), és SQL CREATE parancsokat.
**Döntés:** **Részben elfogadva.**
**Indoklás:** A `Participants` táblát először egyszerűsítettem, de később a tanári követelmények (min. 5 entitás) miatt visszatértem a külön kapcsolótáblás megoldáshoz (`registrations`), kiegészítve `categories` és `locations` táblákkal.

## 2. UI Komponensek - Timeline Nézet
**Dátum:** 2026.03.02.
**Prompt:** "Készíts egy sávos idővonal (timeline) nézetet Reactben, ami hasonlít a Google Calendarra, Tailwind CSS-sel."
**AI Válasz:** Generált egy komplex kódot abszolút pozicionálással a percek alapján.
**Döntés:** **Módosítással elfogadva.**
**Kritika & Javítás (AI TÉVEDÉS):** Az AI kódja nem kezelte az átfedéseket (ha két esemény ugyanakkor van). Ezt manuálisan korrigáltam `z-index` és `left-offset` logikával, hogy a sávok ne takarják ki egymást.

## 3. Hibajavítás - TypeScript Interface
**Dátum:** 2026.03.03.
**Prompt:** "A formEvent.category_id hibát dob a build során: Property does not exist on type 'Event'."
**AI Válasz:** Javasolta a TypeScript interface kiegészítését.
**Döntés:** **Elutasítva.**
**Indoklás (AI TÉVEDÉS):** A probléma nem az interface hiánya volt, hanem a state kezelés logikája. Interface módosítás helyett külön `useState` változókat vezettem be a formhoz, ami tisztább megoldás volt.

## 4. Tesztelés - Unit Tesztek
**Dátum:** 2026.03.03.
**Prompt:** "Írj unit teszteket Vitesthez a dátumformázó és validáló függvényemhez."
**AI Válasz:** Generált 5 alapvető "happy path" tesztesetet.
**Döntés:** **Kiegészítve.**
**Indoklás:** Az AI nem fedte le a szélsőséges eseteket (üres string, rossz formátum), ezért ezeket manuálisan hozzáadtam a `logic.test.ts`-hez a robusztusabb működés érdekében.

## 5. Aszinkron Állapotkezelés - Spinner
**Dátum:** 2026.03.04.
**Prompt:** "Hogyan jelezzem a felhasználónak, amíg az SQLite-ból töltődnek be az adatok?"
**AI Válasz:** Javasolt egy `isLoading` boolean változót és egy "Betöltés..." szöveget.
**Döntés:** **Módosítással elfogadva.**
**Indoklás:** A sima szöveg helyett egy vizuálisan tetszetősebb `framer-motion` alapú Spinner komponenst készítettem a jobb mobil UX érdekében.

## 6. Jitsi Meet Integráció
**Dátum:** 2026.03.05.
**Prompt:** "Hogyan tudok egyedi, biztonságos meeting szobanevet generálni Jitsihez az alkalmazáson belül?"
**AI Válasz:** Javasolt egy véletlenszerű UUID-t vagy az esemény címéből képzett slug-ot.
**Döntés:** **Elfogadva.**
**Indoklás:** Az esemény ID + cím kombinációjából képzett slug-ot választottam, mert így a felhasználók számára is felismerhető a szoba neve a Jitsi felületén.

## 7. Deep Link Konfiguráció
**Dátum:** 2026.03.06.
**Prompt:** "Hogyan állítsam be az AndroidManifest.xml-t, hogy az alkalmazás kezelje az 'ucc-event://' linkeket?"
**AI Válasz:** Adott egy `intent-filter` példát a manifest fájlhoz.
**Döntés:** **Elutasítva / Dokumentáció alapú javítás.**
**Kritika (AI TÉVEDÉS):** Az AI által javasolt szintaxis elavult volt a Capacitor aktuális verziójához képest. A hivatalos Capacitor dokumentáció alapján kellett korrigálnom a konfigurációt, hogy a `DeepLinkHandler.tsx` megfelelően működjön.

## 8. Adatbázis Migráció
**Dátum:** 2026.03.07.
**Prompt:** "Hogyan adjak hozzá egy 'is_public' oszlopot a már létező Events táblához adatvesztés nélkül?"
**AI Válasz:** Javasolta az `ALTER TABLE` parancs futtatását az alkalmazás indításakor.
**Döntés:** **Elfogadva.**
**Indoklás:** Ez a legegyszerűbb módja a séma frissítésének SQLite-ban, és a `@capacitor-community/sqlite` plugin támogatja a kötegelt végrehajtást.

## 9. Admin jogosultságkezelés
**Dátum:** 2026.03.08.
**Prompt:** "Hogyan korlátozzam az 'Adatbázis Reset' gombot csak az admin felhasználónak?"
**AI Válasz:** Javasolt egy UI szintű szűrést: `{user.role === 'admin' && <Button ... />}`.
**Döntés:** **Kiegészítve.**
**Indoklás:** A UI elrejtése nem elég biztonságos. A `db.tsx` fájlban a tényleges törlő függvénybe is beépítettem egy ellenőrzést, hogy hívás szinten is védve legyen a funkció.

## 10. Mobil-specifikus Styling
**Dátum:** 2026.03.09.
**Prompt:** "Milyen Tailwind osztályokkal tudom megakadályozni, hogy a gombokon szövegkijelölés jelenjen meg hosszan tartó érintésnél?"
**AI Válasz:** A `select-none` osztály használatát javasolta.
**Döntés:** **Elfogadva.**
**Indoklás:** Ez elengedhetetlen a natív alkalmazás érzet megteremtéséhez, hogy a gombok ne viselkedjenek webes szövegként.

## AI Korlátok összegzése
A fejlesztés során kiderült, hogy az AI kiváló a boilerplate kód generálásában (pl. SQL sémák, alap validációk), de gyakran elavult konfigurációkat javasol a gyorsan frissülő mobil keretrendszerekhez (Capacitor). A vizuális elrendezéseknél (naptár átfedések) a generált kód manuális finomhangolást igényelt a reszponzivitás és a helyes UX érdekében.
