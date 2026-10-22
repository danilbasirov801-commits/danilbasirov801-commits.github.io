/* ============================================================================
   METRICS.JS — заготовка под счётчики аналитики.
   ----------------------------------------------------------------------------
   СЮДА ВСТАВЛЯЮТ КОДЫ МЕТРИК, когда они будут готовы.

   Как добавить Яндекс.Метрику:
   1. Получите код счётчика в Метрике (Настройки → Код счётчика).
   2. Вставьте его ЦЕЛИКОМ ниже, между фигурными скобками функции
      initMetrics(). Метрика сама создаст и подключит свой скрипт —
      ничего больше делать не нужно.

   Как добавить Google Analytics (gtag.js):
   1. Вставьте две строки ниже в head каждой страницы ЛИБО подключите их
      динамически здесь — по образцу функции loadScript().
   2. Не забудьте заменить G-XXXXXXXXXX на свой идентификатор.

   Пока метрики не добавлены, файл безопасно ничего не делает
   и в консоль ошибок не пишет.
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
    /* ================================================================
       ↓↓↓ ВСТАВЬТЕ СЮДА КОД ЯНДЕКС.МЕТРИКИ (целиком, как даёт кабинет) ↓↓↓

       Пример (замените XXXXXXXX на номер счётчика):

       (function (m, e, t, r, i, k, a) {
         m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
         m[i].l = 1 * new Date();
         for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
         k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a);
       })
       (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

       ym(XXXXXXXX, "init", {
         clickmap: true,
         trackLinks: true,
         accurateTrackBounce: true,
         webvisor: true
       });

       ================================================================ */
  }

  /* Отключение при «уменьшить анимацию» на метрики не влияет —
     счётчики работают всегда, поэтому просто вызываем при загрузке */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMetrics);
  } else {
    initMetrics();
  }
})();
