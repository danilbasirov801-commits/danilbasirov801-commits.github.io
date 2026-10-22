/* «Крошка» — интерактив: меню, форма заявки */
(() => {
  'use strict';

  // Мобильное меню
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
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

  // Форма заявки (демо, без отправки на сервер)
  const form = document.getElementById('order-form');
  const success = document.getElementById('order-success');
  const again = document.getElementById('order-again');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    ['of-name', 'of-phone'].forEach((id) => {
      const input = document.getElementById(id);
      const bad = !input.value.trim() || (input.type === 'tel' && input.value.replace(/\D/g, '').length < 10);
      input.classList.toggle('err', bad);
      if (bad && valid) {
        input.focus();
        valid = false;
      }
    });
    if (!valid) return;
    form.hidden = true;
    success.hidden = false;
  });

  again.addEventListener('click', () => {
    success.hidden = true;
    form.reset();
    form.hidden = false;
  });
})();
