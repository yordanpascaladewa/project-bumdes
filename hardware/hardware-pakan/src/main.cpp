#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "RTClib.h"

// ================= KONFIGURASI =================
const char* ssid = "eyloqr";          
const char* password = "yordanpp";    
// Link Vercel (Pastikan tidak ada spasi di akhir)
const char* serverUrl = "https://project-bumdes-sbor.vercel.app/api/hardware"; 
// Note: Biasanya endpoint untuk IoT dipisah, tapi kalau pakai dashboard pastikan return JSON yang benar
const char* ALAT_ID = "ALAT_UTAMA"; 

// SETTING WAKTU KALIBRASI AWAL
const unsigned long CALIBRATION_OPEN_TIME = 30000; // 30 Detik Mundur (Reset)
const unsigned long CALIBRATION_CLOSE_TIME = 24600; // 24.6 Detik Maju (Posisi Tutup)

// JADWAL OTOMATIS (Hardcode Durasi Buka Tutup)
const unsigned long DURASI_PAGI = 5000; // Contoh: Buka 5 detik
const unsigned long DURASI_SORE = 5000; // Contoh: Buka 5 detik

// JAM MAKAN
const int JAM_PAGI = 9;  // 09:00
const int JAM_SORE = 15; // 15:00

// PIN (RELAY ACTIVE LOW: LOW = NYALA, HIGH = MATI)
#define RELAY_TUTUP  4   // Maju (Extending)
#define RELAY_BUKA   16  // Mundur (Retracting)

RTC_DS3231 rtc;
unsigned long lastCheck = 0;
bool donePagi = false;
bool doneSore = false;
bool isMoving = false; // Flag biar gak tabrakan perintah

// ================= FUNGSI GERAK =================
void stopMotor() {
  digitalWrite(RELAY_TUTUP, HIGH);
  digitalWrite(RELAY_BUKA, HIGH);
  Serial.println("⛔ Motor STOP");
}

// Fungsi Pakan Baru (Simetris: Buka X detik, Tutup X detik)
void jalankanPakan(unsigned long durasiDetik) {
  if (isMoving) return;
  isMoving = true;
  
  Serial.print("\n🚀 MULAI SIKLUS PAKAN: "); 
  Serial.print(durasiDetik / 1000); Serial.println(" detik.");

  // 1. MUNDUR (BUKA PLAT)
  Serial.println("🔽 Membuka Pintu...");
  digitalWrite(RELAY_TUTUP, HIGH); // Pastikan relay tutup mati
  digitalWrite(RELAY_BUKA, LOW);   // Nyalakan relay buka
  delay(durasiDetik);              // Tunggu sesuai durasi input
  
  stopMotor();
  delay(1000); // Jeda 1 detik biar pakan turun & motor adem

  // 2. MAJU (TUTUP PLAT) - Durasi SAMA dengan Buka
  Serial.println("🔼 Menutup Pintu...");
  digitalWrite(RELAY_BUKA, HIGH);  // Pastikan relay buka mati
  digitalWrite(RELAY_TUTUP, LOW);  // Nyalakan relay tutup
  delay(durasiDetik);              // Tunggu durasi yang SAMA
  
  stopMotor();
  
  isMoving = false;
  Serial.println("✅ SIKLUS SELESAI.");
}

// ================= FUNGSI SERVER =================
void cekServer() {
  if(WiFi.status() != WL_CONNECTED || isMoving) return;

  HTTPClient http;
  WiFiClientSecure client; 
  client.setInsecure(); // Abaikan sertifikat SSL (Wajib untuk Vercel/HTTPS)
  
  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "application/json");

  // Kirim Laporan Status ke Server
  StaticJsonDocument<200> doc;
  doc["id"] = ALAT_ID;
  doc["pakan_pagi"] = donePagi;
  doc["pakan_sore"] = doneSore;
  
  String body; 
  serializeJson(doc, body);
  
  // Kirim POST Request
  int httpCode = http.POST(body);
  
  // Baca Balasan dari Server (Cek Perintah Manual)
  if(httpCode > 0) {
    String resp = http.getString();
    // Serial.println(resp); // Debug kalau perlu

    StaticJsonDocument<512> r; 
    DeserializationError error = deserializeJson(r, resp);

    if (!error) {
      String cmd = r["perintah"]; // Harusnya "MANUAL"
      float durasi = r["durasi"]; // Durasi dalam detik (misal 24.6)

      // Eksekusi jika ada perintah manual
      if (cmd == "MANUAL" && durasi > 0) {
        Serial.print("⚠️ DAPAT PERINTAH MANUAL: "); Serial.println(durasi);
        // Konversi ke milidetik
        jalankanPakan((unsigned long)(durasi * 1000));
      }
    }
  }
  http.end();
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  
  // 1. Setup Relay (Matikan dulu semua)
  pinMode(RELAY_TUTUP, OUTPUT);
  pinMode(RELAY_BUKA, OUTPUT);
  stopMotor();

  // 2. Setup RTC
  Wire.begin();
  if (!rtc.begin()) Serial.println("❌ RTC Error!");
  if (rtc.lostPower()) rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));

  // 3. --- KALIBRASI AWAL (PERMINTAAN KAMU) ---
  Serial.println("\n--- 🔧 MEMULAI KALIBRASI POSISI ---");
  
  // Tahap A: Mundur 30 Detik (Pastikan Reset/Buka Full)
  Serial.println("1. Mundur 30 detik (Reset Posisi)...");
  digitalWrite(RELAY_TUTUP, HIGH);
  digitalWrite(RELAY_BUKA, LOW); // Mundur
  delay(CALIBRATION_OPEN_TIME);  // 30000 ms
  stopMotor();
  delay(1000); // Istirahat motor

  // Tahap B: Maju 24.6 Detik (Menutup Rapat)
  Serial.println("2. Maju 24.6 detik (Menutup Plat)...");
  digitalWrite(RELAY_BUKA, HIGH);
  digitalWrite(RELAY_TUTUP, LOW); // Maju
  delay(CALIBRATION_CLOSE_TIME);  // 24600 ms
  stopMotor();
  
  Serial.println("--- ✅ KALIBRASI SELESAI. ALAT SIAP. ---");
  // -------------------------------------------

  // 4. Setup WiFi
  Serial.print("Menghubungkan WiFi");
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED) { 
    delay(500); 
    Serial.print("."); 
  }
  Serial.println("\n✅ WiFi Connected!");
}

// ================= LOOP =================
void loop() {
  DateTime now = rtc.now();

  // 1. LOGIKA JADWAL OTOMATIS
  // Pastikan motor tidak sedang bergerak manual
  if (!isMoving) {
    // Pagi (Jam 9:00:00)
    if (now.hour() == JAM_PAGI && now.minute() == 0 && now.second() < 5 && !donePagi) {
      jalankanPakan(DURASI_PAGI);
      donePagi = true;
    }
    // Sore (Jam 15:00:00)
    if (now.hour() == JAM_SORE && now.minute() == 0 && now.second() < 5 && !doneSore) {
      jalankanPakan(DURASI_SORE);
      doneSore = true;
    }
    
    // Reset Status Harian (Misal jam 12 malam)
    if (now.hour() == 0 && now.minute() == 0) {
      donePagi = false;
      doneSore = false;
    }
  }

  // 2. CEK PERINTAH WEB (Interval 3 detik biar responsif tapi gak spam)
  if (millis() - lastCheck > 3000) {
    lastCheck = millis();
    cekServer();
  }
}