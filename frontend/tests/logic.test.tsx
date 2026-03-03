import { expect, test, describe } from 'vitest';
import { formatListDate, getDisplayParticipants, validateEvent, isSameDay } from '../utils/logic';

describe('Segédfüggvények Tesztelése', () => {

    // 1-3. Teszt: Dátum formázás
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

    // 4-6. Teszt: Résztvevők lista
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

    // 7-9. Teszt: Validáció
    test('validateEvent hibát ad, ha a cím rövid', () => {
        const res = validateEvent("Yo", "2026-01-01", "2026-01-02");
        expect(res.valid).toBe(false);
        expect(res.error).toBe("A cím túl rövid!");
    });

    test('validateEvent hibát ad, ha a dátum fordítva van', () => {
        const res = validateEvent("Helyes Cím", "2026-01-05", "2026-01-01"); // Vége előbb van mint az eleje
        expect(res.valid).toBe(false);
    });

    test('validateEvent elfogadja a helyes adatokat', () => {
        const res = validateEvent("Megfelelő Cím", "2026-01-01", "2026-01-02");
        expect(res.valid).toBe(true);
    });

    // 10. Teszt: Nap összehasonlítás
    test('isSameDay felismeri ugyanazt a napot', () => {
        const d1 = new Date("2026-05-10T10:00:00");
        const d2 = new Date("2026-05-10T22:00:00");
        expect(isSameDay(d1, d2)).toBe(true);
    });

});
