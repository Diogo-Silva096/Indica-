/**
 * Acessibilidade e foco nos painéis laterais (drawers).
 */
(function (global) {
  "use strict";

  function criarControleFoco(drawerPainel) {
    var gatilho = null;

    function focaveis() {
      if (!drawerPainel) return [];
      return Array.prototype.slice.call(
        drawerPainel.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(function (el) {
        return !el.hidden && el.getAttribute("aria-hidden") !== "true";
      });
    }

    function aoAbrir(origem) {
      gatilho = origem || document.activeElement;
      var fechar = drawerPainel && drawerPainel.querySelector(".sim-drawer-fechar, .pdf-drawer-fechar, .siaps-drawer-fechar");
      window.requestAnimationFrame(function () {
        if (fechar) fechar.focus();
        else if (drawerPainel) {
          drawerPainel.setAttribute("tabindex", "-1");
          drawerPainel.focus();
        }
      });
    }

    function aoFechar() {
      if (gatilho && typeof gatilho.focus === "function") {
        try { gatilho.focus(); } catch (e) { /* noop */ }
      }
      gatilho = null;
    }

    function aoTecla(e) {
      if (e.key !== "Tab" || !drawerPainel) return;
      var lista = focaveis();
      if (lista.length < 2) return;
      var primeiro = lista[0];
      var ultimo = lista[lista.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        }
      } else if (document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }

    return { aoAbrir: aoAbrir, aoFechar: aoFechar, aoTecla: aoTecla };
  }

  function create(ctx) {
    var simResultadosVisivel = false;
    var simFoco = criarControleFoco(ctx.simDrawer);
    var pdfFoco = criarControleFoco(ctx.pdfDrawer);
    var siapsFoco = criarControleFoco(ctx.siapsDrawer);

    function getSiapsVisivel() {
      return ctx.getSiapsVisivel ? !!ctx.getSiapsVisivel() : false;
    }

    function isSimAberto() {
      return simResultadosVisivel;
    }

    function syncDrawerNav() {
      var pdfVisivel = ctx.getPdfVisivel();
      var siapsVisivel = getSiapsVisivel();
      var algumAberto = pdfVisivel || simResultadosVisivel || siapsVisivel;
      document.body.classList.toggle("drawer-aberto", algumAberto);

      [ctx.navIndicadores, ctx.bottomIndicadores].forEach(function (el) {
        if (el) el.classList.toggle("is-active", !algumAberto);
      });
      [ctx.navSimulador, ctx.bottomNota].forEach(function (btn) {
        if (!btn) return;
        btn.setAttribute("aria-expanded", simResultadosVisivel ? "true" : "false");
        btn.classList.toggle("is-active", simResultadosVisivel);
      });
      [ctx.sidebarPdfBtn, ctx.bottomPdfBtn].forEach(function (btn) {
        if (!btn) return;
        btn.setAttribute("aria-expanded", pdfVisivel ? "true" : "false");
        btn.classList.toggle("is-active", pdfVisivel);
      });
      [ctx.sidebarSiapsBtn, ctx.bottomSiapsBtn].forEach(function (btn) {
        if (!btn) return;
        btn.setAttribute("aria-expanded", siapsVisivel ? "true" : "false");
        btn.classList.toggle("is-active", siapsVisivel);
      });
    }

    function simRenderizarDrawer() {
      if (!ctx.simDrawerConteudo || !global.IndicaNotaUI || !ctx.unidadeSelect.value) return;
      var opt = ctx.unidadeSelect.options[ctx.unidadeSelect.selectedIndex];
      global.IndicaNotaUI.recalcular(ctx.simDrawerConteudo, {
        unidadeId: ctx.unidadeSelect.value,
        unidadeNome: opt ? opt.text : "",
        populacao: ctx.getPopulacao(),
      }, { modoDrawer: true });
    }

    function simAtualizarDrawer() {
      if (ctx.simDrawerRoot) {
        ctx.simDrawerRoot.hidden = !simResultadosVisivel;
        ctx.simDrawerRoot.classList.toggle("is-aberto", simResultadosVisivel);
      }
      syncDrawerNav();
    }

    function simFecharDrawer() {
      if (!simResultadosVisivel) return;
      simResultadosVisivel = false;
      simFoco.aoFechar();
      simAtualizarDrawer();
    }

    function fecharSiapsSilencioso() {
      if (ctx.siapsFecharDrawer) ctx.siapsFecharDrawer({ silencioso: true });
    }

    function simAbrirDrawer(origem) {
      if (!ctx.unidadeSelect.value) return;
      ctx.setPdfVisivel(false);
      ctx.pdfFecharDrawer({ silencioso: true });
      fecharSiapsSilencioso();
      simResultadosVisivel = true;
      simRenderizarDrawer();
      ctx.pdfAtualizarDrawer();
      simAtualizarDrawer();
      simFoco.aoAbrir(origem);
    }

    function simAtualizarSeAberto() {
      if (simResultadosVisivel) simRenderizarDrawer();
    }

    function simIrParaIndicador(id) {
      simFecharDrawer();
      ctx.ativarIndicador(id);
      var painel = document.getElementById("painel-" + id) || document.querySelector('[data-indicador="' + id + '"]');
      if (painel) painel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function fecharTodos() {
      simFecharDrawer();
      fecharSiapsSilencioso();
    }

    function pdfNotificarAberto(origem) {
      simFecharDrawer();
      fecharSiapsSilencioso();
      pdfFoco.aoAbrir(origem);
      syncDrawerNav();
    }

    function pdfNotificarFechado(opts) {
      opts = opts || {};
      if (!opts.silencioso) pdfFoco.aoFechar();
      syncDrawerNav();
    }

    function siapsNotificarAberto(origem) {
      simFecharDrawer();
      if (ctx.setPdfVisivel) ctx.setPdfVisivel(false);
      if (ctx.pdfFecharDrawer) ctx.pdfFecharDrawer({ silencioso: true });
      if (ctx.pdfAtualizarDrawer) ctx.pdfAtualizarDrawer();
      siapsFoco.aoAbrir(origem);
      syncDrawerNav();
    }

    function siapsNotificarFechado(opts) {
      opts = opts || {};
      if (!opts.silencioso) siapsFoco.aoFechar();
      syncDrawerNav();
    }

    function registrarEventos() {
      if (ctx.navSimulador) {
        ctx.navSimulador.addEventListener("click", function (e) {
          if (simResultadosVisivel) simFecharDrawer();
          else simAbrirDrawer(e.currentTarget);
        });
      }
      if (ctx.bottomNota) {
        ctx.bottomNota.addEventListener("click", function (e) {
          if (simResultadosVisivel) simFecharDrawer();
          else simAbrirDrawer(e.currentTarget);
        });
      }
      if (ctx.simDrawerFechar) ctx.simDrawerFechar.addEventListener("click", simFecharDrawer);
      if (ctx.simDrawerOverlay) ctx.simDrawerOverlay.addEventListener("click", simFecharDrawer);
      if (ctx.simDrawerConteudo) {
        ctx.simDrawerConteudo.addEventListener("click", function (e) {
          var btn = e.target.closest(".sim-ir-indicador");
          if (!btn) return;
          e.preventDefault();
          simIrParaIndicador(btn.dataset.indicador);
        });
      }
      document.addEventListener("keydown", function (e) {
        if (e.key === "Tab") {
          if (simResultadosVisivel) simFoco.aoTecla(e);
          else if (ctx.getPdfVisivel()) pdfFoco.aoTecla(e);
          else if (getSiapsVisivel()) siapsFoco.aoTecla(e);
          return;
        }
        if (e.key !== "Escape") return;
        if (simResultadosVisivel) simFecharDrawer();
        else if (ctx.getPdfVisivel()) ctx.pdfFecharDrawer();
        else if (getSiapsVisivel() && ctx.siapsFecharDrawer) ctx.siapsFecharDrawer();
      });
    }

    return {
      syncDrawerNav: syncDrawerNav,
      simAbrirDrawer: simAbrirDrawer,
      simFecharDrawer: simFecharDrawer,
      simAtualizarDrawer: simAtualizarDrawer,
      simAtualizarSeAberto: simAtualizarSeAberto,
      isSimAberto: isSimAberto,
      fecharTodos: fecharTodos,
      pdfNotificarAberto: pdfNotificarAberto,
      pdfNotificarFechado: pdfNotificarFechado,
      siapsNotificarAberto: siapsNotificarAberto,
      siapsNotificarFechado: siapsNotificarFechado,
      registrarEventos: registrarEventos,
    };
  }

  global.IndicaDrawers = { create: create, criarControleFoco: criarControleFoco };
})(typeof window !== "undefined" ? window : this);
