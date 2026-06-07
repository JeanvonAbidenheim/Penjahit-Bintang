/* ==============================================
   pesan.js — Logic form booking pesanan baru
   Dipakai di halaman pesan.html
   ============================================== */

function initHalamanPesan() {
  const form = document.getElementById('formPesan');
  if (!form) return;

  // Wajib login dulu
  db.auth.getSession().then(async ({ data }) => {
    if (!data.session) {
      window.location.href = 'auth.html';
      return;
    }

    // Tampilkan nama user di navbar
    const user = data.session.user;
    const { data: profil } = await db
      .from('profiles')
      .select('nama')
      .eq('id', user.id)
      .single();

    const elNama = document.getElementById('namaUser');
    if (elNama && profil) elNama.textContent = profil.nama;

    // Inisialisasi form
    initFormPesan(form, user);
  });
}


function initFormPesan(form, user) {
  // Isi estimasi tanggal minimal (besok)
  const inputTanggal = form.querySelector('#estimasiAmbil');
  if (inputTanggal) {
    const besok = new Date();
    besok.setDate(besok.getDate() + 3); // minimal 3 hari dari sekarang
    inputTanggal.min = besok.toISOString().split('T')[0];
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const layanan    = form.querySelector('#layanan').value;
    const deskripsi  = form.querySelector('#deskripsi').value.trim();
    const ambil      = form.querySelector('#estimasiAmbil').value;

    if (!layanan || !deskripsi) {
      tampilNotifPesan('Pilih layanan dan isi deskripsi terlebih dahulu!', 'error');
      return;
    }

    setLoadingPesan(true);

    // Generate nomor order unik: PB-YYYYMMDD-XXXX
    const nomorOrder = generateNomorOrder();

    const { error } = await db.from('pesanan').insert({
      nomor_order:       nomorOrder,
      user_id:           user.id,
      layanan,
      deskripsi,
      estimasi_selesai:  ambil || null,
      status:            'menunggu_konfirmasi'
    });

    setLoadingPesan(false);

    if (error) {
      tampilNotifPesan('Gagal membuat pesanan: ' + error.message, 'error');
      return;
    }

    // Sukses → tampilkan nomor order & redirect
    tampilSuksesPesan(nomorOrder);
  });
}


/* ── Generate nomor order unik ── */
function generateNomorOrder() {
  const now    = new Date();
  const tgl    = now.toISOString().slice(0, 10).replace(/-/g, '');
  const acak   = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PB-${tgl}-${acak}`;
}


/* ── Tampil sukses + nomor order ── */
function tampilSuksesPesan(nomorOrder) {
  const formWrap  = document.getElementById('formWrap');
  const sukses    = document.getElementById('pesanSukses');
  const elNomor   = document.getElementById('nomorOrderSukses');

  if (formWrap) formWrap.style.display = 'none';
  if (sukses)   sukses.style.display   = 'flex';
  if (elNomor)  elNomor.textContent    = nomorOrder;
}


/* ── Loading state tombol ── */
function setLoadingPesan(loading) {
  const btn  = document.querySelector('#formPesan button[type="submit"]');
  const teks = document.querySelector('#formPesan .btn-teks');
  if (!btn) return;
  btn.disabled = loading;
  if (teks) teks.textContent = loading ? 'Memproses...' : 'Buat Pesanan';
}


/* ── Notif error/sukses kecil ── */
function tampilNotifPesan(pesan, tipe) {
  const el = document.getElementById('pesanNotif');
  if (!el) return;
  el.textContent   = pesan;
  el.className     = `auth-pesan ${tipe}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
