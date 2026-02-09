import { useState, useEffect } from "react";
import { useRouter } from "next/router"; // Pakai next/router karena kamu di folder 'pages'
import { database } from "../lib/firebaseConfig"; // Sesuaikan path folder lib
import { ref, onValue, update } from "firebase/database";

export default function Dashboard() {
  const router = useRouter();
  
  // --- STATE VARIABLES ---
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);
  const [manualDuration, setManualDuration] = useState("24,6");
  const [loading, setLoading] = useState(false);
  
  // State untuk Jadwal
  const [jadwal, setJadwal] = useState({
    pakan_pagi: "09:00",
    pakan_sore: "15:00",
  });

  // --- 1. CEK STATUS ONLINE/OFFLINE ---
  useEffect(() => {
    // A. DENGARKAN DATA DARI FIREBASE
    const statusRef = ref(database, 'status_alat/last_seen');
    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      const timestamp = snapshot.val();
      if (timestamp) {
        setLastSeen(timestamp);
        checkOnlineStatus(timestamp);
      }
    });

    // B. DENGARKAN CONFIG JADWAL
    const configRef = ref(database, 'config');
    const unsubscribeConfig = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setJadwal({
          pakan_pagi: data.pakan_pagi || "09:00",
          pakan_sore: data.pakan_sore || "15:00",
        });
      }
    });

    // C. INTERVAL LOKAL
    const interval = setInterval(() => {
      checkOnlineStatus(lastSeen);
    }, 1000);

    return () => {
      unsubscribeStatus();
      unsubscribeConfig();
      clearInterval(interval);
    };
  }, [lastSeen]);

  // Fungsi Logika Online (HAPUS BAGIAN ': number')
  const checkOnlineStatus = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Jika selisih waktu < 15 detik, dianggap ONLINE
    if (diff < 15000 && timestamp !== 0) {
      setIsOnline(true);
    } else {
      setIsOnline(false);
    }
  };

  // --- 2. FUNGSI TOMBOL MANUAL ---
  const handleManualFeed = async () => {
    setLoading(true);

    // SOLUSI KOMA: Ganti koma jadi titik
    const durasiFix = parseFloat(manualDuration.replace(',', '.'));

    if (isNaN(durasiFix) || durasiFix <= 0) {
      alert("Masukkan durasi yang benar!");
      setLoading(false);
      return;
    }

    try {
      await update(ref(database, 'perintah'), {
        beri_pakan_sekarang: true,
        durasi: durasiFix 
      });

      alert(`Perintah dikirim! Alat akan buka selama ${durasiFix} detik.`);
    } catch (error) {
      console.error(error);
      alert("Gagal mengirim perintah.");
    }

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  // --- 3. FUNGSI SIMPAN JADWAL ---
  const handleSaveJadwal = async () => {
    try {
      await update(ref(database, 'config'), {
        pakan_pagi: jadwal.pakan_pagi,
        pakan_sore: jadwal.pakan_sore
      });
      alert("Jadwal Berhasil Disimpan!");
    } catch (error) {
      alert("Gagal simpan jadwal.");
    }
  };

  // --- 4. LOGOUT ---
  const handleLogout = () => {
    router.push('/'); 
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              🦆
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Smart Feeder</h1>
              <p className="text-xs text-blue-400 font-semibold tracking-wider">PETERNAKAN BUMDES</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-xs font-bold text-red-400 border border-red-900 hover:bg-red-900/50 px-3 py-1 rounded transition">
            LOGOUT
          </button>
        </div>

        {/* STATUS CARD */}
        <div className={`p-8 rounded-2xl text-center shadow-2xl transition-all duration-500 border-2 ${isOnline ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
          <p className="text-xs font-bold tracking-[0.2em] text-slate-400 mb-2 uppercase">Status Sistem</p>
          <div className="flex justify-center items-center gap-3">
            <span className={`h-4 w-4 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            <h2 className={`text-3xl font-black ${isOnline ? 'text-green-400' : 'text-red-500'}`}>
              {isOnline ? "ALAT ONLINE" : "ALAT OFFLINE"}
            </h2>
          </div>
          {isOnline && <p className="text-xs text-green-300/50 mt-2">Terhubung ke Server</p>}
        </div>

        {/* WARNING BOX */}
        <div className="bg-yellow-900/30 border border-yellow-600/30 p-3 rounded-lg flex gap-3 items-start">
          <span className="text-yellow-500 text-xl">⚠️</span>
          <p className="text-xs text-yellow-200/80 leading-relaxed">
            <span className="font-bold text-yellow-500">SAFETY PROTOCOL:</span> Saat alat baru menyala, aktuator akan Mundur (30s) lalu Maju (24.6s) otomatis untuk kalibrasi.
          </p>
        </div>

        {/* MANUAL CONTROL */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-center font-bold text-slate-500 text-sm mb-6 uppercase tracking-widest">Kontrol Manual</h3>
          
          <div className="mb-6 relative">
            <label className="text-xs text-slate-400 absolute -top-2 left-3 bg-slate-800 px-1">Durasi Buka (Detik)</label>
            <input 
              type="text" 
              value={manualDuration}
              onChange={(e) => setManualDuration(e.target.value)}
              className="w-full bg-slate-900 text-center text-4xl font-bold py-4 rounded-xl border-2 border-slate-600 focus:border-blue-500 focus:outline-none text-white transition placeholder-slate-600"
              placeholder="0.0"
            />
            <span className="absolute right-4 top-6 text-slate-500 font-bold text-sm">SEC</span>
          </div>

          <button 
            onClick={handleManualFeed}
            disabled={loading || !isOnline}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transform active:scale-95 transition-all
              ${loading 
                ? 'bg-slate-600 cursor-not-allowed text-slate-400' 
                : isOnline 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-b-4 border-blue-900' 
                  : 'bg-slate-700 cursor-not-allowed text-slate-500'
              }
            `}>
            {loading ? "SEDANG MEMPROSES..." : "KIRIM PAKAN SEKARANG"}
          </button>
          {!isOnline && <p className="text-center text-xs text-red-400 mt-2">Alat offline, tombol dinonaktifkan.</p>}
        </div>

        {/* JADWAL SETTINGS */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-center font-bold text-slate-500 text-sm mb-6 uppercase tracking-widest">Pengaturan Jadwal</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Pakan Pagi</label>
              <input 
                type="time" 
                value={jadwal.pakan_pagi}
                onChange={(e) => setJadwal({...jadwal, pakan_pagi: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-center font-bold focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Pakan Sore</label>
              <input 
                type="time" 
                value={jadwal.pakan_sore}
                onChange={(e) => setJadwal({...jadwal, pakan_sore: e.target.value})}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-center font-bold focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <button 
            onClick={handleSaveJadwal}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 rounded-lg text-sm transition border border-slate-600">
            SIMPAN JADWAL
          </button>
        </div>

        {/* FOOTER */}
        <div className="text-center mt-8 pb-4 opacity-50">
          <p className="text-[10px] tracking-[2px] font-bold text-blue-400 uppercase mb-1">Made with ❤️ by</p>
          <div className="bg-slate-800/50 inline-block px-4 py-2 rounded-lg border border-slate-700/50">
            <p className="text-xs font-bold text-white">TIM 1 KELOMPOK 71 KKN UNDIP 2026</p>
            <p className="text-[10px] text-slate-400 mt-1">DESA PONOWARENG</p>
            <p className="text-[8px] text-slate-500">KEC. TULIS • KAB. BATANG</p>
          </div>
        </div>

      </div>
    </div>
  );
}