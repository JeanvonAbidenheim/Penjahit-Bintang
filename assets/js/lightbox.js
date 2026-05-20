let indeksAktif   = 0;
let dataAktif     = []; // Array data yang sedang dipakai galeri

/**
 * @param {number} posisi     - Index foto yang mau dibuka
 * @param {Array}  dataArray  - Array data galeri yang sedang aktif
 */
function bukaLightbox(posisi, dataArray) {
  indeksAktif = posisi;
  dataAktif   = dataArray;

  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  lightbox.classList.add('buka');
  document.body.style.overflow = 'hidden'; // Kunci scroll background
  tampilFoto(indeksAktif);
}

function tutupLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  lightbox.classList.remove('buka');
  document.body.style.overflow = '';

  const img = document.getElementById('lightboxImg');
  if (img) img.src = '';

  document.querySelector('.lightbox-placeholder-el')?.remove();
}

function tampilFoto(posisi) {
  const item = dataAktif[posisi];
  if (!item) return;

  const img      = document.getElementById('lightboxImg');
  const nama     = document.getElementById('lightboxNama');
  const kat      = document.getElementById('lightboxKategori');
  const counter  = document.getElementById('lightboxCounter');
  const skeleton = document.getElementById('lightboxSkeleton');
  const prev     = document.getElementById('lightboxPrev');
  const next     = document.getElementById('lightboxNext');

  if (nama)    nama.textContent    = item.nama;
  if (kat)     kat.textContent     = item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1);
  if (counter) counter.textContent = `${posisi + 1} / ${dataAktif.length}`;

  document.querySelector('.lightbox-placeholder-el')?.remove();

  if (item.foto) {

    skeleton?.classList.add('aktif');
    if (img) { img.classList.add('loading'); img.style.display = 'block'; }

    if (img) {
      img.onload = () => {
        skeleton?.classList.remove('aktif');
        img.classList.remove('loading');
      };
      img.onerror = () => {

        skeleton?.classList.remove('aktif');
        img.style.display = 'none';
        tampilPlaceholder(item, img);
      };
      img.src = item.foto;
      img.alt = item.nama;
    }
  } else {

    skeleton?.classList.remove('aktif');
    if (img) img.style.display = 'none';
    tampilPlaceholder(item, img);
  }

  if (prev) prev.style.opacity = posisi === 0 ? '0.3' : '1';
  if (next) next.style.opacity = posisi === dataAktif.length - 1 ? '0.3' : '1';
}

function tampilPlaceholder(item, refEl) {
  const ph = document.createElement('div');
  ph.className = 'lightbox-placeholder-el';
  ph.style.cssText = `
    width: 100%;
    min-height: 380px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 5rem;
    background: ${item.warna};
  `;
  ph.innerHTML = `<span style="filter:drop-shadow(0 8px 20px rgba(0,0,0,0.4))">${item.emoji}</span>`;

  if (refEl) refEl.parentNode.insertBefore(ph, refEl);
}

function initLightbox() {
  const lightboxClose    = document.getElementById('lightboxClose');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const lightboxPrev     = document.getElementById('lightboxPrev');
  const lightboxNext     = document.getElementById('lightboxNext');
  const lightbox         = document.getElementById('lightbox');

  lightboxClose?.addEventListener('click', tutupLightbox);
  lightboxBackdrop?.addEventListener('click', tutupLightbox);

  lightboxPrev?.addEventListener('click', () => {
    if (indeksAktif > 0) tampilFoto(--indeksAktif);
  });

  lightboxNext?.addEventListener('click', () => {
    if (indeksAktif < dataAktif.length - 1) tampilFoto(++indeksAktif);
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('buka')) return;

    switch (e.key) {
      case 'Escape':      tutupLightbox(); break;
      case 'ArrowLeft':
        if (indeksAktif > 0) tampilFoto(--indeksAktif);
        break;
      case 'ArrowRight':
        if (indeksAktif < dataAktif.length - 1) tampilFoto(++indeksAktif);
        break;
    }
  });

  let touchMulai = 0;

  lightbox?.addEventListener('touchstart', (e) => {
    touchMulai = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox?.addEventListener('touchend', (e) => {
    const selisih = touchMulai - e.changedTouches[0].screenX;

    if (Math.abs(selisih) < 50) return; // Abaikan swipe terlalu pendek

    if (selisih > 0 && indeksAktif < dataAktif.length - 1) {
      tampilFoto(++indeksAktif); // Swipe kiri → foto berikutnya
    } else if (selisih < 0 && indeksAktif > 0) {
      tampilFoto(--indeksAktif); // Swipe kanan → foto sebelumnya
    }
  }, { passive: true });
}