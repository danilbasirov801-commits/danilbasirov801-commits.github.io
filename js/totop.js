/* ============================================================================
   TOTOP.JS — кнопка «наверх» в правом нижнем углу.
   Появляется, когда страница прокручена больше чем на 600px.
   ========================================================================== */

(function () {
  "use strict";

  var toTop = document.createElement("button");
  toTop.type = "button";
  toTop.className = "to-top";
  toTop.setAttribute("aria-label", "Наверх");
  toTop.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';

  toTop.addEventListener("click", function () {
    var smooth = !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
  });

  document.body.appendChild(toTop);

  window.addEventListener("scroll", function () {
    toTop.classList.toggle("visible", window.scrollY > 600);
  }, { passive: true });
})();
