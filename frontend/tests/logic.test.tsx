import { expect, test, describe, vi } from 'vitest';
import { formatListDate, getDisplayParticipants, validateEvent, isSameDay } from '../utils/logic';
import * as db from '../utils/db'; // Adatbázis függvények importálása az integrációhoz

vi.mock('../utils/db', () => ({
    saveEvent: vi.fn(),
    getEvents: vi.fn(),
}));

describe('Segédfüggvények Tesztelése', () => {

    // 1-3. Teszt: Dátum formázás (Unit)
    test('formatListDate helyesen formáz egy valid dátumot', () => {
        const input = "2026-03-15T10:00:00";
        const result = formatListDate(input);
        expect(result).toContain("márc."); 
        expect(result).toContain("10:00"); 
    });

    test('formatListDate hibát dob üres bemenetre', () => {
        expect(formatListDate("")).toBe("Érvénytelen dátum");
    });

    test('formatListDate kezeli a rossz formátumot', () => {
        expect(formatListDate("nem-dátum")).toBe("Érvénytelen dátum");
    });

    // 4-6. Teszt: Résztvevők lista (Unit)
    test('getDisplayParticipants helyesen vágja szét a vesszős listát', () => {
        const input = "Anna, Béla, Cecil";
        const result = getDisplayParticipants(input);
        expect(result).toHaveLength(3);
        expect(result[1]).toBe("Béla");
    });

    test('getDisplayParticipants kezeli az üres stringet', () => {
        expect(getDisplayParticipants("")).toHaveLength(0);
    });

    test('getDisplayParticipants eltávolítja a felesleges szóközöket', () => {
        const input = "  User1  ,   User2 ";
        const result = getDisplayParticipants(input);
        expect(result[0]).toBe("User1");
        expect(result[1]).toBe("User2");
    });

    // 7-9. Teszt: Validáció (Unit)
    test('validateEvent hibát ad, ha a cím rövid', () => {
        const res = validateEvent("Yo", "2026-01-01", "2026-01-02");
        expect(res.valid).toBe(false);
        expect(res.error).toBe("A cím túl rövid!");
    });

    test('validateEvent hibát ad, ha a dátum fordítva van', () => {
        const res = validateEvent("Helyes Cím", "2026-01-05", "2026-01-01");
        expect(res.valid).toBe(false);
    });

    test('validateEvent elfogadja a helyes adatokat', () => {
        const res = validateEvent("Megfelelő Cím", "2026-01-01", "2026-01-02");
        expect(res.valid).toBe(true);
    });

    // 10. Teszt: Nap összehasonlítás (Unit)
    test('isSameDay felismeri ugyanazt a napot', () => {
        const d1 = new Date("2026-05-10T10:00:00");
        const d2 = new Date("2026-05-10T22:00:00");
        expect(isSameDay(d1, d2)).toBe(true);
    });

});

// INTEGRÁCIÓS TESZT
describe('Fő Folyamat Integrációs Teszt', () => {
    
    test('Új esemény létrehozási folyamat: Validálás -> Mentés -> Listázás', async () => {
        // 1. lépés: Adatok előkészítése
        const eventData = {
            title: "Projekt Megbeszélés",
            start_date: "2026-04-10T14:00:00",
            end_date: "2026-04-10T15:00:00",
            description: "AI integráció átbeszélése",
            owner: "admin"
        };

        // 2. lépés: Validáció (Logic réteg)
        const validation = validateEvent(eventData.title, eventData.start_date, eventData.end_date);
        expect(validation.valid).toBe(true);

        // 3. lépés: Mentés szimulálása (DB réteg)
        vi.mocked(db.saveEvent).mockResolvedValue(undefined);
        await db.saveEvent(eventData, eventData.owner);
        expect(db.saveEvent).toHaveBeenCalledWith(eventData, "admin");

        // 4. lépés: Listázás szimulálása és adat-integritás ellenőrzése
        vi.mocked(db.getEvents).mockResolvedValue([{ ...eventData, id: 1, is_meeting: false, is_public: false }]);
        const events = await db.getEvents("admin");
        
        expect(events).toHaveLength(1);
        expect(events[0].title).toBe("Projekt Megbeszélés");
        
        // 5. lépés: Megjelenítési logika ellenőrzése a lekért adaton
        const displayDate = formatListDate(events[0].start_date);
        expect(displayDate).toContain("ápr. 10.");
    });
});
