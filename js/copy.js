/* ============================================================================
   COPY.JS — кнопка копирования контактов в буфер обмена.
   Кнопке нужен атрибут data-copy="текст для копирования".
   Работает и без интернета: при недоступности Clipboard API есть запасной путь.
   ========================================================================== */

(function () {
  "use strict";

  var COPY_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
  var CHECK_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    if (!btn.innerHTML.trim()) btn.innerHTML = COPY_ICON;

    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy") || "";

      function done() {
        btn.classList.add("copied");
        btn.innerHTML = CHECK_ICON;
        setTimeout(function () {
          btn.classList.remove("copied");
          btn.innerHTML = COPY_ICON;
        }, 1600);
      }

      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { if (document.execCommand("copy")) done(); } catch (e) {}
        document.body.removeChild(ta);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
    });
  });
})();
