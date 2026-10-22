/* ФИЛИН — общий интерактив всех страниц */
(() => {
  'use strict';

  /* Безопасное хранилище (демо работает и при отключённом localStorage) */
  const store = {
    get(key) {
      try { return JSON.parse(localStorage.getItem(key)); }
      catch (e) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); }
      catch (e) { /* приватный режим — демо продолжит работать без памяти */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) { /* noop */ }
    },
  };
  window.FilinStore = store;

  /* Шапка при скролле */
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Мобильное меню */
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

  /* Появление при скролле */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* Счётчики (главная) */
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = target * easeOut(progress);
      el.textContent = (decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('ru-RU')) + suffix;
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

  /* Ссылки «Записаться» с предвыбором услуги/мастера */
  document.querySelectorAll('[data-service]').forEach((el) => {
    el.addEventListener('click', () => store.set('filin-pick', { service: el.dataset.service }));
  });
  document.querySelectorAll('[data-master]').forEach((el) => {
    el.addEventListener('click', () => {
      const prev = store.get('filin-pick') || {};
      store.set('filin-pick', { ...prev, master: el.dataset.master });
    });
  });

  /* Фильтр категорий на странице услуг */
  const chips = document.querySelectorAll('.filters .chip');
  if (chips.length) {
    const rows = document.querySelectorAll('.price-table .price-row');
    const emptyNote = document.getElementById('empty-note');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.toggle('is-active', c === chip));
        const filter = chip.dataset.filter;
        let visible = 0;
        rows.forEach((row) => {
          const match = filter === 'all' || row.dataset.cat === filter;
          row.classList.toggle('hide', !match);
          if (match) visible++;
        });
        if (emptyNote) emptyNote.hidden = visible > 0;
      });
    });
  }

  /* ============================================================
     МОИ ЗАПИСИ
     ============================================================ */
  const apptList = document.getElementById('appointments-list');
  if (apptList) {
    const emptyBox = document.getElementById('appointments-empty');
    const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

    const fmtDate = (d) => `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;

    function renderAppointments() {
      const items = store.get('filin-appointments');
      const safe = Array.isArray(items) ? items.filter((a) => a && a.date && a.time) : [];
      apptList.innerHTML = '';

      const now = new Date();
      const todayStr = new Date().toDateString();
      const enriched = safe.map((a) => ({ ...a, dt: new Date(a.date + 'T' + a.time) }));
      const upcoming = enriched.filter((a) => !isNaN(a.dt) && a.dt >= now).sort((a, b) => a.dt - b.dt);
      const past = enriched.filter((a) => isNaN(a.dt) || a.dt < now).sort((a, b) => b.dt - a.dt);
      const ordered = [...upcoming, ...past];

      if (!ordered.length) {
        emptyBox.hidden = false;
        return;
      }
      emptyBox.hidden = true;

      ordered.forEach((a) => {
        const isUpcoming = !isNaN(a.dt) && a.dt >= now;
        const isToday = isUpcoming && a.dt.toDateString() === todayStr;
        const li = document.createElement('article');
        li.className = 'appt-card card-flat' + (isUpcoming ? '' : ' is-past');

        const status = isToday
          ? '<span class="appt-status s-today">сегодня</span>'
          : isUpcoming
            ? '<span class="appt-status s-upcoming">предстоит</span>'
            : '<span class="appt-status s-past">прошла</span>';

        li.innerHTML = `
          <div class="appt-date">
            <strong>${a.dt.getDate()}</strong>
            <span>${MONTHS_GEN[a.dt.getMonth()].slice(0, 3)}</span>
            <em>${WEEKDAYS[a.dt.getDay()]}</em>
          </div>
          <div class="appt-info">
            <strong>${a.serviceName}</strong>
            <span>${a.time} · мастер: ${a.masterName}</span>
            <span class="muted">${a.name} · ${a.phone}</span>
            ${status}
          </div>
          <div class="appt-side">
            <span class="appt-price">${a.price.toLocaleString('ru-RU')} ₽</span>
            ${isUpcoming ? `
              <div class="appt-cancel" data-id="${a.id}">
                <button type="button" class="btn btn-danger btn-sm" data-act="ask">Отменить</button>
              </div>` : ''}
          </div>`;
        apptList.appendChild(li);
      });
    }

    apptList.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const wrap = btn.closest('.appt-cancel');
      const id = wrap?.dataset.id;

      if (btn.dataset.act === 'ask') {
        wrap.innerHTML = `
          <span>Отменить запись?</span>
          <button type="button" class="btn btn-danger btn-sm" data-act="yes">Да</button>
          <button type="button" class="btn btn-line btn-sm" data-act="no">Нет</button>`;
        return;
      }
      if (btn.dataset.act === 'no') {
        renderAppointments();
        return;
      }
      if (btn.dataset.act === 'yes' && id) {
        const items = (store.get('filin-appointments') || []).filter((a) => String(a.id) !== String(id));
        store.set('filin-appointments', items);
        renderAppointments();
      }
    });

    renderAppointments();
  }

  /* ============================================================
     КОНТАКТЫ: форма
     ============================================================ */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const success = document.getElementById('contact-success');
    const again = document.getElementById('contact-again');

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      ['cf-name', 'cf-contact'].forEach((id) => {
        const input = document.getElementById(id);
        const bad = !input.value.trim();
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

    again.addEventListener('click', () => {
      success.hidden = true;
      contactForm.reset();
      contactForm.hidden = false;
    });
  }
})();
