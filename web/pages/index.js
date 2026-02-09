import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    // HARDCODE USERNAME & PASSWORD
    if (username === 'admin' && password === 'bumdes123') {
      localStorage.setItem('isLoggedIn', 'true');
      router.push('/dashboard');
    } else {
      setError('Password atau Username Salah, Bos!');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 font-sans">
      
      {/* CARD LOGIN GLASSMORPHISM */}
      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-xl border border-slate-700 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        
        {/* LOGO & TITLE */}
        <div className="text-center mb-10">
          <div className="inline-block bg-indigo-600 p-4 rounded-3xl shadow-lg shadow-indigo-500/20 mb-4 text-3xl">
            🦆
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Smart Feeder</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-bold mt-1">
            Tim 1 KKN UNDIP 2026
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-[11px] p-3 rounded-xl mb-6 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Username</label>
            <input 
              type="text" 
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900/50 border-2 border-slate-700 focus:border-indigo-500 p-4 rounded-2xl text-white outline-none transition-all placeholder:opacity-20"
            />
          </div>

          <div className="pb-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border-2 border-slate-700 focus:border-indigo-500 p-4 rounded-2xl text-white outline-none transition-all placeholder:opacity-20"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 transition-all active:scale-95 uppercase tracking-widest"
          >
            Masuk ke Sistem
          </button>
        </form>
      </div>

      {/* WATERMARK LINTAS JURUSAN */}
      <div className="mt-12 text-center space-y-3">
        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.4em]">
          Made with <span className="text-rose-500 animate-pulse">❤️</span> by
        </p>
        
        <div className="bg-slate-800/30 py-4 px-8 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
          <h4 className="text-white text-[11px] font-black tracking-[0.2em] uppercase mb-1">
            Tim 1 Kelompok 71 KKN UNDIP 2026
          </h4>
          <p className="text-slate-400 text-[9px] font-medium uppercase tracking-tighter">
            Desa Ponowareng
          </p>
        </div>
      </div>

    </div>
  );
}