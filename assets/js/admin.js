/* ==============================================
   admin.js — Dashboard admin
   Hanya bisa diakses oleh email admin
   ============================================== */

// ── Ganti dengan email admin tokomu ──
const EMAIL_ADMIN = 'emailadmin@gmail.com';

function initAdmin() {
  db.auth.getSession().then(async ({ data }) => {
    // Cek login
    if (!data.session) {
      window.location.href = 'auth.html';
      return;
    }

    // Cek apakah ini admin
    const email = data.session.user.email;
    if (email !== EMAIL_ADMIN) {
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;flex-direction:column;gap:1rem">
          <p style="font-size:3rem">🚫</p>
          <p style="font-weight:700">Akses ditolak. Halaman ini hanya untuk admin.</p>
          <a href="index.html" style="color:#c9a84c">← Kembali ke website</a>
        </div>`;
      return;
    }

    // Tampil email admin
    const elEmail = document.getElementById('emailAdmin');
    if (elEmail) elEmail.textContent = email;

    // Muat semua pesanan
    await muatSemuaPesanan();
    await muatStatistik();

    // Realtime update
    db.channel('admin-pesanan')
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'pesanan'
      }, async () => {
        await muatSemuaPesanan();
        await muatStatistik();
      })
      .subscribe();

    // Filter status
    document.querySelectorAll('.filter-status').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-status').forEach(b => b.classList.remove('aktif'));
        this.classList.add('aktif');
        muatSemuaPesanan(this.dataset.status);
      });
    });
  });
}


/* ── Muat semua pesanan (bisa difilter) ── */
async function muatSemuaPesanan(filterStatus = null) {
  const container = document.getElementById('tabelPesanan');
  if (!container) return;

  container.innerHTML = '<tr><td colspan="6" class="loading-td">Memuat data...</td></tr>';

  let query = db
    .from('pesanan')
    .select(`*, profiles(nama, no_hp)`)
    .order('created_at', { ascending: false });

  if (filterStatus) query = query.eq('status', filterStatus);

  const { data: pesanan, error } = await query;

  if (error || !pesanan?.length) {
    container.innerHTML = '<tr><td colspan="6" class="loading-td">Tidak ada pesanan ditemukan.</td></tr>';
    return;
  }

  container.innerHTML = pesanan.map(p => barisAdmin(p)).join('');

  // Event tombol update status
  container.querySelectorAll('.btn-update-status').forEach(btn => {
    btn.addEventListener('click', () => {
      bukaModalUpdate(btn.dataset.id, btn.dataset.status);
    });
  });
}


/* ── Buat satu baris tabel admin ── */
function barisAdmin(p) {
  const { label, warna, icon } = infoStatus(p.status);
  const tgl = new Date(p.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return `
    <tr>
      <td class="td-nomor">${p.nomor_order}</td>
      <td>${p.profiles?.nama || '-'}<br/><small>${p.profiles?.no_hp || ''}</small></td>
      <td>${p.layanan}</td>
      <td><small>${p.deskripsi || '-'}</small></td>
      <td>
        <span class="status-badge-sm" style="background:${warna}">
          ${icon} ${label}
        </span>
      </td>
      <td>${tgl}</td>
      <td>
        <button class="btn-update-status" data-id="${p.id}" data-status="${p.status}">
          Update Status
        </button>
      </td>
    </tr>`;
}


/* ── Modal update status ── */
function bukaModalUpdate(id, statusSaat) {
  const modal = document.getElementById('modalUpdate');
  if (!modal) return;

  modal.style.display = 'flex';
  modal.dataset.id    = id;

  // Set pilihan select sesuai status saat ini
  const select = modal.querySelector('#selectStatus');
  if (select) select.value = statusSaat;

  // Tutup modal
  modal.querySelector('.modal-tutup')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modal.querySelector('.modal-backdrop')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Simpan update
  modal.querySelector('#btnSimpanStatus')?.addEventListener('click', async () => {
    const statusBaru  = modal.querySelector('#selectStatus').value;
    const catatan     = modal.querySelector('#catatanAdmin').value.trim();
    const estimasi    = modal.querySelector('#estimasiAdmin').value;

    await updateStatusPesanan(id, statusBaru, catatan, estimasi);
    modal.style.display = 'none';
  });
}


/* ── Update status pesanan ke database ── */
async function updateStatusPesanan(id, status, catatan, estimasi) {
  const update = { status };
  if (catatan)  update.catatan_admin      = catatan;
  if (estimasi) update.estimasi_selesai   = estimasi;

  const { error } = await db
    .from('pesanan')
    .update(update)
    .eq('id', id);

  if (error) {
    alert('Gagal update: ' + error.message);
    return;
  }

  // Kirim notifikasi WA ke pelanggan
  await kirimNotifWA(id, status);
  await muatSemuaPesanan();
}


/* ── Kirim notifikasi WA ke pelanggan ── */
async function kirimNotifWA(pesananId, statusBaru) {
  const { data: p } = await db
    .from('pesanan')
    .select('*, profiles(nama, no_hp)')
    .eq('id', pesananId)
    .single();

  if (!p?.profiles?.no_hp) return;

  const { label, icon } = infoStatus(statusBaru);
  const noHp   = p.profiles.no_hp.replace(/[^0-9]/g, '');
  const nama   = p.profiles.nama;
  const nomor  = p.nomor_order;

  const pesan =
    `Halo ${nama}! 👋\n\n` +
    `Update pesanan Anda di Penjahit Bintang:\n\n` +
    `📋 No. Order: *${nomor}*\n` +
    `${icon} Status: *${label}*\n\n` +
    `Cek detail pesanan di:\n` +
    `https://penjahit-bintang.netlify.app/status.html\n\n` +
    `Terima kasih sudah mempercayai kami! 🙏`;

  // Buka WA admin dengan pesan siap kirim ke pelanggan
  window.open(
    `https://wa.me/${noHp}?text=${encodeURIComponent(pesan)}`,
    '_blank',
    'noopener'
  );
}


/* ── Statistik ringkasan ── */
async function muatStatistik() {
  const { data } = await db.from('pesanan').select('status');
  if (!data) return;

  const total      = data.length;
  const menunggu   = data.filter(p => p.status === 'menunggu_konfirmasi').length;
  const diproses   = data.filter(p => p.status === 'diproses').length;
  const selesai    = data.filter(p => p.status === 'selesai' || p.status === 'diambil').length;

  setText('statTotal',    total);
  setText('statMenunggu', menunggu);
  setText('statDiproses', diproses);
  setText('statSelesai',  selesai);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}


/* ── Info status (sama seperti di status.js) ── */
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
