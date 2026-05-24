/**
 * Слайдер с 4 слайдами, автопрокруткой каждые 3 секунды и ручным управлением.
 */
(function () {
  'use strict';

  const SLIDES = [
    {
      title: 'Учитесь в удобном темпе',
      caption: 'Онлайн-курсы ДПО с поддержкой преподавателей и понятной программой.',
      bg: '#fef3c7',
      accent: '#f59e0b',
      icon: '🎓',
    },
    {
      title: 'Получите документ',
      caption: 'По окончании обучения вы получите удостоверение установленного образца.',
      bg: '#dbeafe',
      accent: '#3b82f6',
      icon: '📜',
    },
    {
      title: 'Программы для роста',
      caption: 'Курсы по программированию, веб-дизайну и проектированию баз данных.',
      bg: '#dcfce7',
      accent: '#10b981',
      icon: '💻',
    },
    {
      title: 'Удобная оплата',
      caption: 'Оплатите курс наличными или переводом по номеру телефона.',
      bg: '#fce7f3',
      accent: '#ec4899',
      icon: '💳',
    },
  ];

  function slideSvg({ bg, accent, icon }) {
    return `
      <svg viewBox="0 0 800 350" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${bg}"/>
            <stop offset="100%" stop-color="#fff"/>
          </linearGradient>
        </defs>
        <rect width="800" height="350" fill="url(#g)"/>
        <circle cx="660" cy="80" r="60" fill="${accent}" opacity="0.25"/>
        <circle cx="720" cy="280" r="90" fill="${accent}" opacity="0.18"/>
        <circle cx="140" cy="290" r="50" fill="${accent}" opacity="0.20"/>
        <text x="50%" y="48%" text-anchor="middle" font-size="120" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">${icon}</text>
      </svg>
    `;
  }

  function build(root) {
    root.innerHTML = `
      <div class="slider-track">
        ${SLIDES.map(
          (s) => `
          <div class="slider-slide">
            ${slideSvg(s)}
            <div class="slider-caption">
              <h3>${s.title}</h3>
              <p>${s.caption}</p>
            </div>
          </div>
        `
        ).join('')}
      </div>
      <button class="slider-btn prev" aria-label="Назад">‹</button>
      <button class="slider-btn next" aria-label="Вперед">›</button>
      <div class="slider-dots">
        ${SLIDES.map((_, i) => `<button class="slider-dot${i === 0 ? ' active' : ''}" data-i="${i}" aria-label="Слайд ${i + 1}"></button>`).join('')}
      </div>
    `;

    const track = root.querySelector('.slider-track');
    const dots = Array.from(root.querySelectorAll('.slider-dot'));
    let index = 0;
    let timer = null;

    const apply = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
    };

    const go = (i) => {
      index = (i + SLIDES.length) % SLIDES.length;
      apply();
    };

    const next = () => go(index + 1);
    const prev = () => go(index - 1);

    const start = () => {
      stop();
      timer = setInterval(next, 3000);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    root.querySelector('.slider-btn.next').addEventListener('click', () => {
      next();
      start();
    });
    root.querySelector('.slider-btn.prev').addEventListener('click', () => {
      prev();
      start();
    });
    dots.forEach((dot) =>
      dot.addEventListener('click', () => {
        go(parseInt(dot.dataset.i, 10));
        start();
      })
    );

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('touchstart', stop, { passive: true });
    root.addEventListener('touchend', start, { passive: true });

    apply();
    start();
  }

  function init() {
    document.querySelectorAll('[data-slider]').forEach(build);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
