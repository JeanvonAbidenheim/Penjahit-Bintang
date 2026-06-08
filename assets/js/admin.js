/* ==============================================
   admin.js — Dashboard admin
   Hanya bisa diakses oleh email admin

   WAJIB GANTI:
   1. EMAIL_ADMIN → email yang kamu pakai login
   2. URL notif WA → URL Netlify websitemu
   ============================================== */

const EMAIL_ADMIN = 'penjahitbintang@gmail.com'; // ← GANTI INI


/* ── INISIALISASI ── */
function initAdmin() {
  db.auth.getSession().then(async ({ data }) => {

    // Belum login → ke halaman auth
    if (!data.session) {
      window.location.href = 'auth.html';
      return;
    }

    const email = data.session.user.email;

    // Bukan admin → tolak akses
    if (email.toLowerCase() !== EMAIL_ADMIN.toLowerCase()) {
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;
          min-height:100vh;font-family:sans-serif;flex-direction:column;gap:1rem;
          background:#f4f4f0">
          <p style="font-size:3rem">🚫</p>
          <p style="font-weight:700;font-size:1.1rem">Akses ditolak. Halaman ini hanya untuk admin.</p>
          <a href="index.html" style="color:#c9a84c;font-weight:600">← Kembali ke website</a>
        </div>`;
      return;
    }

    // Tampil email admin di navbar
    const elEmail = document.getElementById('emailAdmin');
    if (elEmail) elEmail.textContent = email;

    // Muat data
    await muatSemuaPesanan();
    await muatStatistik();

    // Realtime: auto refresh saat ada perubahan pesanan
    db.channel('admin-pesanan')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'pesanan'
      }, async () => {
        await muatSemuaPesanan();
        await muatStatistik();
      })
      .subscribe();

    // Filter tombol status
    document.querySelectorAll('.filter-status').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-status')
          .forEach(b => b.classList.remove('aktif'));
        this.classList.add('aktif');
        // dataset.status kosong = tampil semua
        muatSemuaPesanan(this.dataset.status || null);
      });
    });

  });
}


/* ── MUAT SEMUA PESANAN ── */
async function muatSemuaPesanan(filterStatus = null) {
  const container = document.getElementById('tabelPesanan');
  if (!container) return;

  container.innerHTML = '<tr><td colspan="7" class="loading-td">⏳ Memuat data...</td></tr>';

  // Bangun query
  let query = db
    .from('pesanan')
    .select('*, profiles(nama, no_hp)')
    .order('created_at', { ascending: false });

  // Filter status hanya kalau ada nilainya
  if (filterStatus && filterStatus.trim() !== '') {
    query = query.eq('status', filterStatus);
  }

  const { data: pesanan, error } = await query;

  // Tangani error dengan pesan jelas
  if (error) {
    console.error('Supabase error:', error.message, error.code);
    container.innerHTML = `
      <tr><td colspan="7" class="loading-td" style="color:#dc2626">
        ❌ Gagal muat data: ${error.message}
        <br/><small>Cek Console untuk detail, atau refresh halaman.</small>
      </td></tr>`;
    return;
  }

  // Tidak ada pesanan
  if (!pesanan || pesanan.length === 0) {
    container.innerHTML = '<tr><td colspan="7" class="loading-td">📭 Belum ada pesanan masuk.</td></tr>';
    return;
  }

  // Render baris tabel
  container.innerHTML = pesanan.map(p => buatBarisAdmin(p)).join('');

  // Pasang event tombol update status
  container.querySelectorAll('.btn-update-status').forEach(btn => {
    btn.addEventListener('click', () => {
      bukaModalUpdate(btn.dataset.id, btn.dataset.status);
    });
  });
}


/* ── BUAT SATU BARIS TABEL ── */
function buatBarisAdmin(p) {
  const { label, warna, icon } = infoStatus(p.status);
  const tgl = new Date(p.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
  const nama = p.profiles?.nama || '—';
  const hp   = p.profiles?.no_hp || '';

  return `
    <tr>
      <td class="td-nomor">${p.nomor_order}</td>
      <td>${nama}<br/><small style="color:#6b6b6b">${hp}</small></td>
      <td>${p.layanan}</td>
      <td><small>${p.deskripsi || '—'}</small></td>
      <td>
        <span class="status-badge-sm" style="background:${warna}">
          ${icon} ${label}
        </span>
      </td>
      <td><small>${tgl}</small></td>
      <td>
        <button class="btn-update-status"
          data-id="${p.id}"
          data-status="${p.status}">
          Update
        </button>
      </td>
    </tr>`;
}


/* ── MODAL UPDATE STATUS ── */
let listenerSimpanTerpasang = false; // Cegah event listener dobel

function bukaModalUpdate(id, statusSaat) {
  const modal = document.getElementById('modalUpdate');
  if (!modal) return;

  // Reset isi modal
  const select   = modal.querySelector('#selectStatus');
  const catatan  = modal.querySelector('#catatanAdmin');
  const estimasi = modal.querySelector('#estimasiAdmin');
  const btnSimpan = modal.querySelector('#btnSimpanStatus');

  if (select)   select.value   = statusSaat;
  if (catatan)  catatan.value  = '';
  if (estimasi) estimasi.value = '';

  modal.style.display = 'flex';

  // Tutup modal
  const tutupModal = () => { modal.style.display = 'none'; };
  modal.querySelector('.modal-tutup')?.onclick    = tutupModal;
  modal.querySelector('.modal-backdrop')?.onclick = tutupModal;

  // Simpan — pakai onclick supaya tidak dobel
  if (btnSimpan) {
    btnSimpan.onclick = async () => {
      const statusBaru     = select?.value;
      const catatanVal     = catatan?.value.trim()  || '';
      const estimasiVal    = estimasi?.value         || '';

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
  const payload = { status };
  if (catatan)  payload.catatan_admin     = catatan;
  if (estimasi) payload.estimasi_selesai  = estimasi;

  const { error } = await db
    .from('pesanan')
    .update(payload)
    .eq('id', id);

  if (error) {
    alert('Gagal update status: ' + error.message);
    return;
  }

  // Buka WA untuk kirim notif ke pelanggan
  await kirimNotifWA(id, status);

  // Refresh tabel
  await muatSemuaPesanan();
  await muatStatistik();
}


/* ── KIRIM NOTIFIKASI WA KE PELANGGAN ── */
async function kirimNotifWA(pesananId, statusBaru) {
  const { data: p, error } = await db
    .from('pesanan')
    .select('nomor_order, profiles(nama, no_hp)')
    .eq('id', pesananId)
    .maybeSingle(); // maybeSingle() tidak error kalau kosong

  if (error || !p?.profiles?.no_hp) {
    console.warn('Tidak bisa kirim notif WA:', error?.message || 'no_hp kosong');
    return;
  }

  const { label, icon } = infoStatus(statusBaru);
  const noHp  = p.profiles.no_hp.replace(/[^0-9]/g, '');
  const nama  = p.profiles.nama;
  const nomor = p.nomor_order;

  const pesan =
    `Halo ${nama}! 👋\n\n` +
    `Update pesanan Anda di Penjahit Bintang:\n\n` +
    `📋 No. Order: *${nomor}*\n` +
    `${icon} Status: *${label}*\n\n` +
    `Pantau pesanan di:\n` +
    `https://penjahit-bintang.vercel.app/status.html\n\n` + // ← GANTI URL
    `Terima kasih sudah mempercayai kami! 🙏`;

  window.open(
    `https://wa.me/${noHp}?text=${encodeURIComponent(pesan)}`,
    '_blank',
    'noopener'
  );
}


/* ── STATISTIK RINGKASAN ── */
async function muatStatistik() {
  const { data, error } = await db
    .from('pesanan')
    .select('status');

  if (error || !data) return;

  setText('statTotal',    data.length);
  setText('statMenunggu', data.filter(p => p.status === 'menunggu_konfirmasi').length);
  setText('statDiproses', data.filter(p => p.status === 'diproses').length);
  setText('statSelesai',  data.filter(p => p.status === 'selesai' || p.status === 'diambil').length);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}


/* ── INFO STATUS ── */
function infoStatus(status) {
  const map = {
    'menunggu_konfirmasi': { label: 'Menunggu Konfirmasi', warna: '#f59e0b', icon: '⏳' },
    'dikonfirmasi':        { label: 'Dikonfirmasi',         warna: '#3b82f6', icon: '✅' },
    'diproses':            { label: 'Sedang Diproses',      warna: '#8b5cf6', icon: '🧵' },
    'selesai':             { label: 'Selesai',               warna: '#10b981', icon: '🎉' },
    'diambil':             { label: 'Sudah Diambil',         warna: '#6b7280', icon: '📦' }
  };
  return map[status] || { label: status, warna: '#6b7280', icon: '❓' };
}
