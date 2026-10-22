/* ОРБИТА — общий интерактив для всех страниц */
(() => {
  'use strict';

  // Состояние шапки при скролле
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Мобильное меню
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  // Появление элементов при скролле
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  // Анимированные счётчики (главная)
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * easeOut(progress)).toLocaleString('ru-RU') + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll('.stat-value[data-count]').forEach((el) => counterObserver.observe(el));

  // Афиша: табы по дням
  const tabs = document.querySelectorAll('.tab[data-tab]');
  const panels = document.querySelectorAll('.day-panel[data-panel]');
  if (tabs.length && panels.length) {
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => {
          t.classList.toggle('is-active', t === tab);
          t.setAttribute('aria-selected', String(t === tab));
        });
        panels.forEach((p) => {
          const active = p.dataset.panel === tab.dataset.tab;
          p.hidden = !active;
        });
      });
    });
  }

  /* ===== Билеты: форма бронирования ===== */
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    const success = document.getElementById('booking-success');
    const summary = document.getElementById('booking-summary');
    const againBtn = document.getElementById('booking-again');
    const totalEl = document.getElementById('booking-total');
    const qtyValue = document.getElementById('qty-value');
    const dateInput = document.getElementById('visit-date');
    const timeSelect = document.getElementById('visit-time');

    // не даём выбрать прошедшую дату
    dateInput.min = new Date().toISOString().split('T')[0];

    const PRICES = { adult: 'билет', few: 'билета', many: 'билетов' };
    const plural = (n) => {
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return PRICES.adult;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return PRICES.few;
      return PRICES.many;
    };
    const formatPrice = (v) => v.toLocaleString('ru-RU') + ' ₽';

    let qty = 2;
    const renderTotal = () => {
      const price = parseInt(bookingForm.elements.tariff.value, 10);
      totalEl.textContent = formatPrice(price * qty);
      qtyValue.textContent = qty;
    };

    document.getElementById('qty-dec').addEventListener('click', () => {
      qty = Math.max(1, qty - 1);
      renderTotal();
    });
    document.getElementById('qty-inc').addEventListener('click', () => {
      qty = Math.min(10, qty + 1);
      renderTotal();
    });
    bookingForm.elements.tariff.forEach((radio) => radio.addEventListener('change', renderTotal));

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!dateInput.value) {
        dateInput.classList.add('err');
        dateInput.focus();
        setTimeout(() => dateInput.classList.remove('err'), 1500);
        return;
      }
      const price = parseInt(bookingForm.elements.tariff.value, 10);
      const tariffName = bookingForm.querySelector('.pill input:checked + span').textContent.toLowerCase();
      const date = new Date(dateInput.value + 'T00:00').toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      });
      const time = timeSelect.value ? `, купол в ${timeSelect.value}` : '';
      summary.textContent =
        `${qty} ${plural(qty)} (тариф «${tariffName}») на ${date}${time} — ${formatPrice(price * qty)}. ` +
        `QR-билет уже летит к вам в SMS.`;
      bookingForm.hidden = true;
      success.hidden = false;
    });

    againBtn.addEventListener('click', () => {
      success.hidden = true;
      bookingForm.hidden = false;
      renderTotal();
    });

    renderTotal();
  }

  /* ===== Контакты: форма обратной связи ===== */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const success = document.getElementById('contact-success');
    const againBtn = document.getElementById('contact-again');

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      ['cf-name', 'cf-email', 'cf-message'].forEach((id) => {
        const input = document.getElementById(id);
        const bad = !input.value.trim() || (input.type === 'email' && !input.checkValidity());
        input.classList.toggle('err', bad);
        if (bad && valid) {
          input.focus();
          valid = false;
        }
      });
      if (!valid) return;
      contactForm.hidden = true;
      success.hidden = false;
    });

    againBtn.addEventListener('click', () => {
      success.hidden = true;
      contactForm.reset();
      contactForm.hidden = false;
    });
  }
})();
