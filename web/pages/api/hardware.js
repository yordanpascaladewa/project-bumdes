import { database } from "../../../lib/firebaseConfig"; 
import { ref, get, update } from "firebase/database";

export default async function handler(req, res) {
  // Hanya terima metode POST (dari ESP32)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 1. PENTING: Catat jam kehadiran alat (Last Seen)
    // Tanpa ini, status akan selalu OFFLINE
    await update(ref(database, 'status_alat'), { 
      online: true, 
      last_seen: Date.now() // Waktu sekarang (milidetik)
    });

    // 2. Cek apakah ada perintah MANUAL dari Firebase?
    const perintahRef = ref(database, "perintah");
    const snapshot = await get(perintahRef);
    const data = snapshot.val();

    if (data && data.beri_pakan_sekarang === true) {
      // ADA PERINTAH! Kirim durasi ke ESP32
      res.status(200).json({
        perintah: "MANUAL",
        durasi: data.durasi || 24.6 
      });

      // Matikan tombol perintah biar gak ngulang terus
      await update(perintahRef, { beri_pakan_sekarang: false });
    } else {
      // GAK ADA PERINTAH, suruh ESP32 diam (Standby)
      res.status(200).json({
        perintah: "STANDBY",
        durasi: 0
      });
    }

  } catch (error) {
    console.error("Firebase Error:", error);
    res.status(500).json({ error: "Gagal update database" });
  }
}