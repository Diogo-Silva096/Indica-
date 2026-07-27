/**
 * Cola do app: liga os módulos (unidade, PCO, TOC, escovação, B3/B5/B6, PDF/quad).
 * Passo 8 — sem lógica de domínio própria; só helpers compartilhados + instalação + orquestração.
 */
(function () {
  var ESB = window.IndicaNotaESB;
  if (!ESB) return;

  var MESES_NOME = ESB.MESES_NOME;
  var QUADRIMESTRES = ESB.QUADRIMESTRES;
  var QUAD_MESES_LABEL = ESB.QUAD_MESES_LABEL;
  var ESC_STORAGE_KEY = ESB.ESC_STORAGE_KEY;
  var PCO_STORAGE_KEY = ESB.PCO_STORAGE_KEY;
  var TOC_STORAGE_KEY = ESB.TOC_STORAGE_KEY;
  var PDF_STORAGE_KEY = ESB.PDF_STORAGE_KEY;

  /* ===== Estado compartilhado do shell ===== */
  var unidadeSelect = document.getElementById("unidade-select");
  var pcoCadastrados = document.getElementById("pco-cadastrados");
  var quadResetBar = document.getElementById("quad-reset");
  var quadResetPeriodo = document.getElementById("quad-reset-periodo");
  var btnReiniciarQuadrimestre = document.getElementById("btn-reiniciar-quadrimestre");
  var navSimulador = document.getElementById("nav-simulador");
  var bottomNota = document.getElementById("bottom-nota");
  var navIndicadores = document.getElementById("nav-indicadores");
  var bottomIndicadores = document.getElementById("bottom-indicadores");
  var simDrawerRoot = document.getElementById("sim-drawer-root");
  var simDrawerOverlay = document.getElementById("sim-drawer-overlay");
  var simDrawerFechar = document.getElementById("sim-drawer-fechar");
  var simDrawer = document.getElementById("sim-drawer");
  var simDrawerConteudo = document.getElementById("sim-drawer-conteudo");

  var populacaoAtual = 0;
  var drawers = null;
  var pcoApi = null;
  var tocApi = null;
  var escApi = null;
  var b456Api = null;
  var pdfApi = null;
  var unidadeApi = null;

  var atualizarNavNota = function () {};
  var entrarNoApp = function () {};
  var atualizarQuadResetBar = function () {};
  var atualizarResultadoLiveB5 = function () {};
  var atualizarResultadoLiveB6 = function () {};
  var atualizarResultadoLiveB3 = function () {};
  var iniciarQuadPainelsParaUnidade = function () {};
  var pdfIniciar = function () {};

  /* ===== Navegação de abas ===== */
  var tabs = document.querySelectorAll(".indicador-tab");
  var paineis = document.querySelectorAll(".indicador-painel");

  function ativarIndicador(id) {
    tabs.forEach(function (tab) {
      var ativo = tab.dataset.indicador === id;
      tab.classList.toggle("is-active", ativo);
      tab.setAttribute("aria-selected", ativo ? "true" : "false");
    });
    paineis.forEach(function (painel) {
      var ativo = painel.dataset.indicador === id;
      painel.classList.toggle("is-active", ativo);
      painel.hidden = !ativo;
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () { ativarIndicador(tab.dataset.indicador); });
  });

  /* ===== Helpers compartilhados (passados aos módulos via env) ===== */
  function fmtPct(valor) {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + "%";
  }

  function attrStyleCor(cor) {
    return cor ? ' style="--cor: ' + cor + '"' : "";
  }

  function attrStyleCorAcum(cor) {
    return cor ? ' style="--cor-acum: ' + cor + '"' : "";
  }

  function plural(qtd, um, muitos) {
    return qtd === 1 ? "1 " + um : qtd + " " + muitos;
  }

  function segmentoEscalaAtivo(z, pct, max) {
    return pct >= z.ini && (pct < z.fim || (z.fim >= max && pct >= z.fim));
  }

  function montarEscalaFaixas(config) {
    var pct = config.pct;
    var atual = config.atual;
    var max = config.max;
    var zonas = config.zonas;
    var ticks = config.ticks || [];
    var titulo = config.titulo || "Onde voc\u00EA est\u00E1 em rela\u00E7\u00E3o \u00E0s metas";
    var extraClass = config.compact ? " b3-escala--compact" : "";
    var rotulos = config.rotulos !== false;
    var posReal = Math.max(0, Math.min(pct, max)) / max * 100;
    var posMarcador = Math.max(3, Math.min(posReal, 97));
    var html = "";

    html += '<div class="b3-escala' + extraClass + '">';
    html += '  <h4 class="dash-section-titulo">' + titulo + "</h4>";
    html += '  <div class="b3-escala-track">';
    html += '    <div class="b3-escala-bar">';

    zonas.forEach(function (z) {
      var largura = (z.fim - z.ini) / max * 100;
      var ehAtual = segmentoEscalaAtivo(z, pct, max);
      html += '<div class="b3-escala-seg' + (ehAtual ? " is-atual" : "") + '" style="flex: 0 0 ' + largura + "%; --cor: " + z.cor + '">';
      if (rotulos && z.nome) {
        html += '<span class="b3-escala-seg-label">' + z.nome + "</span>";
      }
      html += "</div>";
    });

    html += "    </div>";
    html += '    <div class="b3-escala-marcador" style="left: ' + posMarcador + "%; --cor: " + atual.cor + '">';
    html += '      <span class="b3-escala-marcador-valor">' + fmtPct(pct) + "</span>";
    html += '      <span class="b3-escala-marcador-linha"></span>';
    html += "    </div>";
    html += "  </div>";

    if (ticks.length) {
      html += '  <div class="b3-escala-ticks">';
      ticks.forEach(function (t) {
        var left = t / max * 100;
        var rotulo = config.fmtTick ? config.fmtTick(t) : t + "%";
        html += '<span class="b3-escala-tick" style="left: ' + left + '%">' + rotulo + "</span>";
      });
      html += "  </div>";
    }

    html += "</div>";
    return html;
  }

  function obterQuadReferenciaUnidade(unidadeId) {
    var pco = pcoApi ? pcoApi.lerPcoStorage()[unidadeId] : null;
    var toc = tocApi ? tocApi.lerTocStorage()[unidadeId] : null;
    if (pco && pco._quad) return pco._quad;
    if (toc && toc._quad) return toc._quad;
    return null;
  }

  function resolverCompetenciaSalvar(unidadeId, pos) {
    var quad = obterQuadReferenciaUnidade(unidadeId);
    if (quad && QUADRIMESTRES[quad.indice]) {
      return { mes: QUADRIMESTRES[quad.indice].meses[pos - 1], ano: quad.ano };
    }
    var now = new Date();
    var idx = ESB.quadIndicePorMes(now.getMonth() + 1);
    return { mes: QUADRIMESTRES[idx].meses[pos - 1], ano: now.getFullYear() };
  }

  function focarInputMesCard(grid, mes, seletor) {
    if (!grid) return;
    window.requestAnimationFrame(function () {
      var card = grid.querySelector('.pco-mes-card[data-mes="' + mes + '"]');
      var inp = card && card.querySelector(seletor || ".pco-mes-card-input");
      if (inp) {
        inp.focus();
        if (typeof inp.select === "function") inp.select();
      }
    });
  }

  /* Espelha 1ªs consultas entre B1 (PCO) e B2 (TOC) — mesma competência. */
  function uidPcoTocAtivo() {
    return (pcoApi && pcoApi.getUnidadeId()) ||
      (tocApi && tocApi.getUnidadeId()) ||
      "";
  }

  function espelharPrimeirasPcoNoToc(mes, primeiras) {
    if (!tocApi || !mes) return false;
    var uid = uidPcoTocAtivo();
    if (!uid) return false;
    var todos = tocApi.lerTocStorage();
    if (!todos[uid] || !todos[uid][mes]) return false;
    if (Number(todos[uid][mes].primeiraConsulta) === Number(primeiras)) return false;
    todos[uid][mes].primeiraConsulta = primeiras;
    todos[uid][mes].atualizadoEm = new Date().toISOString();
    tocApi.gravarTocStorage(todos);
    return true;
  }

  function espelharPrimeirasTocNoPco(mes, primeiras) {
    if (!pcoApi || !mes) return false;
    var uid = uidPcoTocAtivo();
    if (!uid) return false;
    var todos = pcoApi.lerPcoStorage();
    if (!todos[uid]) todos[uid] = {};
    var atual = todos[uid][mes];
    if (atual && Number(atual.primeiras) === Number(primeiras)) return false;
    todos[uid][mes] = {
      primeiras: primeiras,
      atualizadoEm: new Date().toISOString(),
    };
    try {
      localStorage.setItem(PCO_STORAGE_KEY, JSON.stringify(todos));
    } catch (e) {
      return false;
    }
    return true;
  }

  function limparFormulariosIndicadores() {
    if (b456Api && b456Api.b5Form) {
      if (pdfApi && pdfApi.resetQuadOverrides) pdfApi.resetQuadOverrides();
      b456Api.b5Form.querySelectorAll(".b5-item-input").forEach(function (inp) { inp.value = ""; });
      if (typeof b456Api.aplicarFiltroB5 === "function") b456Api.aplicarFiltroB5();
      if (typeof atualizarResultadoLiveB5 === "function") atualizarResultadoLiveB5();
      else if (b456Api.b5MetasEscala) {
        b456Api.b5MetasEscala.hidden = true;
        b456Api.b5MetasEscala.innerHTML = "";
      }
    }

    if (b456Api && b456Api.b6Form) {
      b456Api.b6Form.querySelectorAll(".b6-item-input").forEach(function (inp) { inp.value = ""; });
      if (typeof b456Api.aplicarFiltroB6 === "function") b456Api.aplicarFiltroB6();
      if (typeof atualizarResultadoLiveB6 === "function") atualizarResultadoLiveB6();
      else if (b456Api.b6MetasEscala) {
        b456Api.b6MetasEscala.hidden = true;
        b456Api.b6MetasEscala.innerHTML = "";
      }
    }

    if (b456Api && b456Api.b3Form) {
      b456Api.b3Form.querySelectorAll(".b3-campo-input").forEach(function (inp) { inp.value = ""; });
      if (typeof atualizarResultadoLiveB3 === "function") atualizarResultadoLiveB3();
      else if (b456Api.b3MetasEscala) {
        b456Api.b3MetasEscala.hidden = true;
        b456Api.b3MetasEscala.innerHTML = "";
      }
    }

    if (escApi && typeof escApi.limparUiEscovacao === "function") escApi.limparUiEscovacao();
  }

  /* ===== Instalar PCO ===== */
  (function instalarPco() {
    if (!window.IndicaPco || typeof window.IndicaPco.install !== "function") {
      console.error("IndicaPco não carregado. Inclua indicadores-pco.js antes de indicadores.js.");
      return;
    }

    pcoApi = window.IndicaPco.install({
      ESB: ESB,
      PCO_STORAGE_KEY: PCO_STORAGE_KEY,
      QUAD_MESES_LABEL: QUAD_MESES_LABEL,
      fmtPct: fmtPct,
      plural: plural,
      attrStyleCor: attrStyleCor,
      montarEscalaFaixas: montarEscalaFaixas,
      resolverCompetenciaSalvar: resolverCompetenciaSalvar,
      focarInputMesCard: focarInputMesCard,
      lerTocStorage: function () { return tocApi ? tocApi.lerTocStorage() : {}; },
      getPopulacaoAtual: function () { return populacaoAtual; },
      getDrawers: function () { return drawers; },
      atualizarQuadResetBar: function (uid) {
        if (typeof atualizarQuadResetBar === "function") atualizarQuadResetBar(uid);
      },
      aposSalvarPco: function (mes, primeiras) {
        espelharPrimeirasPcoNoToc(mes, primeiras);
        if (tocApi) tocApi.atualizarPainelToc();
        if (pdfApi && typeof pdfApi.sincronizarPcoTocEditados === "function") {
          var uid = tocApi ? tocApi.getUnidadeId() : "";
          var tocMes = uid && tocApi ? tocApi.obterTocMesesUnidade(uid)[mes] : null;
          var concluidos = tocMes && typeof tocMes.concluidos === "number" ? tocMes.concluidos : null;
          pdfApi.sincronizarPcoTocEditados(mes, primeiras, concluidos);
        }
      },
    });
  })();

  /* ===== Instalar TOC ===== */
  (function instalarToc() {
    if (!window.IndicaToc || typeof window.IndicaToc.install !== "function") {
      console.error("IndicaToc não carregado. Inclua indicadores-toc.js antes de indicadores.js.");
      return;
    }

    tocApi = window.IndicaToc.install({
      ESB: ESB,
      TOC_STORAGE_KEY: TOC_STORAGE_KEY,
      QUAD_MESES_LABEL: QUAD_MESES_LABEL,
      fmtPct: fmtPct,
      attrStyleCor: attrStyleCor,
      attrStyleCorAcum: attrStyleCorAcum,
      montarEscalaFaixas: montarEscalaFaixas,
      resolverCompetenciaSalvar: resolverCompetenciaSalvar,
      focarInputMesCard: focarInputMesCard,
      lerPcoStorage: function () { return pcoApi ? pcoApi.lerPcoStorage() : {}; },
      obterPcoMesesUnidade: function (id) { return pcoApi ? pcoApi.obterPcoMesesUnidade(id) : {}; },
      getDrawers: function () { return drawers; },
      atualizarQuadResetBar: function (uid) {
        if (typeof atualizarQuadResetBar === "function") atualizarQuadResetBar(uid);
      },
      aposSalvarToc: function (mes, primeiraConsulta, concluidos) {
        espelharPrimeirasTocNoPco(mes, primeiraConsulta);
        if (pcoApi) pcoApi.atualizarPainelPco();
        if (pdfApi && typeof pdfApi.sincronizarPcoTocEditados === "function") {
          pdfApi.sincronizarPcoTocEditados(mes, primeiraConsulta, concluidos);
        }
      },
    });
  })();

  /* ===== Instalar Escovação ===== */
  (function instalarEscovacao() {
    if (!window.IndicaEscovacao || typeof window.IndicaEscovacao.install !== "function") {
      console.error("IndicaEscovacao não carregado. Inclua indicadores-escovacao.js antes de indicadores.js.");
      return;
    }

    escApi = window.IndicaEscovacao.install({
      ESB: ESB,
      ESC_STORAGE_KEY: ESC_STORAGE_KEY,
      classificarPco: function (pct) {
        return pcoApi ? pcoApi.classificarPco(pct) : "regular";
      },
      getUnidadeAtualId: function () {
        return (pcoApi && pcoApi.getUnidadeId()) ||
          (tocApi && tocApi.getUnidadeId()) ||
          (pdfApi && pdfApi.getUnidadeId && pdfApi.getUnidadeId()) ||
          (unidadeSelect && unidadeSelect.value) ||
          "";
      },
      getPopulacaoAtual: function () { return populacaoAtual; },
      getUnidadeSelect: function () { return unidadeSelect; },
      getSimDrawerRoot: function () { return simDrawerRoot; },
      getSimDrawerConteudo: function () { return simDrawerConteudo; },
      aposMudancaEscovacao: function (uid) {
        if (typeof atualizarNavNota === "function") atualizarNavNota(uid);
        if (pdfApi && typeof pdfApi.atualizarAposEscovacao === "function") {
          pdfApi.atualizarAposEscovacao();
        }
      },
    });
  })();

  /* ===== Instalar B3/B5/B6 ===== */
  (function instalarB456() {
    if (!window.IndicaB456 || typeof window.IndicaB456.install !== "function") {
      console.error("IndicaB456 não carregado. Inclua indicadores-b456.js antes de indicadores.js.");
      return;
    }

    b456Api = window.IndicaB456.install({
      ESB: ESB,
      montarEscalaFaixas: montarEscalaFaixas,
      atualizarResultadoLiveB5: function () {
        if (typeof atualizarResultadoLiveB5 === "function") atualizarResultadoLiveB5();
      },
      atualizarResultadoLiveB6: function () {
        if (typeof atualizarResultadoLiveB6 === "function") atualizarResultadoLiveB6();
      },
      atualizarResultadoLiveB3: function () {
        if (typeof atualizarResultadoLiveB3 === "function") atualizarResultadoLiveB3();
      },
    });
  })();

  /* ===== Instalar PDF (+ quadrimestre via pdf-import) ===== */
  (function instalarPdf() {
    if (!window.IndicaPdf || typeof window.IndicaPdf.install !== "function") {
      console.error("IndicaPdf não carregado. Inclua pdf-import.js antes de indicadores.js.");
      return;
    }
    if (!pcoApi || !tocApi || !b456Api) {
      console.error("Módulos PCO/TOC/B456 necessários antes do PDF.");
      return;
    }

    var env = {
      ESB: ESB,
      MESES_NOME: MESES_NOME,
      QUADRIMESTRES: QUADRIMESTRES,
      QUAD_MESES_LABEL: QUAD_MESES_LABEL,
      PDF_STORAGE_KEY: PDF_STORAGE_KEY,
      unidadeSelect: unidadeSelect,
      navIndicadores: navIndicadores,
      bottomIndicadores: bottomIndicadores,
      navSimulador: navSimulador,
      bottomNota: bottomNota,
      ativarIndicador: ativarIndicador,
      obterQuadReferenciaUnidade: obterQuadReferenciaUnidade,
      attrStyleCor: attrStyleCor,
      attrStyleCorAcum: attrStyleCorAcum,
      interpretacaoB3: b456Api.interpretacaoB3,
      interpretacaoB5: b456Api.interpretacaoB5,
      interpretacaoB6: b456Api.interpretacaoB6,
      B5_PREVENTIVOS: b456Api.B5_PREVENTIVOS,
      B5_OUTROS: b456Api.B5_OUTROS,
      B3_EXODONTIAS: b456Api.B3_EXODONTIAS,
      B3_PREVENTIVOS: b456Api.B3_PREVENTIVOS,
      B3_CURATIVOS: b456Api.B3_CURATIVOS,
      B6_TRA: b456Api.B6_TRA,
      B6_OUTROS: b456Api.B6_OUTROS,
      fmtPct: fmtPct,
      classificarPco: pcoApi.classificarPco,
      classificacaoPcoPorId: pcoApi.classificacaoPcoPorId,
      classificarToc: tocApi.classificarToc,
      classificacaoTocPorId: tocApi.classificacaoTocPorId,
      classificarB3: b456Api.classificarB3,
      classificarB5: b456Api.classificarB5,
      classificarB6: b456Api.classificarB6,
      classificacaoB3PorId: b456Api.classificacaoB3PorId,
      classificacaoB5PorId: b456Api.classificacaoB5PorId,
      classificacaoB6PorId: b456Api.classificacaoB6PorId,
      calcularResultadoMesPco: pcoApi.calcularResultadoMesPco,
      lerEscovacaoStorage: function () {
        return escApi ? escApi.lerEscovacaoStorage() : {};
      },
      escConceitoPorId: function (id) {
        return escApi ? escApi.escConceitoPorId(id) : null;
      },
      resolverClassificacaoEscovacaoLocal: function () {
        return escApi
          ? escApi.resolverClassificacaoEscovacaoLocal.apply(escApi, arguments)
          : null;
      },
      salvarMesPco: pcoApi.salvarMesPco,
      salvarMesToc: tocApi.salvarMesToc,
      atualizarPainelPco: pcoApi.atualizarPainelPco,
      atualizarPainelToc: tocApi.atualizarPainelToc,
      aplicarFiltroB5: b456Api.aplicarFiltroB5,
      aplicarFiltroB6: b456Api.aplicarFiltroB6,
      renderizarMetasB5: b456Api.renderizarMetasB5,
      renderizarMetasB6: b456Api.renderizarMetasB6,
      renderizarMetasB3: b456Api.renderizarMetasB3,
      metricasB5DeForm: b456Api.metricasB5DeForm,
      metricasB6DeForm: b456Api.metricasB6DeForm,
      metricasB3DeForm: b456Api.metricasB3DeForm,
      reiniciarQuadrimestrePco: pcoApi.reiniciarQuadrimestrePco,
      reiniciarQuadrimestreToc: tocApi.reiniciarQuadrimestreToc,
      limparFormulariosIndicadores: limparFormulariosIndicadores,
      limparEscovacaoUnidade: function (uid) {
        if (escApi) escApi.limparEscovacaoUnidade(uid);
      },
      b5Form: b456Api.b5Form,
      b6Form: b456Api.b6Form,
      b3Form: b456Api.b3Form,
      b3InExo: b456Api.b3InExo,
      b3InPrev: b456Api.b3InPrev,
      b3InCur: b456Api.b3InCur,
      pcoResultado: pcoApi.pcoResultado,
      tocResumo: tocApi.tocResumo,
      quadResetBar: quadResetBar,
      quadResetPeriodo: quadResetPeriodo,
      btnReiniciarQuadrimestre: btnReiniciarQuadrimestre,
      simDrawerRoot: simDrawerRoot,
      simDrawerOverlay: simDrawerOverlay,
      simDrawerFechar: simDrawerFechar,
      simDrawer: simDrawer,
      simDrawerConteudo: simDrawerConteudo,
    };

    Object.defineProperties(env, {
      populacaoAtual: {
        get: function () { return populacaoAtual; },
        enumerable: true,
      },
      drawers: {
        get: function () { return drawers; },
        set: function (v) { drawers = v; },
        enumerable: true,
      },
      pcoUnidadeId: {
        get: function () { return pcoApi.getUnidadeId(); },
        set: function (v) { pcoApi.setUnidadeId(v); },
        enumerable: true,
      },
      tocUnidadeId: {
        get: function () { return tocApi.getUnidadeId(); },
        set: function (v) { tocApi.setUnidadeId(v); },
        enumerable: true,
      },
      pcoMesAtual: {
        get: function () { return pcoApi.getMesAtual(); },
        set: function (v) { pcoApi.setMesAtual(v); },
        enumerable: true,
      },
      tocMesAtual: {
        get: function () { return tocApi.getMesAtual(); },
        set: function (v) { tocApi.setMesAtual(v); },
        enumerable: true,
      },
      pcoMesEditando: {
        get: function () { return pcoApi.getMesEditando(); },
        set: function (v) { pcoApi.setMesEditando(v); },
        enumerable: true,
      },
      tocMesEditando: {
        get: function () { return tocApi.getMesEditando(); },
        set: function (v) { tocApi.setMesEditando(v); },
        enumerable: true,
      },
    });

    pdfApi = window.IndicaPdf.install(env);
    pdfIniciar = pdfApi.iniciar;
    atualizarQuadResetBar = pdfApi.atualizarQuadResetBar;
    atualizarResultadoLiveB5 = pdfApi.atualizarResultadoLiveB5;
    atualizarResultadoLiveB6 = pdfApi.atualizarResultadoLiveB6;
    atualizarResultadoLiveB3 = pdfApi.atualizarResultadoLiveB3;
    iniciarQuadPainelsParaUnidade = pdfApi.iniciarQuadPainelsParaUnidade;
  })();

  /* ===== Instalar Unidade ===== */
  (function instalarUnidade() {
    if (!window.IndicaUnidade || typeof window.IndicaUnidade.install !== "function") {
      console.error("IndicaUnidade não carregado. Inclua unidade.js antes de indicadores.js.");
      return;
    }

    unidadeApi = window.IndicaUnidade.install({
      navSimulador: navSimulador,
      bottomNota: bottomNota,
      simDrawerRoot: simDrawerRoot,
      getPopulacaoAtual: function () { return populacaoAtual; },
      setPopulacaoAtual: function (v) { populacaoAtual = v; },
      getDrawers: function () { return drawers; },
      getPdfApi: function () { return pdfApi; },
      onEntrar: function (ctx) {
        if (pcoCadastrados) pcoCadastrados.value = ctx.populacao;

        if (tocApi) {
          tocApi.setUnidadeId(ctx.unidadeId);
          tocApi.iniciarTocParaUnidade(ctx.unidadeId);
        }

        if (pcoApi) pcoApi.iniciarPcoParaUnidade(ctx.unidadeId);

        if (typeof pdfIniciar === "function") {
          try {
            pdfIniciar(ctx.unidadeId);
          } catch (err) {
            console.error("Falha ao iniciar PDF/quadrimestre:", err);
            if (typeof iniciarQuadPainelsParaUnidade === "function") {
              try { iniciarQuadPainelsParaUnidade(ctx.unidadeId); } catch (e2) { /* noop */ }
            }
          }
        } else if (typeof iniciarQuadPainelsParaUnidade === "function") {
          iniciarQuadPainelsParaUnidade(ctx.unidadeId);
        }

        if (quadResetBar) quadResetBar.hidden = false;
        if (typeof atualizarQuadResetBar === "function") atualizarQuadResetBar(ctx.unidadeId);
        if (escApi) escApi.carregarEscovacaoUnidade(ctx.unidadeId);
      },
      onSair: function () {
        if (quadResetBar) quadResetBar.hidden = true;
      },
    });

    if (unidadeApi) {
      if (unidadeApi.unidadeSelect) unidadeSelect = unidadeApi.unidadeSelect;
      if (unidadeApi.navIndicadores) navIndicadores = unidadeApi.navIndicadores;
      if (unidadeApi.bottomIndicadores) bottomIndicadores = unidadeApi.bottomIndicadores;
      entrarNoApp = unidadeApi.entrarNoApp;
      atualizarNavNota = unidadeApi.atualizarNavNota;
    }
  })();

  /* ===== Entrada por hash / botão processar ===== */
  if (location.hash === "#indicadores" && unidadeSelect && unidadeSelect.value) {
    entrarNoApp();
  } else if (location.hash === "#indicadores") {
    history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  window.addEventListener("hashchange", function () {
    if (location.hash !== "#indicadores") return;
    if (document.body.classList.contains("modo-app")) return;
    if (unidadeSelect && unidadeSelect.value) {
      entrarNoApp();
      return;
    }
    history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo({ top: 0, behavior: "auto" });
  });

  if (pdfApi && pdfApi.atualizarBotaoProcessar) pdfApi.atualizarBotaoProcessar();

  /* ===== Info-detalhe: marcar leituras ===== */
  (function initInfoDetalhe() {
    var KEY = "indicaPlus_info_vistas_v1";
    function lidas() {
      try {
        return JSON.parse(localStorage.getItem(KEY)) || {};
      } catch (e) {
        return {};
      }
    }
    function marcar(id) {
      if (!id) return;
      var o = lidas();
      o[id] = true;
      try {
        localStorage.setItem(KEY, JSON.stringify(o));
      } catch (e) { /* storage indisponível */ }
    }
    document.querySelectorAll(".info-detalhe[data-info-id]").forEach(function (el) {
      el.addEventListener("toggle", function () {
        if (el.open) marcar(el.dataset.infoId);
      });
    });
  })();
})();
