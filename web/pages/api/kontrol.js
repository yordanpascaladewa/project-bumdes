import dbConnect from '../../lib/db';
import Alat from '../../models/Alat';

export default async function handler(req, res) {
  await dbConnect();
  const ID_TARGET = "ALAT_UTAMA"; // Cuma 1 Alat

  if (req.method === 'GET') {
    // Ambil Data buat ditampilkan di Dashboard
    const alat = await Alat.findOne({ id_alat: ID_TARGET });
    res.status(200).json(alat || {});
  } 
  else if (req.method === 'POST') {
    // Terima Perintah Manual dari Dashboard
    const { durasi } = req.body;
    
    await Alat.findOneAndUpdate(
      { id_alat: ID_TARGET },
      { 
        perintah_manual: true,
        durasi_manual: durasi
      },
      { upsert: true }
    );
    res.status(200).json({ success: true });
  }
}