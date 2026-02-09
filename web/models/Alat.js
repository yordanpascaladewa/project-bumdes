import mongoose from 'mongoose';

const AlatSchema = new mongoose.Schema({
  id_alat: { type: String, required: true, unique: true },
  status_koneksi: String, // "ONLINE" / "OFFLINE"
  terakhir_checkin: Date,
  
  // Laporan dari ESP32
  pakan_pagi: { type: Boolean, default: false }, // True = Sudah Makan
  pakan_sore: { type: Boolean, default: false },
  
  // Perintah dari Web ke ESP32
  perintah_manual: { type: Boolean, default: false }, 
  durasi_manual: { type: Number, default: 0 }, // Detik
});

export default mongoose.models.Alat || mongoose.model('Alat', AlatSchema);