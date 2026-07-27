(function () {
  "use strict";

  var VERSION = "1.0.0";

  if (typeof window !== "undefined") {
    window.IndicaAppVersion = VERSION;
  }

  var el = document.getElementById("app-versao");
  if (el) el.textContent = "v" + VERSION;
})();
