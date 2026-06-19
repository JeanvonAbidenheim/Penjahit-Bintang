/* ==============================================
   profil.js — Halaman profil pelanggan & admin
   Fitur:
   - Lihat & edit nama, nomor HP, username
   - Ganti password
   - Upload & ganti foto profil (Cloudinary)
   ============================================== */

import { auth, db }                              from './firebase.js';
import { onAuthStateChanged,
         updatePassword,
         updateEmail,
         reauthenticateWithCredential,
         EmailAuthProvider }                     from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import { ref, get, update }                      from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js';

/* ── Konfigurasi Cloudinary ── */
const CLOUDINARY_URL    = 'https://api.cloudinary.com/v1_1/dhi4xmvsr/image/upload';
const CLOUDINARY_PRESET = 'penjahit-bintang';

/* ── State ── */
var userAktif   = null;
var profilData  = null;


/* ── INISIALISASI ── */
function initProfil() {
  onAuthStateChanged(auth, async function(user) {
    if (!user) {
      window.location.href = 'auth.html';
      return;
    }

    userAktif = user;
    await muatDataProfil(user);
  });
}


/* ── MUAT DATA PROFIL DARI FIREBASE ── */
async function muatDataProfil(user) {
  var snap = await get(ref(db, 'users/' + user.uid));
  profilData = snap.exists() ? snap.val() : {};

  // Isi semua field dari data yang ada
  isiField('profilNama',     profilData.nama     || '');
  isiField('profilUsername', profilData.username  || '');
  isiField('profilHp',       profilData.no_hp    || '');
  isiField('profilEmail',    user.email          || '');

  // Tampilkan foto profil
  var fotoUrl = profilData.fotoUrl || null;
  tampilFotoProfil(fotoUrl, profilData.nama || user.email);

  // Tampilkan email di navbar
  var elNama = document.getElementById('namaUser');
  if (elNama) elNama.textContent = profilData.nama || user.email;

  // Inisialisasi semua form setelah data dimuat
  initFormInfoDasar();
  initFormPassword();
  initUploadFoto();
}


/* ── TAMPIL FOTO PROFIL ── */
function tampilFotoProfil(fotoUrl, namaFallback) {
  var elFoto    = document.getElementById('avatarImg');
  var elInisial = document.getElementById('avatarInisial');
  var elPreview = document.getElementById('fotoPreview');

  if (fotoUrl) {
    // Punya foto — tampilkan gambar
    if (elFoto)    { elFoto.src = fotoUrl; elFoto.style.display = 'block'; }
    if (elInisial)   elInisial.style.display = 'none';
    if (elPreview) { elPreview.src = fotoUrl; elPreview.style.display = 'block'; }
  } else {
    // Belum punya foto — tampilkan inisial nama
    var inisial = (namaFallback || '?').charAt(0).toUpperCase();
    if (elFoto)    elFoto.style.display   = 'none';
    if (elInisial) {
      elInisial.style.display = 'flex';
      elInisial.textContent   = inisial;
    }
    if (elPreview) elPreview.style.display = 'none';
  }
}


/* ── FORM INFO DASAR: nama, username, HP ── */
function initFormInfoDasar() {
  var form = document.getElementById('formInfoDasar');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    var nama     = document.getElementById('profilNama').value.trim();
    var username = document.getElementById('profilUsername').value.trim();
    var hp       = document.getElementById('profilHp').value.trim();

    if (!nama) {
      tampilNotif('infoDasar', 'Nama tidak boleh kosong!', 'error');
      return;
    }

    setLoadingBtn('btnSimpanInfo', true, 'Menyimpan...');

    try {
      await update(ref(db, 'users/' + userAktif.uid), {
        nama:     nama,
        username: username || null,
        no_hp:    hp       || null
      });

      profilData.nama     = nama;
      profilData.username = username;
      profilData.no_hp    = hp;

      // Update tampilan nama di navbar
      var elNama = document.getElementById('namaUser');
      if (elNama) elNama.textContent = nama;

      setLoadingBtn('btnSimpanInfo', false, 'Simpan Perubahan');
      tampilNotif('infoDasar', 'Profil berhasil diperbarui! ✓', 'sukses');

    } catch (err) {
      setLoadingBtn('btnSimpanInfo', false, 'Simpan Perubahan');
      tampilNotif('infoDasar', 'Gagal menyimpan: ' + err.message, 'error');
    }
  });
}


/* ── FORM GANTI PASSWORD ── */
function initFormPassword() {
  var form = document.getElementById('formPassword');
  if (!form) return;

  // Toggle show/hide password
  form.querySelectorAll('.btn-toggle-pw').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var inputId = btn.dataset.target;
      var input   = document.getElementById(inputId);
      if (!input) return;
      var tampil  = input.type === 'password';
      input.type  = tampil ? 'text' : 'password';
      btn.textContent = tampil ? '🙈' : '👁️';
    });
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    var pwLama  = document.getElementById('passwordLama').value;
    var pwBaru  = document.getElementById('passwordBaru').value;
    var pwUlang = document.getElementById('passwordUlang').value;

    if (!pwLama || !pwBaru || !pwUlang) {
      tampilNotif('password', 'Semua kolom password wajib diisi!', 'error');
      return;
    }
    if (pwBaru.length < 6) {
      tampilNotif('password', 'Password baru minimal 6 karakter.', 'error');
      return;
    }
    if (pwBaru !== pwUlang) {
      tampilNotif('password', 'Konfirmasi password tidak cocok!', 'error');
      return;
    }

    setLoadingBtn('btnSimpanPw', true, 'Memproses...');

    try {
      // Re-autentikasi dengan password lama dulu (wajib untuk keamanan)
      var credential = EmailAuthProvider.credential(userAktif.email, pwLama);
      await reauthenticateWithCredential(userAktif, credential);

      // Ganti password
      await updatePassword(userAktif, pwBaru);

      form.reset();
      setLoadingBtn('btnSimpanPw', false, 'Ganti Password');
      tampilNotif('password', 'Password berhasil diubah! ✓', 'sukses');

    } catch (err) {
      setLoadingBtn('btnSimpanPw', false, 'Ganti Password');
      var pesan = 'Gagal ganti password.';
      if (err.code === 'auth/wrong-password'    ) pesan = 'Password lama salah!';
      if (err.code === 'auth/invalid-credential') pesan = 'Password lama salah!';
      if (err.code === 'auth/too-many-requests'  ) pesan = 'Terlalu banyak percobaan. Coba lagi nanti.';
      tampilNotif('password', pesan, 'error');
    }
  });
}


/* ── UPLOAD FOTO PROFIL ── */
function initUploadFoto() {
  var inputFoto = document.getElementById('inputFotoProfil');
  var btnHapus  = document.getElementById('btnHapusFoto');

  if (!inputFoto) return;

  // Preview sebelum upload
  inputFoto.addEventListener('change', async function() {
    var file = this.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      tampilNotif('foto', 'File harus berupa gambar!', 'error');
      this.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      tampilNotif('foto', 'Ukuran foto maksimal 3MB!', 'error');
      this.value = '';
      return;
    }

    setLoadingBtn('btnGantiFoto', true, 'Mengupload...');
    tampilProgressFoto(0);

    try {
      // Upload ke Cloudinary
      var fotoUrl = await uploadFotoCloudinary(file);

      // Simpan URL ke Firebase
      await update(ref(db, 'users/' + userAktif.uid), { fotoUrl: fotoUrl });
      profilData.fotoUrl = fotoUrl;

      // Update tampilan
      tampilFotoProfil(fotoUrl, profilData.nama);
      setLoadingBtn('btnGantiFoto', false, 'Ganti Foto');
      tampilProgressFoto(100);
      tampilNotif('foto', 'Foto profil berhasil diperbarui! ✓', 'sukses');

      setTimeout(function() { sembunyikanProgressFoto(); }, 1500);

    } catch (err) {
      setLoadingBtn('btnGantiFoto', false, 'Ganti Foto');
      sembunyikanProgressFoto();
      tampilNotif('foto', 'Gagal upload foto: ' + err.message, 'error');
    }
  });

  // Hapus foto profil
  if (btnHapus) {
    btnHapus.addEventListener('click', async function() {
      if (!confirm('Yakin ingin menghapus foto profil?')) return;

      try {
        await update(ref(db, 'users/' + userAktif.uid), { fotoUrl: null });
        profilData.fotoUrl = null;
        tampilFotoProfil(null, profilData.nama);
        tampilNotif('foto', 'Foto profil dihapus. ✓', 'sukses');
      } catch (err) {
        tampilNotif('foto', 'Gagal hapus foto: ' + err.message, 'error');
      }
    });
  }
}


/* ── UPLOAD KE CLOUDINARY ── */
function uploadFotoCloudinary(file) {
  return new Promise(function(resolve, reject) {
    var formData = new FormData();
    formData.append('file',          file);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    formData.append('folder',        'penjahit-bintang/profil');

    var xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable) {
        tampilProgressFoto(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', function() {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText).secure_url);
      } else {
        reject(new Error('Upload gagal, status: ' + xhr.status));
      }
    });

    xhr.addEventListener('error', function() {
      reject(new Error('Koneksi bermasalah saat upload'));
    });

    xhr.open('POST', CLOUDINARY_URL);
    xhr.send(formData);
  });
}


/* ── HELPER ── */
function isiField(id, nilai) {
  var el = document.getElementById(id);
  if (el) el.value = nilai;
}

function setLoadingBtn(id, loading, teks) {
  var btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = teks;
}

function tampilNotif(bagian, pesan, tipe) {
  var el = document.getElementById('notif-' + bagian);
  if (!el) return;
  el.textContent   = pesan;
  el.className     = 'profil-notif ' + tipe;
  el.style.display = 'block';
  setTimeout(function() { el.style.display = 'none'; }, 4000);
}

function tampilProgressFoto(pct) {
  var wrap = document.getElementById('progressFotoWrap');
  var bar  = document.getElementById('progressFotoBar');
  var teks = document.getElementById('progressFotoTeks');
  if (wrap) wrap.style.display = 'block';
  if (bar)  bar.style.width    = pct + '%';
  if (teks) teks.textContent   = pct + '%';
}

function sembunyikanProgressFoto() {
  var wrap = document.getElementById('progressFotoWrap');
  if (wrap) wrap.style.display = 'none';
}

export { initProfil };
