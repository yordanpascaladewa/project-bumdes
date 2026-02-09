#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "RTClib.h"

// ================= KONFIGURASI =================
const char* ssid = "eyloqr";          
const char* password = "yordanpp";    
// GANTI LINK DI BAWAH SESUAI LINK VERCEL LU NANTI
const char* serverUrl = "https://project-bumdes-sbor.vercel.app/dashboard"; 
const char* ALAT_ID = "ALAT_UTAMA"; 

// KALIBRASI WAKTU CURAH (Estimasi)
// Misal: 1 Kg = butuh buka 5 detik.
// 7 Kg = 35 Detik | 8 Kg = 40 Detik
const unsigned long DURASI_PAGI = 35000; // 35 Detik
const unsigned long DURASI_SORE = 40000; // 40 Detik

// SAFETY AKTUATOR
const unsigned long ACT_BUKA_FULL = 29000;   // Mundur Mentok (Buka)
const unsigned long ACT_TUTUP_SAFETY = 24600;// Maju (Tutup) - Jangan lebih!

// JAM MAKAN
const int JAM_PAGI = 9;  // 09:00
const int JAM_SORE = 15; // 15:00

// PIN
#define RELAY_TUTUP  4   // Maju
#define RELAY_BUKA   16  // Mundur

RTC_DS3231 rtc;
unsigned long lastCheck = 0;
bool donePagi = false;
bool doneSore = false;
bool isMoving = false;

// ================= FUNGSI GERAK =================
void stopMotor() {
  digitalWrite(RELAY_TUTUP, HIGH);
  digitalWrite(RELAY_BUKA, HIGH);
  isMoving = false;
  Serial.println("⛔ Motor STOP");
}

void jalankanPakan(unsigned long durasiCurah) {
  if (isMoving) return;
  isMoving = true;
  
  Serial.println("\n🚀 MULAI SIKLUS PAKAN...");

  // 1. BUKA PINTU (Mundur)
  Serial.println("🔽 Membuka Pintu (29s)...");
  digitalWrite(RELAY_TUTUP, HIGH);
  digitalWrite(RELAY_BUKA, LOW);
  delay(ACT_BUKA_FULL);
  stopMotor();

  // 2. TUNGGU CURAH (Pakan Jatuh)
  Serial.print("⏳ Menunggu Pakan Jatuh (");
  Serial.print(durasiCurah/1000);
  Serial.println(" detik)...");
  delay(durasiCurah);

  // 3. TUTUP PINTU (Maju Safety)
  Serial.println("🔼 Menutup Pintu (24.6s)...");
  digitalWrite(RELAY_BUKA, HIGH);
  digitalWrite(RELAY_TUTUP, LOW);
  delay(ACT_TUTUP_SAFETY);
  
  stopMotor();
  Serial.println("✅ SIKLUS SELESAI.");
}

// ================= FUNGSI SERVER =================
void cekServer() {
  if(WiFi.status() != WL_CONNECTED || isMoving) return;

  HTTPClient http;
  WiFiClientSecure client; 
  client.setInsecure();
  
  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "application/json");

  // Kirim Laporan Status
  StaticJsonDocument<200> doc;
  doc["id"] = ALAT_ID;
  doc["pakan_pagi"] = donePagi;
  doc["pakan_sore"] = doneSore;
  
  String body; serializeJson(doc, body);
  int httpCode = http.POST(body);
  
  // Baca Balasan (Perintah Manual)
  if(httpCode == 200) {
    String resp = http.getString();
    StaticJsonDocument<200> r; deserializeJson(r, resp);
    String cmd = r["perintah"];
    int durasi = r["durasi"];

    if (cmd == "MANUAL" && durasi > 0) {
      Serial.println("⚠️ DAPAT PERINTAH MANUAL!");
      jalankanPakan(durasi * 1000);
    }
  }
  http.end();
}

// ================= SETUP & LOOP =================
void setup() {
  Serial.begin(115200);
  
  // Setup Relay (Active LOW)
  digitalWrite(RELAY_TUTUP, HIGH);
  digitalWrite(RELAY_BUKA, HIGH);
  pinMode(RELAY_TUTUP, OUTPUT);
  pinMode(RELAY_BUKA, OUTPUT);

  // Setup RTC
  Wire.begin();
  if (!rtc.begin()) Serial.println("❌ RTC Error!");
  if (rtc.lostPower()) rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));

  // Setup WiFi
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\n✅ WiFi Connected!");
}

void loop() {
  DateTime now = rtc.now();

  // 1. LOGIKA JADWAL OTOMATIS
  if (!isMoving) {
    // Pagi
    if (now.hour() == JAM_PAGI && now.minute() == 0 && !donePagi) {
      jalankanPakan(DURASI_PAGI);
      donePagi = true;
    }
    // Sore
    if (now.hour() == JAM_SORE && now.minute() == 0 && !doneSore) {
      jalankanPakan(DURASI_SORE);
      doneSore = true;
    }
    // Reset Tengah Malam
    if (now.hour() == 0 && now.minute() == 0) {
      donePagi = false;
      doneSore = false;
    }
  }

  // 2. LAPOR & CEK PERINTAH WEB (Tiap 3 detik)
  if (millis() - lastCheck > 3000) {
    lastCheck = millis();
    cekServer();
  }
}