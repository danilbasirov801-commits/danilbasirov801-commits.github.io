/* АКСИОМА — морфинг, треугольник, парабола, квиз, пошаговые решения */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Шапка и появление ---------- */
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

  /* ============================================================
     1. HERO: непрерывный морфинг фигуры
     ============================================================ */
  (() => {
    const path = document.getElementById('morph-path');
    const group = document.getElementById('morph-group');
    const idxEl = document.getElementById('shape-idx');
    const N = 110;

    // луч из центра → расстояние до границы многоугольника
    function radial(verts, theta) {
      const dx = Math.cos(theta), dy = Math.sin(theta);
      let best = 0;
      for (let i = 0; i < verts.length; i++) {
        const p = verts[i], q = verts[(i + 1) % verts.length];
        const denom = dx * (q[1] - p[1]) - dy * (q[0] - p[0]);
        if (Math.abs(denom) < 1e-9) continue;
        const t = (p[0] * (q[1] - p[1]) - p[1] * (q[0] - p[0])) / denom;
        if (t <= 1e-6) continue;
        // пересечение обязано лежать на самом отрезке, а не на его продолжении
        const ix = dx * t, iy = dy * t;
        const minX = Math.min(p[0], q[0]) - 1e-6, maxX = Math.max(p[0], q[0]) + 1e-6;
        const minY = Math.min(p[1], q[1]) - 1e-6, maxY = Math.max(p[1], q[1]) + 1e-6;
        if (ix < minX || ix > maxX || iy < minY || iy > maxY) continue;
        if (t > best) best = t;
      }
      return best || 1;
    }

    const TAU = Math.PI * 2;
    const shapes = [
      () => Array.from({ length: N }, (_, i) => 1.0),                                             // круг
      () => { const v = [[0, -1.1], [-0.95, 0.62], [0.95, 0.62]]; return Array.from({ length: N }, (_, i) => radial(v, (i / N) * TAU)); }, // треугольник
      () => { const v = [[-0.88, -0.88], [0.88, -0.88], [0.88, 0.88], [-0.88, 0.88]]; return Array.from({ length: N }, (_, i) => radial(v, (i / N) * TAU)); }, // квадрат
      () => { const v = Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + (i / 5) * TAU; return [Math.cos(a) * 1.08, Math.sin(a) * 1.08]; }); return Array.from({ length: N }, (_, i) => radial(v, (i / N) * TAU)); }, // пятиугольник
      () => { const v = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i / 10) * TAU; const r = i % 2 ? 0.46 : 1.12; return [Math.cos(a) * r, Math.sin(a) * r]; }); return Array.from({ length: N }, (_, i) => radial(v, (i / N) * TAU)); }, // звезда
    ];

    let cur = shapes[0]().map((r) => r * 74);
    let from = cur.slice();
    let to = cur.slice();
    let idx = 0;
    let t = 0;
    let hold = 900;
    const DUR = 1700;
    let prev = performance.now();
    let rot = 0;

    function frame(nowMs) {
      requestAnimationFrame(frame);
      if (reduced) return;
      const dt = Math.min(nowMs - prev, 50);
      prev = nowMs;
      t += dt;
      rot += dt * 0.00004;

      if (t >= hold + DUR) {
        t = 0;
        idx = (idx + 1) % shapes.length;
        from = to.slice();
        to = shapes[idx]().map((r) => r * 74);
        idxEl.textContent = idx + 1;
      }
      const p = Math.max(0, Math.min((t - hold) / DUR, 1));
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

      const pts = cur.map((r, i) => {
        const target = from[i] + (to[i] - from[i]) * e;
        cur[i] += (target - cur[i]) * Math.min(1, dt * 0.012);
        const a = (i / N) * TAU;
        return (110 + cur[i] * Math.cos(a)).toFixed(1) + ',' + (110 + cur[i] * Math.sin(a)).toFixed(1);
      }).join(' ');
      path.setAttribute('points', pts);
      group.setAttribute('transform', `rotate(${(rot * 57.3).toFixed(2)} 110 110)`);
    }
    path.setAttribute('points', cur.map((r, i) => {
      const a = (i / N) * TAU;
      return (110 + r * Math.cos(a)).toFixed(1) + ',' + (110 + r * Math.sin(a)).toFixed(1);
    }).join(' '));
    requestAnimationFrame(frame);
  })();

  /* ============================================================
     2. ТРЕУГОЛЬНИК: драг вершин + живые показания
     ============================================================ */
  (() => {
    const svg = document.getElementById('tri-svg');
    const line = document.getElementById('tri-line');
    const face = document.getElementById('tri-face');
    const arcs = document.getElementById('tri-arcs');
    const labels = document.getElementById('tri-labels');
    const handles = document.getElementById('tri-handles');
    const NS = 'http://www.w3.org/2000/svg';

    const V = [{ x: 70, y: 320 }, { x: 370, y: 320 }, { x: 210, y: 70 }];
    const NAMES = ['A', 'B', 'C'];

    const dots = NAMES.map((n, i) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', 10);
      c.dataset.i = i;
      handles.appendChild(c);
      return c;
    });
    const sideTexts = [0, 1, 2].map(() => {
      const t = document.createElementNS(NS, 'text');
      labels.appendChild(t);
      return t;
    });
    const angTexts = [0, 1, 2].map(() => {
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('class', 'ang');
      t.setAttribute('text-anchor', 'middle');
      labels.appendChild(t);
      return t;
    });

    const fmt = (v) => v.toFixed(1);
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    function render() {
      const pts = V.map((p) => `${p.x},${p.y}`).join(' ');
      line.setAttribute('points', pts);
      face.setAttribute('points', pts);
      dots.forEach((h, i) => { h.setAttribute('cx', V[i].x); h.setAttribute('cy', V[i].y); });

      const a = dist(V[1], V[2]);  // BC — против A
      const b = dist(V[0], V[2]);  // CA — против B
      const c = dist(V[0], V[1]);  // AB — против C
      const P = a + b + c;

      // углы по теореме косинусов
      const angA = Math.acos(Math.min(1, Math.max(-1, (b * b + c * c - a * a) / (2 * b * c))));
      const angB = Math.acos(Math.min(1, Math.max(-1, (a * a + c * c - b * b) / (2 * a * c))));
      const angC = Math.PI - angA - angB;
      const deg = (r) => (r * 180) / Math.PI;

      // площадь по формуле Герона
      const hp = P / 2;
      const S = Math.sqrt(Math.max(0, hp * (hp - a) * (hp - b) * (hp - c)));

      // подписи сторон (середины, со сдвигом наружу)
      const mids = [
        [(V[1].x + V[2].x) / 2, (V[1].y + V[2].y) / 2, 'a'],
        [(V[0].x + V[2].x) / 2, (V[0].y + V[2].y) / 2, 'b'],
        [(V[0].x + V[1].x) / 2, (V[0].y + V[1].y) / 2, 'c'],
      ];
      const lens = [a, b, c];
      const cx = (V[0].x + V[1].x + V[2].x) / 3;
      const cy = (V[0].y + V[1].y + V[2].y) / 3;
      mids.forEach((m, i) => {
        const dx = m[0] - cx, dy = m[1] - cy;
        const len = Math.hypot(dx, dy) || 1;
        sideTexts[i].setAttribute('x', m[0] + (dx / len) * 20);
        sideTexts[i].setAttribute('y', m[1] + (dy / len) * 20 + 4);
        sideTexts[i].textContent = `${m[2]}=${fmt(lens[i])}`;
      });

      // дуги углов + подписи
      let arcsD = '';
      const angs = [angA, angB, angC];
      V.forEach((p, i) => {
        const q1 = V[(i + 1) % 3], q2 = V[(i + 2) % 3];
        let u1 = { x: q1.x - p.x, y: q1.y - p.y };
        let u2 = { x: q2.x - p.x, y: q2.y - p.y };
        const l1 = Math.hypot(u1.x, u1.y), l2 = Math.hypot(u2.x, u2.y);
        u1 = { x: u1.x / l1, y: u1.y / l1 };
        u2 = { x: u2.x / l2, y: u2.y / l2 };
        const R = 30;
        const p1 = [p.x + u1.x * R, p.y + u1.y * R];
        const p2 = [p.x + u2.x * R, p.y + u2.y * R];
        const cross = u1.x * u2.y - u1.y * u2.x;
        const sweep = cross > 0 ? 0 : 1;
        arcsD += `M${p1[0].toFixed(1)},${p1[1].toFixed(1)} A${R},${R} 0 0 ${sweep} ${p2[0].toFixed(1)},${p2[1].toFixed(1)} `;
        const bis = { x: u1.x + u2.x, y: u1.y + u2.y };
        const bl = Math.hypot(bis.x, bis.y) || 1;
        angTexts[i].setAttribute('x', p.x + (bis.x / bl) * 52);
        angTexts[i].setAttribute('y', p.y + (bis.y / bl) * 52 + 4);
        angTexts[i].textContent = `${fmt(deg(angs[i]))}°`;
      });
      arcs.setAttribute('d', arcsD);

      // панель показаний
      document.getElementById('ro-verts').innerHTML =
        `A(${fmt(V[0].x)}, ${fmt(V[0].y)})<br>B(${fmt(V[1].x)}, ${fmt(V[1].y)})<br>C(${fmt(V[2].x)}, ${fmt(V[2].y)})`;
      document.getElementById('ro-sides').innerHTML =
        `AB = ${fmt(c)}<br>BC = ${fmt(a)}<br>CA = ${fmt(b)}`;
      document.getElementById('ro-angles').innerHTML =
        `∠A = ${fmt(deg(angA))}° · ∠B = ${fmt(deg(angB))}°<br>∠C = ${fmt(deg(angC))}°`;
      document.getElementById('ro-sum').textContent =
        `α + β + γ = ${fmt(deg(angA) + deg(angB) + deg(angC))}° — всегда`;
      document.getElementById('ro-perim').textContent = fmt(P);
      document.getElementById('ro-area').textContent = fmt(S) + ' ед.²';
    }
    render();

    let active = -1;
    function toSvg(e) {
      const r = svg.getBoundingClientRect();
      return {
        x: Math.max(12, Math.min(428, ((e.clientX - r.left) / r.width) * 440)),
        y: Math.max(12, Math.min(388, ((e.clientY - r.top) / r.height) * 400)),
      };
    }
    dots.forEach((h, i) => {
      h.addEventListener('pointerdown', (e) => {
        active = i;
        h.classList.add('drag');
        h.setPointerCapture?.(e.pointerId);
        e.preventDefault();
      });
    });
    svg.addEventListener('pointermove', (e) => {
      if (active < 0) return;
      const p = toSvg(e);
      V[active].x = p.x;
      V[active].y = p.y;
      render();
    });
    ['pointerup', 'pointercancel'].forEach((ev) =>
      svg.addEventListener(ev, () => {
        if (active >= 0) handles[active].classList.remove('drag');
        active = -1;
      })
    );
  })();

  /* ============================================================
     3. ПАРАБОЛА: слайдеры → график и показания
     ============================================================ */
  (() => {
    const cv = document.getElementById('fn-canvas');
    const ctx = cv.getContext('2d');
    const slA = document.getElementById('sl-a');
    const slB = document.getElementById('sl-b');
    const slC = document.getElementById('sl-c');
    const XR = 8, YR = 9;

    function draw() {
      const a = parseFloat(slA.value), b = parseFloat(slB.value), c = parseFloat(slC.value);
      document.getElementById('val-a').textContent = a.toFixed(1);
      document.getElementById('val-b').textContent = b.toFixed(1);
      document.getElementById('val-c').textContent = c.toFixed(1);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = 640, h = 440;
      if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const sx = w / (XR * 2), sy = h / (YR * 2);
      const px = (x) => w / 2 + x * sx;
      const py = (y) => h / 2 - y * sy;

      // сетка
      ctx.strokeStyle = '#e6e9f5';
      ctx.lineWidth = 1;
      for (let x = -XR; x <= XR; x++) { ctx.beginPath(); ctx.moveTo(px(x), 0); ctx.lineTo(px(x), h); ctx.stroke(); }
      for (let y = -YR; y <= YR; y++) { ctx.beginPath(); ctx.moveTo(0, py(y)); ctx.lineTo(w, py(y)); ctx.stroke(); }

      // оси
      ctx.strokeStyle = '#8a90a8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, py(0)); ctx.lineTo(w, py(0));
      ctx.moveTo(px(0), 0); ctx.lineTo(px(0), h);
      ctx.stroke();
      ctx.fillStyle = '#8a90a8';
      ctx.font = '11px JetBrains Mono, monospace';
      for (let x = -XR + 2; x <= XR - 2; x += 2) if (x !== 0) ctx.fillText(x, px(x) + 3, py(0) + 13);
      for (let y = -YR + 2; y <= YR - 2; y += 2) if (y !== 0) ctx.fillText(y, px(0) + 5, py(y) - 3);

      // кривая
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.clip();
      ctx.strokeStyle = '#6c5ce7';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(108, 92, 231, 0.4)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      let started = false;
      for (let x = -XR; x <= XR; x += 0.02) {
        const y = a * x * x + b * x + c;
        if (!isFinite(y) || Math.abs(y) > 200) { started = false; continue; }
        const X = px(x), Y = py(y);
        if (!started) { ctx.moveTo(X, Y); started = true; }
        else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // показания
      const fmtN = (v) => (Math.abs(v) < 1e-9 ? 0 : v).toFixed(1).replace('-0.0', '0.0');
      const vertexEl = document.getElementById('fn-vertex');
      const dEl = document.getElementById('fn-d');
      const rootsEl = document.getElementById('fn-roots');

      if (Math.abs(a) < 0.051) {
        vertexEl.textContent = 'a = 0 — это уже не парабола, а прямая';
        const root = Math.abs(b) < 0.051 ? null : -c / b;
        dEl.textContent = 'D не применяется';
        rootsEl.textContent = root === null
          ? 'корней нет (прямая не пересекает ось x)'
          : `пересечение с осью x: x = ${fmtN(root)}`;
        return;
      }

      const x0 = -b / (2 * a), y0 = a * x0 * x0 + b * x0 + c;
      const D = b * b - 4 * a * c;

      // вершина на графике
      if (Math.abs(x0) <= XR + 1 && Math.abs(y0) <= YR + 4) {
        ctx.fillStyle = '#e05fa8';
        ctx.beginPath();
        ctx.arc(px(x0), py(y0), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      let rootsText;
      if (D > 0.001) {
        const r1 = (-b - Math.sqrt(D)) / (2 * a);
        const r2 = (-b + Math.sqrt(D)) / (2 * a);
        [r1, r2].forEach((r) => {
          if (Math.abs(r) <= XR + 1) {
            ctx.fillStyle = '#1d9e6c';
            ctx.beginPath();
            ctx.arc(px(r), py(0), 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        rootsText = `корни: x₁ = ${fmtN(r1)},  x₂ = ${fmtN(r2)}`;
      } else if (D >= -0.001) {
        rootsText = `D = 0 — один корень: x = ${fmtN(x0)}`;
      } else {
        rootsText = 'действительных корней нет (D < 0)';
      }

      vertexEl.textContent = `вершина: (${fmtN(x0)}; ${fmtN(y0)})`;
      dEl.textContent = `D = b² − 4ac = ${D.toFixed(1)}`;
      rootsEl.textContent = rootsText;

      // формула
      const sgn = (v) => v < 0 ? '− ' + Math.abs(v).toFixed(1) : '+ ' + v.toFixed(1);
      document.getElementById('fn-formula').textContent =
        `y = ${a.toFixed(1)}x² ${sgn(b)}x ${sgn(c)}`;
    }
    [slA, slB, slC].forEach((s) => s.addEventListener('input', draw));
    draw();
  })();

  /* ============================================================
     4. КВИЗ с цветовой пульсацией
     ============================================================ */
  (() => {
    const QUESTIONS = [
      { q: 'Чему равен √144?', opts: ['10', '12', '14', '16'], correct: 1 },
      { q: 'Сумма углов любого треугольника?', opts: ['90°', '180°', '270°', '360°'], correct: 1 },
      { q: 'Производная от x² — это…', opts: ['x', '2x', 'x²⁄2', '2'], correct: 1 },
      { q: 'π с точностью до сотых — это…', opts: ['3,41', '3,14', '3,15', '3,12'], correct: 1 },
    ];
    const qEl = document.getElementById('quiz-q');
    const optsEl = document.getElementById('quiz-opts');
    const dotsEl = document.getElementById('quiz-dots');
    const stepEl = document.getElementById('quiz-step');
    const scoreEl = document.getElementById('quiz-score');
    const bodyEl = document.getElementById('quiz-body');
    const doneEl = document.getElementById('quiz-done');

    let idx = 0, score = 0, locked = false, marks = [];

    function renderDots() {
      dotsEl.innerHTML = '';
      QUESTIONS.forEach((_, i) => {
        const d = document.createElement('i');
        if (i === idx) d.className = 'cur';
        if (marks[i] === true) d.className = 'good';
        if (marks[i] === false) d.className = 'bad';
        dotsEl.appendChild(d);
      });
    }

    function renderQ() {
      const item = QUESTIONS[idx];
      qEl.textContent = item.q;
      stepEl.textContent = `вопрос ${idx + 1} из ${QUESTIONS.length}`;
      scoreEl.textContent = `счёт: ${score}`;
      optsEl.innerHTML = '';
      const order = item.opts
        .map((text, i) => ({ text, i }))
        .sort(() => Math.random() - 0.5);
      order.forEach(({ text, i }) => {
        const b = document.createElement('button');
        b.className = 'opt';
        b.type = 'button';
        b.textContent = text;
        b.addEventListener('click', () => answer(i, b));
        optsEl.appendChild(b);
      });
      renderDots();
    }

    function answer(i, btn) {
      if (locked) return;
      locked = true;
      const item = QUESTIONS[idx];
      const buttons = [...optsEl.children];
      buttons.forEach((b) => { b.disabled = true; });
      const ok = i === item.correct;
      marks[idx] = ok;
      if (ok) { score++; btn.classList.add('good'); }
      else {
        btn.classList.add('bad');
        buttons[item.correct].classList.add('good');
      }
      scoreEl.textContent = `счёт: ${score}`;
      renderDots();
      setTimeout(() => {
        locked = false;
        idx++;
        if (idx < QUESTIONS.length) renderQ();
        else finish();
      }, 1100);
    }

    function finish() {
      bodyEl.style.display = 'none';
      doneEl.hidden = false;
      document.getElementById('quiz-final').textContent = `${score}/${QUESTIONS.length}`;
      const ring = doneEl.querySelector('.quiz-ring');
      ring.style.setProperty('--score', Math.round((score / QUESTIONS.length) * 100));
      const verdict = score === QUESTIONS.length ? 'Идеально. Можно репетитором становиться.'
        : score >= 2 ? 'Крепкая база — остальное в разделах выше.'
        : 'Ничего страшного: потрогайте треугольник и попробуйте снова.';
      document.getElementById('quiz-verdict').textContent = verdict;
      renderDots();
    }

    document.getElementById('quiz-restart').addEventListener('click', () => {
      idx = 0; score = 0; marks = [];
      bodyEl.style.display = '';
      doneEl.hidden = true;
      renderQ();
    });

    renderQ();
  })();

  /* ============================================================
     5. ПОШАГОВЫЕ РЕШЕНИЯ
     ============================================================ */
  (() => {
    const EXAMPLES = {
      disc: [
        { f: 'a = 2,  b = −5,  c = −3', t: 'определяем коэффициенты уравнения 2x² − 5x − 3 = 0' },
        { f: 'D = b² − 4ac', t: 'формула дискриминанта' },
        { f: 'D = 25 − 4·2·(−3) = 49', t: 'подставляем: минус на минус даёт плюс' },
        { f: 'D > 0 → два корня', t: 'сравниваем дискриминант с нулём' },
        { f: 'x = (−b ± √D) / 2a = (5 ± 7) / 4', t: 'формула корней квадратного уравнения' },
        { f: 'x₁ = (5 + 7) / 4 = 3', t: 'первый корень' },
        { f: 'x₂ = (5 − 7) / 4 = −0,5', t: 'второй корень' },
        { f: 'Ответ: x₁ = 3,  x₂ = −0,5', t: 'готово — можно проверять подстановкой', answer: true },
      ],
      pyth: [
        { f: 'a = 3,  b = 4,  ∠ = 90°', t: 'дано: два катета и прямой угол между ними' },
        { f: 'c² = a² + b²', t: 'теорема Пифагора' },
        { f: 'c² = 3² + 4² = 9 + 16 = 25', t: 'подставляем значения' },
        { f: 'c = √25 = 5', t: 'извлекаем квадратный корень' },
        { f: 'Ответ: гипотенуза c = 5', t: 'классика, на которой держатся тысячи задач', answer: true },
      ],
    };

    const listEl = document.getElementById('steps-list');
    const fill = document.getElementById('steps-fill');
    const countEl = document.getElementById('steps-count');
    const nextBtn = document.getElementById('steps-next');
    const allBtn = document.getElementById('steps-all');
    const resetBtn = document.getElementById('steps-reset');
    let current = 'disc';
    let revealed = 0;

    function render() {
      const steps = EXAMPLES[current];
      revealed = Math.min(revealed, steps.length);
      listEl.innerHTML = '';
      for (let i = 0; i < revealed; i++) {
        const li = document.createElement('li');
        li.className = 'step-line' + (steps[i].answer ? ' answer' : '');
        li.innerHTML = `<span class="step-num">${i + 1}</span><span><span class="step-f">${steps[i].f}</span><span class="step-t">${steps[i].t}</span></span>`;
        if (i === revealed - 1 && !reduced_motion()) setTimeout(() => li.classList.add('in'), 30);
        else li.classList.add('in');
        listEl.appendChild(li);
      }
      fill.style.width = (revealed / steps.length) * 100 + '%';
      countEl.textContent = `шаг ${revealed} из ${steps.length}`;
      nextBtn.disabled = revealed >= steps.length;
      allBtn.disabled = revealed >= steps.length;
      const last = listEl.lastElementChild;
      if (last) last.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    }
    const reduced_motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

    nextBtn.addEventListener('click', () => { revealed++; render(); });
    allBtn.addEventListener('click', () => { revealed = EXAMPLES[current].length; render(); });
    resetBtn.addEventListener('click', () => { revealed = 0; render(); });

    document.querySelectorAll('.steps-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.steps-tab').forEach((t) => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        current = tab.dataset.ex;
        revealed = 0;
        render();
      });
    });

    render();
  })();
})();
