/* ============================================================================
   THEME.JS — переключатель тёмной/светлой темы.
   Начальную тему ставит маленький скрипт в <head> каждой страницы (до
   отрисовки), здесь только переключение по кнопке и запоминание выбора.
   ========================================================================== */

(function () {
  "use strict";

  var toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  /* Адресная строка мобильных браузеров красится в цвет фона */
  function paintAddressBar() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content",
        getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#f0ede6");
    }
  }
  paintAddressBar();

  toggle.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) { /* приватный режим */ }
    paintAddressBar();
  });

  /* Синхронизация между открытыми вкладками: сменили тему в одной —
     все остальные страницы перекрашиваются сразу, без перезагрузки */
  window.addEventListener("storage", function (e) {
    if (e.key === "theme" && (e.newValue === "dark" || e.newValue === "light")) {
      document.documentElement.setAttribute("data-theme", e.newValue);
      paintAddressBar();
    }
  });

  /* Кнопки «Назад/Вперёд»: страница из кэша получает актуальную тему */
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    var saved = null;
    try { saved = localStorage.getItem("theme"); } catch (err) { /* приватный режим */ }
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
      paintAddressBar();
    }
  });
})();
