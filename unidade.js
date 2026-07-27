/**
 * Seleção de unidade, sessão, shell (sidebar) e entrada/saída do app.
 * Instalado por indicadores.js via IndicaUnidade.install(env).
 * Passo 2 da organização do código: extrair o bloco de unidade do arquivo monolítico.
 */
(function (global) {
  "use strict";

  function install(env) {
    env = env || {};

    var unidadeSelect = document.getElementById("unidade-select");
    var btnEntrar = document.getElementById("btn-entrar");
    var unidadeErro = document.getElementById("unidade-erro");
    var secIndicadores = document.getElementById("indicadores");
    var telaEntrada = document.getElementById("tela-entrada");
    var telaApp = document.getElementById("tela-app");
    var entradaUnidade = document.getElementById("entrada-unidade");
    var entradaResumo = document.getElementById("entrada-resumo");
    var entradaSelecao = document.getElementById("entrada-selecao");
    var entradaResumoNome = document.getElementById("entrada-resumo-nome");
    var entradaResumoPop = document.getElementById("entrada-resumo-pop");
    var btnUsarOutra = document.getElementById("btn-usar-outra");
    var unidadeAtiva = document.getElementById("unidade-ativa");
    var introTrocar = document.getElementById("intro-trocar-unidade");
    var unidadeNome = document.getElementById("unidade-ativa-nome");
    var unidadePop = document.getElementById("unidade-ativa-pop");
    var appSidebar = document.getElementById("app-sidebar");
    var appBottomBar = document.getElementById("app-bottom-bar");
    var navIndicadores = document.getElementById("nav-indicadores");
    var bottomIndicadores = document.getElementById("bottom-indicadores");

    var navSimulador = env.navSimulador || document.getElementById("nav-simulador");
    var bottomNota = env.bottomNota || document.getElementById("bottom-nota");
    var simDrawerRoot = env.simDrawerRoot || document.getElementById("sim-drawer-root");

    function getPopulacaoAtual() {
      return typeof env.getPopulacaoAtual === "function" ? env.getPopulacaoAtual() : 0;
    }

    function setPopulacaoAtual(v) {
      if (typeof env.setPopulacaoAtual === "function") env.setPopulacaoAtual(v);
    }

    function getDrawers() {
      return typeof env.getDrawers === "function" ? env.getDrawers() : null;
    }

    function getPdfApi() {
      return typeof env.getPdfApi === "function" ? env.getPdfApi() : null;
    }

    function gravarSessaoUnidade(id, nome, pop) {
      if (window.IndicaNotaESB && IndicaNotaESB.gravarUnidadeAtiva) {
        IndicaNotaESB.gravarUnidadeAtiva({ unidadeId: id, unidadeNome: nome, populacao: pop });
        return;
      }
      try {
        localStorage.setItem("indicaPlus_unidade_ativa_v1", JSON.stringify({
          unidadeId: id,
          unidadeNome: nome,
          populacao: pop,
        }));
      } catch (e) { /* storage indisponível */ }
    }

    function limparSessaoUnidade() {
      if (window.IndicaNotaESB && IndicaNotaESB.limparUnidadeAtiva) {
        IndicaNotaESB.limparUnidadeAtiva();
        return;
      }
      try {
        localStorage.removeItem("indicaPlus_unidade_ativa_v1");
        sessionStorage.removeItem("indicaPlus_sessao_v1");
      } catch (e) { /* noop */ }
    }

    function atualizarNavNota(unidadeId) {
      var show = !!unidadeId;
      [navSimulador, bottomNota].forEach(function (el) {
        if (!el) return;
        el.hidden = !show;
      });
    }

    function setAppShellVisivel(visivel) {
      if (appSidebar) appSidebar.hidden = !visivel;
      if (appBottomBar) appBottomBar.hidden = true;
      if (!visivel) {
        var pdfApi = getPdfApi();
        if (pdfApi && pdfApi.setResultadosVisivel) pdfApi.setResultadosVisivel(false);
        var drawers = getDrawers();
        if (drawers) drawers.fecharTodos();
        var pdfRoot = pdfApi && pdfApi.getDrawerRoot ? pdfApi.getDrawerRoot() : null;
        if (pdfRoot) {
          pdfRoot.hidden = true;
          pdfRoot.classList.remove("is-aberto");
        }
        if (simDrawerRoot) {
          simDrawerRoot.hidden = true;
          simDrawerRoot.classList.remove("is-aberto");
        }
        document.body.classList.remove("drawer-aberto");
      }
    }

    function aplicarUnidadeSelecionada(id, nome, pop, persistir) {
      setPopulacaoAtual(pop);
      if (persistir !== false) gravarSessaoUnidade(id, nome, pop);
      atualizarNavNota(id);
      if (entradaUnidade && entradaUnidade.dataset.modo === "selecao" && btnEntrar) {
        btnEntrar.disabled = !id;
      }
    }

    function setModoEntradaResumo(nome, pop) {
      if (!entradaUnidade) return;
      entradaUnidade.dataset.modo = "resumo";
      if (entradaResumo) entradaResumo.hidden = false;
      if (entradaSelecao) entradaSelecao.hidden = true;
      if (btnUsarOutra) btnUsarOutra.hidden = false;
      if (entradaResumoNome) entradaResumoNome.textContent = nome;
      if (entradaResumoPop) {
        entradaResumoPop.textContent = Number(pop).toLocaleString("pt-BR");
      }
      if (btnEntrar) {
        btnEntrar.textContent = "Entrar";
        btnEntrar.disabled = false;
      }
      if (unidadeErro) unidadeErro.hidden = true;
    }

    function setModoEntradaSelecao() {
      if (!entradaUnidade) return;
      entradaUnidade.dataset.modo = "selecao";
      if (entradaResumo) entradaResumo.hidden = true;
      if (entradaSelecao) entradaSelecao.hidden = false;
      if (btnUsarOutra) btnUsarOutra.hidden = true;
      if (btnEntrar) {
        btnEntrar.textContent = "Continuar";
        btnEntrar.disabled = !(unidadeSelect && unidadeSelect.value);
      }
    }

    function abrirNotaSeSolicitado() {
      try {
        var params = new URLSearchParams(window.location.search);
        if (params.get("nota") !== "1") return;
        params.delete("nota");
        var qs = params.toString();
        var hash = location.hash || "#indicadores";
        history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + hash);
        var drawers = getDrawers();
        if (drawers) drawers.simAbrirDrawer();
      } catch (e) { /* noop */ }
    }

    function entrarNoApp() {
      if (!unidadeSelect || !unidadeSelect.value) {
        if (entradaUnidade && entradaUnidade.dataset.modo === "resumo") {
          setModoEntradaSelecao();
        }
        if (unidadeErro) unidadeErro.hidden = false;
        return;
      }

      var populacao = Number(unidadeSelect.value);
      var nomeUnidade = unidadeSelect.options[unidadeSelect.selectedIndex].text;
      setPopulacaoAtual(populacao);

      if (unidadeNome) unidadeNome.textContent = nomeUnidade;
      if (unidadePop) unidadePop.textContent = populacao.toLocaleString("pt-BR");
      if (unidadeAtiva) unidadeAtiva.hidden = false;
      if (introTrocar) introTrocar.hidden = false;

      if (typeof env.onEntrar === "function") {
        env.onEntrar({
          unidadeId: unidadeSelect.value,
          unidadeNome: nomeUnidade,
          populacao: populacao,
        });
      }

      gravarSessaoUnidade(unidadeSelect.value, nomeUnidade, populacao);
      atualizarNavNota(unidadeSelect.value);

      document.body.classList.remove("modo-entrada");
      document.body.classList.add("modo-app");
      document.documentElement.classList.remove("modo-entrada");
      document.documentElement.classList.add("modo-app");
      if (telaEntrada) {
        telaEntrada.hidden = true;
        telaEntrada.setAttribute("inert", "");
      }
      if (telaApp) {
        telaApp.hidden = false;
        telaApp.removeAttribute("inert");
      }
      setAppShellVisivel(true);
      if (location.hash !== "#indicadores") {
        history.replaceState(null, "", location.pathname + location.search + "#indicadores");
      }
      window.scrollTo({ top: 0, behavior: "auto" });
      abrirNotaSeSolicitado();
    }

    function sairDoApp(limparSessao) {
      document.body.classList.remove("modo-app");
      document.body.classList.add("modo-entrada");
      document.documentElement.classList.remove("modo-app");
      document.documentElement.classList.add("modo-entrada");
      if (telaEntrada) {
        telaEntrada.hidden = false;
        telaEntrada.removeAttribute("inert");
      }
      if (telaApp) {
        telaApp.hidden = true;
        telaApp.setAttribute("inert", "");
      }

      if (unidadeAtiva) unidadeAtiva.hidden = true;
      if (introTrocar) introTrocar.hidden = true;
      setAppShellVisivel(false);
      atualizarNavNota("");

      if (typeof env.onSair === "function") {
        env.onSair({ limparSessao: !!limparSessao });
      }

      if (limparSessao) {
        limparSessaoUnidade();
        setPopulacaoAtual(0);
        if (unidadeSelect) unidadeSelect.value = "";
        setModoEntradaSelecao();
      }

      if (location.hash) {
        history.replaceState(null, "", location.pathname + location.search);
      }
      window.scrollTo({ top: 0, behavior: "auto" });
      if (unidadeSelect) unidadeSelect.focus();
    }

    function irParaIndicadores(e) {
      if (document.body.classList.contains("modo-entrada")) {
        if (e) e.preventDefault();
        if (entradaUnidade && entradaUnidade.dataset.modo === "resumo") {
          setModoEntradaSelecao();
        }
        if (unidadeErro) unidadeErro.hidden = false;
        if (unidadeSelect) unidadeSelect.focus();
        return;
      }
      if (e) e.preventDefault();
      var pdfApi = getPdfApi();
      if (pdfApi && pdfApi.fecharDrawer) pdfApi.fecharDrawer();
      var drawers = getDrawers();
      if (drawers) drawers.simFecharDrawer();
      if (secIndicadores) {
        secIndicadores.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    if (unidadeSelect) {
      unidadeSelect.addEventListener("change", function () {
        if (unidadeErro) unidadeErro.hidden = true;
        if (!unidadeSelect.value) {
          if (btnEntrar) btnEntrar.disabled = true;
          atualizarNavNota("");
          return;
        }
        aplicarUnidadeSelecionada(
          unidadeSelect.value,
          unidadeSelect.options[unidadeSelect.selectedIndex].text,
          Number(unidadeSelect.value)
        );
      });
    }

    if (btnEntrar) {
      btnEntrar.addEventListener("click", entrarNoApp);
    }

    if (btnUsarOutra) {
      btnUsarOutra.addEventListener("click", function () {
        setModoEntradaSelecao();
        if (unidadeSelect) unidadeSelect.focus();
      });
    }

    document.querySelectorAll(".js-trocar-unidade").forEach(function (btn) {
      btn.addEventListener("click", function () {
        sairDoApp(true);
      });
    });

    if (navIndicadores) navIndicadores.addEventListener("click", irParaIndicadores);
    if (bottomIndicadores) bottomIndicadores.addEventListener("click", irParaIndicadores);

    (function restaurarUnidadeSalva() {
      if (!unidadeSelect) return;
      var salva = window.IndicaNotaESB && IndicaNotaESB.resolverUnidadeAtiva
        ? IndicaNotaESB.resolverUnidadeAtiva()
        : null;
      if (!salva || !salva.unidadeId) return;

      var opt = unidadeSelect.querySelector('option[value="' + salva.unidadeId + '"]');
      if (!opt) return;

      unidadeSelect.value = salva.unidadeId;
      aplicarUnidadeSelecionada(salva.unidadeId, salva.unidadeNome || opt.text, Number(salva.populacao), false);
      setModoEntradaResumo(salva.unidadeNome || opt.text, salva.populacao);
    })();

    return {
      unidadeSelect: unidadeSelect,
      navIndicadores: navIndicadores,
      bottomIndicadores: bottomIndicadores,
      entrarNoApp: entrarNoApp,
      sairDoApp: sairDoApp,
      atualizarNavNota: atualizarNavNota,
      setAppShellVisivel: setAppShellVisivel,
      irParaIndicadores: irParaIndicadores,
    };
  }

  global.IndicaUnidade = { install: install };
})(typeof window !== "undefined" ? window : global);
