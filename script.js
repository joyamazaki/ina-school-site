
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
  const track = slider.querySelector('.slides');
  const slides = [...slider.querySelectorAll('.slide')];
  const dots = [...slider.querySelectorAll('.slider-dot')];
  const captions = slides.map((slide) => (slide.dataset.caption || '').split('|'));
  const caption = slider.querySelector('[data-slider-caption]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const interval = 5200;
  let current = 0;
  let trackIndex = 0;
  let timer;
  let remaining = interval;
  let startedAt = 0;
  let paused = false;

  if (track && slides.length > 1) {
    const firstClone = slides[0].cloneNode(true);
    firstClone.classList.remove('active');
    firstClone.classList.add('slide-clone');
    firstClone.setAttribute('aria-hidden', 'true');
    track.append(firstClone);
  }

  const updateUi = () => {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === current);
      slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
    });
    dots.forEach((dot) => dot.classList.remove('active', 'complete'));
    void slider.offsetWidth;
    dots.forEach((dot, i) => {
      dot.classList.toggle('complete', i < current);
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
    if (caption) {
      caption.replaceChildren();
      captions[current].forEach((text, index) => {
        if (index > 0) caption.append(document.createElement('wbr'));
        const phrase = document.createElement('span');
        phrase.className = 'keep-together';
        phrase.textContent = text;
        caption.append(phrase);
      });
    }
  };

  const moveTrack = (index, animate = true) => {
    if (!track) return;
    track.classList.toggle('no-transition', !animate);
    track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
    if (!animate) {
      void track.offsetWidth;
      track.classList.remove('no-transition');
    }
  };

  const schedule = (delay = interval) => {
    clearTimeout(timer);
    remaining = delay;
    if (reducedMotion || paused || slides.length < 2) return;
    startedAt = performance.now();
    timer = setTimeout(() => show(current + 1), delay);
  };

  const show = (index, animate = true) => {
    const isLoop = index >= slides.length;
    current = isLoop ? 0 : (index + slides.length) % slides.length;
    trackIndex = isLoop ? slides.length : current;
    updateUi();
    moveTrack(trackIndex, animate && !reducedMotion);
    schedule();
  };

  if (track) {
    track.addEventListener('transitionend', (event) => {
      if (event.propertyName !== 'transform' || trackIndex !== slides.length) return;
      trackIndex = 0;
      moveTrack(0, false);
    });
  }

  const pause = () => {
    if (reducedMotion || paused) return;
    paused = true;
    slider.classList.add('paused');
    remaining = Math.max(0, remaining - (performance.now() - startedAt));
    clearTimeout(timer);
  };

  const resume = () => {
    if (reducedMotion || !paused) return;
    paused = false;
    slider.classList.remove('paused');
    schedule(Math.max(remaining, 100));
  };

  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  slider.addEventListener('mouseenter', pause);
  slider.addEventListener('mouseleave', resume);
  show(0, false);
}

document.querySelectorAll('.faq-list details').forEach((details) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const summary = details.querySelector('summary');
  let animation;

  const closedHeight = () => {
    const styles = getComputedStyle(details);
    return summary.offsetHeight
      + Number.parseFloat(styles.borderTopWidth)
      + Number.parseFloat(styles.borderBottomWidth);
  };

  const finish = (open) => {
    details.open = open;
    details.classList.remove('is-opening');
    details.style.height = '';
    details.style.overflow = '';
    animation = undefined;
  };

  const animate = (startHeight, endHeight, open) => {
    details.style.height = `${startHeight}px`;
    details.style.overflow = 'hidden';
    animation = details.animate(
      { height: [`${startHeight}px`, `${endHeight}px`] },
      { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)' }
    );
    animation.onfinish = () => finish(open);
    animation.oncancel = () => { animation = undefined; };
  };

  summary.addEventListener('click', (event) => {
    event.preventDefault();
    const startHeight = details.getBoundingClientRect().height;
    if (animation) animation.cancel();

    if (details.open) {
      animate(startHeight, closedHeight(), false);
      return;
    }

    details.open = true;
    details.classList.add('is-opening');
    const endHeight = details.scrollHeight;
    animate(startHeight, endHeight, true);
  });
});

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
    item.style.setProperty('--reveal-delay', `${Math.min(order, 3) * 105}ms`);
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
