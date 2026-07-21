(function () {
  "use strict";

  var ESB = window.IndicaNotaESB;
  var UI = window.IndicaNotaUI;
  if (!ESB || !UI) return;

  var semUnidade = document.getElementById("sim-sem-unidade");
  var conteudo = document.getElementById("sim-conteudo");

  function mostrarEstado(semUnidadeAtiva) {
    if (semUnidadeAtiva) {
      semUnidade.hidden = false;
      conteudo.hidden = true;
      document.body.classList.add("sim-page--sem-unidade");
      return;
    }
    semUnidade.hidden = true;
    conteudo.hidden = false;
    document.body.classList.remove("sim-page--sem-unidade");
  }

  function iniciar() {
    var sessao = ESB.resolverUnidadeAtiva();
    if (!sessao || !sessao.unidadeId || !sessao.populacao) {
      mostrarEstado(true);
      return;
    }

    mostrarEstado(false);
    UI.recalcular(conteudo, sessao, { modoDrawer: false });
  }

  iniciar();

  window.addEventListener("pageshow", function () {
    iniciar();
  });
})();
