// Page enter animation
requestAnimationFrame(() => {
  document.querySelectorAll('.page-enter').forEach((el) => el.classList.add('is-loaded'));
});

// Lightbox for gallery images
(() => {
  const gallery = document.querySelector('.content');
  if (!gallery) return;

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  const overlayImg = document.createElement('img');
  overlayImg.className = 'overlayImage';
  overlayImg.alt = 'Enlarged view';
  overlay.appendChild(overlayImg);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.classList.remove('open');
  };

  gallery.addEventListener('click', (e) => {
    const img = e.target.closest('img.row_image');
    if (!img) return;
    overlayImg.src = img.src;
    overlay.classList.add('open');
  });

  overlay.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
})();

// Desktop wheel-scroll redirect: scroll the right gallery column instead of the page
(() => {
  const content = document.querySelector('.content');
  if (!content) return;
  const mql = window.matchMedia('(min-width: 764px)');

  function onWheel(e) {
    if (!mql.matches) return;
    e.preventDefault();
    content.scrollTop += e.deltaY;
  }
  window.addEventListener('wheel', onWheel, { passive: false });
})();
