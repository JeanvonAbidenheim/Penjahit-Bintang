/* ==============================================
   galeri-admin.js — Kelola galeri
   Upload foto → Cloudinary (simpel, tanpa rules)
   Simpan data → Firebase Realtime Database
   ============================================== */

import { auth, db }                              from './firebase.js';
import { onAuthStateChanged, signOut }           from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import { ref, push, onValue, remove, update }    from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js';

const EMAIL_ADMIN      = 'emailadmin@gmail.com';  // ← GANTI INI
const CLOUDINARY_URL   = 'https://api.cloudinary.com/v1_1/dhi4xmvsr/image/upload';
const CLOUDINARY_PRESET = 'penjahit-bintang';


/* ── INISIALISASI ── */
function initGaleriAdmin() {
  onAuthStateChanged(auth, function(user) {
    if (!user) { window.location.href = 'auth.html'; return; }

    if (user.email.toLowerCase() !== EMAIL_ADMIN.toLowerCase()) {
      window.location.href = 'index.html';
      return;
    }

    var elEmail = document.getElementById('emailAdmin');
    if (elEmail) elEmail.textContent = user.email;

    initFormUpload();
    muatGaleriAdmin();
  });
}


/* ── FORM UPLOAD ── */
function initFormUpload() {
  var form        = document.getElementById('formUpload');
  var inputFoto   = document.getElementById('inputFoto');
  var previewWrap = document.getElementById('previewWrap');
  var previewImg  = document.getElementById('previewImg');
  var dropPlaceholder = document.getElementById('dropPlaceholder');

  if (!form) return;

  // Preview foto sebelum upload
  inputFoto && inputFoto.addEventListener('change', function() {
    var file = this.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      tampilNotif('File harus berupa gambar!', 'error');
      this.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      tampilNotif('Ukuran foto maksimal 5MB!', 'error');
      this.value = '';
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      if (previewImg)      previewImg.src            = e.target.result;
      if (previewWrap)     previewWrap.style.display  = 'block';
      if (dropPlaceholder) dropPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  // Submit upload
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    var file     = inputFoto && inputFoto.files[0];
    var nama     = document.getElementById('uploadNama').value.trim();
    var kategori = document.getElementById('uploadKategori').value;
    var badge    = document.getElementById('uploadBadge').value;

    if (!file) {
      tampilNotif('Pilih foto terlebih dahulu!', 'error');
      return;
    }
    if (!nama || !kategori) {
      tampilNotif('Nama dan kategori wajib diisi!', 'error');
      return;
    }

    setLoadingUpload(true);
    updateProgress(0);

    try {
      // ── Upload ke Cloudinary pakai FormData ──
      var formData = new FormData();
      formData.append('file',           file);
      formData.append('upload_preset',  CLOUDINARY_PRESET);
      formData.append('folder',         'penjahit-bintang/galeri');

      // Pakai XHR supaya bisa pantau progress
      var fotoUrl = await uploadKeCloudinary(formData);

      // ── Simpan data ke Firebase ──
      await push(ref(db, 'galeri'), {
        nama:      nama,
        kategori:  kategori,
        badge:     badge || null,
        fotoUrl:   fotoUrl,
        createdAt: Date.now()
      });

      setLoadingUpload(false);
      resetForm(form, previewWrap, dropPlaceholder);
      tampilNotif('Foto berhasil diupload! 🎉', 'sukses');

    } catch (err) {
      setLoadingUpload(false);
      tampilNotif('Gagal upload: ' + err.message, 'error');
    }
  });
}


/* ── UPLOAD KE CLOUDINARY ── */
function uploadKeCloudinary(formData) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();

    // Pantau progress
    xhr.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable) {
        var pct = Math.round((e.loaded / e.total) * 100);
        updateProgress(pct);
      }
    });

    xhr.addEventListener('load', function() {
      if (xhr.status === 200) {
        var result = JSON.parse(xhr.responseText);
        resolve(result.secure_url);
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


/* ── MUAT GALERI ADMIN ── */
function muatGaleriAdmin() {
  var container = document.getElementById('gridGaleriAdmin');
  var loading   = document.getElementById('loadingGaleri');
  var kosong    = document.getElementById('galeriKosong');

  onValue(ref(db, 'galeri'), function(snapshot) {
    if (loading) loading.style.display = 'none';

    if (!snapshot.exists()) {
      if (kosong)    kosong.style.display    = 'flex';
      if (container) container.innerHTML     = '';
      setText('totalFoto', 0);
      return;
    }

    if (kosong) kosong.style.display = 'none';

    var items = [];
    snapshot.forEach(function(child) {
      items.push(Object.assign({ id: child.key }, child.val()));
    });
    items.sort(function(a, b) { return b.createdAt - a.createdAt; });

    setText('totalFoto', items.length);

    if (container) {
      container.innerHTML = items.map(function(item) {
        return kartuGaleriAdmin(item);
      }).join('');

      // Event hapus
      container.querySelectorAll('.btn-hapus-foto').forEach(function(btn) {
        btn.addEventListener('click', function() {
          hapusFoto(btn.dataset.id);
        });
      });

      // Event edit badge
      container.querySelectorAll('.btn-edit-badge').forEach(function(btn) {
        btn.addEventListener('click', function() {
          bukaModalBadge(btn.dataset.id, btn.dataset.badge);
        });
      });
    }
  });
}


/* ── KARTU GALERI ADMIN ── */
function kartuGaleriAdmin(item) {
  var badgeHtml = item.badge && item.badge !== 'null'
    ? '<span class="badge-foto badge-' + item.badge + '">' +
      (item.badge === 'baru' ? '✦ Baru' : item.badge === 'terlaris' ? '🔥 Terlaris' : '🏷 Promo') +
      '</span>'
    : '';

  var labelKat = item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1);

  return '<div class="kartu-foto-admin">' +
    '<div class="foto-wrap">' +
      '<img src="' + item.fotoUrl + '" alt="' + item.nama + '" loading="lazy" />' +
      badgeHtml +
    '</div>' +
    '<div class="foto-info">' +
      '<p class="foto-nama">' + item.nama + '</p>' +
      '<span class="foto-kat">' + labelKat + '</span>' +
    '</div>' +
    '<div class="foto-aksi">' +
      '<button class="btn-edit-badge" data-id="' + item.id + '" data-badge="' + (item.badge || '') + '">Edit Badge</button>' +
      '<button class="btn-hapus-foto" data-id="' + item.id + '">Hapus</button>' +
    '</div>' +
  '</div>';
}


/* ── HAPUS FOTO ── */
async function hapusFoto(id) {
  if (!confirm('Yakin mau hapus foto ini?')) return;
  try {
    await remove(ref(db, 'galeri/' + id));
    tampilNotif('Foto berhasil dihapus!', 'sukses');
  } catch (err) {
    tampilNotif('Gagal hapus: ' + err.message, 'error');
  }
}


/* ── MODAL EDIT BADGE ── */
function bukaModalBadge(id, badgeSaat) {
  var modal     = document.getElementById('modalBadge');
  var select    = document.getElementById('selectBadge');
  var btnSimpan = document.getElementById('btnSimpanBadge');
  var btnTutup  = modal && modal.querySelector('.modal-tutup');
  var backdrop  = modal && modal.querySelector('.modal-backdrop');

  if (!modal) return;

  if (select) select.value = badgeSaat || '';
  modal.style.display = 'flex';

  function tutup() { modal.style.display = 'none'; }
  if (btnTutup) btnTutup.onclick = tutup;
  if (backdrop) backdrop.onclick = tutup;

  if (btnSimpan) {
    btnSimpan.onclick = async function() {
      var badgeBaru = select ? select.value : '';
      await update(ref(db, 'galeri/' + id), { badge: badgeBaru || null });
      tampilNotif('Badge diupdate!', 'sukses');
      tutup();
    };
  }
}


/* ── HELPER ── */
function setLoadingUpload(loading) {
  var btn      = document.getElementById('btnUpload');
  var teks     = document.getElementById('btnUploadTeks');
  var progress = document.getElementById('progressWrap');
  if (btn)     btn.disabled      = loading;
  if (teks)    teks.textContent  = loading ? 'Mengupload...' : 'Upload Foto';
  if (progress) progress.style.display = loading ? 'block' : 'none';
}

function updateProgress(pct) {
  var bar  = document.getElementById('progressBar');
  var teks = document.getElementById('progressTeks');
  if (bar)  bar.style.width   = pct + '%';
  if (teks) teks.textContent  = pct + '%';
}

function resetForm(form, previewWrap, dropPlaceholder) {
  form.reset();
  if (previewWrap)     previewWrap.style.display     = 'none';
  if (dropPlaceholder) dropPlaceholder.style.display = 'block';
  updateProgress(0);
}

function tampilNotif(pesan, tipe) {
  var el = document.getElementById('uploadNotif');
  if (!el) return;
  el.textContent   = pesan;
  el.className     = 'auth-pesan ' + tipe;
  el.style.display = 'block';
  setTimeout(function() { el.style.display = 'none'; }, 4000);
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

export { initGaleriAdmin };
