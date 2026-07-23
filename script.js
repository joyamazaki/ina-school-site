
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

const createLoopCarousel = ({
  root,
  track,
  slides,
  dots,
  dragSurface,
  interval,
  autoplay = true,
  onChange
}) => {
  if (!root || !track || !slides.length) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pauseReasons = new Set();
  let current = 0;
  let trackIndex = slides.length > 1 ? 1 : 0;
  let timer;
  let remaining = interval;
  let startedAt = 0;
  let dragging = false;
  let horizontalDrag = false;
  let pointerId;
  let pointerType = '';
  let startX = 0;
  let startY = 0;
  let deltaX = 0;

  if (!autoplay) root.classList.add('manual');

  if (slides.length > 1) {
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides.at(-1).cloneNode(true);
    [firstClone, lastClone].forEach((clone) => {
      clone.classList.remove('active');
      clone.classList.add('slide-clone');
      clone.setAttribute('aria-hidden', 'true');
    });
    track.prepend(lastClone);
    track.append(firstClone);
  } else {
    root.classList.add('is-single');
  }

  const moveTrack = (index, animate = true, dragOffset = 0) => {
    track.classList.toggle('no-transition', !animate);
    const offset = dragOffset
      ? ` ${dragOffset > 0 ? '+' : '-'} ${Math.abs(dragOffset)}px`
      : '';
    track.style.transform = `translate3d(calc(-${index * 100}%${offset}), 0, 0)`;
    if (!animate) {
      void track.offsetWidth;
      track.classList.remove('no-transition');
    }
  };

  const updateUi = () => {
    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === current);
      slide.setAttribute('aria-hidden', index === current ? 'false' : 'true');
    });
    dots.forEach((dot) => dot.classList.remove('active', 'complete'));
    void root.offsetWidth;
    dots.forEach((dot, index) => {
      dot.classList.toggle('complete', index < current);
      dot.classList.toggle('active', index === current);
      dot.setAttribute('aria-current', index === current ? 'true' : 'false');
    });
    if (onChange) onChange(current);
  };

  const schedule = (delay = interval) => {
    clearTimeout(timer);
    remaining = delay;
    if (!autoplay || reducedMotion || pauseReasons.size || slides.length < 2) return;
    startedAt = performance.now();
    timer = setTimeout(() => show(current + 1), delay);
  };

  const show = (index, animate = true) => {
    if (index >= slides.length) {
      current = 0;
      trackIndex = slides.length + 1;
    } else if (index < 0) {
      current = slides.length - 1;
      trackIndex = 0;
    } else {
      current = index;
      trackIndex = index + 1;
    }
    updateUi();
    moveTrack(trackIndex, animate && !reducedMotion);
    schedule();
  };

  const pause = (reason) => {
    if (!autoplay || reducedMotion || slides.length < 2 || pauseReasons.has(reason)) return;
    if (!pauseReasons.size) {
      remaining = Math.max(0, remaining - (performance.now() - startedAt));
      clearTimeout(timer);
    }
    pauseReasons.add(reason);
    root.classList.add('paused');
  };

  const resume = (reason) => {
    if (!autoplay || reducedMotion || !pauseReasons.has(reason)) return;
    pauseReasons.delete(reason);
    if (pauseReasons.size) return;
    root.classList.remove('paused');
    schedule(Math.max(remaining, 100));
  };

  track.addEventListener('transitionend', (event) => {
    if (event.propertyName !== 'transform') return;
    if (trackIndex === 0) {
      trackIndex = slides.length;
      moveTrack(trackIndex, false);
    } else if (trackIndex === slides.length + 1) {
      trackIndex = 1;
      moveTrack(trackIndex, false);
    }
  });

  dots.forEach((dot, index) => dot.addEventListener('click', () => show(index)));
  root.addEventListener('mouseenter', () => pause('hover'));
  root.addEventListener('mouseleave', () => resume('hover'));
  root.addEventListener('focusin', () => pause('focus'));
  root.addEventListener('focusout', () => resume('focus'));

  if (dragSurface && slides.length > 1) {
    const finishDrag = (event, cancelled = false) => {
      if (!dragging || event.pointerId !== pointerId) return;
      if (dragSurface.hasPointerCapture(pointerId)) dragSurface.releasePointerCapture(pointerId);
      dragging = false;
      dragSurface.classList.remove('is-dragging');
      const threshold = Math.min(48, dragSurface.clientWidth * 0.1);
      if (!cancelled && horizontalDrag && Math.abs(deltaX) >= threshold) {
        show(current + (deltaX < 0 ? 1 : -1));
      } else {
        moveTrack(trackIndex, !reducedMotion);
      }
      horizontalDrag = false;
      pointerType = '';
      deltaX = 0;
      resume('drag');
    };

    dragSurface.addEventListener('dragstart', (event) => event.preventDefault());
    dragSurface.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      dragging = true;
      horizontalDrag = false;
      pointerId = event.pointerId;
      pointerType = event.pointerType;
      startX = event.clientX;
      startY = event.clientY;
      deltaX = 0;
      pause('drag');
    });
    dragSurface.addEventListener('pointermove', (event) => {
      if (!dragging || event.pointerId !== pointerId) return;
      const nextDeltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      if (!horizontalDrag) {
        if (Math.abs(nextDeltaX) < 7 && Math.abs(deltaY) < 7) return;
        if (Math.abs(deltaY) > Math.abs(nextDeltaX)) {
          finishDrag(event, true);
          return;
        }
        horizontalDrag = true;
        dragSurface.classList.add('is-dragging');
        if (!dragSurface.hasPointerCapture(pointerId)) {
          dragSurface.setPointerCapture(pointerId);
        }
      }
      event.preventDefault();
      const limit = dragSurface.clientWidth * 0.42;
      deltaX = Math.max(-limit, Math.min(limit, nextDeltaX));
      moveTrack(trackIndex, false, deltaX);
    });
    dragSurface.addEventListener('pointerup', (event) => finishDrag(event));
    dragSurface.addEventListener('pointercancel', (event) => finishDrag(event, true));
    dragSurface.addEventListener('pointerleave', (event) => {
      if (pointerType === 'mouse') finishDrag(event);
    });
  }

  updateUi();
  moveTrack(trackIndex, false);
  schedule();
};

const slider = document.querySelector('[data-slider]');
if (slider) {
  const track = slider.querySelector('.slides');
  const slides = [...slider.querySelectorAll('.slide')];
  const dots = [...slider.querySelectorAll('.slider-dot')];
  const captions = slides.map((slide) => (slide.dataset.caption || '').split('|'));
  const caption = slider.querySelector('[data-slider-caption]');
  createLoopCarousel({
    root: slider,
    track,
    slides,
    dots,
    dragSurface: track,
    interval: 4300,
    onChange: (current) => {
      if (!caption) return;
      caption.replaceChildren();
      captions[current].forEach((text, index) => {
        if (index > 0) caption.append(document.createElement('wbr'));
        const phrase = document.createElement('span');
        phrase.className = 'keep-together';
        phrase.textContent = text;
        caption.append(phrase);
      });
    }
  });
}

const voiceSlider = document.querySelector('[data-voice-slider]');
if (voiceSlider) {
  const track = voiceSlider.querySelector('.voice-track');
  const slides = [...voiceSlider.querySelectorAll('.voice-slide')];
  const dotsContainer = voiceSlider.querySelector('.voice-dots');
  const attribution = voiceSlider.querySelector('[data-voice-attribution]');
  const fullImageLink = voiceSlider.querySelector('[data-voice-link]');
  const dots = slides.map((_, index) => {
    const dot = document.createElement('button');
    dot.className = 'voice-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `${index + 1}枚目`);
    dotsContainer.append(dot);
    return dot;
  });
  createLoopCarousel({
    root: voiceSlider,
    track,
    slides,
    dots,
    dragSurface: voiceSlider.querySelector('.voice-viewport'),
    interval: 6000,
    autoplay: false,
    onChange: (current) => {
      const slide = slides[current];
      if (attribution) attribution.textContent = slide.dataset.attribution || '';
      if (fullImageLink) {
        const fullImage = slide.dataset.fullImage;
        fullImageLink.hidden = !fullImage;
        if (fullImage) fullImageLink.href = fullImage;
      }
    }
  });
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
  '.voice-slider',
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

const mobileCta = document.querySelector('.mobile-cta');
if (mobileCta) {
  const showAfter = 180;
  let scrollTicking = false;

  const updateMobileCta = () => {
    mobileCta.classList.toggle('is-visible', window.scrollY >= showAfter);
    scrollTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateMobileCta);
  }, { passive: true });

  updateMobileCta();
}
