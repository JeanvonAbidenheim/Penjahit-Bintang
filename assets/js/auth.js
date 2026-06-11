import { auth, db }                             from './firebase.js';
import { createUserWithEmailAndPassword,
         signInWithEmailAndPassword,
         onAuthStateChanged }                   from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import { ref, set }                             from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js';

// INISIALISASI 
function initAuth() {
  // Kalau sudah login → langsung ke status
  onAuthStateChanged(auth, function(user) {
    if (user) {
      window.location.href = 'status.html';
    }
  });

  var tabLogin  = document.getElementById('tabLogin');
  var tabDaftar = document.getElementById('tabDaftar');

  tabLogin  && tabLogin.addEventListener('click',  function() { toggleTab('login'); });
  tabDaftar && tabDaftar.addEventListener('click', function() { toggleTab('daftar'); });

  initFormLogin();
  initFormDaftar();
}

// FORM LOGIN 
function initFormLogin() {
  var form = document.getElementById('formLogin');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    var email    = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;

    setLoading('formLogin', true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = 'status.html';
    } catch (err) {
      setLoading('formLogin', false);
      var pesan = 'Email atau password salah.';
      if (err.code === 'auth/user-not-found')  pesan = 'Akun tidak ditemukan.';
      if (err.code === 'auth/wrong-password')  pesan = 'Password salah.';
      if (err.code === 'auth/too-many-requests') pesan = 'Terlalu banyak percobaan. Coba lagi nanti.';
      tampilPesan('login', 'error', pesan);
    }
  });
}

// FORM DAFTAR 
function initFormDaftar() {
  var form = document.getElementById('formDaftar');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    var nama     = document.getElementById('daftarNama').value.trim();
    var hp       = document.getElementById('daftarHp').value.trim();
    var email    = document.getElementById('daftarEmail').value.trim();
    var password = document.getElementById('daftarPassword').value;
    var konfirm  = document.getElementById('daftarKonfirm').value;

    if (!nama || !hp || !email || !password) {
      tampilPesan('daftar', 'error', 'Semua kolom wajib diisi!');
      return;
    }
    if (password.length < 6) {
      tampilPesan('daftar', 'error', 'Password minimal 6 karakter.');
      return;
    }
    if (password !== konfirm) {
      tampilPesan('daftar', 'error', 'Konfirmasi password tidak cocok!');
      return;
    }

    setLoading('formDaftar', true);

    try {
      // Buat akun di Firebase Auth
      var result = await createUserWithEmailAndPassword(auth, email, password);
      var uid    = result.user.uid;

      // Simpan profil ke Realtime Database
      await set(ref(db, 'users/' + uid), {
        nama:      nama,
        no_hp:     hp,
        email:     email,
        createdAt: Date.now()
      });

      // Langsung redirect ke status
      window.location.href = 'status.html';

    } catch (err) {
      setLoading('formDaftar', false);
      var pesan = 'Gagal membuat akun.';
      if (err.code === 'auth/email-already-in-use') pesan = 'Email sudah terdaftar. Silakan login.';
      if (err.code === 'auth/invalid-email')         pesan = 'Format email tidak valid.';
      if (err.code === 'auth/weak-password')         pesan = 'Password terlalu lemah.';
      tampilPesan('daftar', 'error', pesan);
    }
  });
}

// LOGOUT
async function logout() {
  await auth.signOut();
  window.location.href = 'index.html';
}


// HELPER 
function toggleTab(tab) {
  var formLogin  = document.getElementById('formLogin');
  var formDaftar = document.getElementById('formDaftar');
  var tabLogin   = document.getElementById('tabLogin');
  var tabDaftar  = document.getElementById('tabDaftar');

  if (tab === 'login') {
    formLogin  && formLogin.classList.remove('hidden');
    formDaftar && formDaftar.classList.add('hidden');
    tabLogin   && tabLogin.classList.add('tab-aktif');
    tabDaftar  && tabDaftar.classList.remove('tab-aktif');
  } else {
    formDaftar && formDaftar.classList.remove('hidden');
    formLogin  && formLogin.classList.add('hidden');
    tabDaftar  && tabDaftar.classList.add('tab-aktif');
    tabLogin   && tabLogin.classList.remove('tab-aktif');
  }
}

function setLoading(formId, loading) {
  var btn  = document.querySelector('#' + formId + ' button[type="submit"]');
  var teks = document.querySelector('#' + formId + ' .btn-teks');
  if (!btn) return;
  btn.disabled = loading;
  if (teks) teks.textContent = loading ? 'Memproses...' : btn.dataset.teks || 'Kirim';
}

function tampilPesan(form, tipe, pesan) {
  var el = document.getElementById('pesan-' + form);
  if (!el) return;
  el.textContent   = pesan;
  el.className     = 'auth-pesan ' + tipe;
  el.style.display = 'block';
  setTimeout(function() { el.style.display = 'none'; }, 4000);
}
export { initAuth, logout };
