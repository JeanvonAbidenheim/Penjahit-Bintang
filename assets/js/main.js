document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initAnimasiScroll();
  initGaleri();
  initLightbox();
  initFormKontak();
  initCounterStatistik();
  initSmoothScroll();
  initWAFloat();

  console.log('✦ Penjahit Bintang — Semua modul berhasil diinisialisasi!');
});

function initLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (!loadingScreen) return;

  setTimeout(() => {
    loadingScreen.classList.add('hide');
    document.body.classList.add('loaded');
    setTimeout(() => loadingScreen.remove(), 600);
  }, 1200);
}

function initFormKontak() {
  const form        = document.getElementById('kontakForm');
  const formSuccess = document.getElementById('formSuccess');
  const submitText  = document.getElementById('submitText');
  const submitBtn   = document.querySelector('.btn-submit');

  if (!form) return;

  const FORMSPREE_URL = 'https://formspree.io/f/maqkqzwv';

  const labelLayanan = {
    'permak':        'Permak Pakaian',
    'custom-pria':   'Jahit Custom Pria',
    'custom-wanita': 'Jahit Custom Wanita',
    'seragam':       'Seragam Sekolah/Kantor',
    'lainnya':       'Lainnya'
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data    = new FormData(form);
    const nama    = (data.get('nama')    || '').trim();
    const hp      = (data.get('hp')      || '').trim();
    const layanan = (data.get('layanan') || '').trim();
    const pesan   = (data.get('pesan')   || '').trim();

    if (!nama) {
      tampilkanNotif('Nama lengkap belum diisi!', 'peringatan');
      form.querySelector('#nama')?.focus();
      return;
    }
    if (!hp) {
      tampilkanNotif('Nomor WhatsApp belum diisi!', 'peringatan');
      form.querySelector('#hp')?.focus();
      return;
    }
    if (!layanan) {
      tampilkanNotif('Pilih jenis layanan terlebih dahulu!', 'peringatan');
      form.querySelector('#layanan')?.focus();
      return;
    }

    if (submitText) submitText.textContent = 'Mengirim...';
    if (submitBtn)  submitBtn.disabled = true;

    const namaPesanan = labelLayanan[layanan] || layanan;

    try {

      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          Nama:     nama,
          WhatsApp: hp,
          Layanan:  namaPesanan,
          Pesan:    pesan || '(tidak ada keterangan tambahan)'
        })
      });

      const json = await res.json();

      if (!res.ok || json.errors) {
        throw new Error(json.errors?.[0]?.message || 'Gagal kirim');
      }

      bukaWhatsApp(nama, hp, namaPesanan, pesan);
      form.style.display = 'none';
      formSuccess?.classList.add('tampil');

    } catch (err) {
      console.error('Formspree error:', err);

      tampilkanNotif('Koneksi bermasalah, mengalihkan ke WhatsApp...', 'peringatan');

      setTimeout(() => {
        bukaWhatsApp(nama, hp, namaPesanan, pesan);
        if (submitText) submitText.textContent = 'Kirim Pesan';
        if (submitBtn)  submitBtn.disabled = false;
      }, 1800);
    }
  });
}

function bukaWhatsApp(nama, hp, layanan, pesan) {
  const teks =
    `Halo Penjahit Bintang! 👋\n\n` +
    `Saya ingin memesan:\n` +
    `• Nama: ${nama}\n` +
    `• No HP: ${hp}\n` +
    `• Layanan: ${layanan}` +
    (pesan ? `\n• Keterangan: ${pesan}` : '') +
    `\n\nMohon bantuannya, terima kasih! 🙏`;

  window.open(
    `https://wa.me/6285607962255?text=${encodeURIComponent(teks)}`,
    '_blank',
    'noopener'
  );
}

function initCounterStatistik() {
  const statNums    = document.querySelectorAll('.stat-num');
  const heroSection = document.getElementById('home');

  if (!heroSection || !statNums.length) return;

  let sudahJalan = false;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !sudahJalan) {
      sudahJalan = true;
      statNums.forEach(el => {
        const target = el.textContent;
        el.textContent = '0';
        setTimeout(() => animasiCounter(el, target), 400);
      });
    }
  }, { threshold: 0.5 });

  observer.observe(heroSection);
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const idTujuan = anchor.getAttribute('href');
      if (idTujuan === '#') return;
      const el = document.querySelector(idTujuan);
      if (!el) return;
      e.preventDefault();
      scrollKe(idTujuan);
    });
  });
}

function initWAFloat() {
  const waBtn = document.querySelector('.wa-float');
  if (!waBtn) return;

  function updateOpacity() {
    const heroTinggi = document.getElementById('home')?.offsetHeight || 600;
    waBtn.style.opacity = window.scrollY > heroTinggi * 0.7 ? '1' : '0.4';
  }

  window.addEventListener('scroll', updateOpacity, { passive: true });
  updateOpacity();
}