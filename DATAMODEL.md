# Adatmodell Dokumentáció

Az alkalmazás legalább 5 entitást kezel SQLite adatbázisban a relációk betartásával.

## Entitások és Mezők

1.  **Users (Felhasználók)**
    * `id` (INTEGER, Primary Key)
    * `username` (TEXT, Unique)
    * `password` (TEXT)
    * `role` (TEXT) - 'admin' vagy 'user'

2.  **Events (Események)**
    * `id` (INTEGER, Primary Key)
    * `title` (TEXT)
    * `description` (TEXT)
    * `start_date` (TEXT - ISO Date)
    * `end_date` (TEXT - ISO Date)
    * `owner_id` (INTEGER, Foreign Key -> Users)
    * `category_id` (INTEGER, Foreign Key -> Categories)
    * `location_id` (INTEGER, Foreign Key -> Locations)

3.  **Categories (Kategóriák)**
    * `id` (INTEGER, Primary Key)
    * `name` (TEXT)
    * `color` (TEXT)

4.  **Locations (Helyszínek)**
    * `id` (INTEGER, Primary Key)
    * `name` (TEXT)
    * `address` (TEXT)

5.  **Registrations (Jelentkezések)**
    * `id` (INTEGER, Primary Key)
    * `user_id` (INTEGER, Foreign Key -> Users)
    * `event_id` (INTEGER, Foreign Key -> Events)

## Kapcsolati háló
* **User - Event (1:N):** Egy felhasználó több esemény tulajdonosa lehet.
* **Category - Event (1:N):** Egy kategóriába több esemény tartozhat.
* **Location - Event (1:N):** Egy helyszínen több esemény is tartható.
* **User - Event (N:M):** A `Registrations` táblán keresztül valósul meg a jelentkezés (több felhasználó jelentkezhet több eseményre).
