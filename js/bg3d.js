/* ============================================================================
   BG3D.JS — живой 3D-фон на Canvas без библиотек.
   Слои сцены (от дальнего к ближнему):
     1. Аврора-свечения — два огромных мягких пятна, медленно дрейфуют.
     2. Звёздная пыль — десятки мерцающих частиц, плывущих вверх.
     3. Падающие звёзды — изредка, только в тёмной теме.
     4. Каркасные фигуры — куб и октаэдр с перспективой и свечением вершин.
   Цвета берутся из CSS-переменной --accent (подстраиваются под тему).
   При «уменьшить анимацию» рисуется один статичный кадр.
   Canvas создаётся скриптом: без JS фон просто не рисуется, страница цела.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Сцена и размеры ------------------------------------------------------ */

  var canvas = document.createElement("canvas");
  canvas.className = "bg-3d";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }
  window.addEventListener("resize", resize);

  /* --- Цвет из темы ----------------------------------------------------------- */

  var accent = [86, 70, 229];
  var isDark = false;

  function readTheme() {
    var v = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(v);
    if (m) accent = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
    isDark = document.documentElement.getAttribute("data-theme") === "dark";
  }
  readTheme();
  new MutationObserver(readTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
  });

  function rgba(a) {
    return "rgba(" + accent[0] + "," + accent[1] + "," + accent[2] + "," + a + ")";
  }

  /* --- Геометрия: куб и октаэдр ------------------------------------------------ */

  function cube() {
    var v = [], e = [], i, j, k, diff;
    for (i = 0; i < 8; i++) v.push([(i & 1 ? 1 : -1), (i & 2 ? 1 : -1), (i & 4 ? 1 : -1)]);
    for (i = 0; i < 8; i++) for (j = i + 1; j < 8; j++) {
      diff = 0;
      for (k = 0; k < 3; k++) if (v[i][k] !== v[j][k]) diff++;
      if (diff === 1) e.push([i, j]);
    }
    return { v: v, e: e };
  }

  function octahedron() {
    var v = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    var e = [], i, j;
    for (i = 0; i < 6; i++) for (j = i + 1; j < 6; j++) {
      if (v[i][0] + v[j][0] || v[i][1] + v[j][1] || v[i][2] + v[j][2]) e.push([i, j]);
    }
    return { v: v, e: e };
  }

  /* Фигуры: позиция — доли экрана, скорость — радианы в секунду */
  var objects = [
    {
      geo: cube(), size: 0.155, fx: 0.74, fy: 0.34,
      ax: 0.65, ay: 0.35, sx: 0.11, sy: 0.15,
      phase: 0, strength: 1, parallax: 26
    },
    {
      geo: octahedron(), size: 0.10, fx: 0.13, fy: 0.74,
      ax: 0.2, ay: 0.8, sx: -0.08, sy: -0.11,
      phase: 2.1, strength: 0.55, parallax: 14
    }
  ];

  /* --- Звёздная пыль -------------------------------------------------------------- */

  var particles = [];

  function initParticles() {
    var count = Math.max(24, Math.min(90, Math.round(W * H / 26000)));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.8 + Math.random() * 1.7,
        vx: (Math.random() - 0.5) * 9,      /* px/сек по горизонтали */
        vy: -5 - Math.random() * 11,        /* плывут вверх */
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.4 + Math.random() * 1.4, /* скорость мерцания */
        base: 0.25 + Math.random() * 0.55
      });
    }
  }

  /* --- Падающие звёзды (только тёмная тема) ---------------------------------------- */

  var meteor = null;
  var meteorTimer = 5;

  function spawnMeteor() {
    var angle = Math.PI * (0.62 + Math.random() * 0.16); /* вниз-влево */
    var speed = 620 + Math.random() * 260;
    meteor = {
      x: W * (0.35 + Math.random() * 0.6),
      y: -30,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      max: 0.9 + Math.random() * 0.4
    };
  }

  /* --- Проекция ---------------------------------------------------------------- */

  function project(p, obj, t) {
    var ay = obj.ay + t * obj.sy;
    var ax = obj.ax + t * obj.sx;
    var cy = Math.cos(ay), sy = Math.sin(ay);
    var x = p[0] * cy + p[2] * sy;
    var z = -p[0] * sy + p[2] * cy;
    var cx = Math.cos(ax), sx = Math.sin(ax);
    var y = p[1] * cx - z * sx;
    z = p[1] * sx + z * cx;
    var s = 3 / (3 + z); /* перспектива: s > 1 — ближе, < 1 — дальше */
    return { x: x * s, y: y * s, s: s };
  }

  /* --- Параллакс за курсором ------------------------------------------------------ */

  var targetX = 0, targetY = 0, curX = 0, curY = 0;
  var finePointer = window.matchMedia && matchMedia("(pointer: fine)").matches;

  if (finePointer && !reduceMotion) {
    window.addEventListener("pointermove", function (e) {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  /* --- Отрисовка -------------------------------------------------------------------- */

  function render(t, dt) {
    ctx.clearRect(0, 0, W, H);

    var lineAlpha = isDark ? 0.18 : 0.32;
    var vertexAlpha = isDark ? 0.55 : 0.65;
    var glowAlpha = isDark ? 0.07 : 0.10;
    var lineWidth = isDark ? 1.15 : 1.35;
    var dustAlpha = isDark ? 0.85 : 0.7;
    var auroraAlpha = isDark ? 0.05 : 0.045;
    var narrow = W < 760;

    curX += (targetX - curX) * 0.05;
    curY += (targetY - curY) * 0.05;

    /* 1. Аврора-свечения: два пятна, медленно кружат по экрану */
    var glows = [
      { fx: 0.24 + Math.sin(t * 0.05) * 0.08, fy: 0.3 + Math.cos(t * 0.04) * 0.07, r: 0.75, a: 1 },
      { fx: 0.8 + Math.cos(t * 0.043) * 0.09, fy: 0.72 + Math.sin(t * 0.052) * 0.08, r: 0.65, a: 0.8 }
    ];
    for (var g = 0; g < glows.length; g++) {
      var gp = glows[g];
      var gx = W * gp.fx + curX * 18, gy = H * gp.fy + curY * 12;
      var gr = Math.min(W, H) * gp.r;
      var grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      grad.addColorStop(0, rgba(auroraAlpha * gp.a));
      grad.addColorStop(1, rgba(0));
      ctx.fillStyle = grad;
      ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
    }

    /* 2. Звёздная пыль */
    for (var p = 0; p < particles.length; p++) {
      var d = particles[p];
      if (dt > 0) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.y < -6) { d.y = H + 6; d.x = Math.random() * W; }
        if (d.x < -6) d.x = W + 6;
        if (d.x > W + 6) d.x = -6;
      }
      var tw = 0.55 + 0.45 * Math.sin(t * d.twinkle + d.phase);
      ctx.fillStyle = rgba(d.base * dustAlpha * tw);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    /* 3. Падающие звёзды — только в тёмной теме */
    if (isDark && !reduceMotion) {
      meteorTimer -= dt;
      if (meteorTimer <= 0 && !meteor) {
        spawnMeteor();
        meteorTimer = 6 + Math.random() * 8;
      }
      if (meteor) {
        meteor.life += dt;
        meteor.x += meteor.vx * dt;
        meteor.y += meteor.vy * dt;
        var fade = Math.max(0, 1 - meteor.life / meteor.max);
        var tail = 0.16;
        var streak = ctx.createLinearGradient(
          meteor.x, meteor.y,
          meteor.x - meteor.vx * tail, meteor.y - meteor.vy * tail
        );
        streak.addColorStop(0, rgba(0.75 * fade));
        streak.addColorStop(1, rgba(0));
        ctx.strokeStyle = streak;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.vx * tail, meteor.y - meteor.vy * tail);
        ctx.stroke();
        ctx.fillStyle = rgba(0.9 * fade);
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        if (meteor.life >= meteor.max || meteor.y > H + 40 || meteor.x < -40) meteor = null;
      }
    }

    /* 4. Каркасные фигуры */
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      var size = Math.min(W, H) * obj.size * (narrow && i === 0 ? 0.8 : 1);
      var px = W * obj.fx + curX * obj.parallax;
      var py = H * obj.fy + Math.sin(t * 0.4 + obj.phase) * 12 + curY * obj.parallax * 0.7;
      var strength = obj.strength * (narrow ? 0.7 : 1);

      /* Мягкое свечение за фигурой */
      var halo = ctx.createRadialGradient(px, py, 0, px, py, size * 3.2);
      halo.addColorStop(0, rgba(glowAlpha * strength));
      halo.addColorStop(1, rgba(0));
      ctx.fillStyle = halo;
      ctx.fillRect(px - size * 3.2, py - size * 3.2, size * 6.4, size * 6.4);

      /* Вершины в 3D */
      var pts = [];
      for (var v = 0; v < obj.geo.v.length; v++) {
        pts.push(project(obj.geo.v[v], obj, t));
      }

      /* Рёбра: чем ближе к зрителю, тем ярче */
      ctx.lineWidth = lineWidth;
      for (var e = 0; e < obj.geo.e.length; e++) {
        var a = pts[obj.geo.e[e][0]];
        var b = pts[obj.geo.e[e][1]];
        var depth = Math.max(0, Math.min(1, ((a.s + b.s) / 2 - 0.72) / 0.55));
        var alpha = lineAlpha * (0.35 + 0.65 * depth) * strength;
        ctx.strokeStyle = rgba(alpha);
        ctx.beginPath();
        ctx.moveTo(px + a.x * size, py + a.y * size);
        ctx.lineTo(px + b.x * size, py + b.y * size);
        ctx.stroke();
      }

      /* Светящиеся вершины */
      ctx.shadowBlur = 12;
      ctx.shadowColor = rgba(vertexAlpha * 0.8);
      for (var q = 0; q < pts.length; q++) {
        var pt = pts[q];
        var r = 2.1 * pt.s * (i === 0 ? 1 : 0.8);
        ctx.fillStyle = rgba(vertexAlpha * pt.s * strength);
        ctx.beginPath();
        ctx.arc(px + pt.x * size, py + pt.y * size, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
  }

  /* --- Цикл ---------------------------------------------------------------------------- */

  resize();

  if (reduceMotion) {
    render(0, 0); /* один статичный кадр, без анимации */
  } else {
    var start = null, last = null;
    function frame(ms) {
      if (start === null) { start = ms; last = ms; }
      var t = (ms - start) / 1000;
      var dt = Math.min(0.05, (ms - last) / 1000); /* защита от скачков после сворачивания */
      last = ms;
      render(t, dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
