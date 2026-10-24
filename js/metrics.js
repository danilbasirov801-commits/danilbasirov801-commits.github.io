/* ============================================================================
   METRICS.JS — счётчики аналитики.
   ----------------------------------------------------------------------------
   Яндекс.Метрика (счётчик № 1137711974) подключена здесь и работает
   на всех страницах: этот файл подключён у каждой страницы сайта.
   Статистика видна только владельцу счётчика в кабинете Метрики.

   Как добавить Google Analytics (gtag.js), если понадобится:
   1. Вставьте две строки с кодом в <head> каждой страницы ЛИБО
      подключите динамически здесь — по образцу функции loadScript().
   2. Замените G-XXXXXXXXXX на свой идентификатор.
   ========================================================================== */

(function () {
  "use strict";

  /* Динамическая подгрузка внешнего скрипта (пригодится для gtag.js) */
  function loadScript(src, async) {
    var s = document.createElement("script");
    s.src = src;
    s.async = async !== false;
    document.head.appendChild(s);
  }

  function initMetrics() {
    /* --- Яндекс.Метрика, счётчик № 1137711974 (подключён 2026-10-25).
           Код вставлен целиком, как даёт кабинет Метрики.
           Здесь он выполняется на всех страницах: metrics.js подключён
           у каждой. Инициализация сама отправляет просмотр страницы,
           повторная вставка скрипта на одной странице не возможна —
           за этим следит проверка в цикле ниже. -------------------- */

    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
      k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a);
    })
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    ym(1137711974, "init", {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: "dataLayer",
      referer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true
    });
  }

  /* Отключение при «уменьшить анимацию» на метрики не влияет —
     счётчики работают всегда, поэтому просто вызываем при загрузке */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMetrics);
  } else {
    initMetrics();
  }
})();
