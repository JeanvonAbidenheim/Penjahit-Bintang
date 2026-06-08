const SUPABASE_URL = 'https://rhxzkptvrnkrfosltxom.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoeHprcHR2cm5rcmZvc2x0eG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzM5MTksImV4cCI6MjA5NjQwOTkxOX0.tqk1grzcGIBx6lLPbrb3b4KjpvRAVHD4nXmsPcZd-UM';

// Coba semua kemungkinan cara akses createClient
let db;

if (typeof supabase !== 'undefined' && supabase.createClient) {
  // CDN global
  db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else if (typeof window !== 'undefined' && window.supabase) {
  // Window global
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.error('Supabase library tidak terload!');
}
