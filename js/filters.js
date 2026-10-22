/* ============================================================================
   FILTERS.JS — фильтры на странице «Проекты».
   Кнопка .chip с data-filter="landing" показывает только карточки,
   у которых этот тег указан в data-tags. Без JS видны все карточки.
   ========================================================================== */

(function () {
  "use strict";

  var chipsBox = document.getElementById("filter-chips");
  var grid = document.getElementById("projects-grid");
  if (!chipsBox || !grid) return;

  chipsBox.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;

    chipsBox.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
    chip.classList.add("active");

    var f = chip.getAttribute("data-filter") || "";
    grid.querySelectorAll(".card").forEach(function (card) {
      var tags = (card.getAttribute("data-tags") || "").split(/\s+/);
      card.hidden = f !== "" && tags.indexOf(f) === -1;
    });
  });
})();
