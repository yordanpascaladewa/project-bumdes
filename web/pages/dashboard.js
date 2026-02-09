import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [manualDurasi, setManualDurasi] = useState(24.6); // Durasi presisi sesuai permintaan
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  // Proteksi Halaman & Auto Refresh Data
  useEffect(() => {
    if (!localStorage.getItem('isLoggedIn')) router.push('/');
    
    const interval = setInterval(fetchData, 2000); // Sinkronisasi tiap 2 detik
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/kontrol');
      setData(res.data);
    } catch (err) { 
      console.error("Gagal mengambil data database", err); 
    }
  };

  const kirimManual = async () => {
    setIsSending(true);
    try {
      // Mengirim perintah MAJU ke API
      await axios.post('/api/kontrol', { perintah: "MAJU", durasi: manualDurasi });
      alert(`🚀 SIKLUS PAKAN DIMULAI!\nAktuator akan membuka ${manualDurasi} detik lalu menutup kembali.`);
    } catch (err) { 
      alert("Koneksi server terputus!"); 
    }
    setIsSending(false);
  };

  // Logika Cek Online (Toleransi 1 Menit)
  const isOnline = data?.terakhir_checkin && (new Date() - new Date(data.terakhir_checkin) < 60000);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-lg mx-auto">
        
        {/* HEADER APLIKASI */}
        <div className="flex justify-between items-center mb-8 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">🦆</div>
            <div>
              <h1 className="text-lg font-black text-white leading-tight tracking-tight">Smart Feeder</h1>
              <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-400 font-bold">Peternakan Bumdes</p>
            </div>
          </div>
          <button 
            onClick={() => {localStorage.removeItem('isLoggedIn'); router.push('/')}} 
            className="text-red-400 text-[10px] font-black border border-red-500/30 px-4 py-2 rounded-xl hover:bg-red-500/10 transition-all uppercase tracking-widest"
          >
            Logout
          </button>
        </div>

        {/* STATUS KONEKSI ESP32 */}
        <div className={`relative overflow-hidden p-6 rounded-[2rem] mb-6 border-b-4 transition-all duration-500 shadow-2xl ${isOnline ? 'bg-emerald-500/10 border-emerald-500 shadow-emerald-500/10' : 'bg-rose-500/10 border-rose-500 shadow-rose-500/10'}`}>
          <div className="flex flex-col items-center relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50 mb-2">STATUS SISTEM</span>
            <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
              {isOnline ? "ALAT ONLINE" : "ALAT OFFLINE"}
              <span className={`w-3 h-3 rounded-full animate-pulse ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            </h2>
            {data?.terakhir_checkin && (
              <p className="text-[9px] mt-2 font-mono opacity-40 uppercase">Last Signal: {new Date(data.terakhir_checkin).toLocaleTimeString()}</p>
            )}
          </div>
        </div>

        {/* INFO PANEL SAFETY */}
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-8 flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <p className="text-[10px] text-amber-200/80 leading-relaxed font-medium">
            <strong>SAFETY PROTOCOL:</strong> Aktuator akan melakukan "Safety Run" (Mundur 30 detik) saat perangkat dinyalakan untuk mencegah tabrakan plat pakan.
          </p>
        </div>

        {/* KONTROL UTAMA */}
        <div className="bg-slate-800/80 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-4xl font-black italic">MANUAL</div>
          
          <h3 className="text-center font-bold text-[10px] uppercase tracking-[0.2em] mb-6 text-slate-500">Durasi Buka Plat (Detik)</h3>
          
          <div className="relative mb-8">
            <input 
              type="number" 
              step="0.1"
              value={manualDurasi} 
              onChange={(e) => setManualDurasi(e.target.value)} 
              className="w-full bg-slate-900 border-2 border-slate-700 focus:border-indigo-500 p-6 rounded-2xl text-white font-black text-center text-5xl outline-none transition-all shadow-inner" 
            />
            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
              <span className="text-xs font-bold text-slate-600 uppercase">Sec</span>
            </div>
          </div>

          <button 
            onClick={kirimManual} 
            disabled={!isOnline || isSending} 
            className={`w-full py-6 rounded-2xl font-black text-xl tracking-tight transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-3
              ${isOnline && !isSending 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30' 
                : 'bg-slate-700 text-slate-500 cursor-not-allowed grayscale'}`}
          >
            {isSending ? (
              <>
                <div className="w-5 h-5 border-4 border-slate-400 border-t-white rounded-full animate-spin"></div>
                PROSES...
              </>
            ) : (
              "KIRIM PAKAN SEKARANG"
            )}
          </button>
        </div>

        {/* WATERMARK KKN UNDIP 2026 */}
        <div className="mt-20 text-center space-y-4">
          <p className="text-slate-600 text-[9px] font-bold uppercase tracking-[0.4em]">
            Made with <span className="text-rose-500 animate-pulse">❤️</span> by
          </p>
          
          <div className="inline-block relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-2xl blur-md"></div>
            <div className="relative bg-slate-800/40 py-5 px-8 rounded-2xl border border-slate-700/50 backdrop-blur-md">
              <h4 className="text-white text-[11px] font-black tracking-[0.2em] uppercase leading-none mb-2">
                Tim 1 Kelompok 71 KKN UNDIP 2026
              </h4>
              <p className="text-indigo-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                Desa Ponowareng
              </p>
              <p className="text-slate-500 text-[8px] font-medium uppercase tracking-tight">
                Kec. Tulis • Kab. Batang
              </p>
            </div>
          </div>

          <div className="pt-8 opacity-20">
            <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              &copy; 2026 • Universitas Diponegoro
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}