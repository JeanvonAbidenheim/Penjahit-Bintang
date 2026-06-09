/* ==============================================
   pesan.js — Buat pesanan baru
   ============================================== */

import { auth, db }                             from './firebase.js';
import { onAuthStateChanged }                   from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import { ref, push, get }                       from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js';


function initHalamanPesan() {
  onAuthStateChanged(auth, async function(user) {
    if (!user) {
      window.location.href = 'auth.html';
      return;
    }

    // Ambil nama user
    var snap = await get(ref(db, 'users/' + user.uid));
    if (snap.exists()) {
      var profil = snap.val();
      var elNama = document.getElementById('namaUser');
      if (elNama) elNama.textContent = profil.nama;
    }

    initFormPesan(user);
  });
}


function initFormPesan(user) {
  var form = document.getElementById('formPesan');
  if (!form) return;

  // Set minimal tanggal ambil = 3 hari dari sekarang
  var inputTgl = document.getElementById('estimasiAmbil');
  if (inputTgl) {
    var besok = new Date();
    besok.setDate(besok.getDate() + 3);
    inputTgl.min = besok.toISOString().split('T')[0];
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    var layanan   = document.getElementById('layanan').value;
    var deskripsi = document.getElementById('deskripsi').value.trim();
    var ambil     = document.getElementById('estimasiAmbil').value;

    if (!layanan || !deskripsi) {
      tampilNotif('Pilih layanan dan isi deskripsi!', 'error');
      return;
    }

    setLoading(true);

    var nomorOrder = buatNomorOrder();

    try {
      await push(ref(db, 'pesanan'), {
        nomorOrder:      nomorOrder,
        userId:          user.uid,
        layanan:         layanan,
        deskripsi:       deskripsi,
        estimasiAmbil:   ambil || null,
        status:          'menunggu_konfirmasi',
        catatanAdmin:    null,
        createdAt:       Date.now(),
        updatedAt:       Date.now()
      });

      setLoading(false);
      tampilSukses(nomorOrder);

    } catch (err) {
      setLoading(false);
      tampilNotif('Gagal membuat pesanan: ' + err.message, 'error');
    }
  });
}


function buatNomorOrder() {
  var now  = new Date();
  var tgl  = now.toISOString().slice(0, 10).replace(/-/g, '');
  var acak = Math.random().toString(36).slice(2, 6).toUpperCase();
  return 'PB-' + tgl + '-' + acak;
}

function tampilSukses(nomorOrder) {
  var formWrap = document.getElementById('formWrap');
  var sukses   = document.getElementById('pesanSukses');
  var elNomor  = document.getElementById('nomorOrderSukses');
  if (formWrap) formWrap.style.display = 'none';
  if (sukses)   sukses.style.display   = 'flex';
  if (elNomor)  elNomor.textContent    = nomorOrder;
}

function setLoading(loading) {
  var btn  = document.querySelector('#formPesan button[type="submit"]');
  var teks = document.querySelector('#formPesan .btn-teks');
  if (!btn) return;
  btn.disabled = loading;
  if (teks) teks.textContent = loading ? 'Memproses...' : 'Buat Pesanan';
}

function tampilNotif(pesan, tipe) {
  var el = document.getElementById('pesanNotif');
  if (!el) return;
  el.textContent   = pesan;
  el.className     = 'auth-pesan ' + tipe;
  el.style.display = 'block';
  setTimeout(function() { el.style.display = 'none'; }, 4000);
}

export { initHalamanPesan };
