import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection;

export async function setupDatabase() {
  db = await sqlite.createConnection("ucc_db", false, "no-encryption", 1, false);
  await db.open();

  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    );
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
      is_public INTEGER DEFAULT 0
    );
  `;
  await db.execute(schema);

  const adminCheck = await db.query("SELECT * FROM users WHERE username = 'admin'");
  if (!adminCheck.values || adminCheck.values.length === 0) {
    await db.run("INSERT INTO users (username, password, role) VALUES ('admin', 'admin', 'admin')");
  }
}

export async function loginUser(username: string, password: string) {
  if (!db) await setupDatabase();
  const res = await db.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
  if (res.values && res.values.length > 0) {
    return res.values[0];
  }
  throw new Error("Hibás felhasználónév vagy jelszó!");
}

export async function createUser(username: string, password: string, role: string) {
  if (!db) await setupDatabase();
  try {
    await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, password, role]);
  } catch (e) {
    throw new Error("Ez a felhasználónév már létezik!");
  }
}

export async function getAllUsers() {
  if (!db) await setupDatabase();
  const res = await db.query("SELECT username FROM users");
  return res.values?.map(u => u.username) || [];
}

export async function changePassword(username: string, newPassword: string) {
  if (!db) await setupDatabase();
  await db.run("UPDATE users SET password = ? WHERE username = ?", [newPassword, username]);
}

export async function getEvents(currentUser: string, viewedUser?: string | null) {
  if (!db) await setupDatabase();
  const targetUser = viewedUser || currentUser;
  
  const query = "SELECT * FROM events WHERE participants LIKE ? OR (owner = ? AND is_public = 0)";
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
  const res = await db.query("SELECT * FROM events WHERE is_public = 1");
  return (res.values || []).map(e => ({ ...e, is_meeting: e.is_meeting === 1, is_public: e.is_public === 1 }));
}

export async function saveEvent(payload: any, owner: string) {
  if (!db) await setupDatabase();
  const isMeeting = payload.is_meeting ? 1 : 0;
  const isPublic = payload.is_public ? 1 : 0;

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
      "UPDATE events SET title=?, start_date=?, end_date=?, description=?, participants=?, is_meeting=?, is_public=?, meeting_link=? WHERE id=?",
      [payload.title, payload.start_date, payload.end_date, payload.description, finalParticipants, isMeeting, isPublic, mLink, payload.id]
    );
  } else {
    await db.run(
      "INSERT INTO events (title, start_date, end_date, description, owner, participants, is_meeting, is_public, meeting_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [payload.title, payload.start_date, payload.end_date, payload.description, owner, finalParticipants, isMeeting, isPublic, mLink]
    );
  }
}

export async function deleteLocalEvent(id: number) {
  if (!db) await setupDatabase();
  await db.run("DELETE FROM events WHERE id=?", [id]);
}

export async function joinLocalEvent(eventId: number, username: string) {
  if (!db) await setupDatabase();
  const res = await db.query("SELECT participants FROM events WHERE id=?", [eventId]);
  if (res.values && res.values.length > 0) {
    let parts = res.values[0].participants || "";
    let partArray = parts.split(',').map((p: string) => p.trim()).filter((p: string) => p);
    if (!partArray.includes(username)) {
      partArray.push(username);
      await db.run("UPDATE events SET participants=? WHERE id=?", [partArray.join(', '), eventId]);
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
}

export async function resetDatabase() {
  if (!db) await setupDatabase();
  
  await db.execute("DROP TABLE IF EXISTS events;");
  await db.execute("DROP TABLE IF EXISTS users;");
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      description TEXT,
      owner TEXT NOT NULL,
      participants TEXT,
      is_meeting INTEGER DEFAULT 0,
      is_public INTEGER DEFAULT 0,
      meeting_link TEXT
    );
  `);

  try {
    await db.run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      ["admin", "admin", "admin"]
    );
  } catch (err) {
    console.error("Hiba az admin letrehozasakor:", err);
  }
}
