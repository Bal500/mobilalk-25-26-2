// 1. Dátum formázó logika
export const formatListDate = (d: string) => { 
    if (!d) return "Érvénytelen dátum";
    try { 
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return "Érvénytelen dátum";
        return dateObj.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
    } catch (e) { return "Hiba"; } 
};

// 2. Résztvevők tömbbé alakítása (vesszős stringből)
export const getDisplayParticipants = (participantsStr: string | null | undefined): string[] => {
    if (!participantsStr) return [];
    return participantsStr.split(',').map(x => x.trim()).filter(Boolean);
};

// 3. Validációs logika (mentés előtt ellenőrizzük az űrlapot)
export const validateEvent = (title: string, start: string, end: string) => {
    if (!title || title.trim().length < 3) return { valid: false, error: "A cím túl rövid!" };
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return { valid: false, error: "Hibás dátum!" };
    if (endDate < startDate) return { valid: false, error: "A befejezés nem lehet korábban, mint a kezdés!" };
    
    return { valid: true, error: null };
};

// 4. Nap egyezés vizsgálata (naptárhoz)
export const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
