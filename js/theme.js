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
})();
