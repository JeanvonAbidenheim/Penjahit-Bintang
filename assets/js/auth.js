/* ==============================================
   auth.js — Logic login, daftar, dan logout
   Dipakai di halaman auth.html
   ============================================== */


/* ── INISIALISASI ── */
function initAuth() {
  const formLogin  = document.getElementById('formLogin');
  const formDaftar = document.getElementById('formDaftar');
  const tabLogin   = document.getElementById('tabLogin');
  const tabDaftar  = document.getElementById('tabDaftar');

  if (!formLogin && !formDaftar) return;

  // Cek kalau sudah login → redirect ke status pesanan
  db.auth.getSession().then(({ data }) => {
    if (data.session) window.location.href = 'status.html';
  });

  // ── Toggle tab login / daftar ──
  tabLogin?.addEventListener('click', () => toggleTab('login'));
  tabDaftar?.addEventListener('click', () => toggleTab('daftar'));

  // ── Form login ──
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = formLogin.querySelector('#loginEmail').value.trim();
    const password = formLogin.querySelector('#loginPassword').value;

    setLoading(formLogin, true);

    const { error } = await db.auth.signInWithPassword({ email, password });

    setLoading(formLogin, false);

    if (error) {
      tampilPesan('login', 'error', 'Email atau password salah. Coba lagi.');
      return;
    }

    // Sukses login → ke halaman status pesanan
    window.location.href = 'status.html';
  });

  // ── Form daftar ──
  formDaftar?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nama     = formDaftar.querySelector('#daftarNama').value.trim();
    const hp       = formDaftar.querySelector('#daftarHp').value.trim();
    const email    = formDaftar.querySelector('#daftarEmail').value.trim();
    const password = formDaftar.querySelector('#daftarPassword').value;
    const konfirm  = formDaftar.querySelector('#daftarKonfirm').value;

    // Validasi
    if (!nama || !hp || !email || !password) {
      tampilPesan('daftar', 'error', 'Semua kolom wajib diisi!');
      return;
    }
    if (password.length < 6) {
      tampilPesan('daftar', 'error', 'Password minimal 6 karakter.');
      return;
    }
    if (password !== konfirm) {
      tampilPesan('daftar', 'error', 'Konfirmasi password tidak cocok!');
      return;
    }

    setLoading(formDaftar, true);

    // Daftar ke Supabase Auth
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { data: { nama, no_hp: hp } }
    });

    if (error) {
      setLoading(formDaftar, false);
      tampilPesan('daftar', 'error', 'Gagal daftar: ' + error.message);
      return;
    }

    // Simpan profil ke tabel profiles
    if (data.user) {
      await db.from('profiles').upsert({
        id:     data.user.id,
        nama,
        no_hp:  hp
      });
    }

    setLoading(formDaftar, false);
    tampilPesan('daftar', 'sukses',
      'Akun berhasil dibuat! Silakan cek email untuk verifikasi, lalu login.'
    );
    formDaftar.reset();
    setTimeout(() => toggleTab('login'), 2500);
  });
}


/* ── LOGOUT ── */
async function logout() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}


/* ── HELPER: cek session aktif ── */
async function getUser() {
  const { data } = await db.auth.getSession();
  return data.session?.user || null;
}


/* ── HELPER: toggle tab ── */
function toggleTab(tab) {
  const formLogin  = document.getElementById('formLogin');
  const formDaftar = document.getElementById('formDaftar');
  const tabLogin   = document.getElementById('tabLogin');
  const tabDaftar  = document.getElementById('tabDaftar');

  if (tab === 'login') {
    formLogin?.classList.remove('hidden');
    formDaftar?.classList.add('hidden');
    tabLogin?.classList.add('tab-aktif');
    tabDaftar?.classList.remove('tab-aktif');
  } else {
    formDaftar?.classList.remove('hidden');
    formLogin?.classList.add('hidden');
    tabDaftar?.classList.add('tab-aktif');
    tabLogin?.classList.remove('tab-aktif');
  }
}


/* ── HELPER: loading state tombol ── */
function setLoading(form, loading) {
  const btn  = form.querySelector('button[type="submit"]');
  const teks = form.querySelector('.btn-teks');
  if (!btn) return;
  btn.disabled = loading;
  if (teks) teks.textContent = loading ? 'Memproses...' : btn.dataset.teks || 'Kirim';
}


/* ── HELPER: tampil pesan error/sukses ── */
function tampilPesan(form, tipe, pesan) {
  const el = document.getElementById(`pesan-${form}`);
  if (!el) return;
  el.textContent  = pesan;
  el.className    = `auth-pesan ${tipe}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
