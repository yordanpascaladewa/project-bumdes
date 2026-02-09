import dbConnect from '../../lib/db';
import Alat from '../../models/Alat';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const { id, pakan_pagi, pakan_sore } = req.body;

    // 1. Update Status dari Laporan ESP32
    let alat = await Alat.findOneAndUpdate(
      { id_alat: id },
      { 
        status_koneksi: "ONLINE",
        terakhir_checkin: new Date(),
        pakan_pagi: pakan_pagi,
        pakan_sore: pakan_sore
      },
      { new: true, upsert: true } // Buat baru kalau belum ada
    );

    // 2. Cek apakah ada perintah Manual dari Web?
    const responseData = {
      perintah: alat.perintah_manual ? "MANUAL" : "STANDBY",
      durasi: alat.durasi_manual || 0
    };

    // 3. Kalau perintah sudah dikirim, reset di DB biar ga dieksekusi 2x
    if (alat.perintah_manual) {
      await Alat.findOneAndUpdate({ id_alat: id }, { perintah_manual: false, durasi_manual: 0 });
    }

    res.status(200).json(responseData);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}