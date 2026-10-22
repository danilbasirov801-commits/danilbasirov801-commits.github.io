/* УТРО — дыхание hero, цитаты-печатная машинка, расписание-аккордеон, chime, форма */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- меню ---------- */
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

  /* ---------- появление: мягкие 600 мс ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* ============================================================
     Opt-in колокольчик: включается кнопкой, звучит один раз
     при первом скролле после включения
     ============================================================ */
  let soundOn = false;
  let chimePlayed = false;
  let audioCtx = null;
  const soundBtn = document.getElementById('sound-toggle');

  function playChime() {
    try {
      audioCtx = audioCtx || new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t0 = audioCtx.currentTime;
      [[880, 0.0], [1318.5, 0.09]].forEach(([freq, delay]) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t0 + delay);
        g.gain.exponentialRampToValueAtTime(0.045, t0 + delay + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + delay + 1.9);
        o.connect(g).connect(audioCtx.destination);
        o.start(t0 + delay);
        o.stop(t0 + delay + 2);
      });
    } catch (e) { /* тишина — тоже вариант */ }
  }

  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.textContent = soundOn ? 'звук вкл' : 'звук выкл';
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.classList.toggle('on', soundOn);
    if (soundOn) {
      try { audioCtx = audioCtx || new AudioContext(); audioCtx.resume(); } catch (e) { /* noop */ }
      chimePlayed = false; // снова готовы к колокольчику при первом скролле
    }
  });

  window.addEventListener('scroll', () => {
    if (soundOn && !chimePlayed && window.scrollY > 40) {
      chimePlayed = true;
      playChime();
    }
  }, { passive: true });

  /* ============================================================
     Цитаты преподавателей: печатаем по символу на hover
     (на тач-устройствах — при появлении карточки)
     ============================================================ */
  document.querySelectorAll('.teach-quote').forEach((el) => {
    const full = el.dataset.quote;
    let typed = false;

    const type = () => {
      if (typed || reduced) { el.textContent = full; typed = true; return; }
      typed = true;
      let i = 0;
      const step = () => {
        el.textContent = full.slice(0, ++i);
        if (i < full.length) setTimeout(step, 24);
      };
      step();
    };

    el.closest('.teach-row').addEventListener('mouseenter', type);
    // на тач-устройствах hover нет — печатаем, когда карточка входит в экран
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && matchMedia('(hover: none)').matches) {
          type();
          io.disconnect();
        }
      });
    }, { threshold: 0.5 });
    io.observe(el.closest('.teach-row'));
  });

  /* ============================================================
     Расписание: строки-аккордеон
     ============================================================ */
  document.querySelectorAll('.sched-head:not([disabled])').forEach((head) => {
    head.addEventListener('click', () => {
      const row = head.closest('.sched-row');
      const open = row.classList.toggle('open');
      head.setAttribute('aria-expanded', String(open));
      // одна раскрытая строка за раз — спокойнее
      document.querySelectorAll('.sched-row.open').forEach((other) => {
        if (other !== row) {
          other.classList.remove('open');
          other.querySelector('.sched-head').setAttribute('aria-expanded', 'false');
        }
      });
    });
  });

  /* ============================================================
     Форма первого класса
     ============================================================ */
  const form = document.getElementById('first-form');
  const done = document.getElementById('ff-done');
  const summary = document.getElementById('ff-summary');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    const name = document.getElementById('ff-name');
    const phone = document.getElementById('ff-phone');
    if (name.value.trim().length < 2) { name.classList.add('err'); name.focus(); valid = false; }
    if (phone.value.replace(/\D/g, '').length < 10) { phone.classList.add('err'); if (valid) phone.focus(); valid = false; }
    if (!valid) {
      setTimeout(() => { name.classList.remove('err'); phone.classList.remove('err'); }, 1600);
      return;
    }
    const practice = document.getElementById('ff-practice').value;
    summary.textContent =
      `${name.value.trim()}, записали вас на «${practice}». Подтвердим день и время по телефону — спокойно, без звонков в 7 утра.`;
    form.hidden = true;
    done.hidden = false;
  });
})();
