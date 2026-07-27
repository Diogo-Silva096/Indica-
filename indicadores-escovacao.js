/**
 * Indicador 3 — Escovação supervisionada (conceito do quadrimestre).
 * Instalado por indicadores.js via IndicaEscovacao.install(env).
 * Passo 5 da organização do código: extrair o bloco Escovação do arquivo monolítico.
 */
(function (global) {
  "use strict";

  function install(env) {
    env = env || {};

    var ESB = env.ESB || window.IndicaNotaESB;
    var ESC_STORAGE_KEY = env.ESC_STORAGE_KEY || (ESB && ESB.ESC_STORAGE_KEY) || "indicaPlus_escovacao_v1";

    function classificarPco(pct) {
      if (typeof env.classificarPco === "function") return env.classificarPco(pct);
      return ESB && typeof ESB.classificarPco === "function" ? ESB.classificarPco(pct) : "regular";
    }

    function getUnidadeAtualId() {
      return typeof env.getUnidadeAtualId === "function" ? env.getUnidadeAtualId() : "";
    }

    function getPopulacaoAtual() {
      return typeof env.getPopulacaoAtual === "function" ? env.getPopulacaoAtual() : 0;
    }

    function getUnidadeSelect() {
      return typeof env.getUnidadeSelect === "function" ? env.getUnidadeSelect() : null;
    }

    function getSimDrawerRoot() {
      return typeof env.getSimDrawerRoot === "function" ? env.getSimDrawerRoot() : null;
    }

    function getSimDrawerConteudo() {
      return typeof env.getSimDrawerConteudo === "function" ? env.getSimDrawerConteudo() : null;
    }

    function aposMudancaEscovacao(uid) {
      if (typeof env.aposMudancaEscovacao === "function") env.aposMudancaEscovacao(uid);
    }

    /* Conceitos B4: mesma lista de CLASSIFICACOES.b4 no core. */
    var ESC_CONCEITOS = (ESB && ESB.CLASSIFICACOES && ESB.CLASSIFICACOES.b4) || [
      { id: "regular", nome: "Regular", cor: "#64748b" },
      { id: "suficiente", nome: "Suficiente", cor: "#d97706" },
      { id: "bom", nome: "Bom", cor: "#0284c7" },
      { id: "otimo", nome: "\u00D3timo", cor: "#059669" },
    ];

    var escConceitoSelecionado = null;
    var escConceitoConfirmado = null;

    function lerEscovacaoStorage() {
      try {
        var raw = localStorage.getItem(ESC_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    }

    function escConceitoPorId(id) {
      if (ESB && typeof ESB.classificacaoPorId === "function") {
        return ESB.classificacaoPorId("b4", id) || null;
      }
      for (var i = 0; i < ESC_CONCEITOS.length; i++) {
        if (ESC_CONCEITOS[i].id === id) return ESC_CONCEITOS[i];
      }
      return null;
    }

    function resolverClassificacaoEscovacaoLocal(dados) {
      if (ESB && typeof ESB.resolverClassificacaoEscovacao === "function") {
        return ESB.resolverClassificacaoEscovacao(dados);
      }
      if (!dados) return null;
      if (dados.classificacao && escConceitoPorId(dados.classificacao)) return dados.classificacao;
      if (dados.populacao > 0 && dados.sessoes != null) {
        return classificarPco((dados.sessoes / dados.populacao) * 100);
      }
      return null;
    }

    function gravarEscovacaoUnidade(unidadeId, classificacao) {
      if (!unidadeId) return;
      if (typeof ESB.gravarEscovacao === "function") {
        ESB.gravarEscovacao(unidadeId, classificacao ? { classificacao: classificacao } : null);
        return;
      }
      var todos = lerEscovacaoStorage();
      if (!classificacao) delete todos[unidadeId];
      else {
        todos[unidadeId] = {
          classificacao: classificacao,
          atualizadoEm: new Date().toISOString(),
        };
      }
      localStorage.setItem(ESC_STORAGE_KEY, JSON.stringify(todos));
    }

    function atualizarUiEscovacao() {
      var opcoes = document.getElementById("esc-conceito-opcoes");
      var btnConfirmar = document.getElementById("esc-conceito-confirmar");
      var btnLimpar = document.getElementById("esc-conceito-limpar");
      var statusEl = document.getElementById("esc-conceito-status");
      if (!opcoes) return;

      var ativo = escConceitoSelecionado || escConceitoConfirmado;
      opcoes.querySelectorAll(".esc-conceito-btn").forEach(function (btn) {
        var id = btn.getAttribute("data-conceito");
        var selecionado = ativo === id;
        btn.classList.toggle("is-selected", selecionado);
        btn.setAttribute("aria-pressed", selecionado ? "true" : "false");
      });

      if (btnConfirmar) {
        var precisaConfirmar = !!escConceitoSelecionado && escConceitoSelecionado !== escConceitoConfirmado;
        btnConfirmar.disabled = !precisaConfirmar;
        btnConfirmar.textContent = escConceitoConfirmado && !precisaConfirmar
          ? "Classifica\u00E7\u00E3o confirmada"
          : "Confirmar classifica\u00E7\u00E3o";
      }

      if (btnLimpar) btnLimpar.hidden = !escConceitoConfirmado;

      if (statusEl) {
        if (escConceitoConfirmado) {
          var c = escConceitoPorId(escConceitoConfirmado);
          statusEl.hidden = false;
          statusEl.innerHTML = c
            ? 'Classifica\u00E7\u00E3o salva: <strong style="color: ' + c.cor + '">' + c.nome + "</strong>. J\u00E1 entra na nota final."
            : "";
        } else {
          statusEl.hidden = true;
          statusEl.textContent = "";
        }
      }
    }

    function carregarEscovacaoUnidade(unidadeId) {
      var dados = lerEscovacaoStorage()[unidadeId];
      escConceitoConfirmado = resolverClassificacaoEscovacaoLocal(dados);
      escConceitoSelecionado = escConceitoConfirmado;
      atualizarUiEscovacao();
    }

    function limparEscovacaoUnidade(unidadeId) {
      if (unidadeId) gravarEscovacaoUnidade(unidadeId, null);
      escConceitoSelecionado = null;
      escConceitoConfirmado = null;
      atualizarUiEscovacao();
    }

    function limparUiEscovacao() {
      escConceitoSelecionado = null;
      escConceitoConfirmado = null;
      atualizarUiEscovacao();
    }

    function recalcularNotaSeAberta() {
      var simDrawerRoot = getSimDrawerRoot();
      var simDrawerConteudo = getSimDrawerConteudo();
      var unidadeSelect = getUnidadeSelect();
      if (
        !window.IndicaNotaUI ||
        !simDrawerRoot ||
        !simDrawerRoot.classList.contains("is-aberto") ||
        !simDrawerConteudo ||
        !unidadeSelect ||
        !unidadeSelect.value
      ) {
        return;
      }
      var opt = unidadeSelect.options[unidadeSelect.selectedIndex];
      window.IndicaNotaUI.recalcular(simDrawerConteudo, {
        unidadeId: unidadeSelect.value,
        unidadeNome: opt ? opt.text : "",
        populacao: getPopulacaoAtual(),
      }, { modoDrawer: true });
    }

    function initEscovacaoConceito() {
      var opcoes = document.getElementById("esc-conceito-opcoes");
      var btnConfirmar = document.getElementById("esc-conceito-confirmar");
      var btnLimpar = document.getElementById("esc-conceito-limpar");
      if (!opcoes || !btnConfirmar) return;
      if (opcoes.dataset.bound === "1") return;

      opcoes.addEventListener("click", function (e) {
        var btn = e.target.closest(".esc-conceito-btn");
        if (!btn || !opcoes.contains(btn)) return;
        escConceitoSelecionado = btn.getAttribute("data-conceito");
        atualizarUiEscovacao();
      });

      btnConfirmar.addEventListener("click", function () {
        if (!escConceitoSelecionado) return;
        var uid = getUnidadeAtualId();
        if (!uid) return;
        gravarEscovacaoUnidade(uid, escConceitoSelecionado);
        escConceitoConfirmado = escConceitoSelecionado;
        atualizarUiEscovacao();
        aposMudancaEscovacao(uid);
        recalcularNotaSeAberta();
      });

      if (btnLimpar) {
        btnLimpar.addEventListener("click", function () {
          var uid = getUnidadeAtualId();
          if (!uid) return;
          limparEscovacaoUnidade(uid);
          aposMudancaEscovacao(uid);
          recalcularNotaSeAberta();
        });
      }

      opcoes.dataset.bound = "1";
    }

    initEscovacaoConceito();

    return {
      lerEscovacaoStorage: lerEscovacaoStorage,
      escConceitoPorId: escConceitoPorId,
      resolverClassificacaoEscovacaoLocal: resolverClassificacaoEscovacaoLocal,
      gravarEscovacaoUnidade: gravarEscovacaoUnidade,
      carregarEscovacaoUnidade: carregarEscovacaoUnidade,
      limparEscovacaoUnidade: limparEscovacaoUnidade,
      limparUiEscovacao: limparUiEscovacao,
      atualizarUiEscovacao: atualizarUiEscovacao,
      getConceitoConfirmado: function () { return escConceitoConfirmado; },
      getConceitoSelecionado: function () { return escConceitoSelecionado; },
    };
  }

  global.IndicaEscovacao = { install: install };
})(typeof window !== "undefined" ? window : global);
