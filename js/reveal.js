/* ============================================================================
   REVEAL.JS — плавное появление блоков при прокрутке.
   Элементам достаточно добавить класс reveal. Без JS (и при «уменьшить
   анимацию») контент просто виден сразу — стили это учитывают.
   ========================================================================== */

(function () {
  "use strict";

  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("is-visible");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(".reveal:not(.is-visible)").forEach(function (el, i) {
    /* Лёгкая лесенка задержки внутри ряда, чтобы блоки появлялись волной */
    el.style.transitionDelay = (i % 3) * 70 + "ms";
    io.observe(el);
  });
})();
