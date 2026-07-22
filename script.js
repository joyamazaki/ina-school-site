
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.nav');
if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
  });
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

document.querySelectorAll('form[data-demo]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    alert('現在は試作版です。公開時に送信先を設定します。');
  });
});
