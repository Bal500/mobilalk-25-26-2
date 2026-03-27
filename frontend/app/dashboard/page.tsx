"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatListDate, getDisplayParticipants, isSameDay } from '../../utils/logic';

import { useAlert } from '@/components/AlertContext';
import ConfirmModal from '@/components/ConfirmModal';
import SearchableSelect from "../../components/SearchableSelect";

// HELYI ADATBÁZIS FÜGGVÉNYEK IMPORTÁLÁSA
import { 
  getEvents, getPublicEvents, saveEvent, deleteLocalEvent, getCategories, getLocations,
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
  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'public'>('list');
  const [publicEvents, setPublicEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const [editId, setEditId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newParticipants, setNewParticipants] = useState("");
  const [isMeeting, setIsMeeting] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const [categoryId, setCategoryId] = useState<number | string>("");
  const [locationId, setLocationId] = useState<number | string>("");

  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  const [selectedCalDate, setSelectedCalDate] = useState<Date>(new Date());

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
    getCategories().then(setCategories).catch(console.error);
    getLocations().then(setLocations).catch(console.error);

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
      is_meeting: isMeeting, is_public: isPublic, meeting_link: meetingLink,
      category_id: categoryId, location_id: locationId
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

  const handleResetDatabase = async () => {
    setShowResetModal(false);
    await resetDatabase();
    localStorage.clear();
    router.push("/login");
  };

  const resetForm = () => {
    setEditId(null); setNewTitle(""); setStartDate(""); setEndDate("");
    setNewDesc(""); setNewParticipants(""); setIsMeeting(false); setIsPublic(false);
    setMeetingLink(""); setCategoryId(""); setLocationId("");
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
    setCategoryId(event.category_id || "");
    setLocationId(event.location_id || "");
    
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  // NAPTÁR ÉS DÁTUM SEGÉDEK
  const monthNames = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
  const dayNames = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const nextMonth = () => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1));

  const daysInMonth = getDaysInMonth(currentCalDate.getFullYear(), currentCalDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentCalDate.getFullYear(), currentCalDate.getMonth());

  const eventOverlapsDay = (ev: any, targetDate: Date) => {
    const evStart = new Date(ev.start_date);
    const evEnd = new Date(ev.end_date);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);
    return evStart < dayEnd && evEnd > dayStart;
  };

  const getEventsForDay = (day: number, month: number, year: number) => {
    const targetDate = new Date(year, month, day);
    return events.filter(ev => eventOverlapsDay(ev, targetDate));
  };

  const selectedDayEvents = events.filter(ev => eventOverlapsDay(ev, selectedCalDate));

  const getLayoutEvents = () => {
    if (!selectedDayEvents || selectedDayEvents.length === 0) return [];
  
    const sorted = [...selectedDayEvents].sort((a, b) => {
      const startA = new Date(a.start_date).getTime();
      const startB = new Date(b.start_date).getTime();
      if (startA !== startB) return startA - startB;
      return (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) -
            (new Date(a.end_date).getTime() - new Date(a.start_date).getTime());
    });
  
    const clusters: any[][] = [];
    sorted.forEach(event => {
      let cluster = clusters.find(c => c.some(ce => 
        new Date(event.start_date) < new Date(ce.end_date) &&
        new Date(ce.start_date) < new Date(event.end_date)
      ));
      if (!cluster) { cluster = []; clusters.push(cluster); }
      cluster.push(event);
    });
  
    const result: any[] = [];
    clusters.forEach(cluster => {
      const columns: any[][] = [];
      cluster.forEach(event => {
        let colIdx = 0;
        while (columns[colIdx]?.some(ce => 
          new Date(event.start_date) < new Date(ce.end_date) &&
          new Date(ce.start_date) < new Date(event.end_date)
        )) { colIdx++; }
        if (!columns[colIdx]) columns[colIdx] = [];
        columns[colIdx].push(event);
        event.colIndex = colIdx;
      });
      cluster.forEach(event => {
        event.totalCols = columns.length;
        result.push(event);
      });
    });
    return result;
  };

  const calendarEventsToRender = activeTab === 'calendar' ? getLayoutEvents() : [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans p-4 md:p-8 relative">
      
      {/* HEADER */}
      <header role="banner" className="flex justify-between items-center mb-8 border-b border-zinc-800/50 pb-5 relative">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Esemény<span className="text-blue-500">Kezelő</span></h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">
            Belépve: <span className="text-zinc-300" aria-label={`Bejelentkezett felhasználó: ${user}`}>{user}</span>
          </p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            aria-label="Főmenü megnyitása"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 text-white transition-all shadow-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>

          {isMenuOpen && (
            <div 
              role="menu"
              className="absolute right-0 mt-3 w-52 bg-[#121212] border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2"
            >
              {userRole === "admin" && (
                <>
                  <button role="menuitem" onClick={() => { setShowUserModal(true); setIsMenuOpen(false); }} className="w-full text-left px-5 py-3.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 flex items-center gap-2">
                    <span aria-hidden="true">👤</span> Új felhasználó
                  </button>
                  <button role="menuitem" onClick={() => { setShowResetModal(true); setIsMenuOpen(false); }} className="w-full text-left px-5 py-3.5 text-sm text-red-500 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 font-bold flex items-center gap-2">
                    <span aria-hidden="true">🔥</span> Adatbázis nullázása
                  </button>
                </>
              )}
              <button role="menuitem" onClick={() => { setShowPasswordModal(true); setIsMenuOpen(false); }} className="w-full text-left px-5 py-3.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 flex items-center gap-2">
                <span aria-hidden="true">🔑</span> Jelszó csere
              </button>
              <button role="menuitem" onClick={handleLogout} className="w-full text-left px-5 py-3.5 text-sm text-red-400 hover:bg-zinc-800 transition-colors font-bold flex items-center gap-2">
                <span aria-hidden="true">🚪</span> Kilépés
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        
        {/* 1. OSZLOP: ŰRLAP */}
        <section aria-labelledby="form-heading" className="bg-[#121212] p-6 rounded-3xl border border-zinc-800/60 shadow-xl h-fit">
          <div className="mb-6 pb-6 border-b border-zinc-800/60">
            <SearchableSelect label="Más naptárának megtekintése" placeholder="Keresés..." options={allUsers.filter(u => u !== user)} value={viewedUser} onChange={(val) => setViewedUser(val)} />
          </div>

          {!viewedUser ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 id="form-heading" className="text-xl font-bold mb-5 text-white flex justify-between items-center">
                {editId ? <><span aria-hidden="true">✏️</span> Szerkesztés</> : "Új esemény"}
                {editId && <span className="text-xs bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20 font-semibold">Aktív</span>}
              </h2>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} aria-label="Esemény megnevezése" className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none transition-colors" placeholder="Esemény megnevezése" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} aria-label="Kezdés időpontja" className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl text-zinc-300 text-xs md:text-sm [color-scheme:dark] focus:border-blue-500 focus:outline-none transition-colors" required />
                <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} aria-label="Befejezés időpontja" className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl text-zinc-300 text-xs md:text-sm [color-scheme:dark] focus:border-blue-500 focus:outline-none transition-colors" required />
              </div>
              <input value={newParticipants} onChange={e => setNewParticipants(e.target.value)} aria-label="További résztvevők" className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none transition-colors" placeholder="További résztvevők (pl. Anna, Gábor)" />
              
              <div className="flex gap-6 pt-2 pb-2 px-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-300 font-medium select-none">
                  <input type="checkbox" checked={isMeeting} onChange={e => setIsMeeting(e.target.checked)} className="w-4 h-4 accent-blue-500 rounded" /> Meeting
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-sm text-zinc-300 font-medium select-none">
                  <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-4 h-4 accent-green-500 rounded" /> Publikus
                </label>
              </div>
              
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} aria-label="Leírás" className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl text-white h-24 text-sm focus:border-blue-500 focus:outline-none transition-colors resize-none" placeholder="Leírás..." />
              
              <div className="mb-4">
                <label htmlFor="category-select" className="block text-sm font-medium mb-1 text-zinc-300">Kategória</label>
                <select id="category-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none transition-colors">
                  <option value="">-- Válassz kategóriát --</option>
                  {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="location-select" className="block text-sm font-medium mb-1 text-zinc-300">Helyszín</label>
                <select id="location-select" value={locationId} onChange={(e) => setLocationId(e.target.value)} className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl text-white text-sm focus:border-blue-500 focus:outline-none transition-colors">
                  <option value="">-- Válassz helyszínt --</option>
                  {locations.map((loc) => (<option key={loc.id} value={loc.id}>{loc.name} ({loc.capacity} fő)</option>))}
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="submit" className={`flex-1 py-3.5 font-bold rounded-xl text-white transition-all shadow-md active:scale-[0.98] ${editId ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                  {editId ? "Mentés" : "Hozzáadás"}
                </button>
                {editId && <button type="button" onClick={resetForm} className="px-6 py-3.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 font-bold transition-all active:scale-[0.98]">Mégse</button>}
              </div>
            </form>
          ) : (
            <div className="text-center py-12">
              <div aria-hidden="true" className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl border border-zinc-700/50 shadow-inner">📅</div>
              <h3 className="text-xl font-bold text-white mb-1">{viewedUser}</h3>
              <p className="text-zinc-500 text-sm mb-8">naptárát látod jelenleg.</p>
              <button onClick={() => setViewedUser(null)} className="w-full py-3.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-bold hover:bg-blue-500/20 transition-colors">← Vissza a sajátomhoz</button>
            </div>
          )}
        </section>

        {/* 2. OSZLOP: TARTALOM */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div role="tablist" aria-label="Nézetválasztó" className="bg-[#121212] p-1.5 rounded-2xl border border-zinc-800/60 flex gap-1.5 w-full shrink-0 shadow-sm overflow-x-auto snap-x hide-scrollbar">
            <button role="tab" id="tab-list" aria-controls="panel-list" aria-selected={activeTab === 'list'} onClick={() => setActiveTab('list')} className={`flex-1 min-w-[100px] py-3 rounded-xl text-sm font-bold transition-all snap-start ${activeTab === 'list' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>📋 Lista</button>
            <button role="tab" id="tab-cal" aria-controls="panel-cal" aria-selected={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} className={`flex-1 min-w-[100px] py-3 rounded-xl text-sm font-bold transition-all snap-start ${activeTab === 'calendar' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>📅 Naptár</button>
            <button role="tab" id="tab-pub" aria-controls="panel-pub" aria-selected={activeTab === 'public'} onClick={() => setActiveTab('public')} className={`flex-1 min-w-[100px] py-3 rounded-xl text-sm font-bold transition-all snap-start ${activeTab === 'public' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>🌍 Publikus</button>
          </div>

          <div className="space-y-4 pb-10">
            <div id="panel-list" role="tabpanel" aria-labelledby="tab-list" className={activeTab === 'list' ? 'block' : 'hidden'}>
              {activeTab === 'list' && (
                <div className="space-y-4">
                  {events.length === 0 && <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-800/60 rounded-3xl bg-[#121212]/50">Nincs megjeleníthető esemény.</div>}
                  {events.map((event) => (
                    <div key={event.id} className="bg-[#121212] border border-zinc-800/60 hover:border-zinc-700 transition-colors p-5 md:p-6 rounded-3xl shadow-sm flex flex-col md:flex-row gap-5 justify-between relative overflow-hidden">
                      {event.category_color && (<div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: event.category_color }}></div>)}
                      <div className="flex-1 pl-2"> 
                        <div className="flex flex-wrap items-center gap-3 mb-2.5">
                          <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">{event.title}</h3>
                          {event.category_name && (<span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white border border-white/10 shadow-sm" style={{ backgroundColor: event.category_color || '#3b82f6' }}>{event.category_name}</span>)}
                          {event.is_public && <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-bold tracking-wide">PUBLIKUS</span>}
                        </div>
                        <div className="flex flex-col gap-1 mb-4">
                          <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                            <span aria-hidden="true">🕒</span> <span>{formatListDate(event.start_date)} — {formatListDate(event.end_date)}</span>
                          </div>
                          {event.location_name && (<div className="flex items-center gap-2 text-sm text-zinc-500"><span aria-hidden="true">📍</span><span>{event.location_name} {event.address ? `(${event.address})` : ''}</span></div>)}
                        </div>
                        {event.description && <p className="text-zinc-400 text-sm mb-5 bg-black/40 p-3.5 rounded-xl leading-relaxed border border-zinc-800/50">{event.description}</p>}
                        <div className="flex items-center gap-3 flex-wrap mt-2">
                          <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Résztvevők:</span>
                          <div className="flex flex-wrap gap-2">
                            {getDisplayParticipants(event.participants).map((p: string, i: number) => (
                              <span key={i} className={`px-2.5 py-1 rounded-md text-xs font-bold ${p === event.owner ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-black text-zinc-400 border border-zinc-800'}`}>
                                {p} {p === event.owner && <span className="text-zinc-500 ml-1 font-normal">(Szervező)</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                        {event.is_meeting && event.meeting_link && (
                          <div className="mt-5">
                            <button onClick={() => window.open(event.meeting_link, '_blank')} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-sm font-bold transition-all w-full sm:w-auto">
                              <span className="text-lg" aria-hidden="true">📹</span> Meeting indítása
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
                </div>
              )}
            </div>

            <div id="panel-cal" role="tabpanel" aria-labelledby="tab-cal" className={activeTab === 'calendar' ? 'block' : 'hidden'}>
              {activeTab === 'calendar' && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                  <div className="bg-[#121212] p-4 md:p-5 rounded-3xl border border-zinc-800/60 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <button onClick={prevMonth} aria-label="Előző hónap" className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <h2 className="text-base md:text-lg font-bold text-white tracking-wide">{currentCalDate.getFullYear()}. {monthNames[currentCalDate.getMonth()]}</h2>
                      <button onClick={nextMonth} aria-label="Következő hónap" className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {dayNames.map(day => (<div key={day} className="text-center text-[10px] font-bold text-zinc-600 uppercase pb-1">{day}</div>))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDay }).map((_, i) => (<div key={`empty-${i}`} className="h-10 rounded-lg bg-transparent"></div>))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNumber = i + 1;
                        const thisDate = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), dayNumber);
                        const isSelected = isSameDay(thisDate, selectedCalDate);
                        const isToday = isSameDay(thisDate, new Date());
                        const dayEvents = getEventsForDay(dayNumber, currentCalDate.getMonth(), currentCalDate.getFullYear());
                        return (
                          <div key={dayNumber} onClick={() => setSelectedCalDate(thisDate)} role="button" aria-label={`${thisDate.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}${isToday ? ', ma' : ''}${isSelected ? ', kiválasztva' : ''}${dayEvents.length > 0 ? ', eseményekkel' : ''}`} className={`h-10 md:h-12 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all border ${isSelected ? 'bg-blue-600 border-blue-500 shadow-md' : 'bg-black/30 hover:bg-zinc-800 border-zinc-800/50'} ${isToday && !isSelected ? 'border-zinc-500 text-blue-400' : ''}`}>
                            <span className={`text-xs md:text-sm font-bold ${isSelected ? 'text-white' : ''}`}>{dayNumber}</span>
                            <div className="flex gap-0.5 mt-0.5">{dayEvents.length > 0 && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></div>}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-[#121212] rounded-3xl border border-zinc-800/60 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 md:p-5 border-b border-zinc-800/60 bg-zinc-900/30">
                      <h3 className="text-white font-bold text-base flex items-center gap-2"><span className="text-lg" aria-hidden="true">🕘</span> {selectedCalDate.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', weekday: 'long'})}</h3>
                    </div>
                    <div className="relative h-[60vh] md:h-[500px] overflow-y-auto hide-scrollbar" id="timeline-container">
                      <div className="relative h-[1440px] w-full bg-[#121212]">
                        {Array.from({ length: 24 }).map((_, i) => (<div key={`line-${i}`} className="absolute w-full flex items-start border-b border-zinc-800/50" style={{ top: `${i * 60}px`, height: '60px' }}><span className="text-[10px] md:text-xs text-zinc-500 w-12 text-right pr-2 -mt-[9px] bg-[#121212] relative z-10 font-medium">{i}:00</span></div>))}
                        <div className="absolute top-0 left-12 right-0 bottom-0">
                          {calendarEventsToRender.map((ev) => {
                            const start = new Date(ev.start_date);
                            const end = new Date(ev.end_date);
                            const actualStart = start < new Date(selectedCalDate.setHours(0,0,0,0)) ? new Date(selectedCalDate.setHours(0,0,0,0)) : start;
                            const actualEnd = end > new Date(selectedCalDate.setHours(23,59,59,999)) ? new Date(selectedCalDate.setHours(23,59,59,999)) : end;
                            const startMin = actualStart.getHours() * 60 + actualStart.getMinutes();
                            const durationMin = Math.max((actualEnd.getTime() - actualStart.getTime()) / 60000, 25);
                            const totalCols = ev.totalCols || 1;
                            const colIndex = ev.colIndex || 0;
                            const widthPct = 100 / totalCols;
                            const leftPct = colIndex * widthPct;
                            return (
                              <div key={ev.id} onClick={(e) => { e.stopPropagation(); setActiveTab("list"); handleEditClick(ev); }} aria-label={`${ev.title}, ${start.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })} órától, ${ev.location_name || 'nincs megadott helyszín'}`} className={`absolute rounded-lg p-2 text-xs cursor-pointer shadow-md border-l-4 transition-all hover:z-50 hover:brightness-110 flex flex-col justify-start items-start text-left overflow-hidden ${ev.is_meeting ? "bg-[#3d1a1a] border-l-red-500 border-red-900/50 text-red-100" : "bg-[#1a263d] border-l-blue-500 border-blue-900/50 text-blue-100"}`} style={{ top: `${startMin + 4}px`, height: `${durationMin - 8}px`, left: `${leftPct}%`, width: `calc(${widthPct}% - 2px)`, zIndex: 10 + colIndex, minHeight: '26px' }}>
                                <div className="flex flex-wrap items-center gap-x-2 w-full"><span className="font-bold truncate max-w-full">{ev.title}</span>{widthPct > 30 && (<span className="text-[10px] opacity-60 font-mono shrink-0">{start.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}</span>)}</div>
                                {durationMin > 40 && ev.location_name && (<div className="mt-1 text-[10px] opacity-50 truncate w-full flex items-center gap-1"><span aria-hidden="true">📍</span> {ev.location_name}</div>)}
                              </div>
                            );
                          })}
                        </div>
                        {isSameDay(selectedCalDate, new Date()) && (<div aria-label="Jelenlegi idő" className="absolute left-12 right-0 border-b-2 border-red-500 z-50 flex items-center shadow-[0_0_10px_rgba(239,68,68,0.5)] pointer-events-none" style={{ top: `${new Date().getHours() * 60 + new Date().getMinutes()}px` }}><div className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -left-1.5 shadow-sm"></div></div>)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div id="panel-pub" role="tabpanel" aria-labelledby="tab-pub" className={activeTab === 'public' ? 'block' : 'hidden'}>
              {activeTab === 'public' && (
                <>
                  {publicEvents.length === 0 && <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-800/60 rounded-3xl bg-[#121212]/50">Nincs publikus esemény.</div>}
                  {publicEvents.map((event) => (
                    <div key={event.id} className="bg-[#121212] border border-zinc-800/60 hover:border-zinc-700 transition-colors p-5 md:p-6 rounded-3xl shadow-sm flex flex-col md:flex-row gap-5 justify-between md:items-center relative overflow-hidden">
                      {event.category_color && (<div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: event.category_color }}></div>)}
                      <div className="flex-1 pl-2">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">{event.title}</h3>
                          {event.category_name && (<span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white" style={{ backgroundColor: event.category_color || '#3b82f6' }}>{event.category_name}</span>)}
                        </div>
                        <div className="flex flex-col gap-1 mb-3">
                          <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
                            <span aria-hidden="true">🕒</span> <span>{formatListDate(event.start_date)} — {formatListDate(event.end_date)}</span>
                          </div>
                          {event.location_name && (<div className="flex items-center gap-2 text-sm text-zinc-500"><span aria-hidden="true">📍</span> {event.location_name}</div>)}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-4">
                            <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Résztvevők:</span>
                            <div className="flex flex-wrap gap-2">
                              {getDisplayParticipants(event.participants).map((p: string, i: number) => (
                                <span key={i} className={`px-2.5 py-1 rounded-md text-xs font-bold ${p === event.owner ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-black text-zinc-400 border border-zinc-800'}`}>{p} {p === event.owner && <span className="text-zinc-500 ml-1 font-normal">(Szervező)</span>}</span>
                              ))}
                            </div>
                        </div>
                        {event.is_meeting && event.meeting_link && getDisplayParticipants(event.participants).includes(user || "") && (
                          <div className="mt-2"><button onClick={() => window.open(event.meeting_link, '_blank')} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-sm font-bold transition-all w-full sm:w-auto"><span className="text-lg" aria-hidden="true">📹</span> Csatlakozás a meetinghez</button></div>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 shrink-0 border-t border-zinc-800/50 pt-4 md:border-none md:pt-0">
                        {event.owner === user ? (
                          <><button onClick={() => { handleEditClick(event); setActiveTab('list'); }} className="w-full sm:w-auto px-4 py-2.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-xl transition-colors text-sm font-bold text-center"><span aria-hidden="true">✏️</span> Szerkesztés</button><button onClick={() => setDeleteId(event.id)} className="w-full sm:w-auto px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors text-sm font-bold text-center"><span aria-hidden="true">🗑️</span> Törlés</button></>
                        ) : (
                          getDisplayParticipants(event.participants).includes(user || "") ? (
                            <button onClick={() => leaveEvent(event.id)} className="w-full sm:w-auto px-6 py-2.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-bold rounded-xl transition-colors text-sm text-center border border-zinc-700">- Leadás</button>
                          ) : (
                            <button onClick={() => joinEvent(event.id)} className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-900/20 text-sm text-center">+ Csatlakozás</button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <ConfirmModal isOpen={deleteId !== null} title="Törlés megerősítése" message="Biztosan törölni szeretnéd ezt az eseményt?" confirmLabel="Törlés" onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />

      <ConfirmModal 
        isOpen={conflictPayload !== null} 
        title="💥 Időpont ütközés!" 
        message={<div aria-live="assertive">{conflictMessage}</div>} 
        confirmLabel="Mentés mindenképp" 
        onConfirm={() => executeSave(conflictPayload)} 
        onCancel={() => setConflictPayload(null)} 
      />

      <ConfirmModal 
        isOpen={showResetModal} 
        title="🔥 Adatbázis nullázása" 
        message={<div className="flex flex-col gap-3"><span className="text-red-500 font-extrabold text-lg">VIGYÁZAT!</span><span>Ez a művelet az összes felhasználót és eseményt <b className="text-white">véglegesen törli</b> az alkalmazásból.</span><span className="mt-2 text-zinc-400">Biztosan folytatni szeretnéd? Ezt nem lehet visszavonni!</span></div>} 
        confirmLabel="Igen, mindent törlök" 
        onConfirm={handleResetDatabase} 
        onCancel={() => setShowResetModal(false)} 
      />

      {showPasswordModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="pw-title" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121212] p-8 rounded-3xl border border-zinc-800 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 id="pw-title" className="text-2xl font-bold text-white mb-6 text-center">Jelszó módosítása</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <label htmlFor="new-pw-input" className="sr-only">Új jelszó</label>
              <input id="new-pw-input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full p-4 bg-black border border-zinc-800 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-colors" placeholder="Új jelszó..." required />
              <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95">Mentés</button>
              <button type="button" onClick={() => setShowPasswordModal(false)} className="w-full py-3 text-zinc-500 font-bold rounded-xl hover:bg-zinc-900 transition-colors">Mégse</button>
            </form>
          </div>
        </div>
      )}

      {showUserModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="user-title" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121212] p-8 rounded-3xl border border-zinc-800 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 id="user-title" className="text-2xl font-bold text-white mb-6 text-center">Új felhasználó</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <label htmlFor="user-name-input" className="sr-only">Felhasználónév</label>
              <input id="user-name-input" type="text" value={createUsername} onChange={e => setCreateUsername(e.target.value)} className="w-full p-4 bg-black border border-zinc-800 rounded-xl text-white focus:border-blue-500 focus:outline-none" placeholder="Felhasználónév" required />
              <label htmlFor="user-pw-input" className="sr-only">Jelszó</label>
              <input id="user-pw-input" type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} className="w-full p-4 bg-black border border-zinc-800 rounded-xl text-white focus:border-blue-500 focus:outline-none" placeholder="Jelszó" required />
              <label htmlFor="role-select" className="sr-only">Szerepkör</label>
              <select id="role-select" value={createRole} onChange={e => setCreateRole(e.target.value)} className="w-full p-4 bg-black border border-zinc-800 rounded-xl text-white focus:outline-none"><option value="user">User</option><option value="admin">Admin</option></select>
              <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95">Létrehozás</button>
              <button type="button" onClick={() => setShowUserModal(false)} className="w-full py-3 text-zinc-500 font-bold rounded-xl hover:bg-zinc-900 transition-colors">Mégse</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
