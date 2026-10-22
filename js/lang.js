/* ============================================================================
   LANG.JS — переключатель RU / EN.
   Показом текста управляет CSS по атрибуту lang у <html> (см. base.css),
   этот модуль только ставит атрибут, запоминает выбор и обновляет кнопки.
   Заголовок вкладки меняется через data-title-ru / data-title-en у <html>.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.documentElement;
  var lang = root.getAttribute("lang") || "ru";

  function updateButtons() {
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === lang);
    });
  }

  function setLang(l) {
    lang = l;
    root.setAttribute("lang", l);
    try { localStorage.setItem("lang", l); } catch (e) { /* приватный режим */ }

    var title = root.getAttribute("data-title-" + l);
    if (title) document.title = title;

    updateButtons();
  }

  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () {
      setLang(b.getAttribute("data-lang"));
    });
  });

  /* Синхронизация между открытыми вкладками: сменили язык в одной —
     все остальные страницы переключаются сразу, без перезагрузки */
  window.addEventListener("storage", function (e) {
    if (e.key === "lang" && (e.newValue === "ru" || e.newValue === "en")) {
      setLang(e.newValue);
    }
  });

  updateButtons();
})();
