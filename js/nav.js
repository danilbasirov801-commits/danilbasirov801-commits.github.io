/* ============================================================================
   NAV.JS — мобильное меню (бургер).
   ========================================================================== */

(function () {
  "use strict";

  var navToggle = document.getElementById("nav-toggle");
  if (!navToggle) return;

  navToggle.addEventListener("click", function () {
    var open = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  /* Клик по любому пункту меню закрывает его */
  document.querySelectorAll(".nav a").forEach(function (a) {
    a.addEventListener("click", function () {
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
})();
