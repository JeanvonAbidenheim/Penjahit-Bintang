// Import Firebase dari CDN (module)
import { initializeApp }                        from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import { getAuth }                              from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import { getDatabase }                          from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js';

const firebaseConfig = {
  apiKey:            'AIzaSyAUFU-23yFgtCMXQ4FMRNNDBsupWa6jJ3A',
  authDomain:        'penjahit-bintang.firebaseapp.com',
  databaseURL:       'https://penjahit-bintang-default-rtdb.firebaseio.com',
  projectId:         'penjahit-bintang',
  storageBucket:     'penjahit-bintang.firebasestorage.app',
  messagingSenderId: '294428016547',
  appId:             '1:294428016547:web:1b45a02404b5caa777a416'
};

// Inisialisasi Firebase
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

// Export supaya bisa dipakai file lain
export { auth, db };
