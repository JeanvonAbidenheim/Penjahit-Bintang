/* ==============================================
   status.js — Cek status pesanan realtime
   ============================================== */

import { auth, db }                             from './firebase.js';
import { onAuthStateChanged }                   from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import { ref, get, onValue, query,
         orderByChild, equalTo }                from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js';


function initHalamanStatus() {
  onAuthStateChanged(auth, async function(user) {
    if (!user) {
      window.location.href = 'auth.html';
      return;
    }

    // Ambil nama user
    var snap = await get(ref(db, 'users/' + user.uid));
    if (snap.exists()) {
      var elNama = document.getElementById('namaUser');
      if (elNama) elNama.textContent = snap.val().nama;
    }

    // Pantau pesanan user ini secara realtime
    var pesananQuery = query(
      ref(db, 'pesanan'),
      orderByChild('userId'),
      equalTo(user.uid)
    );

    onValue(pesananQuery, function(snapshot) {
      renderPesanan(snapshot);
    });
  });
}


function renderPesanan(snapshot) {
  var container = document.getElementById('daftarPesanan');
  var loading   = document.getElementById('loadingPesanan');
  var kosong    = document.getElementById('pesananKosong');

  if (loading) loading.style.display = 'none';

  if (!snapshot.exists()) {
    if (kosong)    kosong.style.display    = 'flex';
    if (container) container.innerHTML     = '';
    return;
  }

  if (kosong) kosong.style.display = 'none';

  // Ubah snapshot jadi array dan urutkan terbaru dulu
  var pesanan = [];
  snapshot.forEach(function(child) {
    pesanan.push(Object.assign({ id: child.key }, child.val()));
  });
  pesanan.sort(function(a, b) { return b.createdAt - a.createdAt; });

  if (container) {
    container.innerHTML = pesanan.map(function(p) { return kartuPesanan(p); }).join('');
  }
}


function kartuPesanan(p) {
  var info       = infoStatus(p.status);
  var tglPesan   = formatTanggal(p.createdAt);
  var tglEstimasi = p.estimasiAmbil ? p.estimasiAmbil : 'Belum ditentukan';

  return '<div class="kartu-pesanan">' +
    '<div class="kartu-header">' +
      '<div>' +
        '<p class="kartu-nomor">' + p.nomorOrder + '</p>' +
        '<p class="kartu-tgl">Dipesan: ' + tglPesan + '</p>' +
      '</div>' +
      '<span class="status-badge" style="background:' + info.warna + '">' +
        info.icon + ' ' + info.label +
      '</span>' +
    '</div>' +
    '<div class="kartu-body">' +
      '<div class="kartu-info-row">' +
        '<span class="kartu-label">Layanan</span>' +
        '<span class="kartu-val">' + p.layanan + '</span>' +
      '</div>' +
      '<div class="kartu-info-row">' +
        '<span class="kartu-label">Deskripsi</span>' +
        '<span class="kartu-val">' + (p.deskripsi || '—') + '</span>' +
      '</div>' +
      '<div class="kartu-info-row">' +
        '<span class="kartu-label">Estimasi Ambil</span>' +
        '<span class="kartu-val">' + tglEstimasi + '</span>' +
      '</div>' +
      (p.catatanAdmin ? '<div class="kartu-info-row catatan ' + (p.status === 'ditolak' ? 'catatan-tolak' : '') + '">' +
        '<span class="kartu-label">' + (p.status === 'ditolak' ? 'Alasan Penolakan' : 'Catatan Admin') + '</span>' +
        '<span class="kartu-val">' + p.catatanAdmin + '</span>' +
      '</div>' : '') +
    '</div>' +
    '<div class="kartu-progress">' + progressBar(p.status) + '</div>' +
  '</div>';
}


function progressBar(statusAktif) {
  // Kalau pesanan ditolak, tampilkan progress bar khusus
  // (bukan progress bar normal 5 tahap)
  if (statusAktif === 'ditolak') {
    return '<div class="progress-wrap progress-ditolak">' +
      '<div class="progress-step aktif sekarang ditolak">' +
        '<div class="progress-dot">✕</div>' +
        '<p class="progress-label">Pesanan Ditolak</p>' +
      '</div>' +
    '</div>';
  }

  var tahapan = [
    { key: 'menunggu_konfirmasi', label: 'Menunggu' },
    { key: 'dikonfirmasi',        label: 'Dikonfirmasi' },
    { key: 'diproses',            label: 'Diproses' },
    { key: 'selesai',             label: 'Selesai' },
    { key: 'diambil',             label: 'Diambil' }
  ];

  var idxAktif = tahapan.findIndex(function(t) { return t.key === statusAktif; });

  var html = '<div class="progress-wrap">';
  tahapan.forEach(function(t, i) {
    var aktif    = i <= idxAktif ? 'aktif' : '';
    var sekarang = i === idxAktif ? 'sekarang' : '';
    var dotIsi   = i < idxAktif ? '✓' : (i + 1);

    html += '<div class="progress-step ' + aktif + ' ' + sekarang + '">';
    html += '<div class="progress-dot">' + dotIsi + '</div>';
    html += '<p class="progress-label">' + t.label + '</p>';
    html += '</div>';

    if (i < tahapan.length - 1) {
      html += '<div class="progress-line ' + (i < idxAktif ? 'aktif' : '') + '"></div>';
    }
  });
  html += '</div>';
  return html;
}


function infoStatus(status) {
  var map = {
    'menunggu_konfirmasi': { label: 'Menunggu Konfirmasi', warna: '#f59e0b', icon: '⏳' },
    'dikonfirmasi':        { label: 'Dikonfirmasi',         warna: '#3b82f6', icon: '✅' },
    'diproses':            { label: 'Sedang Diproses',      warna: '#8b5cf6', icon: '🧵' },
    'selesai':             { label: 'Selesai',               warna: '#10b981', icon: '🎉' },
    'diambil':             { label: 'Sudah Diambil',         warna: '#6b7280', icon: '📦' },
    'ditolak':             { label: 'Ditolak',               warna: '#ef4444', icon: '✕' }
  };
  return map[status] || { label: status, warna: '#6b7280', icon: '❓' };
}

function formatTanggal(timestamp) {
  return new Date(timestamp).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

export { initHalamanStatus };
