"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAlert } from '@/components/AlertContext';
import ConfirmModal from '@/components/ConfirmModal';
import SearchableSelect from "../../components/SearchableSelect";

// --- HELYI ADATBÁZIS FÜGGVÉNYEK IMPORTÁLÁSA ---
import { 
  getEvents, getPublicEvents, saveEvent, deleteLocalEvent, 
  joinLocalEvent, leaveLocalEvent, getAllUsers, createUser, changePassword, resetDatabase
} from '@/utils/db';

export default function DashboardPage() {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [user, setUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [viewedUser, setViewedUser] = useState<string | null>(null);

  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'public'>('list');
  const [publicEvents, setPublicEvents] = useState<any[]>([]);

  const [editId, setEditId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newParticipants, setNewParticipants] = useState("");
  const [isMeeting, setIsMeeting] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [meetingLink, setMeetingLink] = useState(""); 

  const [conflictPayload, setConflictPayload] = useState<any | null>(null);
  const [conflictMessage, setConflictMessage] = useState<React.ReactNode>("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("user");
  const [newPass, setNewPass] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");

    if (!storedUser) {
      router.push("/login");
    } else {
      setUser(storedUser);
      setUserRole(storedRole);
      fetchLocalUsers();
      fetchLocalEvents();
    }
  }, [router, viewedUser]);

  useEffect(() => {
    if (activeTab === 'public') fetchLocalPublicEvents();
  }, [activeTab]);


  const fetchLocalEvents = async () => {
    const currentUser = user || localStorage.getItem("username");
    if (!currentUser) return;
    try {
      const data = await getEvents(currentUser, viewedUser);
      setEvents(data);
    } catch (err) { console.error(err); }
  };

  const fetchLocalPublicEvents = async () => {
    try { setPublicEvents(await getPublicEvents()); } 
    catch (err) { console.error(err); }
  };

  const fetchLocalUsers = async () => {
    try { setAllUsers(await getAllUsers()); } 
    catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      showAlert("A befejezés nem lehet korábban!", "error");
      return;
    }

    const payload = {
      id: editId, title: newTitle, start_date: startDate, end_date: endDate,
      description: newDesc, participants: newParticipants, 
      is_meeting: isMeeting, is_public: isPublic, meeting_link: meetingLink
    };

    const overlaps = events.filter(ev => {
      if (editId && ev.id === editId) return false; 
      
      const evStart = new Date(ev.start_date);
      const evEnd = new Date(ev.end_date);
      return start < evEnd && end > evStart;
    });

    if (overlaps.length > 0) {
      setConflictMessage(
        <div className="flex flex-col gap-3">
          <span>A megadott időpont ütközik egy már létező eseménnyel:</span>
          <span className="text-white font-bold px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
            "{overlaps[0].title}"
          </span>
          <span className="mt-2 text-red-400 font-bold">
            Biztosan menteni szeretnéd a kérdéses időpontra?
          </span>
        </div>
      );
      setConflictPayload(payload);
      return;
    }

    await executeSave(payload);
  };

  const executeSave = async (payload: any) => {
    try {
      await saveEvent(payload, user || "Ismeretlen");
      showAlert(payload.id ? "Esemény frissítve!" : "Esemény létrehozva!", "success");
      resetForm();
      fetchLocalEvents();
      if (activeTab === 'public') fetchLocalPublicEvents();
    } catch (err) {
      showAlert("Hiba a mentés során", "error");
    }
    setConflictPayload(null); 
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteLocalEvent(deleteId);
      showAlert("Esemény törölve!", "success");
      fetchLocalEvents();
      fetchLocalPublicEvents();
    } catch (err) {
      showAlert("Hiba a törlésnél", "error");
    }
    setDeleteId(null);
  };

  const joinEvent = async (id: number) => {
    if (!user) return;
    await joinLocalEvent(id, user);
    showAlert("Sikeresen csatlakoztál!", "success");
    fetchLocalEvents();
    fetchLocalPublicEvents();
  };

  const leaveEvent = async (id: number) => {
    if (!user) return;
    await leaveLocalEvent(id, user);
    showAlert("Leadva.", "info");
    fetchLocalEvents();
    fetchLocalPublicEvents();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(createUsername, createPassword, createRole);
      showAlert(`Sikeresen létrehozva: ${createUsername}`, "success");
      setCreateUsername(""); setCreatePassword(""); setShowUserModal(false);
      fetchLocalUsers();
    } catch (error: any) {
      showAlert(error.message, "error");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await changePassword(user, newPass);
      showAlert("Jelszó sikeresen módosítva!", "success");
      setNewPass("");
      setShowPasswordModal(false);
    } catch (err) {
      showAlert("Hiba a módosításnál", "error");
    }
  };

  const handleLogout = () => { localStorage.clear(); router.push("/login"); };

  // ADATBÁZIS TÖRLÉSE
  const handleResetDatabase = async () => {
    setShowResetModal(false);
    await resetDatabase();
    localStorage.clear();
    router.push("/login");
  };

  const resetForm = () => {
    setEditId(null); setNewTitle(""); setStartDate(""); setEndDate("");
    setNewDesc(""); setNewParticipants(""); setIsMeeting(false); setIsPublic(false);
    setMeetingLink("");
  };

  const handleEditClick = (event: any) => {
    if (event.owner && event.owner !== user) {
      showAlert("Csak a létrehozó szerkesztheti.", "info"); return;
    }
    setEditId(event.id); setNewTitle(event.title); setStartDate(event.start_date);
    setEndDate(event.end_date); setNewDesc(event.description || "");
    
    let parts = event.participants ? event.participants.split(',').map((p:string)=>p.trim()) : [];
    parts = parts.filter((p:string) => p !== event.owner);
    setNewParticipants(parts.join(', '));
    
    setIsMeeting(event.is_meeting || false);
    setIsPublic(event.is_public || false);
    setMeetingLink(event.meeting_link || "");
    
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const formatListDate = (d: string) => { 
    try { 
      const dateObj = new Date(d);
      return dateObj.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
    } catch (e) { return d; } 
  };

  const getDisplayParticipants = (event: any): string[] => {
    return event.participants ? event.participants.split(',').map((x:string)=>x.trim()).filter(Boolean) : [];
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans p-4 md:p-8 relative">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 border-b border-zinc-800/50 pb-5 relative">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Esemény<span className="text-blue-500">Kezelő</span></h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Belépve: <span className="text-zinc-300">{user}</span></p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 text-white transition-all shadow-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-52 bg-[#121212] border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              {userRole === "admin" && (
                <>
                  <button onClick={() => { setShowUserModal(true); setIsMenuOpen(false); }} className="w-full text-left px-5 py-3.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 flex items-center gap-2">
                    <span>👤</span> Új felhasználó
                  </button>
                  <button onClick={() => { setShowResetModal(true); setIsMenuOpen(false); }} className="w-full text-left px-5 py-3.5 text-sm text-red-500 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 font-bold flex items-center gap-2">
                    <span>🔥</span> Adatbázis nullázása !!!DEMO FEATURE!!!
                  </button>
                </>
              )}
              <button onClick={() => { setShowPasswordModal(true); setIsMenuOpen(false); }} className="w-full text-left px-5 py-3.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 flex items-center gap-2">
                <span>🔑</span> Jelszó csere
              </button>
              <button onClick={handleLogout} className="w-full text-left px-5 py-3.5 text-sm text-red-400 hover:bg-zinc-800 transition-colors font-bold flex items-center gap-2">
                <span>🚪</span> Kilépés
              </button>
            </div>
          )}
        </div>
      </header>

      {/* FŐ TARTALOM */}
      <main className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        
        {/* ŰRLAP */}
        <div className="bg-[#121212] p-6 rounded-3xl border border-zinc-800/60 shadow-xl h-fit">
          <div className="mb-6 pb-6 border-b border-zinc-800/60">
            <SearchableSelect label="Más naptárának megtekintése" placeholder="Keresés..." options={allUsers.filter(u => u !== user)} value={viewedUser} onChange={(val) => setViewedUser(val)} />
          </div>

          {!viewedUser ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-bold mb-5 text-white flex justify-between items-center">
                {editId ? "✏️ Szerkesztés" : "Új esemény"}
                {editId && <span className="text-xs bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20 font-semibold">Aktív</span>}
              </h2>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none transition-colors" placeholder="Esemény megnevezése" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl text-zinc-300 text-xs md:text-sm [color-scheme:dark] focus:border-blue-500 focus:outline-none transition-colors" required />
                <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl text-zinc-300 text-xs md:text-sm [color-scheme:dark] focus:border-blue-500 focus:outline-none transition-colors" required />
              </div>
              <input value={newParticipants} onChange={e => setNewParticipants(e.target.value)} className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none transition-colors" placeholder="További résztvevők (pl. Anna, Gábor)" />
              
              <div className="flex gap-6 pt-2 pb-2 px-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-300 font-medium select-none">
                  <input type="checkbox" checked={isMeeting} onChange={e => setIsMeeting(e.target.checked)} className="w-4 h-4 accent-blue-500 rounded" /> Meeting
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-300 font-medium select-none">
                  <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-4 h-4 accent-green-500 rounded" /> Publikus
                </label>
              </div>
              
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl text-white h-24 text-sm focus:border-blue-500 focus:outline-none transition-colors resize-none" placeholder="Leírás..." />
              
              <div className="flex gap-3 pt-3">
                <button type="submit" className={`flex-1 py-3.5 font-bold rounded-xl text-white transition-all shadow-md active:scale-[0.98] ${editId ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                  {editId ? "Mentés" : "Hozzáadás"}
                </button>
                {editId && <button type="button" onClick={resetForm} className="px-6 py-3.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 font-bold transition-all active:scale-[0.98]">Mégse</button>}
              </div>
            </form>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl border border-zinc-700/50 shadow-inner">📅</div>
              <h3 className="text-xl font-bold text-white mb-1">{viewedUser}</h3>
              <p className="text-zinc-500 text-sm mb-8">naptárát látod jelenleg.</p>
              <button onClick={() => setViewedUser(null)} className="w-full py-3.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-bold hover:bg-blue-500/20 transition-colors">← Vissza a sajátomhoz</button>
            </div>
          )}
        </div>

        {/* LISTA OSZLOP */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* TAB VÁLTÓ */}
          <div className="bg-[#121212] p-1.5 rounded-2xl border border-zinc-800/60 flex gap-1.5 w-full shrink-0 shadow-sm">
            <button onClick={() => setActiveTab('list')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>📋 Eseményeim</button>
            <button onClick={() => setActiveTab('public')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'public' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>🌍 Publikus</button>
          </div>

          {/* LISTA TARTALOM */}
          <div className="space-y-4 pb-10">
            {activeTab === 'list' ? (
              <>
                {events.length === 0 && <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-800/60 rounded-3xl bg-[#121212]/50">Nincs megjeleníthető esemény.</div>}
                {events.map((event) => (
                  <div key={event.id} className="bg-[#121212] border border-zinc-800/60 hover:border-zinc-700 transition-colors p-5 md:p-6 rounded-3xl shadow-sm flex flex-col md:flex-row gap-5 justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2.5">
                        <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">{event.title}</h3>
                        {event.is_public && <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-bold tracking-wide">PUBLIKUS</span>}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4 font-medium">
                        <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{formatListDate(event.start_date)} — {formatListDate(event.end_date)}</span>
                      </div>
                      
                      {event.description && <p className="text-zinc-400 text-sm mb-5 bg-black/40 p-3.5 rounded-xl leading-relaxed border border-zinc-800/50">{event.description}</p>}
                      
                      <div className="flex items-center gap-3 flex-wrap mt-2">
                        <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Résztvevők:</span>
                        <div className="flex flex-wrap gap-2">
                          {getDisplayParticipants(event).map((p: string, i: number) => (
                            <span key={i} className={`px-2.5 py-1 rounded-md text-xs font-bold ${p === event.owner ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-black text-zinc-400 border border-zinc-800'}`}>
                              {p} {p === event.owner && <span className="text-zinc-500 ml-1 font-normal">(Szervező)</span>}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* MEETING GOMB */}
                      {event.is_meeting && event.meeting_link && (
                        <div className="mt-5">
                          <button 
                            onClick={() => window.open(event.meeting_link, '_blank')}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-sm font-bold transition-all w-full sm:w-auto"
                          >
                            <span className="text-lg">📹</span> Videóhívás Indítása
                          </button>
                        </div>
                      )}

                    </div>
                    
                    {event.owner === user && (
                      <div className="flex flex-row md:flex-col gap-2 shrink-0 mt-4 md:mt-0 border-t border-zinc-800/50 pt-4 md:border-none md:pt-0">
                        <button onClick={() => handleEditClick(event)} className="flex-1 md:flex-none px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-colors text-sm font-bold text-center">Szerkesztés</button>
                        <button onClick={() => setDeleteId(event.id)} className="flex-1 md:flex-none px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors text-sm font-bold text-center">Törlés</button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <>
                {publicEvents.length === 0 && <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-800/60 rounded-3xl bg-[#121212]/50">Nincs publikus esemény.</div>}
                {publicEvents.map((event) => (
                  <div key={event.id} className="bg-[#121212] border border-zinc-800/60 hover:border-zinc-700 transition-colors p-5 md:p-6 rounded-3xl shadow-sm flex flex-col md:flex-row gap-5 justify-between md:items-center">
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-bold text-white tracking-tight mb-2">{event.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-green-400 font-medium mb-3">
                        <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{formatListDate(event.start_date)} — {formatListDate(event.end_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-4">
                          <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Résztvevők:</span>
                          <div className="flex flex-wrap gap-2">
                            {getDisplayParticipants(event).map((p: string, i: number) => (
                              <span key={i} className={`px-2.5 py-1 rounded-md text-xs font-bold ${p === event.owner ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-black text-zinc-400 border border-zinc-800'}`}>
                                {p} {p === event.owner && <span className="text-zinc-500 ml-1 font-normal">(Szervező)</span>}
                              </span>
                            ))}
                          </div>
                      </div>

                      {/* MEETING GOMB A PUBLIKUS FÜLÖN */}
                      {event.is_meeting && event.meeting_link && getDisplayParticipants(event).includes(user || "") && (
                        <div className="mt-2">
                          <button 
                            onClick={() => window.open(event.meeting_link, '_blank')}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-sm font-bold transition-all w-full sm:w-auto"
                          >
                            <span className="text-lg">📹</span> Videóhívás Indítása
                          </button>
                        </div>
                      )}

                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0 border-t border-zinc-800/50 pt-4 md:border-none md:pt-0">
                      
                      {event.owner === user && (
                        <>
                          <button onClick={() => { handleEditClick(event); setActiveTab('list'); }} className="w-full sm:w-auto px-4 py-2.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-xl transition-colors text-sm font-bold text-center">
                            ✏️ Szerkesztés
                          </button>
                          <button onClick={() => setDeleteId(event.id)} className="w-full sm:w-auto px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors text-sm font-bold text-center">
                            🗑️ Törlés
                          </button>
                        </>
                      )}

                      {getDisplayParticipants(event).includes(user || "") ? (
                        <button onClick={() => leaveEvent(event.id)} className="w-full sm:w-auto px-6 py-2.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-bold rounded-xl transition-colors text-sm text-center">
                          - Leadás
                        </button>
                      ) : (
                        <button onClick={() => joinEvent(event.id)} className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-md text-sm text-center">
                          + Csatlakozás
                        </button>
                      )}

                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </main>

      {/* TÖRLÉS MODÁL */}
      <ConfirmModal isOpen={deleteId !== null} title="Törlés megerősítése" message="Biztosan törölni szeretnéd ezt az eseményt?" confirmLabel="Törlés" onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />

      {/* ÚJ ÜTKÖZÉS MODÁL */}
      <ConfirmModal 
        isOpen={conflictPayload !== null} 
        title="⚠️ Időpont ütközés!" 
        message={conflictMessage} 
        confirmLabel="Mentés mindenképp" 
        onConfirm={() => executeSave(conflictPayload)} 
        onCancel={() => setConflictPayload(null)} 
      />

      {/* ADATBÁZIS NULLÁZÁSA MODÁL */}
      <ConfirmModal 
        isOpen={showResetModal} 
        title="🔥 Adatbázis Nullázása" 
        message={
          <div className="flex flex-col gap-3">
            <span className="text-red-500 font-extrabold text-lg">VIGYÁZAT!</span>
            <span>Ez a művelet az összes felhasználót és eseményt <b className="text-white">véglegesen törli</b> az alkalmazásból.</span>
            <span className="mt-2 text-zinc-400">Biztosan folytatni szeretnéd? Ezt nem lehet visszavonni!</span>
          </div>
        } 
        confirmLabel="Igen, mindent törlök" 
        onConfirm={handleResetDatabase} 
        onCancel={() => setShowResetModal(false)} 
      />

      {/* ÚJ JELSZÓ MODÁL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121212] p-8 rounded-3xl border border-zinc-800 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Jelszó Módosítása</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full p-4 bg-black border border-zinc-800 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors" placeholder="Új jelszó..." required />
              <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95">Mentés</button>
              <button type="button" onClick={() => setShowPasswordModal(false)} className="w-full py-3 text-zinc-500 font-bold rounded-xl hover:bg-zinc-900 transition-colors">Mégse</button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ÚJ USER MODÁL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121212] p-8 rounded-3xl border border-zinc-800 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Új felhasználó</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input type="text" value={createUsername} onChange={e => setCreateUsername(e.target.value)} className="w-full p-4 bg-black border border-zinc-800 rounded-xl text-white focus:border-blue-500 focus:outline-none" placeholder="Felhasználónév" required />
              <input type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} className="w-full p-4 bg-black border border-zinc-800 rounded-xl text-white focus:border-blue-500 focus:outline-none" placeholder="Jelszó" required />
              <select value={createRole} onChange={e => setCreateRole(e.target.value)} className="w-full p-4 bg-black border border-zinc-800 rounded-xl text-white focus:outline-none">
                <option value="user">User</option><option value="admin">Admin</option>
              </select>
              <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95">Létrehozás</button>
              <button type="button" onClick={() => setShowUserModal(false)} className="w-full py-3 text-zinc-500 font-bold rounded-xl hover:bg-zinc-900 transition-colors">Mégse</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
