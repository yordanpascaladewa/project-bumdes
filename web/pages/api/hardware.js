import { database } from "../../../lib/firebaseConfig"; 
import { ref, get, update, set } from "firebase/database";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { id, pakan_pagi, pakan_sore } = req.body;

    // --- BAGIAN INI YANG KEMARIN KITA LEWATKAN ---
    // 1. Catat "Last Seen" (Waktu Terakhir Online) ke Firebase
    // Kita simpan timestamp server saat ini
    await update(ref(database, 'status_alat'), { 
      online: true, 
      last_seen: Date.now() // Ini jam detik ini (ms)
    });
    // ----------------------------------------------

    // 2. Cek apakah ada perintah MANUAL dari Firebase?
    const perintahRef = ref(database, "perintah");
    const snapshot = await get(perintahRef);
    const data = snapshot.val();

    if (data && data.beri_pakan_sekarang === true) {
      // ADA PERINTAH! Kirim ke ESP32
      res.status(200).json({
        perintah: "MANUAL",
        durasi: 24.6 
      });

      // Matikan tombol manual di database biar gak looping
      await update(perintahRef, { beri_pakan_sekarang: false });
    } else {
      // GAK ADA PERINTAH, Standby aja
      res.status(200).json({
        perintah: "STANDBY",
        durasi: 0
      });
    }

  } catch (error) {
    console.error("Firebase Error:", error);
    res.status(500).json({ error: "Gagal cek database" });
  }
}