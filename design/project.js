// Lightbox
(() => {
  const media = document.querySelector('.media');
  if (!media) return;
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  const img = document.createElement('img');
  img.alt = '';
  lb.appendChild(img);
  document.body.appendChild(lb);
  const imgs = Array.from(media.querySelectorAll('img'));
  let i = 0;
  imgs.forEach((el, idx) => el.addEventListener('click', () => {
    i = idx; img.src = el.src; lb.classList.add('open');
  }));
  lb.addEventListener('click', () => lb.classList.remove('open'));
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') lb.classList.remove('open');
    if (e.key === 'ArrowRight') { i = (i + 1) % imgs.length; img.src = imgs[i].src; }
    if (e.key === 'ArrowLeft')  { i = (i - 1 + imgs.length) % imgs.length; img.src = imgs[i].src; }
  });
})();
