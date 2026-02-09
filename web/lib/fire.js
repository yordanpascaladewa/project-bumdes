// File: web/lib/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  // Masukkan API KEY kamu yang panjang itu di sini
  apiKey: "AIzaSy...", 
  authDomain: "project-bumdes-...",
  databaseURL: "https://project-bumdes-....firebaseio.com",
  projectId: "project-bumdes-...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

// Singleton pattern biar gak error "App already initialized"
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);

export { database };