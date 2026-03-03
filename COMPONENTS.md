# Komponens Architektúra

Az alkalmazás modularitását az alábbi komponens-hierarchia és navigációs struktúra biztosítja.

## Komponensfa (Layout és Főbb elemek)
* **RootLayout** (layout.tsx)
    * **AlertProvider** (Állapotkezelés)
    * **DeepLinkHandler** (Mobil integráció)
    * **Oldal tartalom** (children)
        * **Login form** (login/page.tsx)
        * **Event Dashboard** (dashboard/page.tsx)
            * **SearchableSelect** (Kategória/Helyszín választó)
            * **ConfirmModal** (Törlés megerősítés)
            * **HelpDesk** (Segítségnyújtás)

## Újrafelhasználható atomi komponensek
1.  **Alert:** Üzenetek és hibák visszajelzése.
2.  **ConfirmModal:** Kritikus műveletek (pl. törlés) előtti megerősítés.
3.  **SearchableSelect:** Dinamikus kereshető legördülő lista.
