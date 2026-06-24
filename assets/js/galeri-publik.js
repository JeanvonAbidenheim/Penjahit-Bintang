/* ==============================================
   galeri-publik.js — Tampil galeri di index.html
   Baca dari Firebase, render ke masonry grid
   ============================================== */

import { db }                                    from './firebase.js';
import { ref, onValue }                          from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js';
import { Icons }                                 from './icons.js';

var warnaDot = {
  pria: '#3b82f6', wanita: '#ec4899',
  permak: '#f59e0b', seragam: '#10b981'
};

var semuaData    = [];
var dataFiltered = [];
var filterAktif  = 'semua';
var itemTampil   = 9;


function initGaleriPublik() {
  var galeriGrid = document.getElementById('galeriGrid');
  if (!galeriGrid) return;

  // Dengerin perubahan galeri dari Firebase secara realtime
  onValue(ref(db, 'galeri'), function(snapshot) {
    semuaData = [];

    if (snapshot.exists()) {
      snapshot.forEach(function(child) {
        semuaData.push(Object.assign({ id: child.key }, child.val()));
      });
      semuaData.sort(function(a, b) { return b.createdAt - a.createdAt; });
    }

    renderGaleri(filterAktif, false);
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      filterAktif = btn.dataset.filter;
      itemTampil  = 9;
      renderGaleri(filterAktif, false);
    });
  });

  // Load more
  var btnLoadMore = document.getElementById('btnLoadMore');
  if (btnLoadMore) {
    btnLoadMore.addEventListener('click', function() {
      itemTampil += 9;
      renderGaleri(filterAktif, true);
    });
  }
}


function renderGaleri(filter, loadMore) {
  var galeriGrid = document.getElementById('galeriGrid');
  if (!galeriGrid) return;

  // Filter data
  dataFiltered = filter === 'semua'
    ? semuaData.slice()
    : semuaData.filter(function(item) { return item.kategori === filter; });

  if (!loadMore) {
    // Tampil skeleton dulu
    galeriGrid.innerHTML =
      '<div class="galeri-skeleton"></div>' +
      '<div class="galeri-skeleton sk-tall"></div>' +
      '<div class="galeri-skeleton"></div>' +
      '<div class="galeri-skeleton sk-tall"></div>' +
      '<div class="galeri-skeleton"></div>' +
      '<div class="galeri-skeleton"></div>';
  }

  setTimeout(function() {
    if (!loadMore) {
      galeriGrid.querySelectorAll('.galeri-skeleton').forEach(function(sk) { sk.remove(); });
      galeriGrid.innerHTML = '';
    }

    if (dataFiltered.length === 0) {
      galeriGrid.innerHTML =
        '<div style="text-align:center;padding:3rem 1rem;color:var(--abu-terang)">' +
        'Belum ada foto untuk kategori ini.</div>';
      updateCounter(0);
      updateLoadMoreBtn(true);
      return;
    }

    var mulaiDari = loadMore ? galeriGrid.querySelectorAll('.galeri-item').length : 0;

    dataFiltered.slice(mulaiDari, itemTampil).forEach(function(item, i) {
      var el = buatKartu(item);
      galeriGrid.appendChild(el);
      setTimeout(function() { el.classList.add('muncul'); }, i * 60);
    });

    updateCounter(Math.min(itemTampil, dataFiltered.length));
    updateLoadMoreBtn(itemTampil >= dataFiltered.length);

  }, loadMore ? 0 : 400);
}


function buatKartu(item) {
  var el       = document.createElement('div');
  el.className = 'galeri-item';
  el.dataset.kategori = item.kategori;
  el.dataset.id       = item.id;

  var labelKat = item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1);
  var dotWarna = warnaDot[item.kategori] || '#ccc';

  var badgeHtml = item.badge && item.badge !== 'null'
    ? '<span class="galeri-badge badge-' + item.badge + '">' +
      (item.badge === 'baru' ? Icons.bintangMerk + ' Baru' : item.badge === 'terlaris' ? Icons.bintang + ' Terlaris' : Icons.label + ' Promo') +
      '</span>'
    : '';

  el.innerHTML =
    '<div class="galeri-img-wrap">' +
      '<img src="' + item.fotoUrl + '" alt="' + item.nama + '" loading="lazy" />' +
      badgeHtml +
      '<div class="galeri-overlay">' +
        '<div class="galeri-zoom-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
            '<circle cx="11" cy="11" r="8"/>' +
            '<line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
            '<line x1="11" y1="8" x2="11" y2="14"/>' +
            '<line x1="8" y1="11" x2="14" y2="11"/>' +
          '</svg>' +
        '</div>' +
        '<p class="galeri-overlay-nama">' + item.nama + '</p>' +
        '<span class="galeri-overlay-kat">' +
          '<span style="width:6px;height:6px;border-radius:50%;background:' + dotWarna + ';display:inline-block"></span>' +
          labelKat +
        '</span>' +
      '</div>' +
    '</div>' +
    '<div class="galeri-info">' +
      '<p class="galeri-nama">' + item.nama + '</p>' +
      '<div class="galeri-meta">' +
        '<span class="galeri-kategori-tag">' + labelKat + '</span>' +
        '<span class="galeri-klik-hint">Klik untuk lihat →</span>' +
      '</div>' +
    '</div>';

  el.addEventListener('click', function() {
    var posisi = dataFiltered.findIndex(function(d) { return d.id === item.id; });
    if (typeof bukaLightbox === 'function') bukaLightbox(posisi, dataFiltered);
  });

  return el;
}


function updateCounter(jumlah) {
  var el = document.getElementById('galeriCount');
  if (el) el.textContent = jumlah;
}

function updateLoadMoreBtn(semuaTampil) {
  var btn  = document.getElementById('btnLoadMore');
  var teks = document.getElementById('loadMoreText');
  if (!btn || !teks) return;

  if (semuaTampil) {
    teks.textContent = 'Semua Karya Sudah Ditampilkan';
    btn.classList.add('semua-tampil');
  } else {
    var sisa = dataFiltered.length - Math.min(itemTampil, dataFiltered.length);
    teks.textContent = 'Lihat Semua Karya (' + sisa + ' lagi)';
    btn.classList.remove('semua-tampil');
  }
}

export { initGaleriPublik };
