/**
 * @param {string} pesan  - Teks yang mau ditampilkan
 * @param {string} tipe   - 'sukses' | 'peringatan'
 */
function tampilkanNotif(pesan, tipe = 'sukses') {

  const notifLama = document.querySelector('.notif-toast');
  if (notifLama) notifLama.remove();

  const notif = document.createElement('div');
  notif.className = 'notif-toast';
  notif.textContent = pesan;
  notif.style.background = tipe === 'peringatan' ? '#ef4444' : '#22c55e';
  notif.style.color = '#fff';

  document.body.appendChild(notif);

  requestAnimationFrame(() => {
    notif.classList.add('tampil');
  });

  setTimeout(() => {
    notif.classList.remove('tampil');
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

/**
 * @param {HTMLElement} el         - Elemen yang isinya mau dianimasikan
 * @param {string}      targetStr  - Nilai target, boleh ada sufiks (contoh: '500+', '4.9★')
 * @param {number}      durasi     - Durasi animasi dalam ms (default 1500)
 */
function animasiCounter(el, targetStr, durasi = 1500) {
  const angka  = parseFloat(targetStr.replace(/[^0-9.]/g, ''));
  const sufiks = targetStr.replace(/[0-9.]/g, '');
  const mulai  = Date.now();

  function update() {
    const progress = Math.min((Date.now() - mulai) / durasi, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // Easing cubic
    const nilai    = angka * eased;

    el.textContent = (nilai % 1 < 0.05 || progress < 1)
      ? Math.floor(nilai) + sufiks
      : nilai.toFixed(1) + sufiks;

    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = targetStr; // Pastikan nilai akhir presisi
  }

  requestAnimationFrame(update);
}

/**
 * @param {string} selektor   - CSS selector tujuan (contoh: '#layanan')
 * @param {number} offsetExtra - Ruang tambahan dari atas (default 16px)
 */
function scrollKe(selektor, offsetExtra = 16) {
  const el = document.querySelector(selektor);
  if (!el) return;

  const navbarTinggi = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--navbar-tinggi') || '72'
  );

  window.scrollTo({
    top: el.offsetTop - navbarTinggi - offsetExtra,
    behavior: 'smooth'
  });
}

function initAnimasiScroll() {
  const elemen = document.querySelectorAll('[data-animate]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('tampil');
        }, i * 80); // Stagger: setiap elemen delay 80ms
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elemen.forEach(el => observer.observe(el));
}
