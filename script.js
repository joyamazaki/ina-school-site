
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.nav');
if (menuButton && nav) {
  const closeMenu = () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'メニューを開く');
  };

  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
  });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
}

const slider = document.querySelector('[data-slider]');
if (slider) {
  const slides = [...slider.querySelectorAll('.slide')];
  const dots = [...slider.querySelectorAll('.slider-dot')];
  const captions = slides.map((slide) => slide.dataset.caption || '');
  const caption = slider.querySelector('[data-slider-caption]');
  let current = 0;
  let timer;
  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('active', i === current));
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
    if (caption) caption.textContent = captions[current];
  };
  const start = () => {
    clearInterval(timer);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timer = setInterval(() => show(current + 1), 5200);
    }
  };
  dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); start(); }));
  slider.addEventListener('mouseenter', () => clearInterval(timer));
  slider.addEventListener('mouseleave', start);
  show(0); start();
}

const revealItems = [...document.querySelectorAll([
  '.concern-list li',
  '.feature-item',
  '.location-panel',
  '.service-item',
  '.consultation-item',
  '.support-list article',
  '.faq-list details',
  '.card',
  '.price-row',
  '.contact-big',
  '.contact-mid',
  '.contact-small',
  '.line-cta',
  '.section-note',
  '.course-note'
].join(','))];

if (revealItems.length && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealGroups = new Map();
  revealItems.forEach((item) => {
    const group = item.parentElement;
    const groupItems = revealGroups.get(group) || [];
    const order = groupItems.length;
    groupItems.push(item);
    revealGroups.set(group, groupItems);
    item.classList.add('reveal-item');
    item.style.setProperty('--reveal-delay', `${Math.min(order, 3) * 80}ms`);
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      revealGroups.get(entry.target).forEach((item) => item.classList.add('is-visible'));
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

  revealGroups.forEach((items, group) => revealObserver.observe(group));
}

document.querySelectorAll('form[data-demo]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    alert('現在は試作版です。公開時に送信先を設定します。');
  });
});
