import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection;

async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function setupDatabase() {
  db = await sqlite.createConnection("ucc_db", false, "no-encryption", 1, false);
  
  try {
    await db.open();
  } catch (e) {
    // Ha már nyitva van, nem gond
  }

  // 1. Tábla: Felhasználók
  const usersSchema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    );
  `;
  await db.execute(usersSchema);

  // 2. Tábla: Kategóriák
  const categoriesSchema = `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3b82f6'
    );
  `;
  await db.execute(categoriesSchema);

  // 3. Tábla: Helyszínek
  const locationsSchema = `
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      capacity INTEGER
    );
  `;
  await db.execute(locationsSchema);

  // 4. Tábla: Események
  const eventsSchema = `
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      description TEXT,
      owner TEXT,
      participants TEXT, 
      is_meeting INTEGER DEFAULT 0,
      meeting_link TEXT,
      is_public INTEGER DEFAULT 0,
      category_id INTEGER,
      location_id INTEGER,
      FOREIGN KEY(category_id) REFERENCES categories(id),
      FOREIGN KEY(location_id) REFERENCES locations(id)
    );
  `;
  await db.execute(eventsSchema);

  // 5. Tábla: Regisztrációk
  const registrationsSchema = `
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      status TEXT DEFAULT 'confirmed',
      registration_date TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(event_id) REFERENCES events(id)
    );
  `;
  await db.execute(registrationsSchema);

  // MIGRÁCIÓ (Biztonsági háló)
  try { await db.execute("ALTER TABLE events ADD COLUMN category_id INTEGER;"); } catch (e) {}
  try { await db.execute("ALTER TABLE events ADD COLUMN location_id INTEGER;"); } catch (e) {}

  // ALAPADATOK FELTÖLTÉSE
  await seedData();
}

async function seedData() {
  // Admin létrehozása
  const adminCheck = await db.query("SELECT * FROM users WHERE username = 'admin'");
  if (!adminCheck.values || adminCheck.values.length === 0) {
    const hashedAdminPw = await hashPassword('admin'); // <-- TITKOSÍTÁS
    await db.run("INSERT INTO users (username, password, role) VALUES ('admin', ?, 'admin')", [hashedAdminPw]);
  }

  // Kategóriák feltöltése
  const catCheck = await db.query("SELECT COUNT(*) as count FROM categories");
  if (catCheck.values && catCheck.values[0].count === 0) {
    await db.run("INSERT INTO categories (name, color) VALUES ('Munka', '#ef4444')"); 
    await db.run("INSERT INTO categories (name, color) VALUES ('Szórakozás', '#10b981')"); 
    await db.run("INSERT INTO categories (name, color) VALUES ('Oktatás', '#3b82f6')"); 
  }

  // Helyszínek feltöltése
  const locCheck = await db.query("SELECT COUNT(*) as count FROM locations");
  if (locCheck.values && locCheck.values[0].count === 0) {
    await db.run("INSERT INTO locations (name, address, capacity) VALUES ('Főépület', 'Budapest, Fő u. 1.', 100)");
    await db.run("INSERT INTO locations (name, address, capacity) VALUES ('Online Tér', 'Zoom/Meet', 999)");
    await db.run("INSERT INTO locations (name, address, capacity) VALUES ('Kistárgyaló', '1. emelet jobbra', 10)");
  }
}

export async function loginUser(username: string, password: string) {
  if (!db) await setupDatabase();
  
  const hashedPassword = await hashPassword(password);
  
  const res = await db.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, hashedPassword]);
  
  if (res.values && res.values.length > 0) {
    return res.values[0];
  }
  throw new Error("Hibás felhasználónév vagy jelszó!");
}

export async function createUser(username: string, password: string, role: string) {
  if (!db) await setupDatabase();
  try {
    const hashedPassword = await hashPassword(password);
    await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hashedPassword, role]);
  } catch (e) {
    throw new Error("Ez a felhasználónév már létezik!");
  }
}

export async function getAllUsers() {
  if (!db) await setupDatabase();
  const res = await db.query("SELECT username FROM users");
  return res.values?.map(u => u.username) || [];
}

export async function getCategories() {
  if (!db) await setupDatabase();
  const res = await db.query("SELECT * FROM categories");
  return res.values || [];
}

export async function getLocations() {
  if (!db) await setupDatabase();
  const res = await db.query("SELECT * FROM locations");
  return res.values || [];
}

export async function changePassword(username: string, newPassword: string) {
  if (!db) await setupDatabase();
  const hashedNewPassword = await hashPassword(newPassword);
  await db.run("UPDATE users SET password = ? WHERE username = ?", [hashedNewPassword, username]);
}

export async function getEvents(currentUser: string, viewedUser?: string | null) {
  if (!db) await setupDatabase();
  const targetUser = viewedUser || currentUser;
  
  const query = `
    SELECT e.*, c.name as category_name, c.color as category_color, l.name as location_name, l.address 
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN locations l ON e.location_id = l.id
    WHERE e.participants LIKE ? OR (e.owner = ? AND e.is_public = 0)
  `;
  const params = [`%${targetUser}%`, targetUser];
  
  const res = await db.query(query, params);
  
  return (res.values || []).map(e => ({
    ...e,
    is_meeting: e.is_meeting === 1,
    is_public: e.is_public === 1
  }));
}

export async function getPublicEvents() {
  if (!db) await setupDatabase();
  const res = await db.query(`
    SELECT e.*, c.name as category_name, c.color as category_color, l.name as location_name, l.address 
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN locations l ON e.location_id = l.id
    WHERE e.is_public = 1
  `);
  return (res.values || []).map(e => ({ ...e, is_meeting: e.is_meeting === 1, is_public: e.is_public === 1 }));
}

export async function saveEvent(payload: any, owner: string) {
  if (!db) await setupDatabase();
  const isMeeting = payload.is_meeting ? 1 : 0;
  const isPublic = payload.is_public ? 1 : 0;
  
  const categoryId = payload.category_id ? payload.category_id : null;
  const locationId = payload.location_id ? payload.location_id : null;

  let partsArray = payload.participants ? payload.participants.split(',').map((p:string)=>p.trim()).filter((p:string)=>p) : [];
  if (!partsArray.includes(owner)) {
    partsArray.unshift(owner); 
  }
  const finalParticipants = partsArray.join(', ');

  let mLink = payload.meeting_link || "";
  if (isMeeting && !mLink) {
    const randomStr = Math.random().toString(36).substring(2, 10);
    mLink = `https://meet.jit.si/MobilAlk-${randomStr}`;
  } else if (!isMeeting) {
    mLink = "";
  }

  if (payload.id) {
    await db.run(
      "UPDATE events SET title=?, start_date=?, end_date=?, description=?, participants=?, is_meeting=?, is_public=?, meeting_link=?, category_id=?, location_id=? WHERE id=?",
      [payload.title, payload.start_date, payload.end_date, payload.description, finalParticipants, isMeeting, isPublic, mLink, categoryId, locationId, payload.id]
    );
  } else {
    await db.run(
      "INSERT INTO events (title, start_date, end_date, description, owner, participants, is_meeting, is_public, meeting_link, category_id, location_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [payload.title, payload.start_date, payload.end_date, payload.description, owner, finalParticipants, isMeeting, isPublic, mLink, categoryId, locationId]
    );
  }
}

export async function deleteLocalEvent(id: number) {
  if (!db) await setupDatabase();
  await db.run("DELETE FROM registrations WHERE event_id=?", [id]); 
  await db.run("DELETE FROM events WHERE id=?", [id]);
}

export async function joinLocalEvent(eventId: number, username: string) {
  if (!db) await setupDatabase();
  
  // Backward compatibility
  const res = await db.query("SELECT participants FROM events WHERE id=?", [eventId]);
  if (res.values && res.values.length > 0) {
    let parts = res.values[0].participants || "";
    let partArray = parts.split(',').map((p: string) => p.trim()).filter((p: string) => p);
    if (!partArray.includes(username)) {
      partArray.push(username);
      await db.run("UPDATE events SET participants=? WHERE id=?", [partArray.join(', '), eventId]);
    }
  }

  const userRes = await db.query("SELECT id FROM users WHERE username = ?", [username]);
  if (userRes.values && userRes.values.length > 0) {
    const userId = userRes.values[0].id;
    const regCheck = await db.query("SELECT * FROM registrations WHERE user_id = ? AND event_id = ?", [userId, eventId]);
    if (!regCheck.values || regCheck.values.length === 0) {
      await db.run("INSERT INTO registrations (user_id, event_id, status, registration_date) VALUES (?, ?, 'confirmed', ?)", 
        [userId, eventId, new Date().toISOString()]);
    }
  }
}

export async function leaveLocalEvent(eventId: number, username: string) {
  if (!db) await setupDatabase();
  
  const res = await db.query("SELECT participants FROM events WHERE id=?", [eventId]);
  if (res.values && res.values.length > 0) {
    let parts = res.values[0].participants || "";
    let partArray = parts.split(',').map((p: string) => p.trim()).filter((p: string) => p !== username);
    await db.run("UPDATE events SET participants=? WHERE id=?", [partArray.join(', '), eventId]);
  }

  const userRes = await db.query("SELECT id FROM users WHERE username = ?", [username]);
  if (userRes.values && userRes.values.length > 0) {
    const userId = userRes.values[0].id;
    await db.run("DELETE FROM registrations WHERE user_id = ? AND event_id = ?", [userId, eventId]);
  }
}

export async function resetDatabase() {
  if (!db) await setupDatabase();
  
  try {
    await db.execute("PRAGMA foreign_keys = OFF;");
    
    await db.execute("DROP TABLE IF EXISTS registrations;");
    await db.execute("DROP TABLE IF EXISTS events;");
    await db.execute("DROP TABLE IF EXISTS locations;");
    await db.execute("DROP TABLE IF EXISTS categories;");
    await db.execute("DROP TABLE IF EXISTS users;");
    
    // VISSZAKAPCSOLJUK
    await db.execute("PRAGMA foreign_keys = ON;");
    
    // ÚJRAÉPÍTÉS
    await setupDatabase();
  } catch (e) {
    console.error("Reset failed:", e);

    await setupDatabase();
  }
}
