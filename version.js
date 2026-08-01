(function () {
  "use strict";

  var VERSION = "1.2.0";
  var label = "v" + VERSION;

  if (typeof window !== "undefined") {
    window.IndicaAppVersion = VERSION;
  }

  document.querySelectorAll("[data-app-versao]").forEach(function (el) {
    el.textContent = label;
  });
})();
