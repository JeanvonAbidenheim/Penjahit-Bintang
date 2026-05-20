function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('navMenu');
  const navLinks  = document.querySelectorAll('.nav-link');
  const sections  = document.querySelectorAll('section[id]');

  if (!navbar) return; 

  function handleScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveLink();
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  hamburger?.addEventListener('click', function () {
    const lagiBuka = navMenu.classList.toggle('buka');
    this.classList.toggle('aktif');

    document.body.style.overflow = lagiBuka ? 'hidden' : '';
  });

  navLinks.forEach(link => {
    link.addEventListener('click', tutupMenu);
  });

  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target) && navMenu.classList.contains('buka')) {
      tutupMenu();
    }
  });

  function tutupMenu() {
    navMenu.classList.remove('buka');
    hamburger?.classList.remove('aktif');
    document.body.style.overflow = '';
  }

  function updateActiveLink() {
    const navbarTinggi = navbar.offsetHeight;
    const scrollPosisi = window.scrollY + navbarTinggi + 20;

    sections.forEach(section => {
      const id    = section.getAttribute('id');
      const atas  = section.offsetTop;
      const bawah = atas + section.offsetHeight;

      if (scrollPosisi >= atas && scrollPosisi < bawah) {
        navLinks.forEach(l => l.classList.remove('active'));
        document.querySelector(`.nav-link[href="#${id}"]`)?.classList.add('active');
      }
    });
  }
}