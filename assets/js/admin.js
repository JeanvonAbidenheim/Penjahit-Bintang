/* ==============================================
   admin.js — Dashboard admin
   WAJIB GANTI: EMAIL_ADMIN dengan emailmu
   ============================================== */

import { auth, db }                             from './firebase.js';
import { onAuthStateChanged, signOut }          from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import { ref, onValue, get, update }            from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js';
import { Icons }                                from './icons.js';

const EMAIL_ADMIN = 'penjahitbintangnia@gmail.com'; // ← GANTI INI


function initAdmin() {
  onAuthStateChanged(auth, async function(user) {

    // Belum login
    if (!user) {
      window.location.href = 'auth.html';
      return;
    }

    // Bukan admin
    var emailUser  = (user.email || '').toLowerCase().trim();
    var emailAdmin = EMAIL_ADMIN.toLowerCase().trim();

    if (emailUser !== emailAdmin) {
      console.warn('Akses ditolak. Email login:', emailUser, '| Email admin terdaftar:', emailAdmin);
      document.body.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;' +
        'min-height:100vh;font-family:sans-serif;flex-direction:column;gap:1rem;background:#f4f4f0">' +
        '<p style="font-size:3rem">🚫</p>' +
        '<p style="font-weight:700">Akses ditolak. Halaman ini hanya untuk admin.</p>' +
        '<p style="font-size:0.85rem;color:#888">Login sebagai: ' + emailUser + '</p>' +
        '<a href="auth.html" style="color:#c9a84c;font-weight:600">← Login dengan akun lain</a>' +
        '<a href="index.html" style="color:#888;font-size:0.85rem">Kembali ke website</a>' +
        '</div>';
      return;
    }

    // Tampil email admin
    var elEmail = document.getElementById('emailAdmin');
    if (elEmail) elEmail.textContent = user.email;

    // Pantau semua pesanan secara realtime
    onValue(ref(db, 'pesanan'), async function(snapshot) {
      await renderTabelAdmin(snapshot);
      hitungStatistik(snapshot);
    });

    // Filter tombol
    document.querySelectorAll('.filter-status').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-status').forEach(function(b) {
          b.classList.remove('aktif');
        });
        btn.classList.add('aktif');
      });
    });
  });
}


/* ── RENDER TABEL ADMIN ── */
async function renderTabelAdmin(snapshot) {
  var container = document.getElementById('tabelPesanan');
  if (!container) return;

  if (!snapshot.exists()) {
    container.innerHTML = '<tr><td colspan="7" class="loading-td">' + Icons.email + ' Belum ada pesanan masuk.</td></tr>';
    return;
  }

  // Ambil semua pesanan + data user sekaligus
  var pesanan = [];
  var promises = [];

  snapshot.forEach(function(child) {
    var p = Object.assign({ id: child.key }, child.val());
    pesanan.push(p);
    // Ambil nama & HP user untuk tiap pesanan
    promises.push(
      get(ref(db, 'users/' + p.userId)).then(function(snap) {
        if (snap.exists()) {
          p.namaUser = snap.val().nama;
          p.hpUser   = snap.val().no_hp;
        }
      })
    );
  });

  await Promise.all(promises);

  // Urutkan terbaru dulu
  pesanan.sort(function(a, b) { return b.createdAt - a.createdAt; });

  container.innerHTML = pesanan.map(function(p) { return buatBarisAdmin(p); }).join('');

  // Event tombol update
  container.querySelectorAll('.btn-update-status').forEach(function(btn) {
    btn.addEventListener('click', function() {
      bukaModal(btn.dataset.id, btn.dataset.status, btn.dataset.hp, btn.dataset.nama, btn.dataset.nomor);
    });
  });
}


/* ── BUAT BARIS TABEL ── */
function buatBarisAdmin(p) {
  var info = infoStatus(p.status);
  var tgl  = new Date(p.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return '<tr>' +
    '<td class="td-nomor">' + p.nomorOrder + '</td>' +
    '<td>' + (p.namaUser || '—') + '<br/><small style="color:#6b6b6b">' + (p.hpUser || '') + '</small></td>' +
    '<td>' + p.layanan + '</td>' +
    '<td><small>' + (p.deskripsi || '—') + '</small></td>' +
    '<td><span class="status-badge-sm" style="background:' + info.warna + '">' + info.icon + ' ' + info.label + '</span></td>' +
    '<td><small>' + tgl + '</small></td>' +
    '<td><button class="btn-update-status" ' +
      'data-id="'    + p.id        + '" ' +
      'data-status="'+ p.status    + '" ' +
      'data-hp="'    + (p.hpUser  || '') + '" ' +
      'data-nama="'  + (p.namaUser|| '') + '" ' +
      'data-nomor="' + p.nomorOrder+ '">' +
      'Update' +
    '</button></td>' +
    '</tr>';
}


/* ── MODAL UPDATE STATUS ── */
function bukaModal(id, statusSaat, hp, nama, nomor) {
  var modal    = document.getElementById('modalUpdate');
  var select   = document.getElementById('selectStatus');
  var catatan  = document.getElementById('catatanAdmin');
  var estimasi = document.getElementById('estimasiAdmin');
  var btnSimpan = document.getElementById('btnSimpanStatus');
  var btnTutup  = modal.querySelector('.modal-tutup');
  var backdrop  = modal.querySelector('.modal-backdrop');

  if (select)   select.value   = statusSaat;
  if (catatan)  catatan.value  = '';
  if (estimasi) estimasi.value = '';

  modal.style.display = 'flex';

  // Update label & hint sesuai status yang dipilih
  function updateLabelCatatan() {
    var label = document.getElementById('labelCatatan');
    var hint  = document.getElementById('hintDitolak');
    var aktif = select ? select.value : statusSaat;

    if (aktif === 'ditolak') {
      if (label) label.textContent = 'Alasan Penolakan *';
      if (hint)  hint.style.display = 'block';
      if (catatan) catatan.placeholder = 'Contoh: Detail ukuran tidak lengkap, mohon hubungi kami kembali.';
    } else {
      if (label) label.textContent = 'Catatan untuk Pelanggan (opsional)';
      if (hint)  hint.style.display = 'none';
      if (catatan) catatan.placeholder = 'Contoh: Bahan sedang kami potong, estimasi 3 hari lagi.';
    }
  }

  updateLabelCatatan();
  if (select) select.onchange = updateLabelCatatan;

  function tutup() { modal.style.display = 'none'; }
  if (btnTutup) btnTutup.onclick = tutup;
  if (backdrop) backdrop.onclick = tutup;

  if (btnSimpan) {
    btnSimpan.onclick = async function() {
      var statusBaru  = select   ? select.value        : statusSaat;
      var catatanVal  = catatan  ? catatan.value.trim() : '';
      var estimasiVal = estimasi ? estimasi.value       : '';

      // Wajib isi alasan kalau pesanan ditolak
      if (statusBaru === 'ditolak' && !catatanVal) {
        alert('Mohon isi alasan penolakan di kolom "Catatan untuk Pelanggan" sebelum menyimpan.');
        catatan && catatan.focus();
        return;
      }

      // Konfirmasi tambahan untuk penolakan — mencegah klik tidak sengaja
      if (statusBaru === 'ditolak') {
        var yakin = confirm(
          'Yakin ingin MENOLAK pesanan ' + nomor + ' atas nama ' + nama + '?\n\n' +
          'Alasan: ' + catatanVal + '\n\n' +
          'Pelanggan akan menerima notifikasi penolakan via WhatsApp.'
        );
        if (!yakin) return;
      }

      btnSimpan.textContent = 'Menyimpan...';
      btnSimpan.disabled    = true;

      await simpanUpdate(id, statusBaru, catatanVal, estimasiVal, hp, nama, nomor);

      btnSimpan.textContent = 'Simpan & Kirim Notif WA';
      btnSimpan.disabled    = false;
      tutup();
    };
  }
}


/* ── SIMPAN UPDATE STATUS ── */
async function simpanUpdate(id, status, catatan, estimasi, hp, nama, nomor) {
  var payload = {
    status:    status,
    updatedAt: Date.now()
  };
  if (catatan)  payload.catatanAdmin   = catatan;
  if (estimasi) payload.estimasiAmbil  = estimasi;

  try {
    await update(ref(db, 'pesanan/' + id), payload);
    kirimNotifWA(hp, nama, nomor, status, catatan);
  } catch (err) {
    alert('Gagal update: ' + err.message);
  }
}


/* ── KIRIM NOTIF WA ── */
function kirimNotifWA(hp, nama, nomor, status, catatan) {
  if (!hp) return;

  var info  = infoStatus(status);
  var noHp  = hp.replace(/[^0-9]/g, '');
  var pesan;

  if (status === 'ditolak') {
    // Pesan khusus untuk penolakan — lebih sopan & sertakan alasan
    pesan =
      'Halo ' + nama + ', 🙏\n\n' +
      'Mohon maaf, pesanan Anda di Penjahit Bintang belum dapat kami proses:\n\n' +
      '📋 No. Order: *' + nomor + '*\n' +
      '✕ Status: *Ditolak*\n\n' +
      (catatan ? 'Alasan: ' + catatan + '\n\n' : '') +
      'Anda dapat menghubungi kami untuk informasi lebih lanjut atau membuat pesanan baru dengan detail yang sesuai.\n\n' +
      'Terima kasih atas pengertiannya. 🙏';
  } else {
    pesan =
      'Halo ' + nama + '! 👋\n\n' +
      'Update pesanan Anda di Penjahit Bintang:\n\n' +
      '📋 No. Order: *' + nomor + '*\n' +
      info.ikonWA + ' Status: *' + info.label + '*\n\n' +
      'Pantau pesanan di:\n' +
      'https://penjahit-bintang.vercel.app/status.html\n\n' + // ← GANTI URL
      'Terima kasih! 🙏';
  }

  window.open(
    'https://wa.me/' + noHp + '?text=' + encodeURIComponent(pesan),
    '_blank', 'noopener'
  );
}


/* ── STATISTIK ── */
function hitungStatistik(snapshot) {
  if (!snapshot.exists()) return;

  var total = 0, menunggu = 0, diproses = 0, selesai = 0, ditolak = 0;

  snapshot.forEach(function(child) {
    var s = child.val().status;
    total++;
    if (s === 'menunggu_konfirmasi') menunggu++;
    if (s === 'diproses')            diproses++;
    if (s === 'selesai' || s === 'diambil') selesai++;
    if (s === 'ditolak') ditolak++;
  });

  setText('statTotal',    total);
  setText('statMenunggu', menunggu);
  setText('statDiproses', diproses);
  setText('statSelesai',  selesai);
  setText('statDitolak',  ditolak);
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}


/* ── INFO STATUS ── */
function infoStatus(status) {
  var map = {
    'menunggu_konfirmasi': { label: 'Menunggu Konfirmasi', warna: '#f59e0b', icon: Icons.loading, ikonWA: '⏳' },
    'dikonfirmasi':        { label: 'Dikonfirmasi',         warna: '#3b82f6', icon: Icons.cek,    ikonWA: '✅' },
    'diproses':            { label: 'Sedang Diproses',      warna: '#8b5cf6', icon: Icons.jahit,  ikonWA: '🧵' },
    'selesai':             { label: 'Selesai',               warna: '#10b981', icon: Icons.sukses, ikonWA: '🎉' },
    'diambil':             { label: 'Sudah Diambil',         warna: '#6b7280', icon: Icons.paket,  ikonWA: '📦' },
    'ditolak':             { label: 'Ditolak',               warna: '#ef4444', icon: Icons.tolak,  ikonWA: '✕'  }
  };
  return map[status] || { label: status, warna: '#6b7280', icon: Icons.tanya, ikonWA: '❓' };
}


/* ── LOGOUT ── */
async function logout() {
  await signOut(auth);
  window.location.href = 'index.html';
}

export { initAdmin, logout };
