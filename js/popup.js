/* ============================================================================
   POPUP.JS — предпросмотр кейса во всплывающем окне.
   Клик по карточке проекта открывает попап с содержимым кейса (страница
   кейса подгружается по fetch), а не уводит на отдельную страницу.
   Отдельные страницы остаются: кнопка «Открыть как страницу» внутри попапа,
   плюс прямые ссылки и поисковики работают как раньше.
   Если fetch недоступен (например, сайт открыт с диска по file://),
   происходит обычный переход на страницу кейса — ничего не ломается.
   ========================================================================== */

(function () {
  "use strict";

  var grids = document.querySelectorAll(".grid-cards");
  if (!grids.length) return;

  var modal = null;
  var lastFocus = null;

  function ensureModal() {
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "case-popup";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML =
      '<div class="case-popup-box">' +
        '<button type="button" class="case-popup-close" aria-label="Закрыть">✕</button>' +
        '<div class="case-popup-content">' +
          '<p class="case-popup-loading"><span class="l-ru">Загрузка…</span><span class="l-en">Loading…</span></p>' +
        '</div>' +
        '<div class="case-popup-links">' +
          '<a class="btn btn-ghost case-popup-full" href="#">' +
            '<span class="l-ru">Открыть как страницу</span><span class="l-en">Open as a page</span>&nbsp;↗' +
          '</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    /* Клик по фону или крестику закрывает */
    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.closest(".case-popup-close")) close();
    });

    /* Клик по ссылке внутри попапа — закрываем и идём по ссылке */
    modal.addEventListener("click", function (e) {
      var link = e.target.closest("a[href]");
      if (link && !link.classList.contains("case-popup-full")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    return modal;
  }

  function close() {
    if (!modal) return;
    modal.classList.remove("open");
    document.body.classList.remove("popup-open");
    if (lastFocus) { try { lastFocus.focus(); } catch (e) { /* элемент мог исчезнуть */ } }
  }

  function navigate(href) {
    close();
    window.location.href = href;
  }

  function open(href) {
    var m = ensureModal();
    lastFocus = document.activeElement;

    m.querySelector(".case-popup-full").setAttribute("href", href);
    m.classList.add("open");
    document.body.classList.add("popup-open");
    m.querySelector(".case-popup-box").scrollTop = 0;

    fetch(href)
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var article = doc.querySelector("article");
        if (!article) { navigate(href); return; }

        var box = m.querySelector(".case-popup-content");
        box.innerHTML = "";
        while (article.firstChild) box.appendChild(article.firstChild);

        /* В попапе не нужны ссылки «назад», «следующий проект»
           и кнопка «Все проекты» из карточки с кнопками */
        var extra = box.querySelectorAll(
          ".back-link, .next-case, .case-links a[href='index.html']"
        );
        extra.forEach(function (el) { el.remove(); });

        /* Показываем содержимое сразу, без каскадной анимации появления */
        box.querySelectorAll(".reveal").forEach(function (el) {
          el.classList.add("is-visible");
          el.style.transitionDelay = "0ms";
        });
      })
      .catch(function () { navigate(href); });
  }

  grids.forEach(function (grid) {
    grid.addEventListener("click", function (e) {
      var card = e.target.closest("a.card");
      if (!card) return;
      /* Ctrl/Cmd/Shift+клик и средняя кнопка — обычное поведение браузера */
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      open(card.getAttribute("href"));
    });
  });
})();
