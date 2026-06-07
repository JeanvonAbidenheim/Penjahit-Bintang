/* ==============================================
supabase.js — Koneksi ke database Supabase
Ganti SUPABASE_URL dan SUPABASE_KEY dengan
kredensial dari dashboard Supabase-mu
============================================== */

const SUPABASE_URL = 'https://rhxzkptvrnkrfosltxom.supabase.co'; // ← ganti
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoeHprcHR2cm5rcmZvc2x0eG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzM5MTksImV4cCI6MjA5NjQwOTkxOX0.tqk1grzcGIBx6lLPbrb3b4KjpvRAVHD4nXmsPcZd-UM';                   // ← ganti

// Inisialisasi client Supabase
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);