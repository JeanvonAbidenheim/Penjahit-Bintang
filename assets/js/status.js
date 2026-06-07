/* ==============================================
   status.js — Halaman cek status pesanan
   Pelanggan bisa lihat semua pesanannya
   ============================================== */

function initHalamanStatus() {
  // Wajib login
  db.auth.getSession().then(async ({ data }) => {
    if (!data.session) {
      window.location.href = 'auth.html';
      return;
    }

    const user = data.session.user;

    // Tampil nama user
    const { data: profil } = await db
      .from('profiles')
      .select('nama, no_hp')
      .eq('id', user.id)
      .single();

    const elNama = document.getElementById('namaUser');
    if (elNama && profil) elNama.textContent = profil.nama;

    // Muat semua pesanan user ini
    await muatPesanan(user.id);

    // Realtime: update otomatis kalau admin ganti status
    db.channel('pesanan-update')
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'pesanan',
        filter: `user_id=eq.${user.id}`
      }, () => muatPesanan(user.id))
      .subscribe();
  });
}


/* ── Muat daftar pesanan dari database ── */
async function muatPesanan(userId) {
  const container = document.getElementById('daftarPesanan');
  const loading   = document.getElementById('loadingPesanan');
  const kosong    = document.getElementById('pesananKosong');

  if (loading) loading.style.display = 'flex';
  if (kosong)  kosong.style.display  = 'none';

  const { data: pesanan, error } = await db
    .from('pesanan')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (loading) loading.style.display = 'none';

  if (error || !pesanan?.length) {
    if (kosong) kosong.style.display = 'flex';
    if (container) container.innerHTML = '';
    return;
  }

  if (container) {
    container.innerHTML = pesanan.map(p => kartuPesanan(p)).join('');
  }
}


/* ── Buat HTML kartu satu pesanan ── */
function kartuPesanan(p) {
  const { label, warna, icon } = infoStatus(p.status);
  const tglPesan   = formatTanggal(p.created_at);
  const tglEstimasi = p.estimasi_selesai
    ? formatTanggal(p.estimasi_selesai)
    : 'Belum ditentukan';

  return `
    <div class="kartu-pesanan">
      <div class="kartu-header">
        <div>
          <p class="kartu-nomor">${p.nomor_order}</p>
          <p class="kartu-tgl">Dipesan: ${tglPesan}</p>
        </div>
        <span class="status-badge" style="background:${warna}">
          ${icon} ${label}
        </span>
      </div>

      <div class="kartu-body">
        <div class="kartu-info-row">
          <span class="kartu-label">Layanan</span>
          <span class="kartu-val">${p.layanan}</span>
        </div>
        <div class="kartu-info-row">
          <span class="kartu-label">Deskripsi</span>
          <span class="kartu-val">${p.deskripsi || '-'}</span>
        </div>
        <div class="kartu-info-row">
          <span class="kartu-label">Estimasi Selesai</span>
          <span class="kartu-val">${tglEstimasi}</span>
        </div>
        ${p.catatan_admin ? `
        <div class="kartu-info-row catatan">
          <span class="kartu-label">Catatan Admin</span>
          <span class="kartu-val">${p.catatan_admin}</span>
        </div>` : ''}
      </div>

      <!-- Progress bar status -->
      <div class="kartu-progress">
        ${progressBar(p.status)}
      </div>
    </div>`;
}


/* ── Progress bar 5 tahap ── */
function progressBar(statusAktif) {
  const tahapan = [
    { key: 'menunggu_konfirmasi', label: 'Menunggu' },
    { key: 'dikonfirmasi',        label: 'Dikonfirmasi' },
    { key: 'diproses',            label: 'Diproses' },
    { key: 'selesai',             label: 'Selesai' },
    { key: 'diambil',             label: 'Diambil' }
  ];

  const idxAktif = tahapan.findIndex(t => t.key === statusAktif);

  return `<div class="progress-wrap">
    ${tahapan.map((t, i) => `
      <div class="progress-step ${i <= idxAktif ? 'aktif' : ''} ${i === idxAktif ? 'sekarang' : ''}">
        <div class="progress-dot">${i < idxAktif ? '✓' : i + 1}</div>
        <p class="progress-label">${t.label}</p>
      </div>
      ${i < tahapan.length - 1 ? `<div class="progress-line ${i < idxAktif ? 'aktif' : ''}"></div>` : ''}
    `).join('')}
  </div>`;
}


/* ── Info label & warna per status ── */
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


/* ── Format tanggal ke bahasa Indonesia ── */
function formatTanggal(iso) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day:   'numeric',
    month: 'long',
    year:  'numeric'
  });
}
