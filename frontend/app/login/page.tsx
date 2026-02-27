"use client";

import { SyntheticEvent, useState, useEffect } from 'react'; 
import { useRouter } from 'next/navigation';
import Alert from '@/components/Alert';
import { loginUser, setupDatabase } from '@/utils/db'; 

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ msg: string, type: 'error' | 'success' | 'info' } | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    setupDatabase().catch(console.error);
  }, []);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setNotification(null);

    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
      setNotification({ msg: "Minden mező kitöltése kötelező!", type: 'error' });
      setIsLoading(false);
      return;
    }

    try {
      const user = await loginUser(username, password);
      
      localStorage.setItem("username", user.username);
      localStorage.setItem("role", user.role);
      localStorage.setItem("token", "local-auth-token"); 
      
      setNotification({ msg: "Sikeres bejelentkezés!", type: 'success' });
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);

    } catch (error: any) {
      setNotification({ msg: error.message || "Hiba: Rossz felhasználónév vagy jelszó!", type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex items-center justify-center font-sans p-4 md:p-8 relative">
      <Alert 
        message={notification?.msg || null} 
        type={notification?.type} 
        onClose={() => setNotification(null)} 
      />

      <div className="max-w-md w-full p-8 sm:p-10 bg-[#121212] rounded-[2rem] shadow-2xl border border-zinc-800/60 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-zinc-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-700/50 shadow-inner">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Esemény<span className="text-blue-500">Kezelő</span>
          </h2>
          <p className="text-zinc-500 mt-2 text-sm font-medium">Jelentkezz be a folytatáshoz</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Felhasználónév</label>
            <input 
                name="username" 
                type="text" 
                className="w-full p-4 bg-black border border-zinc-800 rounded-2xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all" 
                placeholder="admin" 
                autoComplete="off"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Jelszó</label>
            <input 
                name="password" 
                type="password" 
                className="w-full p-4 bg-black border border-zinc-800 rounded-2xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all" 
                placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Betöltés...
              </>
            ) : "Bejelentkezés"}
          </button>
        </form>
      </div>
    </div>
  );
}
