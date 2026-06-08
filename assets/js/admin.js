/* ==============================================
   admin.js — Dashboard admin
   WAJIB GANTI:
   1. EMAIL_ADMIN → email yang kamu pakai login
   2. URL notif WA → URL Netlify websitemu
   ============================================== */

const EMAIL_ADMIN = 'penjahitbintang@gmail.com'; // ← GANTI INI


/* ── INISIALISASI ── */
function initAdmin() {
  db.auth.getSession().then(async function(result) {
    var data = result.data;

    if (!data.session) {
      window.location.href = 'auth.html';
      return;
    }

    var email = data.session.user.email;

    if (email.toLowerCase() !== EMAIL_ADMIN.toLowerCase()) {
      document.body.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;' +
        'min-height:100vh;font-family:sans-serif;flex-direction:column;gap:1rem;background:#f4f4f0">' +
        '<p style="font-size:3rem">🚫</p>' +
        '<p style="font-weight:700;font-size:1.1rem">Akses ditolak. Halaman ini hanya untuk admin.</p>' +
        '<a href="index.html" style="color:#c9a84c;font-weight:600">← Kembali ke website</a>' +
        '</div>';
      return;
    }

    var elEmail = document.getElementById('emailAdmin');
    if (elEmail) elEmail.textContent = email;

    await muatSemuaPesanan();
    await muatStatistik();

    db.channel('admin-pesanan')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'pesanan'
      }, async function() {
        await muatSemuaPesanan();
        await muatStatistik();
      })
      .subscribe();

    var filterBtns = document.querySelectorAll('.filter-status');
    filterBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        filterBtns.forEach(function(b) { b.classList.remove('aktif'); });
        btn.classList.add('aktif');
        var status = btn.dataset.status;
        muatSemuaPesanan(status && status !== '' ? status : null);
      });
    });
  });
}


/* ── MUAT SEMUA PESANAN ── */
async function muatSemuaPesanan(filterStatus) {
  filterStatus = filterStatus || null;

  var container = document.getElementById('tabelPesanan');
  if (!container) return;

  container.innerHTML = '<tr><td colspan="7" class="loading-td">⏳ Memuat data...</td></tr>';

  var query = db
    .from('pesanan')
    .select('*, profiles(nama, no_hp)')
    .order('created_at', { ascending: false });

  if (filterStatus) {
    query = query.eq('status', filterStatus);
  }

  var result = await query;
  var pesanan = result.data;
  var error   = result.error;

  if (error) {
    console.error('Error muat pesanan:', error.message, error.code);
    container.innerHTML =
      '<tr><td colspan="7" class="loading-td" style="color:#dc2626">' +
      '❌ Gagal muat data: ' + error.message +
      '</td></tr>';
    return;
  }

  if (!pesanan || pesanan.length === 0) {
    container.innerHTML = '<tr><td colspan="7" class="loading-td">📭 Belum ada pesanan masuk.</td></tr>';
    return;
  }

  container.innerHTML = pesanan.map(function(p) { return buatBarisAdmin(p); }).join('');

  container.querySelectorAll('.btn-update-status').forEach(function(btn) {
    btn.addEventListener('click', function() {
      bukaModalUpdate(btn.dataset.id, btn.dataset.status);
    });
  });
}


/* ── BUAT SATU BARIS TABEL ── */
function buatBarisAdmin(p) {
  var info  = infoStatus(p.status);
  var label = info.label;
  var warna = info.warna;
  var icon  = info.icon;

  var tgl = new Date(p.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  var nama = (p.profiles && p.profiles.nama) ? p.profiles.nama : '—';
  var hp   = (p.profiles && p.profiles.no_hp) ? p.profiles.no_hp : '';

  return '<tr>' +
    '<td class="td-nomor">' + p.nomor_order + '</td>' +
    '<td>' + nama + '<br/><small style="color:#6b6b6b">' + hp + '</small></td>' +
    '<td>' + p.layanan + '</td>' +
    '<td><small>' + (p.deskripsi || '—') + '</small></td>' +
    '<td><span class="status-badge-sm" style="background:' + warna + '">' + icon + ' ' + label + '</span></td>' +
    '<td><small>' + tgl + '</small></td>' +
    '<td><button class="btn-update-status" data-id="' + p.id + '" data-status="' + p.status + '">Update</button></td>' +
    '</tr>';
}


/* ── MODAL UPDATE STATUS ── */
function bukaModalUpdate(id, statusSaat) {
  var modal = document.getElementById('modalUpdate');
  if (!modal) return;

  var select    = document.getElementById('selectStatus');
  var catatan   = document.getElementById('catatanAdmin');
  var estimasi  = document.getElementById('estimasiAdmin');
  var btnSimpan = document.getElementById('btnSimpanStatus');
  var btnTutup  = modal.querySelector('.modal-tutup');
  var backdrop  = modal.querySelector('.modal-backdrop');

  if (select)   select.value   = statusSaat;
  if (catatan)  catatan.value  = '';
  if (estimasi) estimasi.value = '';

  modal.style.display = 'flex';

  function tutupModal() {
    modal.style.display = 'none';
  }

  if (btnTutup)  btnTutup.onclick  = tutupModal;
  if (backdrop)  backdrop.onclick  = tutupModal;

  if (btnSimpan) {
    btnSimpan.onclick = async function() {
      var statusBaru  = select  ? select.value         : statusSaat;
      var catatanVal  = catatan ? catatan.value.trim()  : '';
      var estimasiVal = estimasi ? estimasi.value       : '';

      btnSimpan.textContent = 'Menyimpan...';
      btnSimpan.disabled    = true;

      await updateStatusPesanan(id, statusBaru, catatanVal, estimasiVal);

      btnSimpan.textContent = 'Simpan & Kirim Notif WA';
      btnSimpan.disabled    = false;
      tutupModal();
    };
  }
}


/* ── UPDATE STATUS KE DATABASE ── */
async function updateStatusPesanan(id, status, catatan, estimasi) {
  var payload = { status: status };
  if (catatan)  payload.catatan_admin    = catatan;
  if (estimasi) payload.estimasi_selesai = estimasi;

  var result = await db.from('pesanan').update(payload).eq('id', id);

  if (result.error) {
    alert('Gagal update status: ' + result.error.message);
    return;
  }

  await kirimNotifWA(id, status);
  await muatSemuaPesanan();
  await muatStatistik();
}


/* ── KIRIM NOTIFIKASI WA KE PELANGGAN ── */
async function kirimNotifWA(pesananId, statusBaru) {
  var result = await db
    .from('pesanan')
    .select('nomor_order, profiles(nama, no_hp)')
    .eq('id', pesananId)
    .maybeSingle();

  var p     = result.data;
  var error = result.error;

  if (error || !p || !p.profiles || !p.profiles.no_hp) {
    console.warn('Tidak bisa kirim notif WA:', error ? error.message : 'data tidak lengkap');
    return;
  }

  var info  = infoStatus(statusBaru);
  var noHp  = p.profiles.no_hp.replace(/[^0-9]/g, '');
  var nama  = p.profiles.nama;
  var nomor = p.nomor_order;

  var pesan =
    'Halo ' + nama + '! 👋\n\n' +
    'Update pesanan Anda di Penjahit Bintang:\n\n' +
    '📋 No. Order: *' + nomor + '*\n' +
    info.icon + ' Status: *' + info.label + '*\n\n' +
    'Pantau pesanan di:\n' +
    'https://penjahitbintang.vercel.app/status.html\n\n' + // ← GANTI URL
    'Terima kasih sudah mempercayai kami! 🙏';

  window.open(
    'https://wa.me/' + noHp + '?text=' + encodeURIComponent(pesan),
    '_blank',
    'noopener'
  );
}


/* ── STATISTIK RINGKASAN ── */
async function muatStatistik() {
  var result = await db.from('pesanan').select('status');
  var data   = result.data;

  if (!data) return;

  setText('statTotal',    data.length);
  setText('statMenunggu', data.filter(function(p) { return p.status === 'menunggu_konfirmasi'; }).length);
  setText('statDiproses', data.filter(function(p) { return p.status === 'diproses'; }).length);
  setText('statSelesai',  data.filter(function(p) { return p.status === 'selesai' || p.status === 'diambil'; }).length);
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}


/* ── INFO STATUS ── */
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
