/* ============================================================================
   MAIN.JS — точка входа. Общие мелочи, которые нужны на каждой странице:
   класс html.js (без него анимации не прячут контент) и год в подвале.
   Остальные модули (theme, lang, nav, reveal, filters, copy, totop)
   самостоятельные и подключаются рядом в <head> или перед </body>.
   ========================================================================== */

(function () {
  "use strict";

  /* Флаг «JS работает»: только с ним включаются анимации появления,
     поэтому без JavaScript весь контент остаётся видимым */
  document.documentElement.classList.add("js");

  /* Год в подвале */
  document.querySelectorAll("#footer-year").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
