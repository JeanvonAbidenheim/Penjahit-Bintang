import { auth, db }                             from './firebase.js';
import { onAuthStateChanged, signOut }          from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import { ref, onValue, get, update }            from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js';

const EMAIL_ADMIN = 'penjahitbintangnia@gmail.com'; // ← GANTI INI

function initAdmin() {
  onAuthStateChanged(auth, async function(user) {

    // Jika Belum login sesuai Users
    if (!user) {
      window.location.href = 'auth.html';
      return;
    }

    // Jika Bukan admin yang login
    if (user.email.toLowerCase() !== EMAIL_ADMIN.toLowerCase()) {
      document.body.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;' +
        'min-height:100vh;font-family:sans-serif;flex-direction:column;gap:1rem;background:#f4f4f0">' +
        '<p style="font-size:3rem">🚫</p>' +
        '<p style="font-weight:700">Akses ditolak. Halaman ini hanya untuk admin.</p>' +
        '<a href="index.html" style="color:#c9a84c;font-weight:600">← Kembali ke website</a>' +
        '</div>';
      return;
    }

    // Menampilkan email admin
    var elEmail = document.getElementById('emailAdmin');
    if (elEmail) elEmail.textContent = user.email;

    // Memantau semua pesanan secara realtime
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

// RENDER TABEL ADMIN
async function renderTabelAdmin(snapshot) {
  var container = document.getElementById('tabelPesanan');
  if (!container) return;

  if (!snapshot.exists()) {
    container.innerHTML = '<tr><td colspan="7" class="loading-td">📭 Belum ada pesanan masuk.</td></tr>';
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

// BUAT BARIS TABEL 
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

// MODAL UPDATE STATUS 
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

  function tutup() { modal.style.display = 'none'; }
  if (btnTutup) btnTutup.onclick = tutup;
  if (backdrop) backdrop.onclick = tutup;

  if (btnSimpan) {
    btnSimpan.onclick = async function() {
      var statusBaru  = select   ? select.value        : statusSaat;
      var catatanVal  = catatan  ? catatan.value.trim() : '';
      var estimasiVal = estimasi ? estimasi.value       : '';

      btnSimpan.textContent = 'Menyimpan...';
      btnSimpan.disabled    = true;

      await simpanUpdate(id, statusBaru, catatanVal, estimasiVal, hp, nama, nomor);

      btnSimpan.textContent = 'Simpan & Kirim Notif WA';
      btnSimpan.disabled    = false;
      tutup();
    };
  }
}

// SIMPAN UPDATE STATUS JOB
async function simpanUpdate(id, status, catatan, estimasi, hp, nama, nomor) {
  var payload = {
    status:    status,
    updatedAt: Date.now()
  };
  if (catatan)  payload.catatanAdmin   = catatan;
  if (estimasi) payload.estimasiAmbil  = estimasi;

  try {
    await update(ref(db, 'pesanan/' + id), payload);
    kirimNotifWA(hp, nama, nomor, status);
  } catch (err) {
    alert('Gagal update: ' + err.message);
  }
}

// MENGIRIM NOTIFIKASI WA KE PELANGGAN
function kirimNotifWA(hp, nama, nomor, status) {
  if (!hp) return;

  var info  = infoStatus(status);
  var noHp  = hp.replace(/[^0-9]/g, '');

  var pesan =
    'Halo ' + nama + '! 👋🏻 \n\n' +
    'Update pesanan Anda di Penjahit Bintang:\n\n' +
    '📋 No. Order: *' + nomor + '*\n' +
    info.icon + ' Status: *' + info.label + '*\n\n' +
    'Pantau pesanan di:\n' +
    'https://penjahit-bintang.vercel.app/status.html\n\n' + // ← GANTI URL
    'Terima kasih! 🙏';

  window.open(
    'https://wa.me/' + noHp + '?text=' + encodeURIComponent(pesan),
    '_blank', 'noopener'
  );
}

// STATISTIK DATA PESANAN
function hitungStatistik(snapshot) {
  if (!snapshot.exists()) return;

  var total = 0, menunggu = 0, diproses = 0, selesai = 0;

  snapshot.forEach(function(child) {
    var s = child.val().status;
    total++;
    if (s === 'menunggu_konfirmasi') menunggu++;
    if (s === 'diproses')            diproses++;
    if (s === 'selesai' || s === 'diambil') selesai++;
  });

  setText('statTotal',    total);
  setText('statMenunggu', menunggu);
  setText('statDiproses', diproses);
  setText('statSelesai',  selesai);
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

// INFO STATUS PESANAN
function infoStatus(status) {
  var map = {
    'menunggu_konfirmasi': { label: 'Menunggu Konfirmasi', warna: '#f59e0b', icon: '⏳' },
    'dikonfirmasi':        { label: 'Dikonfirmasi',         warna: '#3b82f6', icon: '✅' },
    'diproses':            { label: 'Sedang Diproses',      warna: '#8b5cf6', icon: '🧵' },
    'selesai':             { label: 'Selesai',               warna: '#10b981', icon: '🎉' },
    'diambil':             { label: 'Sudah Diambil',         warna: '#6b7280', icon: '📦' }
  };
  return map[status] || { label: status, warna: '#6b7280', icon: '❓' };
}

// LOGOUT
async function logout() {
  await signOut(auth);
  window.location.href = 'index.html';
}
export { initAdmin, logout };
