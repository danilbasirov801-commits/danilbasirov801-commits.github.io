/* ФИЛИН — визард онлайн-записи (booking.html) */
(() => {
  'use strict';

  const serviceOptions = document.getElementById('service-options');
  if (!serviceOptions) return; // скрипт нужен только на странице записи

  const store = window.FilinStore;

  const SERVICES = {
    s1: { name: 'Мужская стрижка', price: 2000, dur: 60 },
    s2: { name: 'Стрижка машинкой', price: 1200, dur: 30 },
    s3: { name: 'Фейд / кроп', price: 2200, dur: 60 },
    s4: { name: 'Детская стрижка', price: 1400, dur: 45 },
    b1: { name: 'Оформление бороды', price: 1500, dur: 45 },
    b2: { name: 'Бритьё опасной бритвой', price: 1800, dur: 45 },
    b3: { name: 'Окантовка бороды', price: 900, dur: 20 },
    c1: { name: '«Филин»: стрижка + борода', price: 3200, dur: 90 },
    c2: { name: '«Отец и сын»', price: 3000, dur: 90 },
    c3: { name: '«Всё включено»', price: 4500, dur: 120 },
    u1: { name: 'Камуфляж седины', price: 1600, dur: 45 },
    u2: { name: 'Уход за бородой', price: 800, dur: 20 },
    u3: { name: 'Чёрный пилинг лица', price: 1700, dur: 30 },
    u4: { name: 'Тонирование волос', price: 1900, dur: 45 },
  };
  const MASTERS = {
    any: { name: 'Любой мастер', note: 'подберём свободного — обычно быстрее' },
    m1: { name: 'Гриша «Топор» Ковалёв', note: 'топ-барбер · 11 лет' },
    m2: { name: 'Тимур Салихов', note: 'барбер · фейды и кропы' },
    m3: { name: 'Данила Орлов', note: 'барбер-стилист · тонирование' },
    m4: { name: 'Марк Гельман', note: 'мастер бороды · 8 лет' },
  };

  const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

  const $ = (id) => document.getElementById(id);
  const stepsEls = [...document.querySelectorAll('.step')];
  const panels = [...document.querySelectorAll('.wizard-panel')];
  const errBox = $('step-error');
  const btnBack = $('btn-back');
  const btnNext = $('btn-next');
  const navBox = $('wizard-nav');
  const successBox = $('wizard-success');
  const successSummary = $('success-summary');
  const masterOptions = $('master-options');
  const calGrid = $('cal-grid');
  const calLabel = $('cal-label');
  const calPrev = $('cal-prev');
  const calNext = $('cal-next');
  const slotsGrid = $('slots-grid');
  const slotsTitle = $('slots-title');
  const slotsEmpty = $('slots-empty');
  const reviewBox = $('review-box');
  const bfName = $('bf-name');
  const bfPhone = $('bf-phone');
  const bfNote = $('bf-note');

  const state = { step: 1, service: null, master: 'any', date: null, time: null, offset: 0 };

  const fmtPrice = (v) => v.toLocaleString('ru-RU') + ' ₽';
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const toISO = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const initials = (name) => {
    const parts = name.replace(/«|»/g, '').split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
  };

  function showError(msg) {
    errBox.textContent = msg;
    errBox.hidden = false;
  }
  function clearError() { errBox.hidden = true; }
  function markInput(input) {
    input.classList.add('err');
    input.focus();
    input.addEventListener('input', () => input.classList.remove('err'), { once: true });
  }

  /* ---------- предвыбор с других страниц ---------- */
  const pick = store.get('filin-pick');
  if (pick && typeof pick === 'object') {
    if (pick.service && SERVICES[pick.service]) state.service = pick.service;
    if (pick.master && MASTERS[pick.master]) state.master = pick.master;
  }

  /* ---------- шаг 1: услуги ---------- */
  function syncSelection(container, id, useText) {
    container.querySelectorAll('button').forEach((b) => {
      const active = useText ? b.textContent === id : b.dataset.id === id;
      b.classList.toggle('is-selected', active);
    });
  }

  function renderServices() {
    serviceOptions.innerHTML = '';
    Object.entries(SERVICES).forEach(([id, s]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'svc-option' + (state.service === id ? ' is-selected' : '');
      b.dataset.id = id;
      b.innerHTML = `<span class="svc-name">${s.name}</span><span class="svc-meta">${s.dur} мин</span><span class="svc-price">${fmtPrice(s.price)}</span>`;
      b.addEventListener('click', () => {
        state.service = id;
        clearError();
        syncSelection(serviceOptions, id);
        updateSummary();
      });
      serviceOptions.appendChild(b);
    });
  }

  /* ---------- шаг 2: мастера ---------- */
  function renderMasters() {
    masterOptions.innerHTML = '';
    Object.entries(MASTERS).forEach(([id, m]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'master-option' + (state.master === id ? ' is-selected' : '');
      b.dataset.id = id;
      b.innerHTML = `
        <span class="avatar">${id === 'any' ? '??' : initials(m.name)}</span>
        <span><span class="mo-name">${m.name}</span><span class="mo-note">${m.note}</span></span>`;
      b.addEventListener('click', () => {
        state.master = id;
        clearError();
        syncSelection(masterOptions, id);
        updateSummary();
        if (state.date) renderSlots(); // занятость зависит от мастера
      });
      masterOptions.appendChild(b);
    });
  }

  /* ---------- шаг 3: календарь (14 дней, по неделе) ---------- */
  function renderCal() {
    const base = addDays(startOfToday(), state.offset * 7);
    calLabel.textContent = cap(base.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }));
    calPrev.disabled = state.offset === 0;
    calNext.disabled = state.offset === 1;
    calGrid.innerHTML = '';

    const makeDay = (d) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cal-day';
      const iso = toISO(d);
      if (state.date === iso) b.classList.add('is-selected');
      b.innerHTML = `<span class="cd-wd">${WEEKDAYS[(d.getDay() + 6) % 7]}</span><span class="cd-num">${d.getDate()}</span>`;
      b.addEventListener('click', () => {
        state.date = iso;
        state.time = null;
        clearError();
        renderCal();
        renderSlots();
        updateSummary();
      });
      return b;
    };

    // каждая строка сетки — календарная неделя пн—вс: пустые ячейки до первого дня
    const makePad = () => {
      const pad = document.createElement('span');
      pad.className = 'cal-pad';
      return pad;
    };
    let i = 0;
    while (i < 14) {
      const wdIdx = (addDays(base, i).getDay() + 6) % 7;
      for (let c = 0; c < wdIdx; c++) calGrid.appendChild(makePad());
      for (let c = wdIdx; c < 7 && i < 14; c++) {
        calGrid.appendChild(makeDay(addDays(base, i)));
        i++;
      }
    }
  }

  calPrev.addEventListener('click', () => { state.offset = Math.max(0, state.offset - 1); renderCal(); });
  calNext.addEventListener('click', () => { state.offset = Math.min(1, state.offset + 1); renderCal(); });

  /* ---------- шаг 3: слоты времени ---------- */
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  // Стабильная «занятость»: одинаковые слоты заняты/свободны при каждом заходе
  function isOccupied(date, time, master) {
    const h = hash(`${date}|${time}|${master}`);
    return h % 100 < (master === 'any' ? 20 : 30);
  }

  function renderSlots() {
    slotsGrid.innerHTML = '';
    if (!state.date) {
      slotsTitle.textContent = 'Выберите день';
      slotsEmpty.hidden = false;
      return;
    }
    slotsEmpty.hidden = true;
    const d = new Date(state.date + 'T00:00');
    slotsTitle.textContent = cap(d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }));

    const minTime = Date.now() + 45 * 60000; // на сегодня — только слоты, до которых ≥45 минут
    for (let m = 10 * 60; m <= 20 * 60 + 30; m += 30) {
      const t = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot' + (state.time === t ? ' is-selected' : '');
      b.textContent = t;

      const slotTime = new Date(state.date + 'T' + t).getTime();
      if (slotTime < minTime) {
        b.disabled = true;
        b.title = 'Уже не успеть — выберите позже';
      } else if (isOccupied(state.date, t, state.master)) {
        b.disabled = true;
        b.title = 'Занято';
      } else {
        b.addEventListener('click', () => {
          state.time = t;
          clearError();
          syncSelection(slotsGrid, t, true);
          updateSummary();
        });
      }
      slotsGrid.appendChild(b);
    }
  }

  /* ---------- сводка ---------- */
  function fmtDateLong(iso) {
    const d = new Date(iso + 'T00:00');
    return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}, ${WEEKDAYS[(d.getDay() + 6) % 7]}`;
  }

  function updateSummary() {
    const s = state.service ? SERVICES[state.service] : null;
    const m = MASTERS[state.master];
    $('sum-service').textContent = s ? s.name : '—';
    $('sum-duration').textContent = s ? s.dur + ' мин' : '—';
    $('sum-master').textContent = m ? m.name : '—';
    $('sum-date').textContent = state.date ? fmtDateLong(state.date) : '—';
    $('sum-time').textContent = state.time || '—';
    $('sum-price').textContent = s ? fmtPrice(s.price) : '—';
  }

  /* ---------- шаг 4: подтверждение ---------- */
  function renderReview() {
    const s = SERVICES[state.service];
    const m = MASTERS[state.master];
    reviewBox.innerHTML = `
      <div class="review-row"><dt>Услуга</dt><dd>${s.name}</dd></div>
      <div class="review-row"><dt>Мастер</dt><dd>${m.name}</dd></div>
      <div class="review-row"><dt>Дата</dt><dd>${fmtDateLong(state.date)}</dd></div>
      <div class="review-row"><dt>Время</dt><dd>${state.time}</dd></div>
      <div class="review-row"><dt>Длительность</dt><dd>${s.dur} мин</dd></div>
      <div class="review-row"><dt>Стоимость</dt><dd>${fmtPrice(s.price)} — оплата на месте</dd></div>`;
  }

  /* ---------- навигация ---------- */
  function render() {
    panels.forEach((p) => { p.hidden = Number(p.dataset.panel) !== state.step; });
    stepsEls.forEach((el) => {
      const n = Number(el.dataset.step);
      el.classList.toggle('is-current', n === state.step);
      el.classList.toggle('is-done', n < state.step);
    });
    btnBack.disabled = state.step === 1;
    btnNext.textContent = state.step === 4 ? 'Подтвердить запись' : 'Далее';
  }

  function validate() {
    if (state.step === 1 && !state.service) return 'Выберите услугу — без неё дальше никак.';
    if (state.step === 3 && (!state.date || !state.time)) return 'Выберите дату и свободное время в календаре.';
    if (state.step === 4) {
      if (bfName.value.trim().length < 2) {
        markInput(bfName);
        return 'Напишите имя — как к вам обращаться.';
      }
      if (bfPhone.value.replace(/\D/g, '').length < 10) {
        markInput(bfPhone);
        return 'Проверьте телефон: нужно не меньше 10 цифр.';
      }
    }
    return null;
  }

  function submit() {
    const s = SERVICES[state.service];
    const m = MASTERS[state.master];
    const items = store.get('filin-appointments');
    const arr = Array.isArray(items) ? items : [];
    arr.push({
      id: Date.now(),
      serviceId: state.service,
      serviceName: s.name,
      masterId: state.master,
      masterName: m.name,
      date: state.date,
      time: state.time,
      price: s.price,
      dur: s.dur,
      name: bfName.value.trim(),
      phone: bfPhone.value.trim(),
      note: bfNote.value.trim(),
    });
    store.set('filin-appointments', arr);
    store.remove('filin-pick');

    stepsEls.forEach((el) => { el.hidden = true; });
    panels.forEach((el) => { el.hidden = true; });
    navBox.hidden = true;
    errBox.hidden = true;
    successSummary.textContent =
      `${s.name} · ${fmtDateLong(state.date)} в ${state.time} · ${m.name}. ` +
      `${fmtPrice(s.price)} — оплата на месте. Подтверждение уже летит на ${bfPhone.value.trim()}.`;
    successBox.hidden = false;
    successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  btnNext.addEventListener('click', () => {
    const err = validate();
    if (err) { showError(err); return; }
    clearError();
    if (state.step === 4) { submit(); return; }
    state.step++;
    if (state.step === 4) renderReview();
    render();
  });

  btnBack.addEventListener('click', () => {
    state.step = Math.max(1, state.step - 1);
    clearError();
    render();
  });

  /* ---------- старт ---------- */
  renderServices();
  renderMasters();
  renderCal();
  renderSlots();
  updateSummary();
  render();
})();
