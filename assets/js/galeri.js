// DATA GALERI MANUAL
const dataGaleri = [

  {
    id: 1,
    nama: 'Kemeja Batik Custom',
    kategori: 'pria',
    foto: 'images/kemeja-batik-pria.png',                       // Ganti: 'images/kemeja-batik-1.jpg'
    emoji: '👔',
    warna: 'linear-gradient(145deg, #1a1a2e, #0f3460)',
    badge: 'terlaris',
    tinggi: 240
  },
  {
    id: 2,
    nama: 'Dress Pesta Elegan',
    kategori: 'wanita',
    foto: 'images/dress-pesta-wanita.png',                       // Ganti: 'images/dress-pesta-1.jpg'
    emoji: '👗',
    warna: 'linear-gradient(145deg, #2d1b69, #6b2d5e)',
    badge: 'baru',
    tinggi: 300
  },
  {
    id: 3,
    nama: 'Seragam Kantor',
    kategori: 'seragam',
    foto: 'images/seragam-kantor.png',
    emoji: '🏢',
    warna: 'linear-gradient(145deg, #0f3460, #2e86c1)',
    badge: null,
    tinggi: 220
  },
  {
    id: 4,
    nama: 'Kebaya Modern',
    kategori: 'wanita',
    foto: 'images/kebaya-modern.png',
    emoji: '🥻',
    warna: 'linear-gradient(145deg, #1e3a1e, #1a7a3c)',
    badge: 'baru',
    tinggi: 270
  },
  {
    id: 5,
    nama: 'Jas Formal Premium',
    kategori: 'pria',
    foto: 'images/jas-formal-premium.png',
    emoji: '🧥',
    warna: 'linear-gradient(145deg, #2c1810, #6b3d1e)',
    badge: null,
    tinggi: 250
  },
  {
    id: 6,
    nama: 'Seragam Sekolah SMA',
    kategori: 'seragam',
    foto: 'images/seragam-sekolah.png',
    emoji: '🎓',
    warna: 'linear-gradient(145deg, #1c3d5a, #0e6655)',
    badge: null,
    tinggi: 230
  },
  {
    id: 7,
    nama: 'Permak Celana Panjang',
    kategori: 'permak',
    foto: 'images/permak-celana-panjang.png',
    emoji: '✂️',
    warna: 'linear-gradient(145deg, #3d2b1f, #8b5e4a)',
    badge: null,
    tinggi: 200
  },
  {
    id: 8,
    nama: 'Gamis Muslimah',
    kategori: 'wanita',
    foto: 'images/gamis-muslimah.png',
    emoji: '🧕',
    warna: 'linear-gradient(145deg, #1a0a2e, #3d2b6e)',
    badge: 'terlaris',
    tinggi: 290
  },
  {
    id: 9,
    nama: 'Celana Chinos Custom',
    kategori: 'pria',
    foto: 'images/celana-chinos-pria.png',
    emoji: '👖',
    warna: 'linear-gradient(145deg, #2a2a1a, #5a5a30)',
    badge: null,
    tinggi: 215
  },

  {
    id: 10,
    nama: 'Blazer Kasual Wanita',
    kategori: 'wanita',
    foto: 'images/blazer-kasual-wanita.png',
    emoji: '🩷',
    warna: 'linear-gradient(145deg, #4a0020, #8b0040)',
    badge: 'promo',
    tinggi: 260
  },
  {
    id: 11,
    nama: 'Kemeja Flanel Custom',
    kategori: 'pria',
    foto: 'images/kemeja-flanel-pria.png',
    emoji: '🟫',
    warna: 'linear-gradient(145deg, #3d1515, #7a2828)',
    badge: null,
    tinggi: 235
  },
  {
    id: 12,
    nama: 'Permak Dress Wedding',
    kategori: 'permak',
    foto: 'images/permak-dress-wedding.png',
    emoji: '💍',
    warna: 'linear-gradient(145deg, #1a1a0a, #4a4a20)',
    badge: 'baru',
    tinggi: 280
  }
];

const warnaDot = {
  pria:    '#3b82f6',
  wanita:  '#ec4899',
  permak:  '#f59e0b',
  seragam: '#10b981'
};

let filterAktif  = 'semua';
let dataFiltered = [];           // Data setelah difilter
const ITEM_AWAL  = 9;           // Berapa item ditampil pertama kali

function initGaleri() {
  const galeriGrid   = document.getElementById('galeriGrid');
  const btnLoadMore  = document.getElementById('btnLoadMore');
  const filterBtns   = document.querySelectorAll('.filter-btn');

  if (!galeriGrid) return;

  renderGaleri(filterAktif, ITEM_AWAL);

  filterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      filterAktif = this.dataset.filter;
      tampilkanSkeleton();
      setTimeout(() => renderGaleri(filterAktif, ITEM_AWAL), 0);
    });
  });

  // Event load more
  btnLoadMore?.addEventListener('click', () => {
    const sudahAda = galeriGrid.querySelectorAll('.galeri-item').length;
    dataFiltered.slice(sudahAda).forEach((item, i) => {
      const el = buatKartuGaleri(item);
      galeriGrid.appendChild(el);
      setTimeout(() => el.classList.add('muncul'), i * 60);
    });
    updateCounter(dataFiltered.length);
    updateLoadMoreBtn(true);
  });
}

function renderGaleri(filter, batas) {
  const galeriGrid = document.getElementById('galeriGrid');
  if (!galeriGrid) return;

  dataFiltered = filter === 'semua'
    ? [...dataGaleri]
    : dataGaleri.filter(item => item.kategori === filter);

  const jumlahTampil = Math.min(batas, dataFiltered.length);

  galeriGrid.querySelectorAll('.galeri-item').forEach(el => el.remove());

  setTimeout(() => {

    galeriGrid.querySelectorAll('.galeri-skeleton').forEach(sk => sk.remove());

    dataFiltered.slice(0, batas).forEach((item, i) => {
      const el = buatKartuGaleri(item);
      galeriGrid.appendChild(el);
      setTimeout(() => el.classList.add('muncul'), i * 60);
    });

    updateCounter(jumlahTampil);
    updateLoadMoreBtn(jumlahTampil >= dataFiltered.length);
  }, 550);
}


/**
 * @returns {HTMLElement}
 */
function buatKartuGaleri(item) {
  const el       = document.createElement('div');
  el.className   = 'galeri-item';
  el.dataset.kategori = item.kategori;
  el.dataset.id  = item.id;

  const labelKat  = item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1);
  const dotWarna  = warnaDot[item.kategori] || '#ccc';

  const htmlGambar = item.foto
    ? `<img src="${item.foto}" alt="${item.nama}" loading="lazy" />`
    : `<div class="galeri-placeholder" style="background:${item.warna};height:${item.tinggi}px">
        <span class="galeri-emoji">${item.emoji}</span>
      </div>`;

  const htmlBadge = item.badge
    ? `<span class="galeri-badge badge-${item.badge}">
        ${ item.badge === 'baru' ? '✦ Baru' : item.badge === 'terlaris' ? '🔥 Terlaris' : '🏷 Promo' }
      </span>`
    : '';

  el.innerHTML = `
    <div class="galeri-img-wrap">
      ${htmlGambar}
      ${htmlBadge}
      <div class="galeri-overlay">
        <div class="galeri-zoom-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </div>
        <p class="galeri-overlay-nama">${item.nama}</p>
        <span class="galeri-overlay-kat">
          <span style="width:6px;height:6px;border-radius:50%;background:${dotWarna};display:inline-block"></span>
          ${labelKat}
        </span>
      </div>
    </div>
    <div class="galeri-info">
      <p class="galeri-nama">${item.nama}</p>
      <div class="galeri-meta">
        <span class="galeri-kategori-tag">${labelKat}</span>
        <span class="galeri-klik-hint">Klik untuk lihat →</span>
      </div>
    </div>`;

  el.addEventListener('click', () => {
    const posisi = dataFiltered.findIndex(d => d.id === item.id);
    bukaLightbox(posisi, dataFiltered);
  });

  return el;
}

function tampilkanSkeleton() {
  const galeriGrid = document.getElementById('galeriGrid');
  if (!galeriGrid) return;
  galeriGrid.innerHTML = `
    <div class="galeri-skeleton"></div>
    <div class="galeri-skeleton sk-tall"></div>
    <div class="galeri-skeleton"></div>
    <div class="galeri-skeleton sk-tall"></div>
    <div class="galeri-skeleton"></div>
    <div class="galeri-skeleton"></div>`;
}

function updateCounter(jumlah) {
  const el = document.getElementById('galeriCount');
  if (el) el.textContent = jumlah;
}

function updateLoadMoreBtn(semuaTampil) {
  const btn  = document.getElementById('btnLoadMore');
  const teks = document.getElementById('loadMoreText');
  if (!btn || !teks) return;

  if (semuaTampil) {
    teks.textContent = 'Semua Karya Sudah Ditampilkan';
    btn.classList.add('semua-tampil');
  } else {
    const sisa = dataFiltered.length - document.querySelectorAll('.galeri-item').length;
    teks.textContent = `Lihat Semua Karya (${sisa} lagi)`;
    btn.classList.remove('semua-tampil');
  }
}
