# AI Prompt Napló - Eseménykezelő Projekt

**Hallgató:** [Írd ide a Neved]
**Neptun kód:** [Írd ide a Kódod]

## 1. Adatbázis Tervezés
**Dátum:** 2026.03.01.
**Prompt:** "Segíts megtervezni egy SQLite adatbázis sémát egy eseménykezelő apphoz Capacitorban. Kell felhasználó, esemény és résztvevők."
**AI Válasz:** Javasolt három táblát (Users, Events, Participants), és SQL CREATE parancsokat.
**Döntés:** **Részben elfogadva.** **Indoklás:** A `Participants` táblát először egyszerűsítettem egy szöveges mezőre az `Events` táblában az egyszerűség kedvéért (`participants` TEXT mező), de később (03.03-án) a tanári követelmények (min. 5 entitás) miatt visszatértem a külön kapcsolótáblás megoldáshoz (`registrations`), kiegészítve `categories` és `locations` táblákkal.

## 2. UI Komponensek - Timeline Nézet
**Dátum:** 2026.03.02.
**Prompt:** "Készíts egy sávos idővonal (timeline) nézetet Reactben, ami hasonlít a Google Calendarra, Tailwind CSS-sel. A sávok magassága függjön az esemény hosszától."
**AI Válasz:** Generált egy komplex kódot `div`-ekkel és abszolút pozicionálással, ami kiszámolja a percek alapján a `top` és `height` értékeket pixelben (pl. `top: startMinutes * 1px`).
**Döntés:** **Módosítással elfogadva.**
**Kritika & Javítás:** Az AI kódja működött, de nem kezelte az átfedéseket (ha két esemény ugyanakkor van). Ezt manuálisan kellett korrigálnom a `z-index` és `left-offset` logikával, hogy a sávok ne takarják ki egymást teljesen, hanem egymás mellett jelenjenek meg. A CSS színeket is átírtam a Dark Mode témához.

## 3. Hibajavítás - TypeScript Interface
**Dátum:** 2026.03.03.
**Prompt:** "A formEvent.category_id hibát dob a build során: Property does not exist on type 'Event'."
**AI Válasz:** Azt javasolta, hogy egészítsem ki a TypeScript interface-t egy `category_id` mezővel.
**Döntés:** **Elutasítva / Más megoldás.**
**Indoklás:** A probléma valójában az volt, hogy a kódban nem egy közös objektumot használtam az űrlaphoz, hanem külön `useState` változókat (`newTitle`, `newDesc` stb.). Így nem az interface-t kellett módosítani, hanem létre kellett hozni új state változókat (`categoryId`, `locationId`) és azokat bekötni a `select` mezőkhöz.

## 4. Tesztelés - Unit Tesztek
**Dátum:** 2026.03.03.
**Prompt:** "Írj unit teszteket Vitesthez a dátumformázó és validáló függvényemhez."
**AI Válasz:** Generált 5 "happy path" tesztesetet (amikor minden adat helyes).
**Döntés:** **Kiegészítve.**
**Indoklás:** Az AI nem írt tesztet a szélsőséges esetekre (pl. üres string, érvénytelen dátum formátum). Ezeket manuálisan adtam hozzá a `logic.test.ts`-hez, hogy a kód robusztusabb legyen.

## AI Korlátok összegzése
A fejlesztés során tapasztaltam, hogy az AI a React komponensek vizuális megjelenítésében (pl. naptár rács) gyakran pontatlan, és a generált kód nem mindig reszponzív. A logikai részeknél (SQL lekérdezések, segédfüggvények) viszont nagy segítséget nyújtott a gyorsabb haladásban.
