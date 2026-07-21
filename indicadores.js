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

  /* ===== SELEÇÃO DE UNIDADE ===== */
  var unidadeSelect = document.getElementById("unidade-select");
  var btnEntrar     = document.getElementById("btn-entrar");
  var unidadeErro   = document.getElementById("unidade-erro");
  var secIndicadores = document.getElementById("indicadores");
  var telaEntrada   = document.getElementById("tela-entrada");
  var telaApp       = document.getElementById("tela-app");
  var entradaUnidade = document.getElementById("entrada-unidade");
  var entradaResumo = document.getElementById("entrada-resumo");
  var entradaSelecao = document.getElementById("entrada-selecao");
  var entradaResumoNome = document.getElementById("entrada-resumo-nome");
  var entradaResumoPop = document.getElementById("entrada-resumo-pop");
  var btnUsarOutra  = document.getElementById("btn-usar-outra");
  var unidadeAtiva  = document.getElementById("unidade-ativa");
  var introTrocar   = document.getElementById("intro-trocar-unidade");
  var unidadeNome   = document.getElementById("unidade-ativa-nome");
  var unidadePop    = document.getElementById("unidade-ativa-pop");
  var pcoCadastrados = document.getElementById("pco-cadastrados");
  var quadResetBar  = document.getElementById("quad-reset");
  var quadResetPeriodo = document.getElementById("quad-reset-periodo");
  var btnReiniciarQuadrimestre = document.getElementById("btn-reiniciar-quadrimestre");
  var navSimulador = document.getElementById("nav-simulador");
  var bottomNota   = document.getElementById("bottom-nota");
  var appSidebar   = document.getElementById("app-sidebar");
  var appBottomBar = document.getElementById("app-bottom-bar");

  var populacaoAtual = 0;
  var drawers = null;

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
      pdfResultadosVisivel = false;
      if (drawers) drawers.fecharTodos();
      if (pdfDrawerRoot) {
        pdfDrawerRoot.hidden = true;
        pdfDrawerRoot.classList.remove("is-aberto");
      }
      if (simDrawerRoot) {
        simDrawerRoot.hidden = true;
        simDrawerRoot.classList.remove("is-aberto");
      }
      document.body.classList.remove("drawer-aberto");
    }
  }

  function aplicarUnidadeSelecionada(id, nome, pop, persistir) {
    populacaoAtual = pop;
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
      btnEntrar.disabled = !unidadeSelect.value;
    }
  }

  function entrarNoApp() {
    if (!unidadeSelect.value) {
      if (entradaUnidade && entradaUnidade.dataset.modo === "resumo") {
        setModoEntradaSelecao();
      }
      if (unidadeErro) unidadeErro.hidden = false;
      return;
    }

    populacaoAtual = Number(unidadeSelect.value);
    var nomeUnidade = unidadeSelect.options[unidadeSelect.selectedIndex].text;

    unidadeNome.textContent = nomeUnidade;
    unidadePop.textContent = populacaoAtual.toLocaleString("pt-BR");
    if (unidadeAtiva) unidadeAtiva.hidden = false;
    if (introTrocar) introTrocar.hidden = false;

    if (pcoCadastrados) {
      pcoCadastrados.value = populacaoAtual;
    }

    tocUnidadeId = unidadeSelect.value;
    iniciarTocParaUnidade(tocUnidadeId);

    pcoUnidadeId = unidadeSelect.value;
    iniciarPcoParaUnidade(pcoUnidadeId);

    if (typeof pdfIniciar === "function") pdfIniciar(unidadeSelect.value);
    else iniciarQuadPainelsParaUnidade(unidadeSelect.value);

    if (quadResetBar) quadResetBar.hidden = false;
    if (typeof atualizarQuadResetBar === "function") atualizarQuadResetBar(unidadeSelect.value);

    gravarSessaoUnidade(unidadeSelect.value, nomeUnidade, populacaoAtual);
    atualizarNavNota(unidadeSelect.value);
    carregarEscovacaoUnidade(unidadeSelect.value);

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
    window.scrollTo({ top: 0, behavior: "auto" });
    abrirNotaSeSolicitado();
  }

  function abrirNotaSeSolicitado() {
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get("nota") !== "1") return;
      params.delete("nota");
      var qs = params.toString();
      var hash = location.hash || "#indicadores";
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + hash);
      if (drawers) drawers.simAbrirDrawer();
    } catch (e) { /* noop */ }
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
    if (quadResetBar) quadResetBar.hidden = true;
    setAppShellVisivel(false);
    atualizarNavNota("");

    if (limparSessao) {
      limparSessaoUnidade();
      populacaoAtual = 0;
      unidadeSelect.value = "";
      setModoEntradaSelecao();
    }

    window.scrollTo({ top: 0, behavior: "auto" });
    unidadeSelect.focus();
  }

  var ESC_CONCEITOS = [
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

  function escUnidadeAtualId() {
    return pcoUnidadeId || tocUnidadeId || pdfUnidadeId || (unidadeSelect && unidadeSelect.value) || "";
  }

  function escConceitoPorId(id) {
    for (var i = 0; i < ESC_CONCEITOS.length; i++) {
      if (ESC_CONCEITOS[i].id === id) return ESC_CONCEITOS[i];
    }
    return null;
  }

  function resolverClassificacaoEscovacaoLocal(dados) {
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
        ? "Classificação confirmada"
        : "Confirmar classificação";
    }

    if (btnLimpar) btnLimpar.hidden = !escConceitoConfirmado;

    if (statusEl) {
      if (escConceitoConfirmado) {
        var c = escConceitoPorId(escConceitoConfirmado);
        statusEl.hidden = false;
        statusEl.innerHTML = c
          ? 'Classificação salva: <strong style="color: ' + c.cor + '">' + c.nome + "</strong>. Já entra na nota final."
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

  function initEscovacaoConceito() {
    var opcoes = document.getElementById("esc-conceito-opcoes");
    var btnConfirmar = document.getElementById("esc-conceito-confirmar");
    var btnLimpar = document.getElementById("esc-conceito-limpar");
    if (!opcoes || !btnConfirmar) return;

    opcoes.addEventListener("click", function (e) {
      var btn = e.target.closest(".esc-conceito-btn");
      if (!btn || !opcoes.contains(btn)) return;
      escConceitoSelecionado = btn.getAttribute("data-conceito");
      atualizarUiEscovacao();
    });

    btnConfirmar.addEventListener("click", function () {
      if (!escConceitoSelecionado) return;
      var uid = escUnidadeAtualId();
      if (!uid) return;
      gravarEscovacaoUnidade(uid, escConceitoSelecionado);
      escConceitoConfirmado = escConceitoSelecionado;
      atualizarUiEscovacao();
      if (typeof atualizarNavNota === "function") atualizarNavNota(uid);
      if (
        window.IndicaNotaUI &&
        simDrawerRoot &&
        simDrawerRoot.classList.contains("is-aberto") &&
        simDrawerConteudo &&
        unidadeSelect &&
        unidadeSelect.value
      ) {
        var opt = unidadeSelect.options[unidadeSelect.selectedIndex];
        window.IndicaNotaUI.recalcular(simDrawerConteudo, {
          unidadeId: unidadeSelect.value,
          unidadeNome: opt ? opt.text : "",
          populacao: populacaoAtual,
        }, { modoDrawer: true });
      }
    });

    if (btnLimpar) {
      btnLimpar.addEventListener("click", function () {
        var uid = escUnidadeAtualId();
        if (!uid) return;
        limparEscovacaoUnidade(uid);
        if (typeof atualizarNavNota === "function") atualizarNavNota(uid);
        if (
          window.IndicaNotaUI &&
          simDrawerRoot &&
          simDrawerRoot.classList.contains("is-aberto") &&
          simDrawerConteudo &&
          unidadeSelect &&
          unidadeSelect.value
        ) {
          var opt = unidadeSelect.options[unidadeSelect.selectedIndex];
          window.IndicaNotaUI.recalcular(simDrawerConteudo, {
            unidadeId: unidadeSelect.value,
            unidadeNome: opt ? opt.text : "",
            populacao: populacaoAtual,
          }, { modoDrawer: true });
        }
      });
    }
  }

  initEscovacaoConceito();

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

  if (btnEntrar) {
    btnEntrar.addEventListener("click", entrarNoApp);
  }

  if (btnUsarOutra) {
    btnUsarOutra.addEventListener("click", function () {
      setModoEntradaSelecao();
      unidadeSelect.focus();
    });
  }

  document.querySelectorAll(".js-trocar-unidade").forEach(function (btn) {
    btn.addEventListener("click", function () {
      sairDoApp(true);
    });
  });

  (function restaurarUnidadeSalva() {
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

  var navIndicadores = document.getElementById("nav-indicadores");
  var bottomIndicadores = document.getElementById("bottom-indicadores");

  function irParaIndicadores(e) {
    if (document.body.classList.contains("modo-entrada")) {
      if (e) e.preventDefault();
      if (entradaUnidade && entradaUnidade.dataset.modo === "resumo") {
        setModoEntradaSelecao();
      }
      if (unidadeErro) unidadeErro.hidden = false;
      unidadeSelect.focus();
      return;
    }
    if (e) e.preventDefault();
    if (typeof pdfFecharDrawer === "function") pdfFecharDrawer();
    if (drawers) drawers.simFecharDrawer();
    if (secIndicadores) {
      secIndicadores.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (navIndicadores) navIndicadores.addEventListener("click", irParaIndicadores);
  if (bottomIndicadores) bottomIndicadores.addEventListener("click", irParaIndicadores);

  /* ===== METAS OUTROS INDICADORES ===== */
  const metas = {
    escovacao:  { tipo: null },
    preventivos:{ tipo: "min", valor: 40, rotulo: "40%" },
  };

  /* ===== NAVEGAÇÃO DE ABAS ===== */
  const tabs = document.querySelectorAll(".indicador-tab");
  const paineis = document.querySelectorAll(".indicador-painel");

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

  /* ===== HELPERS ===== */
  function fmtPct(valor) {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + "%";
  }

  function attrStyleCor(cor) {
    return cor ? ' style="--cor: ' + cor + '"' : "";
  }

  function attrStyleCorAcum(cor) {
    return cor ? ' style="--cor-acum: ' + cor + '"' : "";
  }

  function fmtDec(valor) {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
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

  /* ===== PCO — PRIMEIRA CONSULTA PROGRAMADA (MENSAL) ===== */
  const CLASSIFICACOES = [
    { id: "regular",    nome: "Regular",    cor: "#64748b", faixa: "\u2264 0,25%",   limSup: 0.25  },
    { id: "suficiente", nome: "Suficiente", cor: "#d97706", faixa: "0,25% a 0,75%", limSup: 0.75  },
    { id: "bom",        nome: "Bom",        cor: "#0284c7", faixa: "0,75% a 1,25%", limSup: 1.25  },
    { id: "otimo",      nome: "\u00D3timo", cor: "#059669", faixa: "\u2265 1,25%",   limSup: null  },
  ];

  var PCO_ESCALA_MAX = 2;
  var PCO_ESCALA_ZONAS = [
    { ini: 0,    fim: 0.25,           cor: "#64748b", nome: "Regular" },
    { ini: 0.25, fim: 0.75,           cor: "#d97706", nome: "Suficiente" },
    { ini: 0.75, fim: 1.25,           cor: "#0284c7", nome: "Bom" },
    { ini: 1.25, fim: PCO_ESCALA_MAX, cor: "#059669", nome: "\u00D3timo" },
  ];

  const PCO_MESES_LABEL = QUAD_MESES_LABEL;

  var pcoMesAtual = 1;
  var pcoUnidadeId = "";
  var pcoMesEditando = null;

  var pcoResultado = document.getElementById("pco-resultado");
  var pcoMesesGrid = document.getElementById("pco-meses-grid");

  function classificarPco(pct) {
    if (pct <= 0.25) return "regular";
    if (pct <= 0.75) return "suficiente";
    if (pct <= 1.25) return "bom";
    return "otimo";
  }

  function classificacaoPcoPorId(id) {
    for (var i = 0; i < CLASSIFICACOES.length; i++) {
      if (CLASSIFICACOES[i].id === id) return CLASSIFICACOES[i];
    }
    return CLASSIFICACOES[0];
  }

  /* Metas em quantidade absoluta, com base nos percentuais mensais × população. */
  function metasMensaisPco(pop) {
    return {
      regular:    Math.ceil(pop * 0.0025),
      suficiente: Math.ceil(pop * 0.0075),
      bom:        Math.ceil(pop * 0.0125),
      otimo:      Math.ceil(pop * 0.0125) + 1,
    };
  }

  function calcularResultadoMesPco(pop, primeiras) {
    var pct = pop > 0 ? (primeiras / pop) * 100 : 0;
    var classAtual = classificarPco(pct);
    var metas = metasMensaisPco(pop);
    var faltam = {};
    var atingido = {};

    CLASSIFICACOES.forEach(function (c) {
      faltam[c.id] = Math.max(0, metas[c.id] - primeiras);
      atingido[c.id] = primeiras >= metas[c.id];
    });

    return { pct: pct, classAtual: classAtual, metas: metas, faltam: faltam, atingido: atingido };
  }

  function lerPcoStorage() {
    try {
      var raw = localStorage.getItem(PCO_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function gravarPcoStorage(dados) {
    localStorage.setItem(PCO_STORAGE_KEY, JSON.stringify(dados));
  }

  function obterPcoMesesUnidade(unidadeId) {
    return lerPcoStorage()[unidadeId] || {};
  }

  function mesesPcoOrdenados(meses) {
    return Object.keys(meses).map(Number).filter(function (m) { return m >= 1 && m <= 4; }).sort(function (a, b) { return a - b; });
  }

  function salvarMesPco(mes, primeiras, mesCalendario, ano) {
    var todos = lerPcoStorage();
    if (!todos[pcoUnidadeId]) todos[pcoUnidadeId] = {};
    var unidade = todos[pcoUnidadeId];
    var tocQuad = (lerTocStorage()[pcoUnidadeId] || {})._quad;
    var val = ESB.validarQuadrimestreParaSalvar(unidade, mesCalendario, ano, tocQuad);
    if (!val.ok) return val;

    unidade[mes] = {
      primeiras: primeiras,
      atualizadoEm: new Date().toISOString(),
    };
    if (mesCalendario && ano) ESB.aplicarMetaQuad(unidade, mesCalendario, ano);
    gravarPcoStorage(todos);
    return { ok: true };
  }

  function excluirMesPco(mes) {
    var todos = lerPcoStorage();
    if (!todos[pcoUnidadeId] || !todos[pcoUnidadeId][mes]) return;
    delete todos[pcoUnidadeId][mes];
    if (Object.keys(todos[pcoUnidadeId]).length === 0) delete todos[pcoUnidadeId];
    gravarPcoStorage(todos);
  }

  function reiniciarQuadrimestrePco(unidadeId) {
    var id = unidadeId || pcoUnidadeId;
    if (!id) return false;
    var todos = lerPcoStorage();
    if (!todos[id]) return false;
    delete todos[id];
    gravarPcoStorage(todos);
    return true;
  }

  function ultimoMesCadastradoPco(meses) {
    var ordenados = mesesPcoOrdenados(meses);
    return ordenados.length ? ordenados[ordenados.length - 1] : 0;
  }

  function badgeClassPco(id) {
    var c = classificacaoPcoPorId(id);
    return '<span class="badge-class" style="--cor: ' + c.cor + '">' + c.nome + "</span>";
  }

  function mostrarMsgPco(texto, tipo) {
    /* feedback visual via atualização do painel */
    if (tipo === "sucesso" && pcoResultado && !pcoResultado.hidden) {
      pcoResultado.setAttribute("data-msg", texto);
    }
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

  function salvarEdicaoPco(mes) {
    if (!pcoUnidadeId) return;
    var card = pcoMesesGrid && pcoMesesGrid.querySelector('.pco-mes-card[data-mes="' + mes + '"]');
    var inp = card && card.querySelector(".pco-mes-card-input");
    if (!inp) return;

    var val = Number(inp.value);
    if (inp.value === "" || isNaN(val) || val < 0) {
      inp.focus();
      return;
    }

    var comp = resolverCompetenciaSalvar(pcoUnidadeId, mes);
    var res = salvarMesPco(mes, val, comp.mes, comp.ano);
    if (!res.ok) {
      window.alert(res.mensagem.replace(/<[^>]+>/g, ""));
      return;
    }

    pcoMesEditando = null;
    pcoMesAtual = mes;
    atualizarPainelPco();
    atualizarQuadResetBar(pcoUnidadeId);
    if (drawers) drawers.simAtualizarSeAberto();
  }

  function salvarEdicaoToc(mes) {
    if (!tocUnidadeId) return;
    var card = tocMesesGrid && tocMesesGrid.querySelector('.pco-mes-card[data-mes="' + mes + '"]');
    if (!card) return;

    var inpConcl = card.querySelector('.pco-mes-card-input[data-campo="concluidos"]');
    var inpPco = card.querySelector('.pco-mes-card-input[data-campo="primeiraConsulta"]');
    if (!inpConcl || !inpPco) return;

    var concluidos = Number(inpConcl.value);
    var primeiraConsulta = Number(inpPco.value);
    if (inpConcl.value === "" || inpPco.value === "" || isNaN(concluidos) || isNaN(primeiraConsulta) ||
        concluidos < 0 || primeiraConsulta < 0) {
      if (inpConcl.value === "" || isNaN(concluidos) || concluidos < 0) inpConcl.focus();
      else inpPco.focus();
      return;
    }

    var comp = resolverCompetenciaSalvar(tocUnidadeId, mes);
    var res = salvarMesToc(mes, primeiraConsulta, concluidos, comp.mes, comp.ano);
    if (!res.ok) {
      window.alert(res.mensagem.replace(/<[^>]+>/g, ""));
      return;
    }

    tocMesEditando = null;
    tocMesAtual = mes;
    atualizarPainelToc();
    atualizarQuadResetBar(tocUnidadeId);
    if (drawers) drawers.simAtualizarSeAberto();
  }

  function bindPcoMesesGrid() {
    if (!pcoMesesGrid || pcoMesesGrid.dataset.bound === "1") return;

    pcoMesesGrid.addEventListener("click", function (e) {
      var card = e.target.closest(".pco-mes-card");
      if (!card) return;
      var mes = Number(card.dataset.mes);
      if (!mes) return;

      if (e.target.closest(".pco-mes-card-editar")) {
        e.preventDefault();
        e.stopPropagation();
        pcoMesEditando = mes;
        pcoMesAtual = mes;
        renderizarPcoMesesGrid(obterPcoMesesUnidade(pcoUnidadeId), populacaoAtual);
        selecionarMesPco(mes);
        focarInputMesCard(pcoMesesGrid, mes);
        return;
      }
      if (e.target.closest(".pco-mes-card-btn--cancelar")) {
        e.preventDefault();
        e.stopPropagation();
        pcoMesEditando = null;
        atualizarPainelPco();
        return;
      }
      if (e.target.closest(".pco-mes-card-btn--salvar")) {
        e.preventDefault();
        e.stopPropagation();
        salvarEdicaoPco(mes);
        return;
      }
      if (e.target.closest(".pco-mes-card-input") || e.target.closest(".pco-mes-card-edit")) return;

      if (pcoMesEditando !== null && mes !== pcoMesEditando) pcoMesEditando = null;
      selecionarMesPco(mes);
    });

    pcoMesesGrid.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.classList.contains("pco-mes-card-input")) {
        e.preventDefault();
        var card = e.target.closest(".pco-mes-card");
        if (card) salvarEdicaoPco(Number(card.dataset.mes));
      }
      if (e.key === "Escape" && pcoMesEditando !== null) {
        pcoMesEditando = null;
        atualizarPainelPco();
      }
    });

    pcoMesesGrid.dataset.bound = "1";
  }

  function renderizarPcoMesesGrid(meses, pop) {
    if (!pcoMesesGrid) return;

    var html = "";
    for (var mes = 1; mes <= 4; mes++) {
      var registro = meses[mes];
      var ativo = mes === pcoMesAtual;
      var editando = mes === pcoMesEditando;
      var cardClass = "pco-mes-card";
      if (ativo) cardClass += " is-active";
      if (registro) cardClass += " is-preenchido";
      if (editando) cardClass += " is-editando";

      var cardCor = "";
      if (registro && pop > 0 && !editando) {
        cardCor = attrStyleCor(classificacaoPcoPorId(calcularResultadoMesPco(pop, registro.primeiras).classAtual).cor);
      }

      html += '<div class="' + cardClass + '"' + cardCor + ' data-mes="' + mes + '" role="tab" aria-selected="' + (ativo ? "true" : "false") + '" tabindex="' + (ativo ? "0" : "-1") + '">';
      html += '  <div class="pco-mes-card-top">';
      html += '    <p class="pco-mes-card-titulo">' + PCO_MESES_LABEL[mes - 1] + "</p>";
      if (ativo && !editando) {
        html += '    <button type="button" class="pco-mes-card-editar">Editar</button>';
      }
      html += "  </div>";

      if (editando) {
        html += '  <p class="pco-mes-card-label">Primeiras consultas realizadas neste m\u00EAs</p>';
        html += '  <div class="pco-mes-card-edit">';
        html += '    <input type="number" class="pco-mes-card-input" min="0" step="1" inputmode="numeric" placeholder="0" value="' + (registro ? registro.primeiras : "") + '">';
        html += '    <div class="pco-mes-card-edit-acoes">';
        html += '      <button type="button" class="pco-mes-card-btn pco-mes-card-btn--salvar" aria-label="Salvar">&#10003;</button>';
        html += '      <button type="button" class="pco-mes-card-btn pco-mes-card-btn--cancelar" aria-label="Cancelar">&#10005;</button>';
        html += "    </div>";
        html += "  </div>";
      } else {
        html += '  <p class="pco-mes-card-label">Primeiras consultas realizadas neste m\u00EAs</p>';

        if (registro) {
          html += '  <p class="pco-mes-card-valor">' + registro.primeiras.toLocaleString("pt-BR") + "</p>";
          if (pop > 0) {
            var d = calcularResultadoMesPco(pop, registro.primeiras);
            var cls = classificacaoPcoPorId(d.classAtual);
            html += '  <div class="pco-mes-card-extra">';
            html += '    <span class="pco-mes-card-pct">' + fmtPct(d.pct) + " da popula\u00E7\u00E3o</span>";
            html += '    <span class="pco-mes-card-class" style="--cor: ' + cls.cor + '">' + cls.nome + "</span>";
            html += "  </div>";
          }
        } else {
          html += '  <p class="pco-mes-card-valor pco-mes-card-valor--vazio">\u2014</p>';
        }
      }

      html += "</div>";
    }

    pcoMesesGrid.innerHTML = html;
  }

  function renderizarPcoResultado(pop, primeiras, mes) {
    if (!pcoResultado || pop <= 0) return;

    var d = calcularResultadoMesPco(pop, primeiras);
    var atual = classificacaoPcoPorId(d.classAtual);

    var html = "";

    html += '<div class="pco-hero" style="--cor: ' + atual.cor + '">';
    html += '  <div class="pco-hero-main">';
    html += '    <span class="pco-hero-label">Resultado do ' + PCO_MESES_LABEL[mes - 1] + "</span>";
    html += '    <p class="pco-hero-pct">' + fmtPct(d.pct) + "</p>";
    html += '    <p class="pco-hero-detalhe">' + primeiras.toLocaleString("pt-BR") + " primeiras consultas \u00F7 " + pop.toLocaleString("pt-BR") + " popula\u00E7\u00E3o cadastrada</p>";
    html += "  </div>";
    html += '  <div class="pco-hero-class">';
    html += '    <span class="pco-hero-class-label">Classifica\u00E7\u00E3o do m\u00EAs</span>';
    html += '    <span class="dash-badge" style="--cor: ' + atual.cor + '">' + atual.nome + "</span>";
    html += "  </div>";
    html += "</div>";

    html += montarEscalaFaixas({
      pct: d.pct,
      atual: atual,
      max: PCO_ESCALA_MAX,
      zonas: PCO_ESCALA_ZONAS,
      ticks: [0.25, 0.75, 1.25],
      fmtTick: fmtPct,
    });

    html += '<section class="pco-secao">';
    html += '  <h4 class="pco-secao-titulo">Metas mensais por classifica\u00E7\u00E3o</h4>';
    html += '  <p class="pco-secao-sub">Quantas primeiras consultas este m\u00EAs para atingir cada faixa.</p>';
    html += '  <div class="pco-metas-grid">';

    CLASSIFICACOES.forEach(function (c) {
      var meta = d.metas[c.id];
      var falta = d.faltam[c.id];
      var atingiu = d.atingido[c.id];
      var ehAtual = c.id === d.classAtual;
      var cardClass = "pco-meta-card";
      if (ehAtual) cardClass += " is-atual";
      if (atingiu) cardClass += " is-atingido";

      html += '<div class="' + cardClass + '" style="--cor: ' + c.cor + '">';
      if (ehAtual) html += '<span class="pco-meta-tag">Classifica\u00E7\u00E3o atual</span>';
      html += '  <div class="pco-meta-header">';
      html += '    <h5 class="pco-meta-nome">' + c.nome + "</h5>";
      html += '    <span class="pco-meta-faixa">' + c.faixa + "</span>";
      html += "  </div>";
      html += '  <div class="pco-meta-corpo">';
      html += '    <div class="pco-meta-linha">';
      html += '      <span class="pco-meta-linha-label">Meta no m\u00EAs</span>';
      html += '      <span class="pco-meta-linha-valor">' + (c.id === "otimo" ? meta + " ou mais" : meta) + "</span>";
      html += "    </div>";
      html += '    <div class="pco-meta-linha">';
      html += '      <span class="pco-meta-linha-label">Situa\u00E7\u00E3o neste m\u00EAs</span>';
      if (atingiu) {
        html += '      <span class="pco-meta-linha-valor pco-meta-ok">Meta atingida \u2713</span>';
      } else {
        html += '      <span class="pco-meta-linha-valor pco-meta-falta">Faltam ' + plural(falta, "consulta", "consultas") + "</span>";
      }
      html += "    </div>";
      html += "  </div>";
      html += "</div>";
    });

    html += "  </div>";
    html += "</section>";

    pcoResultado.innerHTML = html;
    pcoResultado.hidden = false;
  }

  function selecionarMesPco(mes) {
    if (mes !== pcoMesEditando && pcoMesEditando !== null) pcoMesEditando = null;
    pcoMesAtual = mes;
    var meses = obterPcoMesesUnidade(pcoUnidadeId);
    var registro = meses[mes];

    renderizarPcoMesesGrid(meses, populacaoAtual);

    if (registro && populacaoAtual > 0) {
      renderizarPcoResultado(populacaoAtual, registro.primeiras, mes);
    } else {
      if (pcoResultado) {
        pcoResultado.hidden = true;
        pcoResultado.innerHTML = "";
      }
    }
  }

  function atualizarPainelPco() {
    if (!pcoUnidadeId) return;

    selecionarMesPco(pcoMesAtual);
  }

  function iniciarPcoParaUnidade(unidadeId) {
    pcoUnidadeId = unidadeId;
    pcoMesEditando = null;
    var meses = obterPcoMesesUnidade(unidadeId);
    var ultimo = ultimoMesCadastradoPco(meses);
    pcoMesAtual = ultimo || 1;
    bindPcoMesesGrid();
    atualizarPainelPco();
  }

  /* ===== TOC — CLASSIFICAÇÕES E QUADRIMESTRE ===== */
  const CLASSIFICACOES_TOC = [
    { id: "regular",    nome: "Regular",    cor: "#64748b", faixa: "\u2264 25%" },
    { id: "suficiente", nome: "Suficiente", cor: "#d97706", faixa: "> 25% e \u2264 50%" },
    { id: "bom",        nome: "Bom",        cor: "#0284c7", faixa: "> 50% e \u2264 75%" },
    { id: "otimo",      nome: "\u00D3timo", cor: "#059669", faixa: "> 75% e \u2264 100%" },
  ];

  var TOC_ESCALA_MAX = 100;
  var TOC_ESCALA_ZONAS = [
    { ini: 0,  fim: 25,  cor: "#64748b", nome: "Regular" },
    { ini: 25, fim: 50,  cor: "#d97706", nome: "Suficiente" },
    { ini: 50, fim: 75,  cor: "#0284c7", nome: "Bom" },
    { ini: 75, fim: 100, cor: "#059669", nome: "\u00D3timo" },
  ];

  const TOC_MESES_LABEL = QUAD_MESES_LABEL;

  var tocMesAtual = 1;
  var tocUnidadeId = "";
  var tocMesEditando = null;

  var tocResumo = document.getElementById("toc-resumo");
  var tocMesesGrid = document.getElementById("toc-meses-grid");

  function classificarToc(pct) {
    if (pct <= 25) return "regular";
    if (pct <= 50) return "suficiente";
    if (pct <= 75) return "bom";
    return "otimo";
  }

  function classificacaoTocPorId(id) {
    return CLASSIFICACOES_TOC.find(function (c) { return c.id === id; });
  }

  function pctIndicador(num, den) {
    if (den <= 0) return null;
    return (num / den) * 100;
  }

  function lerTocStorage() {
    try {
      var raw = localStorage.getItem(TOC_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function gravarTocStorage(dados) {
    localStorage.setItem(TOC_STORAGE_KEY, JSON.stringify(dados));
  }

  function obterTocMesesUnidade(unidadeId) {
    var todos = lerTocStorage();
    return todos[unidadeId] || {};
  }

  function mesesTocOrdenados(meses) {
    return Object.keys(meses)
      .map(Number)
      .filter(function (m) { return m >= 1 && m <= 4; })
      .sort(function (a, b) { return a - b; });
  }

  function calcularLinhaToc(meses, ateMes) {
    var totalPco = 0;
    var totalConcl = 0;

    for (var m = 1; m <= ateMes; m++) {
      if (meses[m]) {
        totalPco += meses[m].primeiraConsulta;
        totalConcl += meses[m].concluidos;
      }
    }

    return {
      totalPco: totalPco,
      totalConcl: totalConcl,
      pctAcum: pctIndicador(totalConcl, totalPco),
    };
  }

  function calcularStatusMes(dadosMes) {
    var pctMes = pctIndicador(dadosMes.concluidos, dadosMes.primeiraConsulta);
    return {
      pctMes: pctMes,
      classificacao: pctMes !== null ? classificarToc(pctMes) : null,
    };
  }

  function bindTocMesesGrid() {
    if (!tocMesesGrid || tocMesesGrid.dataset.bound === "1") return;

    tocMesesGrid.addEventListener("click", function (e) {
      var card = e.target.closest(".pco-mes-card");
      if (!card) return;
      var mes = Number(card.dataset.mes);
      if (!mes) return;

      if (e.target.closest(".pco-mes-card-editar")) {
        e.preventDefault();
        e.stopPropagation();
        tocMesEditando = mes;
        tocMesAtual = mes;
        renderizarTocMesesGrid(obterTocMesesUnidade(tocUnidadeId));
        selecionarMesToc(mes);
        focarInputMesCard(tocMesesGrid, mes, '.pco-mes-card-input[data-campo="concluidos"]');
        return;
      }
      if (e.target.closest(".pco-mes-card-btn--cancelar")) {
        e.preventDefault();
        e.stopPropagation();
        tocMesEditando = null;
        atualizarPainelToc();
        return;
      }
      if (e.target.closest(".pco-mes-card-btn--salvar")) {
        e.preventDefault();
        e.stopPropagation();
        salvarEdicaoToc(mes);
        return;
      }
      if (e.target.closest(".pco-mes-card-input") || e.target.closest(".pco-mes-card-edit")) return;

      if (tocMesEditando !== null && mes !== tocMesEditando) tocMesEditando = null;
      selecionarMesToc(mes);
    });

    tocMesesGrid.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.classList.contains("pco-mes-card-input")) {
        e.preventDefault();
        var card = e.target.closest(".pco-mes-card");
        if (card) salvarEdicaoToc(Number(card.dataset.mes));
      }
      if (e.key === "Escape" && tocMesEditando !== null) {
        tocMesEditando = null;
        atualizarPainelToc();
      }
    });

    tocMesesGrid.dataset.bound = "1";
  }

  function renderizarTocMesesGrid(meses) {
    if (!tocMesesGrid) return;

    var pcoMeses = obterPcoMesesUnidade(tocUnidadeId);
    var html = "";
    for (var mes = 1; mes <= 4; mes++) {
      var registro = meses[mes];
      var ativo = mes === tocMesAtual;
      var editando = mes === tocMesEditando;
      var cardClass = "pco-mes-card pco-mes-card--toc";
      if (ativo) cardClass += " is-active";
      if (registro) cardClass += " is-preenchido";
      else cardClass += " pco-mes-card--vazio";
      if (editando) cardClass += " is-editando";

      var cardCor = "";
      var cls = null;
      var statusMes = null;
      if (registro && !editando) {
        statusMes = calcularStatusMes(registro);
        cls = statusMes.classificacao ? classificacaoTocPorId(statusMes.classificacao) : null;
        cardCor = attrStyleCor(cls ? cls.cor : "");
      }

      html += '<div class="' + cardClass + '"' + cardCor + ' data-mes="' + mes + '" role="tab" aria-selected="' + (ativo ? "true" : "false") + '" tabindex="' + (ativo ? "0" : "-1") + '">';
      html += '  <div class="pco-mes-card-top">';
      html += '    <p class="pco-mes-card-titulo">' + TOC_MESES_LABEL[mes - 1] + "</p>";
      if (ativo && !editando) {
        html += '    <button type="button" class="pco-mes-card-editar">Editar</button>';
      }
      html += "  </div>";

      if (editando) {
        var valConcl = registro ? registro.concluidos : "";
        var valPco = registro ? registro.primeiraConsulta : "";
        if (valPco === "" && pcoMeses[mes]) valPco = pcoMeses[mes].primeiras;

        html += '  <div class="pco-mes-card-edit toc-mes-card-edit">';
        html += '    <div class="toc-mes-card-metricas">';
        html += '      <div class="toc-mes-card-metrica">';
        html += '        <span class="pco-mes-card-label">Trat. conclu\u00EDdo</span>';
        html += '        <input type="number" class="pco-mes-card-input" data-campo="concluidos" min="0" step="1" inputmode="numeric" placeholder="0" value="' + valConcl + '">';
        html += "      </div>";
        html += '      <div class="toc-mes-card-metrica">';
        html += '        <span class="pco-mes-card-label">1\u00AA consulta</span>';
        html += '        <input type="number" class="pco-mes-card-input" data-campo="primeiraConsulta" min="0" step="1" inputmode="numeric" placeholder="0" value="' + valPco + '">';
        html += "      </div>";
        html += "    </div>";
        html += '    <div class="pco-mes-card-edit-acoes">';
        html += '      <button type="button" class="pco-mes-card-btn pco-mes-card-btn--salvar" aria-label="Salvar">&#10003;</button>';
        html += '      <button type="button" class="pco-mes-card-btn pco-mes-card-btn--cancelar" aria-label="Cancelar">&#10005;</button>';
        html += "    </div>";
        html += "  </div>";
      } else if (registro) {
        html += '  <div class="toc-mes-card-metricas">';
        html += '    <div class="toc-mes-card-metrica">';
        html += '      <span class="pco-mes-card-label">Trat. conclu\u00EDdo</span>';
        html += '      <span class="toc-mes-card-num">' + registro.concluidos.toLocaleString("pt-BR") + "</span>";
        html += "    </div>";
        html += '    <div class="toc-mes-card-metrica">';
        html += '      <span class="pco-mes-card-label">1\u00AA consulta</span>';
        html += '      <span class="toc-mes-card-num">' + registro.primeiraConsulta.toLocaleString("pt-BR") + "</span>";
        html += "    </div>";
        html += "  </div>";

        if (statusMes.pctMes !== null && cls) {
          html += '  <div class="pco-mes-card-extra">';
          html += '    <span class="pco-mes-card-pct">' + fmtPct(statusMes.pctMes) + " do m\u00EAs</span>";
          html += '    <span class="pco-mes-card-class" style="--cor: ' + cls.cor + '">' + cls.nome + "</span>";
          html += "  </div>";
        }
      } else {
        html += '  <div class="toc-mes-card-metricas">';
        html += '    <div class="toc-mes-card-metrica">';
        html += '      <span class="pco-mes-card-label">Trat. conclu\u00EDdo</span>';
        html += '      <span class="toc-mes-card-num">\u2014</span>';
        html += "    </div>";
        html += '    <div class="toc-mes-card-metrica">';
        html += '      <span class="pco-mes-card-label">1\u00AA consulta</span>';
        html += '      <span class="toc-mes-card-num">\u2014</span>';
        html += "    </div>";
        html += "  </div>";
      }

      html += "</div>";
    }

    tocMesesGrid.innerHTML = html;
  }

  function ultimoMesCadastrado(meses) {
    var ordenados = mesesTocOrdenados(meses);
    return ordenados.length ? ordenados[ordenados.length - 1] : 0;
  }

  function mostrarMsgToc() {
    /* feedback via atualização do painel */
  }

  function selecionarMesToc(mes) {
    if (mes !== tocMesEditando && tocMesEditando !== null) tocMesEditando = null;
    tocMesAtual = mes;
    var meses = obterTocMesesUnidade(tocUnidadeId);
    var registro = meses[mes];

    renderizarTocMesesGrid(meses);

    if (registro) {
      renderizarTocResumo(meses);
    } else {
      if (tocResumo) {
        tocResumo.hidden = true;
        tocResumo.innerHTML = "";
      }
    }
  }

  function salvarMesToc(mes, primeiraConsulta, concluidos, mesCalendario, ano) {
    var todos = lerTocStorage();
    if (!todos[tocUnidadeId]) todos[tocUnidadeId] = {};
    var unidade = todos[tocUnidadeId];
    var pcoQuad = (lerPcoStorage()[tocUnidadeId] || {})._quad;
    var val = ESB.validarQuadrimestreParaSalvar(unidade, mesCalendario, ano, pcoQuad);
    if (!val.ok) return val;

    unidade[mes] = {
      primeiraConsulta: primeiraConsulta,
      concluidos: concluidos,
      atualizadoEm: new Date().toISOString(),
    };
    if (mesCalendario && ano) ESB.aplicarMetaQuad(unidade, mesCalendario, ano);
    gravarTocStorage(todos);
    return { ok: true };
  }

  function obterQuadReferenciaUnidade(unidadeId) {
    var pco = lerPcoStorage()[unidadeId];
    var toc = lerTocStorage()[unidadeId];
    if (pco && pco._quad) return pco._quad;
    if (toc && toc._quad) return toc._quad;
    return null;
  }

  function excluirMesToc(mes) {
    var todos = lerTocStorage();
    if (!todos[tocUnidadeId] || !todos[tocUnidadeId][mes]) return;
    delete todos[tocUnidadeId][mes];
    if (Object.keys(todos[tocUnidadeId]).length === 0) delete todos[tocUnidadeId];
    gravarTocStorage(todos);
  }

  function reiniciarQuadrimestreToc(unidadeId) {
    var id = unidadeId || tocUnidadeId;
    if (!id) return false;
    var todos = lerTocStorage();
    if (!todos[id]) return false;
    delete todos[id];
    gravarTocStorage(todos);
    return true;
  }

  function badgeClassToc(id) {
    var c = classificacaoTocPorId(id);
    if (!c) return "";
    return '<span class="badge-class" style="--cor: ' + c.cor + '">' + c.nome + "</span>";
  }

  function gerarDicaTocProximoMes(dadosMes, statusMes) {
    if (!dadosMes || dadosMes.primeiraConsulta <= 0 || statusMes.pctMes === null) {
      return {
        titulo: "Dica para o próximo mês",
        texto: "Registre pelo menos 1 primeira consulta para receber recomendações personalizadas.",
      };
    }

    var consultas = dadosMes.primeiraConsulta;
    var concluidos = dadosMes.concluidos;
    var alvo = null;
    var minimo = null;

    if (statusMes.classificacao === "regular") {
      alvo = "Suficiente";
      minimo = Math.floor(consultas * 0.25) + 1;
    } else if (statusMes.classificacao === "suficiente") {
      alvo = "Bom";
      minimo = Math.floor(consultas * 0.50) + 1;
    } else if (statusMes.classificacao === "bom") {
      alvo = "Ótimo";
      minimo = Math.floor(consultas * 0.75) + 1;
    } else {
      return {
        titulo: "Dica para o próximo mês",
        texto: "Você está em Ótimo. Para manter, busque fechar pelo menos 76% das primeiras consultas no próximo mês.",
      };
    }

    var faltam = Math.max(0, minimo - concluidos);
    if (faltam === 0) {
      return {
        titulo: "Dica para o próximo mês",
        texto: "Você já atingiu o patamar de " + alvo + " com este volume de primeiras consultas. Tente manter ou melhorar esse ritmo no próximo mês.",
      };
    }

    return {
      titulo: "Dica para o próximo mês",
      texto: "Se repetir " + consultas + " primeiras consultas, você precisará de pelo menos " + minimo + " tratamentos concluídos para atingir " + alvo + " (" + faltam + " a mais que neste mês).",
    };
  }

  function renderizarTocResumo(meses) {
    if (!tocResumo) return;

    var ultimo = ultimoMesCadastrado(meses);
    if (!ultimo) {
      tocResumo.hidden = true;
      tocResumo.innerHTML = "";
      return;
    }

    var mesStatus = tocMesAtual;
    var dadosMes = meses[mesStatus];
    if (!dadosMes) {
      tocResumo.hidden = true;
      tocResumo.innerHTML = "";
      return;
    }

    var statusMes = calcularStatusMes(dadosMes);
    var cls = classificacaoTocPorId(statusMes.classificacao);
    var quadrimestreFechado = !!meses[4];
    var html = "";

    html += '<div class="dash-status" style="--cor-status: ' + cls.cor + '">';
    html += '  <div class="dash-status-main">';
    html += '    <span class="dash-status-label">Tratamentos conclu\u00EDdos \u00F7 1\u00AA consulta \u2014 ' + TOC_MESES_LABEL[mesStatus - 1] + "</span>";
    html += '    <p class="dash-status-pct">' + (statusMes.pctMes !== null ? fmtPct(statusMes.pctMes) : "\u2014") + "</p>";
    html += '    <p class="toc-resumo-totais">' + dadosMes.concluidos.toLocaleString("pt-BR") + " trat. conclu\u00EDdos \u00B7 " + dadosMes.primeiraConsulta.toLocaleString("pt-BR") + " primeiras consultas</p>";
    html += "  </div>";
    html += '  <div class="dash-status-class">';
    html += '    <span class="dash-status-label">Classifica\u00E7\u00E3o do m\u00EAs</span>';
    html += '    <span class="dash-badge" style="--cor: ' + cls.cor + '">' + cls.nome + "</span>";
    html += "  </div>";
    html += "</div>";

    if (statusMes.pctMes !== null) {
      html += montarEscalaFaixas({
        pct: statusMes.pctMes,
        atual: cls,
        max: TOC_ESCALA_MAX,
        zonas: TOC_ESCALA_ZONAS,
        ticks: [25, 50, 75],
        titulo: "Classifica\u00E7\u00E3o do m\u00EAs",
      });
    }

    if (!quadrimestreFechado) {
      var acumParcial = calcularLinhaToc(meses, mesStatus);
      var dica = gerarDicaTocProximoMes(dadosMes, statusMes);

      if (acumParcial.pctAcum !== null) {
        var clsAcum = classificacaoTocPorId(classificarToc(acumParcial.pctAcum));
        html += '<p class="toc-resumo-secundario"' + attrStyleCorAcum(clsAcum ? clsAcum.cor : "") + ">";
        html += '  <span class="toc-resumo-sec-label">Acumulado at\u00E9 este m\u00EAs</span> ';
        html += '  <strong class="toc-resumo-sec-pct">' + fmtPct(acumParcial.pctAcum) + "</strong>";
        html += '  <span class="toc-resumo-dica-texto"> \u2014 ' + acumParcial.totalConcl.toLocaleString("pt-BR") + " trat. conclu\u00EDdos \u00B7 " + acumParcial.totalPco.toLocaleString("pt-BR") + " 1\u00AA consultas</span>";
        html += "</p>";
      }

      html += '<div class="dash-alertas dash-alertas--inline">';
      html += '  <div class="dash-alerta dash-alerta--info">';
      html += '    <span class="dash-alerta-icone">\u2192</span>';
      html += '    <div class="b5-interp-corpo">';
      html += '      <p class="b5-interp-titulo">' + dica.titulo + "</p>";
      html += '      <p class="dash-alerta-texto">' + dica.texto + "</p>";
      html += "    </div>";
      html += "  </div>";
      html += "</div>";
    }

    html += '<p class="pco-secao-nota">Clique em outro m\u00EAs nos cards abaixo para comparar o desempenho mensal' +
      (quadrimestreFechado ? "." : " e o acumulado.") + "</p>";

    tocResumo.innerHTML = html;
    tocResumo.hidden = false;
  }

  function atualizarPainelToc() {
    if (!tocUnidadeId) return;
    selecionarMesToc(tocMesAtual);
  }

  function iniciarTocParaUnidade(unidadeId) {
    tocUnidadeId = unidadeId;
    tocMesEditando = null;
    var meses = obterTocMesesUnidade(unidadeId);
    var ultimo = ultimoMesCadastrado(meses);
    tocMesAtual = ultimo || 1;
    bindTocMesesGrid();
    atualizarPainelToc();
  }

  /* ===== OUTROS INDICADORES — AVALIAÇÃO ===== */
  function avaliarMeta(id, percentual) {
    var meta = metas[id];
    if (!meta || meta.tipo === null) {
      return { texto: "Resultado calculado para o per\u00EDodo informado.", classe: "" };
    }

    var atingiu = false;
    if (meta.tipo === "min") atingiu = percentual >= meta.valor;
    if (meta.tipo === "max") atingiu = percentual <= meta.valor;

    var comparacao = meta.tipo === "max" ? "no m\u00E1ximo" : "pelo menos";
    var texto = atingiu
      ? "Dentro da meta de refer\u00EAncia (" + comparacao + " " + meta.rotulo + ")."
      : "Abaixo da meta de refer\u00EAncia (" + comparacao + " " + meta.rotulo + ").";

    return { texto: texto, classe: atingiu ? "resultado-otimo" : "resultado-alerta" };
  }

  /* ===== FORMULÁRIOS ===== */
  document.querySelectorAll(".calc-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.numerador || !form.denominador) return;

      var id = form.dataset.calc;
      var numerador = Number(form.numerador.value);
      var denominador = Number(form.denominador.value);

      if (denominador <= 0) return;

      var bloco = document.querySelector('[data-resultado="' + id + '"]');
      if (!bloco) return;

      var percentual = (numerador / denominador) * 100;
      var valorEl = bloco.querySelector("[data-valor]");
      var detalheEl = bloco.querySelector("[data-detalhe]");
      var result = avaliarMeta(id, percentual);

      valorEl.textContent = fmtPct(percentual);
      detalheEl.textContent = result.texto;
      detalheEl.className = "resultado-detalhe " + result.classe;

      bloco.hidden = false;
    });
  });

  /* ===== B5 — PROCEDIMENTOS ODONTOLÓGICOS INDIVIDUAIS PREVENTIVOS ===== */
  const B5_PREVENTIVOS = [
    { cod: "01.01.02.005-8", nome: "Aplica\u00E7\u00E3o de cariost\u00E1tico (por dente)" },
    { cod: "01.01.02.006-6", nome: "Aplica\u00E7\u00E3o de selante (por dente)" },
    { cod: "01.01.02.007-4", nome: "Aplica\u00E7\u00E3o t\u00F3pica de fl\u00FAor (individual por sess\u00E3o)" },
    { cod: "01.01.02.008-2", nome: "Evidencia\u00E7\u00E3o de placa bacteriana" },
    { cod: "01.01.02.010-4", nome: "Orienta\u00E7\u00E3o de higiene bucal" },
    { cod: "01.01.02.012-0", nome: "Orienta\u00E7\u00E3o de higieniza\u00E7\u00E3o de pr\u00F3teses dent\u00E1rias" },
    { cod: "03.07.03.004-0", nome: "Profilaxia / Remo\u00E7\u00E3o da placa bacteriana" },
  ];

  const B5_OUTROS = [
    { cod: "01.01.02.009-0", nome: "Selamento provis\u00F3rio de cavidade dent\u00E1ria" },
    { cod: "04.14.02.013-8", nome: "Exodontia de dente permanente" },
    { cod: "03.07.01.001-5", nome: "Capeamento pulpar" },
    { cod: "03.07.01.003-1", nome: "Restaura\u00E7\u00E3o de dente permanente anterior com resina composta" },
    { cod: "03.07.01.006-6", nome: "Tratamento inicial do dente traumatizado" },
    { cod: "03.07.01.007-4", nome: "Tratamento Restaurador Atraum\u00E1tico (TRA/ART)" },
    { cod: "03.07.01.008-2", nome: "Restaura\u00E7\u00E3o de dente dec\u00EDduo posterior com resina composta" },
    { cod: "03.07.01.010-4", nome: "Restaura\u00E7\u00E3o de dente dec\u00EDduo posterior com ion\u00F4mero de vidro" },
    { cod: "03.07.01.011-2", nome: "Restaura\u00E7\u00E3o de dente dec\u00EDduo anterior com resina composta" },
    { cod: "03.07.01.012-0", nome: "Restaura\u00E7\u00E3o de dente permanente posterior com resina composta" },
    { cod: "03.07.01.014-7", nome: "Adequa\u00E7\u00E3o do comportamento da pessoa com defici\u00EAncia" },
    { cod: "03.07.01.015-5", nome: "Adequa\u00E7\u00E3o do comportamento de crian\u00E7as" },
    { cod: "03.07.02.001-0", nome: "Acesso \u00E0 polpa dent\u00E1ria e medica\u00E7\u00E3o (por dente)" },
    { cod: "03.07.02.002-9", nome: "Curativo de demora com ou sem preparo biomec\u00E2nico" },
    { cod: "03.07.02.007-0", nome: "Pulpotomia dent\u00E1ria" },
    { cod: "03.07.03.002-4", nome: "Raspagem e alisamento subgengivais (por sextante)" },
    { cod: "03.07.03.005-9", nome: "Raspagem, alisamento e polimento supragengivais (por sextante)" },
    { cod: "03.07.03.006-7", nome: "Tratamento de gengivite ulcerativa necrosante aguda (GUNA)" },
    { cod: "03.07.03.007-5", nome: "Tratamento de les\u00F5es da mucosa oral" },
    { cod: "03.07.03.008-3", nome: "Tratamento de pericoronarite" },
    { cod: "03.07.05.001-7", nome: "Fotobiomodula\u00E7\u00E3o a laser de baixa pot\u00EAncia (mucosite oral)" },
  ];

  const CLASSIFICACOES_B5 = [
    { id: "otimo",      nome: "\u00D3timo",     cor: "#059669", faixa: "\u2265 65% e \u2264 85%" },
    { id: "bom",        nome: "Bom",        cor: "#0284c7", faixa: "\u2265 55% e < 65%" },
    { id: "suficiente", nome: "Suficiente", cor: "#d97706", faixa: "\u2265 40% e < 55%" },
    { id: "regular",    nome: "Regular",    cor: "#64748b", faixa: "< 40% ou > 85%" },
  ];

  var B5_ESCALA_MAX = 100;
  var B5_ESCALA_ZONAS = [
    { ini: 0,  fim: 40,              cor: "#64748b", nome: "Regular" },
    { ini: 40, fim: 55,              cor: "#d97706", nome: "Suficiente" },
    { ini: 55, fim: 65,              cor: "#0284c7", nome: "Bom" },
    { ini: 65, fim: 85,              cor: "#059669", nome: "\u00D3timo" },
    { ini: 85, fim: B5_ESCALA_MAX,   cor: "#64748b", nome: "Regular" },
  ];

  function classificarB5(pct) {
    if (pct >= 65 && pct <= 85) return "otimo";
    if (pct >= 55 && pct < 65) return "bom";
    if (pct >= 40 && pct < 55) return "suficiente";
    return "regular";
  }

  function classificacaoB5PorId(id) {
    return CLASSIFICACOES_B5.find(function (c) { return c.id === id; });
  }

  var b5Form = document.getElementById("b5-form");
  var b5ItensPrev = document.getElementById("b5-itens-prev");
  var b5ItensOutros = document.getElementById("b5-itens-outros");
  var b5MetasEscala = document.getElementById("b5-metas-escala");
  var b5FiltroPreenchidos = document.getElementById("b5-filtro-preenchidos");

  function montarItemB5(proc, grupo) {
    var inputId = "b5-" + proc.cod.replace(/[^0-9]/g, "");
    var html = "";
    html += '<div class="b5-item">';
    html += '  <label class="b5-item-info" for="' + inputId + '">';
    html += '    <span class="b5-item-cod">' + proc.cod + "</span>";
    html += '    <span class="b5-item-nome">' + proc.nome + "</span>";
    html += "  </label>";
    html += '  <input type="number" class="b5-item-input" id="' + inputId + '" data-grupo="' + grupo + '" min="0" step="1" inputmode="numeric" placeholder="0">';
    html += "</div>";
    return html;
  }

  function renderizarFormB5() {
    if (!b5ItensPrev || !b5ItensOutros) return;
    b5ItensPrev.innerHTML = B5_PREVENTIVOS.map(function (p) { return montarItemB5(p, "prev"); }).join("");
    b5ItensOutros.innerHTML = B5_OUTROS.map(function (p) { return montarItemB5(p, "outros"); }).join("");
  }

  /* Oculta os procedimentos sem produção (campos vazios ou zerados) para deixar
     a leitura mais intuitiva. Se nenhum procedimento estiver preenchido, mostra
     todos os campos para permitir a digitação manual. */
  function aplicarFiltroB5() {
    if (!b5Form) return;
    var itens = b5Form.querySelectorAll(".b5-item");
    var ativo = b5FiltroPreenchidos ? b5FiltroPreenchidos.checked : false;
    var algumPreenchido = false;
    itens.forEach(function (item) {
      var inp = item.querySelector(".b5-item-input");
      if (inp && Number(inp.value) > 0) algumPreenchido = true;
    });
    itens.forEach(function (item) {
      var inp = item.querySelector(".b5-item-input");
      var preenchido = inp && Number(inp.value) > 0;
      item.hidden = (ativo && algumPreenchido && !preenchido);
    });
    b5Form.querySelectorAll(".b5-itens").forEach(function (grupo) {
      var visiveis = grupo.querySelectorAll(".b5-item:not([hidden])").length;
      grupo.classList.toggle("b5-itens--vazio", ativo && algumPreenchido && visiveis === 0);
    });
  }

  function somarB5() {
    var numerador = 0;
    var totalOutros = 0;

    b5ItensPrev.querySelectorAll(".b5-item-input").forEach(function (inp) {
      var v = Number(inp.value);
      if (!isNaN(v) && v > 0) numerador += v;
    });
    b5ItensOutros.querySelectorAll(".b5-item-input").forEach(function (inp) {
      var v = Number(inp.value);
      if (!isNaN(v) && v > 0) totalOutros += v;
    });

    return { numerador: numerador, denominador: numerador + totalOutros };
  }

  function metricasB5DeForm() {
    var s = somarB5();
    if (s.denominador <= 0) return null;
    return { numerador: s.numerador, denominador: s.denominador, pct: (s.numerador / s.denominador) * 100 };
  }

  function renderizarMetasB5() {
    if (!b5MetasEscala) return;
    var s = somarB5();

    if (s.denominador <= 0) {
      b5MetasEscala.hidden = true;
      b5MetasEscala.innerHTML = "";
      return;
    }

    var pct = (s.numerador / s.denominador) * 100;
    var classId = classificarB5(pct);
    var atual = classificacaoB5PorId(classId);

    b5MetasEscala.innerHTML = montarEscalaFaixas({
      pct: pct,
      atual: atual,
      max: B5_ESCALA_MAX,
      zonas: B5_ESCALA_ZONAS,
      ticks: [40, 55, 65, 85],
    });
    b5MetasEscala.hidden = false;
  }

  if (b5Form) {
    renderizarFormB5();
    aplicarFiltroB5();

    b5Form.addEventListener("input", function (e) {
      if (e.target && e.target.classList.contains("b5-item-input")) {
        aplicarFiltroB5();
        if (typeof atualizarResultadoLiveB5 === "function") atualizarResultadoLiveB5();
        else renderizarMetasB5();
      }
    });

    if (b5FiltroPreenchidos) {
      b5FiltroPreenchidos.addEventListener("change", aplicarFiltroB5);
    }

    b5Form.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  }

  function interpretacaoB5(classId, pct, s) {
    if (classId === "otimo") {
      return {
        tipo: "sucesso", icone: "\u2713",
        titulo: "Equil\u00EDbrio ideal \u2014 continue assim",
        texto: "De cada 100 procedimentos, cerca de <strong>" + Math.round(pct) + " s\u00E3o de preven\u00E7\u00E3o</strong>. A equipe est\u00E1 no ponto certo: previne bastante e, ao mesmo tempo, n\u00E3o deixa de tratar quem precisa. \u00C9 esse o equil\u00EDbrio que se espera. Mantenha o ritmo."
      };
    }
    if (classId === "bom") {
      return {
        tipo: "info", icone: "\u2192",
        titulo: "Quase l\u00E1 \u2014 falta pouco para o ideal",
        texto: "A preven\u00E7\u00E3o j\u00E1 tem bom espa\u00E7o na rotina (cerca de <strong>" + Math.round(pct) + " a cada 100</strong> procedimentos). Para entrar na faixa ideal (entre 65% e 85%), inclua um pouco mais de a\u00E7\u00F5es simples no dia a dia, como orienta\u00E7\u00E3o de higiene, fl\u00FAor e profilaxia."
      };
    }
    if (classId === "suficiente") {
      return {
        tipo: "atencao", icone: "!",
        titulo: "D\u00E1 para prevenir mais",
        texto: "A preven\u00E7\u00E3o ainda \u00E9 minoria (cerca de <strong>" + Math.round(pct) + " a cada 100</strong> procedimentos). Aproveite os atendimentos para reforçar orienta\u00E7\u00E3o de higiene, aplica\u00E7\u00E3o de fl\u00FAor, selantes e profilaxia \u2014 isso aproxima a equipe da faixa ideal (65% a 85%) e reduz a necessidade de tratamentos futuros."
      };
    }
    if (pct > 85) {
      return {
        tipo: "critico", icone: "\u2716",
        titulo: "Preven\u00E7\u00E3o alta demais \u2014 fique atento",
        texto: "Quase tudo que a equipe registra \u00E9 preven\u00E7\u00E3o (mais de <strong>85 a cada 100</strong>). Pode parecer bom, mas costuma significar que tratamentos necess\u00E1rios \u2014 como restaura\u00E7\u00F5es, raspagens e extra\u00E7\u00F5es \u2014 <strong>n\u00E3o est\u00E3o sendo ofertados ou registrados</strong>. Verifique se quem precisa de tratamento est\u00E1 mesmo sendo atendido."
      };
    }
    return {
      tipo: "critico", icone: "\u2716",
      titulo: "Pouca preven\u00E7\u00E3o \u2014 hora de reforçar",
      texto: "A preven\u00E7\u00E3o aparece pouco (menos de <strong>40 a cada 100</strong> procedimentos), ou seja, o foco est\u00E1 quase todo em tratar problemas j\u00E1 instalados. Inclua mais a\u00E7\u00F5es preventivas na rotina (orienta\u00E7\u00E3o, fl\u00FAor, selante, profilaxia) para evitar que novos problemas apare\u00E7am."
    };
  }

  /* ===== B3 — TAXA DE EXODONTIA ===== */
  const B3_EXODONTIAS = [
    { cod: "04.14.02.013-8", nome: "Exodontia de dente permanente" },
    { cod: "04.14.02.014-6", nome: "Exodontia m\u00FAltipla com alveoloplastia por sextante" },
  ];

  const B3_PREVENTIVOS = [
    { cod: "01.01.02.005-8", nome: "Aplica\u00E7\u00E3o de cariost\u00E1tico (por dente)" },
    { cod: "01.01.02.006-6", nome: "Aplica\u00E7\u00E3o de selante (por dente)" },
    { cod: "01.01.02.007-4", nome: "Aplica\u00E7\u00E3o t\u00F3pica de fl\u00FAor (individual por sess\u00E3o)" },
    { cod: "01.01.02.008-2", nome: "Evidencia\u00E7\u00E3o de placa bacteriana" },
    { cod: "01.01.02.009-0", nome: "Selamento provis\u00F3rio de cavidade dent\u00E1ria" },
    { cod: "01.01.02.012-0", nome: "Orienta\u00E7\u00E3o de higieniza\u00E7\u00E3o de pr\u00F3teses dent\u00E1rias" },
    { cod: "03.07.03.004-0", nome: "Profilaxia / Remo\u00E7\u00E3o da placa bacteriana" },
  ];

  const B3_CURATIVOS = [
    { cod: "03.07.01.001-5", nome: "Capeamento pulpar" },
    { cod: "03.07.01.003-1", nome: "Restaura\u00E7\u00E3o de dente permanente anterior com resina composta" },
    { cod: "03.07.01.006-6", nome: "Tratamento inicial do dente traumatizado" },
    { cod: "03.07.01.007-4", nome: "Tratamento Restaurador Atraum\u00E1tico (TRA/ART)" },
    { cod: "03.07.01.008-2", nome: "Restaura\u00E7\u00E3o de dente dec\u00EDduo posterior com resina composta" },
    { cod: "03.07.01.010-4", nome: "Restaura\u00E7\u00E3o de dente dec\u00EDduo posterior com ion\u00F4mero de vidro" },
    { cod: "03.07.01.011-2", nome: "Restaura\u00E7\u00E3o de dente dec\u00EDduo anterior com resina composta" },
    { cod: "03.07.01.012-0", nome: "Restaura\u00E7\u00E3o de dente permanente posterior com resina composta" },
    { cod: "03.07.02.001-0", nome: "Acesso \u00E0 polpa dent\u00E1ria e medica\u00E7\u00E3o (por dente)" },
    { cod: "03.07.02.002-9", nome: "Curativo de demora com ou sem preparo biomec\u00E2nico" },
    { cod: "03.07.02.007-0", nome: "Pulpotomia dent\u00E1ria" },
    { cod: "03.07.03.002-4", nome: "Raspagem e alisamento subgengivais (por sextante)" },
    { cod: "03.07.03.005-9", nome: "Raspagem, alisamento e polimento supragengivais (por sextante)" },
    { cod: "03.07.03.006-7", nome: "Tratamento de gengivite ulcerativa necrosante aguda (GUNA)" },
    { cod: "03.07.03.007-5", nome: "Tratamento de les\u00F5es da mucosa oral" },
    { cod: "03.07.03.008-3", nome: "Tratamento de pericoronarite" },
    { cod: "03.07.05.001-7", nome: "Fotobiomodula\u00E7\u00E3o a laser de baixa pot\u00EAncia (mucosite oral)" },
  ];

  const CLASSIFICACOES_B3 = [
    { id: "otimo",      nome: "\u00D3timo",     cor: "#059669", faixa: "\u2265 3% e < 10%" },
    { id: "bom",        nome: "Bom",        cor: "#0284c7", faixa: "\u2265 10% e < 12%" },
    { id: "suficiente", nome: "Suficiente", cor: "#d97706", faixa: "\u2265 12% e < 14%" },
    { id: "regular",    nome: "Regular",    cor: "#64748b", faixa: "< 3% ou \u2265 14%" },
  ];

  function classificarB3(pct) {
    if (pct >= 3 && pct < 10) return "otimo";
    if (pct >= 10 && pct < 12) return "bom";
    if (pct >= 12 && pct < 14) return "suficiente";
    return "regular";
  }

  function classificacaoB3PorId(id) {
    return CLASSIFICACOES_B3.find(function (c) { return c.id === id; });
  }

  var b3Form = document.getElementById("b3-form");
  var b3InExo = document.getElementById("b3-exo");
  var b3InPrev = document.getElementById("b3-prev");
  var b3InCur = document.getElementById("b3-cur");
  var b3RefExo = document.getElementById("b3-ref-exo");
  var b3RefPrev = document.getElementById("b3-ref-prev");
  var b3RefCur = document.getElementById("b3-ref-cur");
  var b3MetasEscala = document.getElementById("b3-metas-escala");

  function montarRefB3(proc) {
    return '<li><span class="b3-ref-cod">' + proc.cod + '</span><span class="b3-ref-nome">' + proc.nome + "</span></li>";
  }

  function renderizarFormB3() {
    if (b3RefExo) b3RefExo.innerHTML = B3_EXODONTIAS.map(montarRefB3).join("");
    if (b3RefPrev) b3RefPrev.innerHTML = B3_PREVENTIVOS.map(montarRefB3).join("");
    if (b3RefCur) b3RefCur.innerHTML = B3_CURATIVOS.map(montarRefB3).join("");
  }

  function valorCampoB3(input) {
    if (!input) return 0;
    var v = Number(input.value);
    return !isNaN(v) && v > 0 ? v : 0;
  }

  function somarB3() {
    var exodontias = valorCampoB3(b3InExo);
    var preventivos = valorCampoB3(b3InPrev);
    var curativos = valorCampoB3(b3InCur);
    return {
      exodontias: exodontias,
      preventivos: preventivos,
      curativos: curativos,
      numerador: exodontias,
      denominador: exodontias + preventivos + curativos,
    };
  }

  function metricasB3DeForm() {
    var s = somarB3();
    if (s.denominador <= 0) return null;
    return {
      exodontias: s.exodontias,
      preventivos: s.preventivos,
      curativos: s.curativos,
      numerador: s.numerador,
      denominador: s.denominador,
      pct: (s.numerador / s.denominador) * 100,
    };
  }

  function interpretacaoB3(classId, pct) {
    var arred = Math.round(pct);
    if (classId === "otimo") {
      return {
        tipo: "sucesso", icone: "\u2713",
        titulo: "Equil\u00EDbrio ideal \u2014 dentes sendo preservados",
        texto: "De cada 100 procedimentos, cerca de <strong>" + arred + " s\u00E3o exodontias</strong>. A equipe est\u00E1 conseguindo atuar de forma preventiva e conservadora, recorrendo \u00E0 extra\u00E7\u00E3o apenas quando realmente necess\u00E1rio. Mantenha o ritmo."
      };
    }
    if (classId === "bom") {
      return {
        tipo: "info", icone: "\u2192",
        titulo: "Bom resultado \u2014 d\u00E1 para chegar ao ideal",
        texto: "As exodontias representam cerca de <strong>" + arred + " a cada 100</strong> procedimentos. Est\u00E1 pr\u00F3ximo da faixa ideal (3% a 10%). Refor\u00E7ar diagn\u00F3stico precoce e tratamentos conservadores ajuda a reduzir um pouco mais as extra\u00E7\u00F5es."
      };
    }
    if (classId === "suficiente") {
      return {
        tipo: "atencao", icone: "!",
        titulo: "Aten\u00E7\u00E3o \u2014 extra\u00E7\u00F5es acima do desejado",
        texto: "Cerca de <strong>" + arred + " a cada 100</strong> procedimentos s\u00E3o exodontias. O n\u00FAmero come\u00E7a a indicar que muitos dentes est\u00E3o sendo perdidos. Invista em preven\u00E7\u00E3o, diagn\u00F3stico precoce e tratamentos restauradores para reverter essa tend\u00EAncia."
      };
    }
    if (pct >= 14) {
      return {
        tipo: "critico", icone: "\u2716",
        titulo: "Taxa muito alta \u2014 predom\u00EDnio de tratamentos mutiladores",
        texto: "Mais de <strong>14 a cada 100</strong> procedimentos s\u00E3o exodontias. Isso costuma apontar diagn\u00F3stico tardio, dificuldade de acesso ao servi\u00E7o ou alta preval\u00EAncia de doen\u00E7as bucais. Priorize preven\u00E7\u00E3o e tratamentos conservadores para preservar mais dentes."
      };
    }
    return {
      tipo: "atencao", icone: "?",
      titulo: "Taxa muito baixa \u2014 confira o registro",
      texto: "As exodontias aparecem em menos de <strong>3 a cada 100</strong> procedimentos. Pode significar uma popula\u00E7\u00E3o com excelente sa\u00FAde bucal, mas tamb\u00E9m pode indicar <strong>subnotifica\u00E7\u00E3o</strong> ou que extra\u00E7\u00F5es necess\u00E1rias n\u00E3o est\u00E3o sendo ofertadas/registradas. Verifique se a produ\u00E7\u00E3o est\u00E1 sendo lan\u00E7ada corretamente."
    };
  }

  var B3_ESCALA_MAX = 20;
  var B3_ESCALA_ZONAS = [
    { ini: 0,  fim: 3,  cor: "#64748b", nome: "Regular" },
    { ini: 3,  fim: 10, cor: "#059669", nome: "\u00D3timo" },
    { ini: 10, fim: 12, cor: "#0284c7", nome: "Bom" },
    { ini: 12, fim: 14, cor: "#d97706", nome: "Suficiente" },
    { ini: 14, fim: B3_ESCALA_MAX, cor: "#64748b", nome: "Regular" },
  ];

  function renderizarMetasB3() {
    if (!b3MetasEscala) return;
    var met = metricasB3DeForm();

    if (!met) {
      b3MetasEscala.hidden = true;
      b3MetasEscala.innerHTML = "";
      return;
    }

    var classId = classificarB3(met.pct);
    var atual = classificacaoB3PorId(classId);

    b3MetasEscala.innerHTML = montarEscalaFaixas({
      pct: met.pct,
      atual: atual,
      max: B3_ESCALA_MAX,
      zonas: B3_ESCALA_ZONAS,
      ticks: [3, 10, 12, 14],
    });
    b3MetasEscala.hidden = false;
  }

  function montarEscalaB3(pct, classId, atual) {
    return montarEscalaFaixas({
      pct: pct,
      atual: atual,
      max: B3_ESCALA_MAX,
      zonas: B3_ESCALA_ZONAS,
      ticks: [3, 10, 12, 14],
    });
  }

  if (b3Form) {
    renderizarFormB3();

    b3Form.addEventListener("input", function (e) {
      if (e.target && e.target.classList.contains("b3-campo-input")) {
        if (typeof atualizarResultadoLiveB3 === "function") atualizarResultadoLiveB3();
        else renderizarMetasB3();
      }
    });

    b3Form.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  }

  /* ===== B6 — TRATAMENTO RESTAURADOR ATRAUMÁTICO (TRA/ART) ===== */
  const B6_TRA = [
    { cod: "03.07.01.007-4", nome: "Tratamento Restaurador Atraum\u00E1tico (TRA/ART)" },
  ];

  const B6_OUTROS = [
    { cod: "03.07.01.003-1", nome: "Restaura\u00E7\u00E3o de dente permanente anterior com resina composta" },
    { cod: "03.07.01.008-2", nome: "Restaura\u00E7\u00E3o de dente dec\u00EDduo posterior com resina composta" },
    { cod: "03.07.01.010-4", nome: "Restaura\u00E7\u00E3o de dente dec\u00EDduo posterior com ion\u00F4mero de vidro" },
    { cod: "03.07.01.011-2", nome: "Restaura\u00E7\u00E3o de dente dec\u00EDduo anterior com resina composta" },
    { cod: "03.07.01.012-0", nome: "Restaura\u00E7\u00E3o de dente permanente posterior com resina composta" },
  ];

  const CLASSIFICACOES_B6 = [
    { id: "otimo",      nome: "\u00D3timo",     cor: "#059669", faixa: "> 8%" },
    { id: "bom",        nome: "Bom",        cor: "#0284c7", faixa: "> 6% e \u2264 8%" },
    { id: "suficiente", nome: "Suficiente", cor: "#d97706", faixa: "> 3% e \u2264 6%" },
    { id: "regular",    nome: "Regular",    cor: "#64748b", faixa: "\u2264 3%" },
  ];

  function classificarB6(pct) {
    if (pct > 8) return "otimo";
    if (pct > 6) return "bom";
    if (pct > 3) return "suficiente";
    return "regular";
  }

  function classificacaoB6PorId(id) {
    return CLASSIFICACOES_B6.find(function (c) { return c.id === id; });
  }

  var b6Form = document.getElementById("b6-form");
  var b6ItensTra = document.getElementById("b6-itens-tra");
  var b6ItensOutros = document.getElementById("b6-itens-outros");
  var b6MetasEscala = document.getElementById("b6-metas-escala");
  var b6FiltroPreenchidos = document.getElementById("b6-filtro-preenchidos");

  function montarItemB6(proc, grupo) {
    var inputId = "b6-" + proc.cod.replace(/[^0-9]/g, "");
    var html = "";
    html += '<div class="b5-item">';
    html += '  <label class="b5-item-info" for="' + inputId + '">';
    html += '    <span class="b5-item-cod">' + proc.cod + "</span>";
    html += '    <span class="b5-item-nome">' + proc.nome + "</span>";
    html += "  </label>";
    html += '  <input type="number" class="b6-item-input" id="' + inputId + '" data-grupo="' + grupo + '" min="0" step="1" inputmode="numeric" placeholder="0">';
    html += "</div>";
    return html;
  }

  function renderizarFormB6() {
    if (!b6ItensTra || !b6ItensOutros) return;
    b6ItensTra.innerHTML = B6_TRA.map(function (p) { return montarItemB6(p, "tra"); }).join("");
    b6ItensOutros.innerHTML = B6_OUTROS.map(function (p) { return montarItemB6(p, "outros"); }).join("");
  }

  /* Oculta os procedimentos sem produção no indicador de ART (mesma lógica do b5). */
  function aplicarFiltroB6() {
    if (!b6Form) return;
    var itens = b6Form.querySelectorAll(".b5-item");
    var ativo = b6FiltroPreenchidos ? b6FiltroPreenchidos.checked : false;
    var algumPreenchido = false;
    itens.forEach(function (item) {
      var inp = item.querySelector(".b6-item-input");
      if (inp && Number(inp.value) > 0) algumPreenchido = true;
    });
    itens.forEach(function (item) {
      var inp = item.querySelector(".b6-item-input");
      var preenchido = inp && Number(inp.value) > 0;
      item.hidden = (ativo && algumPreenchido && !preenchido);
    });
    b6Form.querySelectorAll(".b5-itens").forEach(function (grupo) {
      var visiveis = grupo.querySelectorAll(".b5-item:not([hidden])").length;
      grupo.classList.toggle("b5-itens--vazio", ativo && algumPreenchido && visiveis === 0);
    });
  }

  function somarB6() {
    var numerador = 0;
    var totalOutros = 0;

    if (b6ItensTra) {
      b6ItensTra.querySelectorAll(".b6-item-input").forEach(function (inp) {
        var v = Number(inp.value);
        if (!isNaN(v) && v > 0) numerador += v;
      });
    }
    if (b6ItensOutros) {
      b6ItensOutros.querySelectorAll(".b6-item-input").forEach(function (inp) {
        var v = Number(inp.value);
        if (!isNaN(v) && v > 0) totalOutros += v;
      });
    }

    return { numerador: numerador, denominador: numerador + totalOutros };
  }

  function metricasB6DeForm() {
    var s = somarB6();
    if (s.denominador <= 0) return null;
    return { numerador: s.numerador, denominador: s.denominador, pct: (s.numerador / s.denominador) * 100 };
  }

  function interpretacaoB6(classId, pct) {
    var arred = Math.round(pct);
    if (classId === "otimo") {
      return {
        tipo: "sucesso", icone: "\u2713",
        titulo: "\u00D3timo \u2014 forte uso de t\u00E9cnica conservadora",
        texto: "De cada 100 restaura\u00E7\u00F5es, cerca de <strong>" + arred + " s\u00E3o TRA/ART</strong>. A equipe incorpora bem a odontologia minimamente invasiva, preservando estrutura dental e evitando interven\u00E7\u00F5es mais complexas. Mantenha o ritmo."
      };
    }
    if (classId === "bom") {
      return {
        tipo: "info", icone: "\u2192",
        titulo: "Bom \u2014 perto da faixa \u00F3tima",
        texto: "O TRA/ART representa cerca de <strong>" + arred + " a cada 100</strong> restaura\u00E7\u00F5es. J\u00E1 \u00E9 um bom uso da t\u00E9cnica conservadora. Para chegar a \u00D3timo (acima de 8%), aposte no TRA/ART nos casos indicados de c\u00E1rie em les\u00F5es acess\u00EDveis."
      };
    }
    if (classId === "suficiente") {
      return {
        tipo: "atencao", icone: "!",
        titulo: "Suficiente \u2014 d\u00E1 para usar mais TRA/ART",
        texto: "Apenas cerca de <strong>" + arred + " a cada 100</strong> restaura\u00E7\u00F5es s\u00E3o TRA/ART. H\u00E1 espa\u00E7o para ampliar a abordagem minimamente invasiva nos casos elegíveis, reduzindo a remo\u00E7\u00E3o de tecido s\u00E3o e preservando mais o dente."
      };
    }
    return {
      tipo: "critico", icone: "\u2716",
      titulo: "Regular \u2014 t\u00E9cnica pouco utilizada",
      texto: "O TRA/ART aparece em <strong>3 ou menos a cada 100</strong> restaura\u00E7\u00F5es. A equipe ainda recorre pouco \u00E0 abordagem minimamente invasiva. Avalie indica\u00E7\u00F5es de TRA/ART e a capacita\u00E7\u00E3o da equipe para incorporar essa t\u00E9cnica na rotina. Confira tamb\u00E9m se os procedimentos est\u00E3o sendo registrados corretamente."
    };
  }

  var B6_ESCALA_MAX = 12;
  var B6_ESCALA_ZONAS = [
    { ini: 0,  fim: 3,  cor: "#64748b", nome: "Regular" },
    { ini: 3,  fim: 6,  cor: "#d97706", nome: "Suficiente" },
    { ini: 6,  fim: 8,  cor: "#0284c7", nome: "Bom" },
    { ini: 8,  fim: B6_ESCALA_MAX, cor: "#059669", nome: "\u00D3timo" },
  ];

  function renderizarMetasB6() {
    if (!b6MetasEscala) return;
    var met = metricasB6DeForm();

    if (!met) {
      b6MetasEscala.hidden = true;
      b6MetasEscala.innerHTML = "";
      return;
    }

    var classId = classificarB6(met.pct);
    var atual = classificacaoB6PorId(classId);

    b6MetasEscala.innerHTML = montarEscalaFaixas({
      pct: met.pct,
      atual: atual,
      max: B6_ESCALA_MAX,
      zonas: B6_ESCALA_ZONAS,
      ticks: [3, 6, 8],
    });
    b6MetasEscala.hidden = false;
  }

  function montarEscalaB6(pct, atual) {
    return montarEscalaFaixas({
      pct: pct,
      atual: atual,
      max: B6_ESCALA_MAX,
      zonas: B6_ESCALA_ZONAS,
      ticks: [3, 6, 8],
    });
  }

  if (b6Form) {
    renderizarFormB6();
    aplicarFiltroB6();

    b6Form.addEventListener("input", function (e) {
      if (e.target && e.target.classList.contains("b6-item-input")) {
        aplicarFiltroB6();
        if (typeof atualizarResultadoLiveB6 === "function") atualizarResultadoLiveB6();
        else renderizarMetasB6();
      }
    });

    if (b6FiltroPreenchidos) {
      b6FiltroPreenchidos.addEventListener("change", aplicarFiltroB6);
    }

    b6Form.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  }

  function limparFormulariosIndicadores() {
    if (b5Form) {
      b5MesOverride = null;
      b5Form.querySelectorAll(".b5-item-input").forEach(function (inp) { inp.value = ""; });
      if (typeof aplicarFiltroB5 === "function") aplicarFiltroB5();
      if (typeof atualizarResultadoLiveB5 === "function") atualizarResultadoLiveB5();
      else if (b5MetasEscala) { b5MetasEscala.hidden = true; b5MetasEscala.innerHTML = ""; }
    }

    if (b6Form) {
      b6MesOverride = null;
      b6Form.querySelectorAll(".b6-item-input").forEach(function (inp) { inp.value = ""; });
      if (typeof aplicarFiltroB6 === "function") aplicarFiltroB6();
      if (typeof atualizarResultadoLiveB6 === "function") atualizarResultadoLiveB6();
      else if (b6MetasEscala) { b6MetasEscala.hidden = true; b6MetasEscala.innerHTML = ""; }
    }

    if (b3Form) {
      b3MesOverride = null;
      b3Form.querySelectorAll(".b3-campo-input").forEach(function (inp) { inp.value = ""; });
      if (typeof atualizarResultadoLiveB3 === "function") atualizarResultadoLiveB3();
      else if (b3MetasEscala) { b3MetasEscala.hidden = true; b3MetasEscala.innerHTML = ""; }
    }

    if (typeof limparUiEscovacao === "function") limparUiEscovacao();
  }

  /* ===== IMPORTAÇÃO AUTOMÁTICA DO RELATÓRIO PDF (e-SUS APS) ===== */
  /* Não se aplica à Escovação supervisionada. */
  var PDF_MESES = MESES_NOME;
  var PDF_QUADRIMESTRES = QUADRIMESTRES;

  var pdfMesSel        = document.getElementById("pdf-mes");
  var pdfAnoInput      = document.getElementById("pdf-ano");
  var pdfFileInput     = document.getElementById("pdf-file");
  var pdfBtnProcessar  = document.getElementById("pdf-processar");
  var pdfStatusEl      = document.getElementById("pdf-status");
  var pdfConflitoEl    = document.getElementById("pdf-conflito");
  var pdfBannerEl      = document.getElementById("pdf-banner");
  var pdfResultadosEl  = document.getElementById("pdf-resultados");
  var pdfHistoricoEl   = document.getElementById("pdf-historico");
  var pdfHistoricoDetalhe = document.getElementById("pdf-historico-detalhe");
  var pdfDrawerRoot    = document.getElementById("pdf-drawer-root");
  var pdfDrawer        = document.getElementById("pdf-drawer");
  var pdfDrawerOverlay = document.getElementById("pdf-drawer-overlay");
  var pdfDrawerFechar  = document.getElementById("pdf-drawer-fechar");
  var pdfDrawerVazio   = document.getElementById("pdf-drawer-vazio");
  var pdfDrawerCompetencia = document.getElementById("pdf-drawer-competencia");
  var pdfDrawerMeses   = document.getElementById("pdf-drawer-meses");
  var pdfDrawerLayout  = document.getElementById("pdf-drawer-layout");
  var pdfDrawerIndice  = document.getElementById("pdf-drawer-indice");
  var pdfDrawerConteudo = document.getElementById("pdf-drawer-conteudo");
  var sidebarPdfBtn    = document.getElementById("sidebar-pdf");
  var bottomPdfBtn     = document.getElementById("bottom-pdf");
  var sidebarPdfBadge  = document.getElementById("sidebar-pdf-badge");
  var bottomPdfBadge   = document.getElementById("bottom-pdf-badge");
  var simDrawerRoot    = document.getElementById("sim-drawer-root");
  var simDrawerOverlay = document.getElementById("sim-drawer-overlay");
  var simDrawerFechar  = document.getElementById("sim-drawer-fechar");
  var simDrawer        = document.getElementById("sim-drawer");
  var simDrawerConteudo = document.getElementById("sim-drawer-conteudo");

  var pdfUnidadeId = "";
  var pdfPendente  = null;
  var pdfArquivoCompetencia = null;
  var pdfResultadosVisivel = false;
  var pdfTemConteudo = false;
  var pdfMesExibido = null;
  var pdfIndiceScrollBound = false;
  var pdfIndiceScrollRaf = 0;

  function pdfDrawerEhDesktop() {
    return window.matchMedia("(min-width: 769px)").matches;
  }

  function pdfLimparIndice() {
    if (pdfDrawerIndice) {
      pdfDrawerIndice.innerHTML = "";
      pdfDrawerIndice.hidden = true;
    }
  }

  function pdfRenderIndice(meta) {
    if (!pdfDrawerIndice) return;
    if (!meta.length || !pdfDrawerEhDesktop()) {
      pdfLimparIndice();
      return;
    }

    var html = '<p class="pdf-indice-titulo">Neste m\u00EAs</p><ul class="pdf-indice-lista">';
    meta.forEach(function (m, i) {
      var badge = m.classNome
        ? '<span class="pdf-indice-badge" style="--cor:' + m.cor + '">' + m.classNome + "</span>"
        : "";
      var active = i === 0 ? " is-active" : "";
      html += '<li><a class="pdf-indice-item' + active + '" href="#' + m.id + '" style="--cor:' + m.cor + '">';
      html += '<span class="pdf-indice-num">' + m.num + "</span>";
      html += '<span class="pdf-indice-corpo"><span class="pdf-indice-nome">' + m.titulo + "</span>";
      html += '<span class="pdf-indice-meta"><span class="pdf-indice-valor">' + m.valor + "</span>" + badge + "</span>";
      html += "</span></a></li>";
    });
    html += "</ul>";

    pdfDrawerIndice.innerHTML = html;
    pdfDrawerIndice.hidden = false;
  }

  function pdfMarcarIndiceAtivo(cardId) {
    if (!pdfDrawerIndice || !cardId) return;
    pdfDrawerIndice.querySelectorAll(".pdf-indice-item").forEach(function (item) {
      var ativo = item.getAttribute("href") === "#" + cardId;
      item.classList.toggle("is-active", ativo);
      if (ativo) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    });
  }

  function pdfAtualizarIndiceAtivo() {
    if (!pdfDrawerConteudo || !pdfDrawerEhDesktop()) return;
    var cards = pdfDrawerConteudo.querySelectorAll(".pdf-card[id]");
    if (!cards.length) return;

    var limite = pdfDrawerConteudo.getBoundingClientRect().top + 96;
    var ativo = cards[0].id;
    cards.forEach(function (card) {
      if (card.getBoundingClientRect().top <= limite) ativo = card.id;
    });
    pdfMarcarIndiceAtivo(ativo);
  }

  function pdfOnIndiceScroll() {
    if (pdfIndiceScrollRaf) return;
    pdfIndiceScrollRaf = window.requestAnimationFrame(function () {
      pdfIndiceScrollRaf = 0;
      pdfAtualizarIndiceAtivo();
    });
  }

  function pdfBindIndiceScroll() {
    if (!pdfDrawerConteudo || pdfIndiceScrollBound || !pdfDrawerEhDesktop()) return;
    pdfDrawerConteudo.addEventListener("scroll", pdfOnIndiceScroll, { passive: true });
    pdfIndiceScrollBound = true;
    pdfAtualizarIndiceAtivo();
  }

  function pdfUnbindIndiceScroll() {
    if (!pdfDrawerConteudo || !pdfIndiceScrollBound) return;
    pdfDrawerConteudo.removeEventListener("scroll", pdfOnIndiceScroll);
    pdfIndiceScrollBound = false;
    if (pdfIndiceScrollRaf) {
      window.cancelAnimationFrame(pdfIndiceScrollRaf);
      pdfIndiceScrollRaf = 0;
    }
  }

  function pdfBindIndiceCliques() {
    if (!pdfDrawerIndice || pdfDrawerIndice.dataset.bound === "1") return;
    pdfDrawerIndice.addEventListener("click", function (e) {
      var link = e.target.closest(".pdf-indice-item");
      if (!link || !pdfDrawerConteudo) return;
      var id = (link.getAttribute("href") || "").replace(/^#/, "");
      var card = id ? document.getElementById(id) : null;
      if (!card) return;
      e.preventDefault();
      var cardTop = card.getBoundingClientRect().top;
      var containerTop = pdfDrawerConteudo.getBoundingClientRect().top;
      var destino = pdfDrawerConteudo.scrollTop + (cardTop - containerTop) - 12;
      pdfDrawerConteudo.scrollTo({ top: Math.max(0, destino), behavior: "smooth" });
      pdfMarcarIndiceAtivo(id);
    });
    pdfDrawerIndice.dataset.bound = "1";
  }

  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  /* ----- Helpers de período ----- */
  function pdfQuadrimestreIndice(mes) { return ESB.quadIndicePorMes(mes); }
  function pdfPosicaoNoQuadrimestre(mes) { return ESB.quadPosicaoNoMes(mes); }

  function pdfDetectarQuadAtivo(uid) {
    var ref = obterQuadReferenciaUnidade(uid);
    if (ref) return ref;

    var store = pdfLerStore()[uid] || {};
    for (var k in store) {
      var m = Number(k);
      if (m < 1 || m > 12) continue;
      return { indice: ESB.quadIndicePorMes(m), ano: store[k].ano };
    }
    return null;
  }

  /* ===== ACOMPANHAMENTO QUADRIMESTRAL — INDICADORES 4, 5 E 6 ===== */

  var b5MesesGrid = document.getElementById("b5-meses-grid");
  var b5QuadResumo = document.getElementById("b5-quad-resumo");
  var b6MesesGrid = document.getElementById("b6-meses-grid");
  var b6QuadResumo = document.getElementById("b6-quad-resumo");
  var b3MesesGrid = document.getElementById("b3-meses-grid");
  var b3QuadResumo = document.getElementById("b3-quad-resumo");

  var b5MesAtual = 1;
  var b5MesOverride = null;
  var b6MesAtual = 1;
  var b6MesOverride = null;
  var b3MesAtual = 1;
  var b3MesOverride = null;
  var quadUnidadeId = "";

  function metricasB5DeDados(dados) {
    if (!dados || !dados.b5) return null;
    var num = dados.b5.num.total;
    var den = dados.b5.num.total + dados.b5.out.total;
    if (den <= 0) return null;
    return { numerador: num, denominador: den, pct: (num / den) * 100 };
  }

  function metricasB6DeDados(dados) {
    if (!dados || !dados.b6) return null;
    var num = dados.b6.num.total;
    var den = dados.b6.num.total + dados.b6.out.total;
    if (den <= 0) return null;
    return { numerador: num, denominador: den, pct: (num / den) * 100 };
  }

  function metricasB3DeDados(dados) {
    if (!dados || !dados.b3) return null;
    var exo = dados.b3.exo.total;
    var den = exo + dados.b3.prev.total + dados.b3.cur.total;
    if (den <= 0) return null;
    return {
      exodontias: exo,
      preventivos: dados.b3.prev.total,
      curativos: dados.b3.cur.total,
      numerador: exo,
      denominador: den,
      pct: (exo / den) * 100,
    };
  }

  function obterRegistrosQuadPdf(uid) {
    var quad = pdfDetectarQuadAtivo(uid);
    var meses = { 1: null, 2: null, 3: null, 4: null };

    if (!quad) return { quad: null, meses: meses };

    var store = pdfLerStore()[uid] || {};
    var calMeses = QUADRIMESTRES[quad.indice].meses;

    for (var pos = 1; pos <= 4; pos++) {
      var cal = calMeses[pos - 1];
      var reg = store[cal] || null;
      meses[pos] = (reg && reg.ano === quad.ano) ? reg : null;
    }

    return { quad: quad, meses: meses };
  }

  function ultimoMesQuadComDados(meses, metricaFn) {
    for (var m = 4; m >= 1; m--) {
      if (meses[m] && metricaFn(meses[m].dados)) return m;
    }
    return 0;
  }

  function acumularMetricasQuad(meses, atePos, metricaFn) {
    var num = 0;
    var den = 0;
    var extra = {};

    for (var m = 1; m <= atePos; m++) {
      if (!meses[m]) continue;
      var met = metricaFn(meses[m].dados);
      if (!met) continue;
      num += met.numerador;
      den += met.denominador;
      if (met.exodontias !== undefined) {
        extra.exodontias = (extra.exodontias || 0) + met.exodontias;
        extra.preventivos = (extra.preventivos || 0) + met.preventivos;
        extra.curativos = (extra.curativos || 0) + met.curativos;
      }
    }

    if (den <= 0) return null;

    var res = { numerador: num, denominador: den, pct: (num / den) * 100 };
    if (extra.exodontias !== undefined) {
      res.exodontias = extra.exodontias;
      res.preventivos = extra.preventivos;
      res.curativos = extra.curativos;
    }
    return res;
  }

  function badgeClassGenerico(classId, classificacaoFn) {
    var c = classificacaoFn(classId);
    if (!c) return "";
    return '<span class="badge-class" style="--cor: ' + c.cor + '">' + c.nome + "</span>";
  }

  function montarHtmlQuadResumoB5(mesSel, met, editado) {
    var classMes = classificarB5(met.pct);
    var cls = classificacaoB5PorId(classMes);
    var label = "Acompanhamento mensal \u2014 " + QUAD_MESES_LABEL[mesSel - 1];
    if (editado) label += " \u00B7 valores editados";

    var html = '<div class="toc-resumo-compact ind-quad-resumo-inner" style="--cor-status: ' + cls.cor + '">';
    html += '  <div class="toc-resumo-bloco">';
    html += '    <span class="toc-resumo-bloco-label">' + label + "</span>";
    html += '    <span class="toc-resumo-bloco-pct">' + fmtPct(met.pct) + "</span>";
    html += badgeClassGenerico(classMes, classificacaoB5PorId);
    html += '    <p class="toc-resumo-dica-texto">' + met.numerador.toLocaleString("pt-BR") + " preventivos \u00F7 " + met.denominador.toLocaleString("pt-BR") + " procedimentos individuais</p>";
    html += "  </div>";
    html += "</div>";
    return html;
  }

  function renderizarQuadResumoB5(meses, mesSel) {
    if (!b5QuadResumo) return;
    var reg = meses[mesSel];
    var met = reg ? metricasB5DeDados(reg.dados) : null;
    if (!met) {
      b5QuadResumo.hidden = true;
      b5QuadResumo.innerHTML = "";
      return;
    }

    b5QuadResumo.innerHTML = montarHtmlQuadResumoB5(mesSel, met, false);
    b5QuadResumo.hidden = false;
  }

  function b5FormDiferenteDoPdf() {
    var metForm = metricasB5DeForm();
    if (!metForm) return false;
    if (!quadUnidadeId) return true;

    var pacote = obterRegistrosQuadPdf(quadUnidadeId);
    var reg = pacote.meses[b5MesAtual];
    if (!reg || !reg.dados) return true;

    var pdfMet = metricasB5DeDados(reg.dados);
    if (!pdfMet) return true;
    return pdfMet.numerador !== metForm.numerador || pdfMet.denominador !== metForm.denominador;
  }

  function atualizarResultadoLiveB5() {
    renderizarMetasB5();

    var metForm = metricasB5DeForm();
    var editado = metForm && b5FormDiferenteDoPdf();
    b5MesOverride = editado ? metForm : null;

    var pacote = quadUnidadeId ? obterRegistrosQuadPdf(quadUnidadeId) : null;
    var meses = pacote ? pacote.meses : { 1: null, 2: null, 3: null, 4: null };

    if (metForm) {
      if (b5QuadResumo) {
        b5QuadResumo.innerHTML = montarHtmlQuadResumoB5(b5MesAtual, metForm, editado);
        b5QuadResumo.hidden = false;
      }
      renderizarB5MesesGrid(meses, editado ? b5MesAtual : null, editado ? metForm : null);
      return;
    }

    b5MesOverride = null;
    var reg = meses[b5MesAtual];
    if (reg && metricasB5DeDados(reg.dados)) {
      renderizarQuadResumoB5(meses, b5MesAtual);
    } else if (b5QuadResumo) {
      b5QuadResumo.hidden = true;
      b5QuadResumo.innerHTML = "";
    }
    renderizarB5MesesGrid(meses);
  }

  function renderizarQuadResumoB6(meses, mesSel) {
    if (!b6QuadResumo) return;
    var reg = meses[mesSel];
    var met = reg ? metricasB6DeDados(reg.dados) : null;
    if (!met) {
      b6QuadResumo.hidden = true;
      b6QuadResumo.innerHTML = "";
      return;
    }

    b6QuadResumo.innerHTML = montarHtmlQuadResumoB6(mesSel, met, false);
    b6QuadResumo.hidden = false;
  }

  function montarHtmlQuadResumoB6(mesSel, met, editado) {
    var classMes = classificarB6(met.pct);
    var cls = classificacaoB6PorId(classMes);
    var label = "Acompanhamento mensal \u2014 " + QUAD_MESES_LABEL[mesSel - 1];
    if (editado) label += " \u00B7 valores editados";

    var html = '<div class="toc-resumo-compact ind-quad-resumo-inner" style="--cor-status: ' + cls.cor + '">';
    html += '  <div class="toc-resumo-bloco">';
    html += '    <span class="toc-resumo-bloco-label">' + label + "</span>";
    html += '    <span class="toc-resumo-bloco-pct">' + fmtPct(met.pct) + "</span>";
    html += badgeClassGenerico(classMes, classificacaoB6PorId);
    html += '    <p class="toc-resumo-dica-texto">' + met.numerador.toLocaleString("pt-BR") + " TRA/ART \u00F7 " + met.denominador.toLocaleString("pt-BR") + " restaura\u00E7\u00F5es</p>";
    html += "  </div>";
    html += "</div>";
    return html;
  }

  function b6FormDiferenteDoPdf() {
    var metForm = metricasB6DeForm();
    if (!metForm) return false;
    if (!quadUnidadeId) return true;

    var pacote = obterRegistrosQuadPdf(quadUnidadeId);
    var reg = pacote.meses[b6MesAtual];
    if (!reg || !reg.dados) return true;

    var pdfMet = metricasB6DeDados(reg.dados);
    if (!pdfMet) return true;
    return pdfMet.numerador !== metForm.numerador || pdfMet.denominador !== metForm.denominador;
  }

  function atualizarResultadoLiveB6() {
    renderizarMetasB6();

    var metForm = metricasB6DeForm();
    var editado = metForm && b6FormDiferenteDoPdf();
    b6MesOverride = editado ? metForm : null;

    var pacote = quadUnidadeId ? obterRegistrosQuadPdf(quadUnidadeId) : null;
    var meses = pacote ? pacote.meses : { 1: null, 2: null, 3: null, 4: null };

    if (metForm) {
      if (b6QuadResumo) {
        b6QuadResumo.innerHTML = montarHtmlQuadResumoB6(b6MesAtual, metForm, editado);
        b6QuadResumo.hidden = false;
      }
      renderizarB6MesesGrid(meses, editado ? b6MesAtual : null, editado ? metForm : null);
      return;
    }

    b6MesOverride = null;
    var reg = meses[b6MesAtual];
    if (reg && metricasB6DeDados(reg.dados)) {
      renderizarQuadResumoB6(meses, b6MesAtual);
    } else if (b6QuadResumo) {
      b6QuadResumo.hidden = true;
      b6QuadResumo.innerHTML = "";
    }
    renderizarB6MesesGrid(meses);
  }

  function montarHtmlQuadResumoB3(mesSel, met, editado) {
    var classMes = classificarB3(met.pct);
    var cls = classificacaoB3PorId(classMes);
    var label = "Acompanhamento mensal \u2014 " + QUAD_MESES_LABEL[mesSel - 1];
    if (editado) label += " \u00B7 valores editados";

    var html = '<div class="toc-resumo-compact ind-quad-resumo-inner" style="--cor-status: ' + cls.cor + '">';
    html += '  <div class="toc-resumo-bloco">';
    html += '    <span class="toc-resumo-bloco-label">' + label + "</span>";
    html += '    <span class="toc-resumo-bloco-pct">' + fmtPct(met.pct) + "</span>";
    html += badgeClassGenerico(classMes, classificacaoB3PorId);
    html += '    <p class="toc-resumo-dica-texto">' + met.exodontias.toLocaleString("pt-BR") + " exodontias \u00F7 " + met.denominador.toLocaleString("pt-BR") + " procedimentos</p>";
    html += "  </div>";
    html += "</div>";
    return html;
  }

  function renderizarQuadResumoB3(meses, mesSel) {
    if (!b3QuadResumo) return;
    var reg = meses[mesSel];
    var met = reg ? metricasB3DeDados(reg.dados) : null;
    if (!met) {
      b3QuadResumo.hidden = true;
      b3QuadResumo.innerHTML = "";
      return;
    }

    b3QuadResumo.innerHTML = montarHtmlQuadResumoB3(mesSel, met, false);
    b3QuadResumo.hidden = false;
  }

  function b3FormDiferenteDoPdf() {
    var metForm = metricasB3DeForm();
    if (!metForm) return false;
    if (!quadUnidadeId) return true;

    var pacote = obterRegistrosQuadPdf(quadUnidadeId);
    var reg = pacote.meses[b3MesAtual];
    if (!reg || !reg.dados) return true;

    var pdfMet = metricasB3DeDados(reg.dados);
    if (!pdfMet) return true;
    return pdfMet.exodontias !== metForm.exodontias ||
      pdfMet.preventivos !== metForm.preventivos ||
      pdfMet.curativos !== metForm.curativos;
  }

  function atualizarResultadoLiveB3() {
    renderizarMetasB3();

    var metForm = metricasB3DeForm();
    var editado = metForm && b3FormDiferenteDoPdf();
    b3MesOverride = editado ? metForm : null;

    var pacote = quadUnidadeId ? obterRegistrosQuadPdf(quadUnidadeId) : null;
    var meses = pacote ? pacote.meses : { 1: null, 2: null, 3: null, 4: null };

    if (metForm) {
      if (b3QuadResumo) {
        b3QuadResumo.innerHTML = montarHtmlQuadResumoB3(b3MesAtual, metForm, editado);
        b3QuadResumo.hidden = false;
      }
      renderizarB3MesesGrid(meses, editado ? b3MesAtual : null, editado ? metForm : null);
      return;
    }

    b3MesOverride = null;
    var reg = meses[b3MesAtual];
    if (reg && metricasB3DeDados(reg.dados)) {
      renderizarQuadResumoB3(meses, b3MesAtual);
    } else if (b3QuadResumo) {
      b3QuadResumo.hidden = true;
      b3QuadResumo.innerHTML = "";
    }
    renderizarB3MesesGrid(meses);
  }

  function pdfPreencherB5DeRegistro(registro) {
    if (!registro || !registro.dados) return;
    var d = registro.dados;
    if (b5Form) b5Form.querySelectorAll(".b5-item-input").forEach(function (inp) { inp.value = ""; });
    pdfPreencherInputs(d.b5.num.itens.concat(d.b5.out.itens), "b5");
    if (typeof aplicarFiltroB5 === "function") aplicarFiltroB5();
    if (typeof atualizarResultadoLiveB5 === "function") atualizarResultadoLiveB5();
    else if (typeof renderizarMetasB5 === "function") renderizarMetasB5();
  }

  function pdfPreencherB6DeRegistro(registro) {
    if (!registro || !registro.dados) return;
    var d = registro.dados;
    if (b6Form) b6Form.querySelectorAll(".b6-item-input").forEach(function (inp) { inp.value = ""; });
    pdfPreencherInputs(d.b6.num.itens.concat(d.b6.out.itens), "b6");
    if (typeof aplicarFiltroB6 === "function") aplicarFiltroB6();
    if (typeof atualizarResultadoLiveB6 === "function") atualizarResultadoLiveB6();
    else if (typeof renderizarMetasB6 === "function") renderizarMetasB6();
  }

  function pdfPreencherB3DeRegistro(registro) {
    if (!registro || !registro.dados) return;
    var d = registro.dados;
    if (b3InExo) b3InExo.value = d.b3.exo.total || "";
    if (b3InPrev) b3InPrev.value = d.b3.prev.total || "";
    if (b3InCur) b3InCur.value = d.b3.cur.total || "";
    if (typeof atualizarResultadoLiveB3 === "function") atualizarResultadoLiveB3();
    else if (typeof renderizarMetasB3 === "function") renderizarMetasB3();
  }

  function renderizarB5MesesGrid(meses, mesOverride, metOverride) {
    if (!b5MesesGrid) return;

    var html = "";
    for (var mes = 1; mes <= 4; mes++) {
      var registro = meses[mes];
      var met = registro ? metricasB5DeDados(registro.dados) : null;
      var editado = mesOverride && metOverride && mes === mesOverride;
      if (editado) met = metOverride;

      var ativo = mes === b5MesAtual;
      var cardClass = "pco-mes-card";
      if (ativo) cardClass += " is-active";
      if (met) cardClass += " is-preenchido";
      if (editado) cardClass += " is-editado";

      var cls = null;
      if (met) cls = classificacaoB5PorId(classificarB5(met.pct));

      html += '<button type="button" class="' + cardClass + '"' + attrStyleCor(cls ? cls.cor : "") + ' data-mes="' + mes + '" role="tab" aria-selected="' + (ativo ? "true" : "false") + '">';
      html += '  <p class="pco-mes-card-titulo">' + QUAD_MESES_LABEL[mes - 1] + "</p>";
      html += '  <p class="pco-mes-card-label">Procedimentos preventivos neste m\u00EAs</p>';

      if (met) {
        html += '  <p class="pco-mes-card-valor">' + met.numerador.toLocaleString("pt-BR") + "</p>";
        html += '  <div class="pco-mes-card-extra">';
        html += '    <span class="pco-mes-card-pct">' + fmtPct(met.pct) + " do m\u00EAs</span>";
        html += '    <span class="pco-mes-card-class" style="--cor: ' + cls.cor + '">' + cls.nome + "</span>";
        html += "  </div>";
      } else {
        html += '  <p class="pco-mes-card-valor pco-mes-card-valor--vazio">\u2014</p>';
      }

      html += "</button>";
    }

    b5MesesGrid.innerHTML = html;
    b5MesesGrid.querySelectorAll(".pco-mes-card").forEach(function (btn) {
      btn.addEventListener("click", function () { selecionarMesQuadB5(Number(btn.dataset.mes)); });
    });
  }

  function renderizarB6MesesGrid(meses, mesOverride, metOverride) {
    if (!b6MesesGrid) return;

    var html = "";
    for (var mes = 1; mes <= 4; mes++) {
      var registro = meses[mes];
      var met = registro ? metricasB6DeDados(registro.dados) : null;
      var editado = mesOverride && metOverride && mes === mesOverride;
      if (editado) met = metOverride;

      var ativo = mes === b6MesAtual;
      var cardClass = "pco-mes-card";
      if (ativo) cardClass += " is-active";
      if (met) cardClass += " is-preenchido";
      if (editado) cardClass += " is-editado";

      var cls = null;
      if (met) cls = classificacaoB6PorId(classificarB6(met.pct));

      html += '<button type="button" class="' + cardClass + '"' + attrStyleCor(cls ? cls.cor : "") + ' data-mes="' + mes + '" role="tab" aria-selected="' + (ativo ? "true" : "false") + '">';
      html += '  <p class="pco-mes-card-titulo">' + QUAD_MESES_LABEL[mes - 1] + "</p>";
      html += '  <p class="pco-mes-card-label">TRA\u002FART neste m\u00EAs</p>';

      if (met) {
        html += '  <p class="pco-mes-card-valor">' + met.numerador.toLocaleString("pt-BR") + "</p>";
        html += '  <div class="pco-mes-card-extra">';
        html += '    <span class="pco-mes-card-pct">' + fmtPct(met.pct) + " do m\u00EAs</span>";
        html += '    <span class="pco-mes-card-class" style="--cor: ' + cls.cor + '">' + cls.nome + "</span>";
        html += "  </div>";
      } else {
        html += '  <p class="pco-mes-card-valor pco-mes-card-valor--vazio">\u2014</p>';
      }

      html += "</button>";
    }

    b6MesesGrid.innerHTML = html;
    b6MesesGrid.querySelectorAll(".pco-mes-card").forEach(function (btn) {
      btn.addEventListener("click", function () { selecionarMesQuadB6(Number(btn.dataset.mes)); });
    });
  }

  function renderizarB3MesesGrid(meses, mesOverride, metOverride) {
    if (!b3MesesGrid) return;

    var html = "";
    for (var mes = 1; mes <= 4; mes++) {
      var registro = meses[mes];
      var met = registro ? metricasB3DeDados(registro.dados) : null;
      var editado = mesOverride && metOverride && mes === mesOverride;
      if (editado) met = metOverride;

      var ativo = mes === b3MesAtual;
      var cardClass = "pco-mes-card";
      if (ativo) cardClass += " is-active";
      if (met) cardClass += " is-preenchido";
      if (editado) cardClass += " is-editado";

      var cls = null;
      if (met) cls = classificacaoB3PorId(classificarB3(met.pct));

      html += '<button type="button" class="' + cardClass + '"' + attrStyleCor(cls ? cls.cor : "") + ' data-mes="' + mes + '" role="tab" aria-selected="' + (ativo ? "true" : "false") + '">';
      html += '  <p class="pco-mes-card-titulo">' + QUAD_MESES_LABEL[mes - 1] + "</p>";
      html += '  <p class="pco-mes-card-label">Exodontias neste m\u00EAs</p>';

      if (met) {
        html += '  <p class="pco-mes-card-valor">' + met.exodontias.toLocaleString("pt-BR") + "</p>";
        html += '  <div class="pco-mes-card-extra">';
        html += '    <span class="pco-mes-card-pct">' + fmtPct(met.pct) + " do m\u00EAs</span>";
        html += '    <span class="pco-mes-card-class" style="--cor: ' + cls.cor + '">' + cls.nome + "</span>";
        html += "  </div>";
      } else {
        html += '  <p class="pco-mes-card-valor pco-mes-card-valor--vazio">\u2014</p>';
      }

      html += "</button>";
    }

    b3MesesGrid.innerHTML = html;
    b3MesesGrid.querySelectorAll(".pco-mes-card").forEach(function (btn) {
      btn.addEventListener("click", function () { selecionarMesQuadB3(Number(btn.dataset.mes)); });
    });
  }

  function selecionarMesQuadB5(mes) {
    b5MesAtual = mes;
    b5MesOverride = null;
    var pacote = obterRegistrosQuadPdf(quadUnidadeId);

    var reg = pacote.meses[mes];
    if (reg && metricasB5DeDados(reg.dados)) {
      pdfPreencherB5DeRegistro(reg);
    } else {
      if (b5Form) b5Form.querySelectorAll(".b5-item-input").forEach(function (inp) { inp.value = ""; });
      if (typeof aplicarFiltroB5 === "function") aplicarFiltroB5();
      if (typeof atualizarResultadoLiveB5 === "function") atualizarResultadoLiveB5();
      else renderizarB5MesesGrid(pacote.meses);
    }
  }

  function selecionarMesQuadB6(mes) {
    b6MesAtual = mes;
    b6MesOverride = null;
    var pacote = obterRegistrosQuadPdf(quadUnidadeId);

    var reg = pacote.meses[mes];
    if (reg && metricasB6DeDados(reg.dados)) {
      pdfPreencherB6DeRegistro(reg);
    } else {
      if (b6Form) b6Form.querySelectorAll(".b6-item-input").forEach(function (inp) { inp.value = ""; });
      if (typeof aplicarFiltroB6 === "function") aplicarFiltroB6();
      if (typeof atualizarResultadoLiveB6 === "function") atualizarResultadoLiveB6();
      else renderizarB6MesesGrid(pacote.meses);
    }
  }

  function selecionarMesQuadB3(mes) {
    b3MesAtual = mes;
    b3MesOverride = null;
    var pacote = obterRegistrosQuadPdf(quadUnidadeId);

    var reg = pacote.meses[mes];
    if (reg && metricasB3DeDados(reg.dados)) {
      pdfPreencherB3DeRegistro(reg);
    } else {
      if (b3InExo) b3InExo.value = "";
      if (b3InPrev) b3InPrev.value = "";
      if (b3InCur) b3InCur.value = "";
      if (typeof atualizarResultadoLiveB3 === "function") atualizarResultadoLiveB3();
      else renderizarB3MesesGrid(pacote.meses);
    }
  }

  function atualizarPainelQuadB5() {
    if (!quadUnidadeId) return;
    b5MesOverride = null;
    var pacote = obterRegistrosQuadPdf(quadUnidadeId);
    var reg = pacote.meses[b5MesAtual];
    if (reg && metricasB5DeDados(reg.dados)) {
      pdfPreencherB5DeRegistro(reg);
    } else {
      if (b5Form) b5Form.querySelectorAll(".b5-item-input").forEach(function (inp) { inp.value = ""; });
      if (typeof aplicarFiltroB5 === "function") aplicarFiltroB5();
      if (typeof atualizarResultadoLiveB5 === "function") atualizarResultadoLiveB5();
      else {
        renderizarB5MesesGrid(pacote.meses);
        if (b5QuadResumo) { b5QuadResumo.hidden = true; b5QuadResumo.innerHTML = ""; }
      }
    }
  }

  function atualizarPainelQuadB6() {
    if (!quadUnidadeId) return;
    b6MesOverride = null;
    var pacote = obterRegistrosQuadPdf(quadUnidadeId);
    var reg = pacote.meses[b6MesAtual];
    if (reg && metricasB6DeDados(reg.dados)) {
      pdfPreencherB6DeRegistro(reg);
    } else {
      if (b6Form) b6Form.querySelectorAll(".b6-item-input").forEach(function (inp) { inp.value = ""; });
      if (typeof aplicarFiltroB6 === "function") aplicarFiltroB6();
      if (typeof atualizarResultadoLiveB6 === "function") atualizarResultadoLiveB6();
      else {
        renderizarB6MesesGrid(pacote.meses);
        if (b6QuadResumo) { b6QuadResumo.hidden = true; b6QuadResumo.innerHTML = ""; }
      }
    }
  }

  function atualizarPainelQuadB3() {
    if (!quadUnidadeId) return;
    b3MesOverride = null;
    var pacote = obterRegistrosQuadPdf(quadUnidadeId);
    var reg = pacote.meses[b3MesAtual];
    if (reg && metricasB3DeDados(reg.dados)) {
      pdfPreencherB3DeRegistro(reg);
    } else {
      if (b3InExo) b3InExo.value = "";
      if (b3InPrev) b3InPrev.value = "";
      if (b3InCur) b3InCur.value = "";
      if (typeof atualizarResultadoLiveB3 === "function") atualizarResultadoLiveB3();
      else {
        renderizarB3MesesGrid(pacote.meses);
        if (b3QuadResumo) { b3QuadResumo.hidden = true; b3QuadResumo.innerHTML = ""; }
      }
    }
  }

  function atualizarPaineisQuadB456(uid) {
    quadUnidadeId = uid || quadUnidadeId;
    if (!quadUnidadeId) return;

    var pacote = obterRegistrosQuadPdf(quadUnidadeId);
    var ult5 = ultimoMesQuadComDados(pacote.meses, metricasB5DeDados);
    var ult6 = ultimoMesQuadComDados(pacote.meses, metricasB6DeDados);
    var ult3 = ultimoMesQuadComDados(pacote.meses, metricasB3DeDados);

    if (ult5) b5MesAtual = ult5;
    if (ult6) b6MesAtual = ult6;
    if (ult3) b3MesAtual = ult3;

    atualizarPainelQuadB5();
    atualizarPainelQuadB6();
    atualizarPainelQuadB3();
  }

  function iniciarQuadPainelsParaUnidade(unidadeId) {
    quadUnidadeId = unidadeId;
    var pacote = obterRegistrosQuadPdf(unidadeId);

    b5MesAtual = ultimoMesQuadComDados(pacote.meses, metricasB5DeDados) || 1;
    b6MesAtual = ultimoMesQuadComDados(pacote.meses, metricasB6DeDados) || 1;
    b3MesAtual = ultimoMesQuadComDados(pacote.meses, metricasB3DeDados) || 1;

    atualizarPaineisQuadB456(unidadeId);
  }

  function limparQuadResumosB456() {
    b5MesAtual = 1;
    b5MesOverride = null;
    b6MesAtual = 1;
    b6MesOverride = null;
    b3MesAtual = 1;
    b3MesOverride = null;
    if (b5QuadResumo) { b5QuadResumo.hidden = true; b5QuadResumo.innerHTML = ""; }
    if (b6QuadResumo) { b6QuadResumo.hidden = true; b6QuadResumo.innerHTML = ""; }
    if (b3QuadResumo) { b3QuadResumo.hidden = true; b3QuadResumo.innerHTML = ""; }
    var vazio = { 1: null, 2: null, 3: null, 4: null };
    if (b5MesesGrid) renderizarB5MesesGrid(vazio);
    if (b6MesesGrid) renderizarB6MesesGrid(vazio);
    if (b3MesesGrid) renderizarB3MesesGrid(vazio);
  }

  function pdfValidarImportacao(uid, mes, ano) {
    var novoIdx = ESB.quadIndicePorMes(mes);
    var store = pdfLerStore()[uid] || {};

    for (var k in store) {
      var m = Number(k);
      if (m < 1 || m > 12) continue;
      var reg = store[m];
      var idxExist = ESB.quadIndicePorMes(m);
      if (idxExist !== novoIdx || reg.ano !== ano) {
        return { ok: false, mensagem: ESB.mensagemQuadrimestreIncompativel(mes, ano, { indice: idxExist, ano: reg.ano }) };
      }
    }

    var ref = obterQuadReferenciaUnidade(uid);
    if (ref && (ref.indice !== novoIdx || ref.ano !== ano)) {
      return { ok: false, mensagem: ESB.mensagemQuadrimestreIncompativel(mes, ano, ref) };
    }

    return { ok: true };
  }

  function pdfAtualizarMesesDisponiveis(uid) {
    if (!pdfMesSel) return;

    var quadAtivo = pdfDetectarQuadAtivo(uid);
    var opcoes = pdfMesSel.querySelectorAll("option[value]");
    var selecaoValida = false;

    opcoes.forEach(function (opt) {
      var m = Number(opt.value);
      if (!m) return;
      var permitido = !quadAtivo || ESB.quadIndicePorMes(m) === quadAtivo.indice;
      opt.disabled = !permitido;
      if (permitido && pdfMesSel.value === opt.value) selecaoValida = true;
    });

    if (quadAtivo && !selecaoValida) {
      var primeira = Array.from(opcoes).find(function (opt) {
        return opt.value && !opt.disabled;
      });
      if (primeira) pdfMesSel.value = primeira.value;
    }
  }

  function pdfTextoStatus(pos, q) {
    if (pos === 1) {
      return "<strong>Status do acompanhamento:</strong> os resultados correspondem ao 1\u00BA m\u00EAs do " + q.nome +
        ". Os indicadores ainda podem sofrer altera\u00E7\u00F5es at\u00E9 o encerramento do quadrimestre, conforme novas produ\u00E7\u00F5es sejam registradas.";
    }
    if (pos === 4) {
      return "<strong>Status do acompanhamento:</strong> este \u00E9 o 4\u00BA e \u00FAltimo m\u00EAs do " + q.nome +
        ". Com os quatro meses processados, o resultado do quadrimestre est\u00E1 completo.";
    }
    return "<strong>Status do acompanhamento:</strong> dados referentes ao " + pos + "\u00BA m\u00EAs do " + q.nome +
      ". Os resultados j\u00E1 podem ser comparados com os meses anteriores para an\u00E1lise da evolu\u00E7\u00E3o dos indicadores.";
  }

  /* ----- Helpers de texto ----- */
  function escHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function pdfNorm(s) {
    return (s || "").toString().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ").trim();
  }
  function pdfDigitos(s) { return (s || "").replace(/\D/g, ""); }

  /* ----- Leitura do arquivo ----- */
  function pdfLerArquivo(file, como) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function () { reject(fr.error); };
      if (como === "array") fr.readAsArrayBuffer(file);
      else fr.readAsDataURL(file);
    });
  }

  /* ----- Extração de linhas do PDF ----- */
  async function pdfExtrairLinhas(arrayBuffer) {
    var pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    var linhas = [];
    for (var p = 1; p <= pdf.numPages; p++) {
      var page = await pdf.getPage(p);
      var content = await page.getTextContent();
      var mapa = {};
      content.items.forEach(function (it) {
        if (!it.str || !it.str.trim()) return;
        var y = Math.round(it.transform[5]);
        if (!mapa[y]) mapa[y] = [];
        mapa[y].push({ x: it.transform[4], s: it.str });
      });
      Object.keys(mapa).map(Number).sort(function (a, b) { return b - a; }).forEach(function (y) {
        var arr = mapa[y].sort(function (a, b) { return a.x - b.x; });
        var texto = arr.map(function (o) { return o.s; }).join(" ").replace(/\s+/g, " ").trim();
        if (texto) linhas.push(texto);
      });
    }
    return linhas;
  }

  /* Agrupa o texto extra\u00EDdo em registros { codigo10, norm, qtd }.
     No relat\u00F3rio do e-SUS o nome do procedimento pode quebrar em v\u00E1rias
     linhas e a quantidade aparecer numa linha separada logo abaixo. Por isso
     acumulamos o texto de cada procedimento at\u00E9 encontrar o primeiro n\u00FAmero,
     que representa a quantidade produzida. */
  function pdfPrepararLinhas(linhasTexto) {
    var registros = [];
    /* Tolerante a espa\u00E7os que o pdf.js insere entre os blocos do c\u00F3digo
       (ex.: "01.01.02.005 -8" ou "01.01.02.005 - 8"). */
    var codeRe = /^(\d{2}\s*\.?\s*\d{2}\s*\.?\s*\d{2}\s*\.?\s*\d{3}\s*-?\s*\d)/;
    var numRe = /\d{1,3}(?:\.\d{3})+|\d+/;
    var codigoAtual = null;
    var partes = [];

    function reset() { codigoAtual = null; partes = []; }

    function adicionar(codigo, nome, qtd) {
      var bruto = (nome || "").replace(/\s+/g, " ").trim();
      var n = pdfNorm(bruto);
      if (codigo || n) registros.push({ codigo10: codigo, norm: n, nome: bruto, qtd: qtd });
    }

    function fechar(qtd) {
      adicionar(codigoAtual, partes.join(" "), qtd);
      reset();
    }

    linhasTexto.forEach(function (bruto) {
      var t = (bruto || "").replace(/\s+/g, " ").trim();
      if (!t) return;

      var cm = t.match(codeRe);
      if (cm) {
        reset();
        var dig = pdfDigitos(cm[1]);
        codigoAtual = dig.length === 10 ? dig : null;
        var resto = t.slice(cm[0].length).replace(/^\s*-\s*/, "");
        var nm = resto.match(numRe);
        if (nm) {
          partes.push(resto.slice(0, nm.index));
          fechar(parseInt(nm[0].replace(/\./g, ""), 10));
        } else {
          partes.push(resto);
        }
        return;
      }

      var nm2 = t.match(numRe);
      if (nm2) {
        var antes = t.slice(0, nm2.index).trim();
        var qtd = parseInt(nm2[0].replace(/\./g, ""), 10);
        if (codigoAtual || partes.length) {
          if (antes) partes.push(antes);
          fechar(qtd);
        } else {
          adicionar(null, antes, qtd);
        }
      } else {
        partes.push(t);
      }
    });

    return registros;
  }

  function pdfQtdPorCodigo(registros, codFormatado) {
    var d = pdfDigitos(codFormatado);
    var total = 0, achou = false;
    for (var i = 0; i < registros.length; i++) {
      if (registros[i].codigo10 === d && registros[i].qtd !== null && registros[i].qtd !== undefined) {
        total += registros[i].qtd; achou = true;
      }
    }
    return achou ? total : null;
  }

  /* N\u00FAcleo do nome: remove complementos entre par\u00EAnteses
     (ex.: "(por dente)", "(individual por sess\u00E3o)") para casar tamb\u00E9m
     quando o relat\u00F3rio abrevia o nome do procedimento. */
  function pdfNucleo(nome) {
    return pdfNorm(String(nome || "").replace(/\([^)]*\)/g, " "));
  }

  /* Palavras de liga\u00E7\u00E3o ignoradas no casamento por tokens, para que pequenas
     diferen\u00E7as de reda\u00E7\u00E3o do relat\u00F3rio (ex.: "Raspagem alisamento" vs
     "Raspagem e alisamento") n\u00E3o impe\u00E7am o reconhecimento. */
  var PDF_STOP = { e: 1, de: 1, da: 1, do: 1, das: 1, dos: 1, com: 1, ou: 1, por: 1, a: 1, o: 1, sem: 1, em: 1, para: 1, ao: 1, "no": 1, "na": 1 };

  function pdfTokensSig(s) {
    return pdfNorm(s).split(" ").filter(function (t) { return t && t.length > 1 && !PDF_STOP[t]; });
  }

  function pdfTokensSet(norm) {
    var set = {};
    (norm || "").split(" ").forEach(function (t) { if (t) set[t] = 1; });
    return set;
  }

  function pdfQtdPorNome(registros, nomes) {
    var alvos = nomes
      .map(function (n) { return { full: pdfNorm(n), core: pdfNucleo(n), toks: pdfTokensSig(n) }; })
      .filter(function (a) { return a.full; });

    /* Passo 1: o texto lido cont\u00E9m o nome completo do procedimento. */
    for (var i = 0; i < registros.length; i++) {
      var r = registros[i];
      if (!r.norm) continue;
      for (var j = 0; j < alvos.length; j++) {
        if (alvos[j].full && r.norm.indexOf(alvos[j].full) >= 0) return r.qtd;
      }
    }

    /* Passo 2: o relat\u00F3rio abreviou o nome (sem o complemento entre
       par\u00EAnteses). Usa o n\u00FAcleo, exigindo um m\u00EDnimo de caracteres para
       evitar casar com procedimentos parecidos por engano. */
    for (var k = 0; k < registros.length; k++) {
      var rr = registros[k];
      if (!rr.norm) continue;
      for (var m = 0; m < alvos.length; m++) {
        var core = alvos[m].core;
        if (core && core.length >= 8 && rr.norm.indexOf(core) >= 0) return rr.qtd;
      }
    }

    /* Passo 3: todos os tokens significativos do nome esperado est\u00E3o
       presentes no texto lido (em qualquer ordem), tolerando diferen\u00E7as de
       palavras de liga\u00E7\u00E3o e pontua\u00E7\u00E3o. */
    for (var p = 0; p < registros.length; p++) {
      var reg = registros[p];
      if (!reg.norm) continue;
      var rset = pdfTokensSet(reg.norm);
      for (var q = 0; q < alvos.length; q++) {
        var toks = alvos[q].toks;
        if (toks.length < 2) continue;
        var todos = true;
        for (var z = 0; z < toks.length; z++) { if (!rset[toks[z]]) { todos = false; break; } }
        if (todos) return reg.qtd;
      }
    }
    return null;
  }

  function pdfQtdProcedimento(linhas, proc) {
    var q = pdfQtdPorCodigo(linhas, proc.cod);
    if (q === null) q = pdfQtdPorNome(linhas, [proc.nome]);
    return q;
  }

  function pdfFmtCodigo(d) {
    if (!d || d.length !== 10) return d || "";
    return d.slice(0, 2) + "." + d.slice(2, 4) + "." + d.slice(4, 6) + "." + d.slice(6, 9) + "-" + d.slice(9);
  }

  /* Linhas que n\u00E3o s\u00E3o procedimentos (rodap\u00E9s, cabe\u00E7alhos, totais). */
  function pdfEhRodape(norm) {
    if (!norm) return true;
    if (norm === "procedimentos" || norm === "quantidade" || norm === "competencia" || norm === "qtd") return true;
    return /^(total|subtotal|sub total|cds|pagina|relatorio|consolidado)\b/.test(norm);
  }

  /* Agrega os procedimentos lidos no PDF em uma lista \u00DANICA, somando as
     quantidades por c\u00F3digo (ou nome, quando n\u00E3o h\u00E1 c\u00F3digo) e descartando
     rodap\u00E9s/cabe\u00E7alhos. Cada procedimento aparece uma s\u00F3 vez \u2014 \u00E9 a base que
     garante que a contagem nunca ultrapasse o total real do relat\u00F3rio. */
  function pdfAgregarLidos(linhas) {
    var agg = {}, ordem = [];
    linhas.forEach(function (r) {
      if (r.qtd === null || r.qtd === undefined || r.qtd <= 0) return;
      if (pdfEhRodape(r.norm)) return;
      var chave = r.codigo10 || r.norm;
      if (!chave) return;
      if (!agg[chave]) { agg[chave] = { codigo10: r.codigo10 || "", norm: r.norm || "", nome: r.nome || "", qtd: 0, n: 0 }; ordem.push(chave); }
      agg[chave].qtd += r.qtd;
      agg[chave].n += 1;
      if (!agg[chave].nome && r.nome) agg[chave].nome = r.nome;
      if (!agg[chave].norm && r.norm) agg[chave].norm = r.norm;
    });
    return ordem.map(function (k) { return agg[k]; });
  }

  /* Dado um procedimento lido (reg) e uma lista de procedimentos esperados,
     devolve o procedimento da lista que corresponde, ou null. Casa por c\u00F3digo
     e, na falta dele, por nome (completo, n\u00FAcleo sem par\u00EAnteses ou conjunto
     de tokens significativos). */
  function pdfMatchProc(reg, lista) {
    var i, p;
    if (reg.codigo10) {
      for (i = 0; i < lista.length; i++) {
        if (reg.codigo10 === pdfDigitos(lista[i].cod)) return lista[i];
      }
    }
    if (!reg.norm) return null;
    var rset = pdfTokensSet(reg.norm);
    for (i = 0; i < lista.length; i++) {
      p = lista[i];
      var full = pdfNorm(p.nome);
      if (full && reg.norm.indexOf(full) >= 0) return p;
      var core = pdfNucleo(p.nome);
      if (core && core.length >= 8 && reg.norm.indexOf(core) >= 0) return p;
      var toks = pdfTokensSig(p.nome);
      if (toks.length >= 2) {
        var todos = true;
        for (var z = 0; z < toks.length; z++) { if (!rset[toks[z]]) { todos = false; break; } }
        if (todos) return p;
      }
    }
    return null;
  }

  /* Classifica os procedimentos lidos em grupos de um indicador, contando cada
     procedimento UMA \u00DANICA vez (registro-c\u00EAntrico). Como percorre os lidos e
     n\u00E3o a lista esperada, \u00E9 imposs\u00EDvel somar o mesmo registro duas vezes. */
  function pdfClassificar(lidos, grupos) {
    var res = {};
    grupos.forEach(function (g) { res[g.chave] = { itens: [], total: 0 }; });
    lidos.forEach(function (reg) {
      for (var i = 0; i < grupos.length; i++) {
        var p = pdfMatchProc(reg, grupos[i].lista);
        if (p) {
          res[grupos[i].chave].itens.push({ cod: p.cod, nome: p.nome, qtd: reg.qtd });
          res[grupos[i].chave].total += reg.qtd;
          break;
        }
      }
    });
    return res;
  }

  /* Diagn\u00F3stico de leitura: usa a mesma base agregada e separa os
     procedimentos que N\u00C3O foram reconhecidos por nenhuma lista de indicador.
     Funciona tamb\u00E9m em relat\u00F3rios que trazem apenas nomes, sem c\u00F3digo. */
  function pdfDiagnostico(lidos) {
    var TODOS = B5_PREVENTIVOS
      .concat(B5_OUTROS, B6_TRA, B6_OUTROS, B3_EXODONTIAS, B3_PREVENTIVOS, B3_CURATIVOS, [
        { cod: "", nome: "Primeira consulta odontol\u00F3gica program\u00E1tica" },
        { cod: "", nome: "Tratamento odontol\u00F3gico conclu\u00EDdo" },
      ]);

    var naoReconhecidos = [];
    var totalLido = 0, totalReconhecido = 0, temDuplicados = false;

    lidos.forEach(function (reg) {
      if (reg.n > 1) temDuplicados = true;
      totalLido += reg.qtd;
      if (pdfMatchProc(reg, TODOS)) {
        totalReconhecido += reg.qtd;
      } else {
        naoReconhecidos.push({ codigo10: reg.codigo10, nome: reg.nome, qtd: reg.qtd, n: reg.n });
      }
    });

    naoReconhecidos.sort(function (a, b) { return b.qtd - a.qtd; });
    return {
      naoReconhecidos: naoReconhecidos,
      totalLido: totalLido,
      totalReconhecido: totalReconhecido,
      totalNaoReconhecido: totalLido - totalReconhecido,
      temDuplicados: temDuplicados,
    };
  }

  /* ----- Cálculo dos indicadores a partir das linhas ----- */
  function pdfCalcularDados(linhas) {
    var lidos = pdfAgregarLidos(linhas);

    var b5 = pdfClassificar(lidos, [
      { chave: "num", lista: B5_PREVENTIVOS },
      { chave: "out", lista: B5_OUTROS },
    ]);
    var b6 = pdfClassificar(lidos, [
      { chave: "num", lista: B6_TRA },
      { chave: "out", lista: B6_OUTROS },
    ]);
    var b3 = pdfClassificar(lidos, [
      { chave: "exo", lista: B3_EXODONTIAS },
      { chave: "prev", lista: B3_PREVENTIVOS },
      { chave: "cur", lista: B3_CURATIVOS },
    ]);

    return {
      b5: { num: b5.num, out: b5.out },
      b6: { num: b6.num, out: b6.out },
      b3: { exo: b3.exo, prev: b3.prev, cur: b3.cur },
      pcoPrimeiras: pdfQtdPorNome(linhas, ["primeira consulta odontologica programatica", "primeira consulta odontologica"]),
      tocConcluido: pdfQtdPorNome(linhas, ["tratamento odontologico concluido", "tratamento concluido"]),
      diagnostico: pdfDiagnostico(lidos),
    };
  }

  function pdfContarEncontrados(d) {
    var n = d.b5.num.itens.length + d.b5.out.itens.length +
            d.b6.num.itens.length + d.b6.out.itens.length +
            d.b3.exo.itens.length + d.b3.prev.itens.length + d.b3.cur.itens.length;
    if (d.pcoPrimeiras !== null) n++;
    if (d.tocConcluido !== null) n++;
    return n;
  }

  /* ----- Persistência ----- */
  function pdfLerStore() {
    try { var raw = localStorage.getItem(PDF_STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
    catch (e) { return {}; }
  }
  function pdfTentarGravar(store) {
    try { localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(store)); return true; }
    catch (e) { return false; }
  }
  function pdfSalvarComFallback(store, registro) {
    if (pdfTentarGravar(store)) return true;
    if (registro.arquivo) registro.arquivo.dataUrl = null;
    Object.keys(store).forEach(function (u) {
      Object.keys(store[u]).forEach(function (m) {
        var r = store[u][m];
        if (r.arquivo) r.arquivo.dataUrl = null;
        if (r.versoes) r.versoes.forEach(function (v) { if (v.arquivo) v.arquivo.dataUrl = null; });
      });
    });
    return pdfTentarGravar(store);
  }

  /* ----- Interpretação TOC ----- */
  function pdfInterpToc(classId, pct) {
    var arred = pct !== null ? Math.round(pct) : 0;
    if (classId === "otimo") return { tipo: "sucesso", icone: "\u2713", titulo: "\u00D3timo \u2014 tratamentos sendo conclu\u00EDdos", texto: "Cerca de <strong>" + arred + " a cada 100</strong> primeiras consultas resultaram em tratamento conclu\u00EDdo. A equipe est\u00E1 fechando bem os tratamentos iniciados." };
    if (classId === "bom") return { tipo: "info", icone: "\u2192", titulo: "Bom \u2014 perto do ideal", texto: "Cerca de <strong>" + arred + " a cada 100</strong> primeiras consultas evolu\u00EDram para tratamento conclu\u00EDdo. Acompanhe os casos em aberto para passar de 75%." };
    if (classId === "suficiente") return { tipo: "atencao", icone: "!", titulo: "Suficiente \u2014 d\u00E1 para concluir mais", texto: "Apenas cerca de <strong>" + arred + " a cada 100</strong> primeiras consultas viraram tratamento conclu\u00EDdo. Refor\u00E7e o acompanhamento dos tratamentos iniciados." };
    return { tipo: "critico", icone: "\u2716", titulo: "Baixa conclus\u00E3o de tratamentos", texto: "Cerca de <strong>" + arred + " a cada 100</strong> primeiras consultas resultaram em tratamento conclu\u00EDdo. Muitos tratamentos iniciados n\u00E3o est\u00E3o sendo finalizados." };
  }

  /* ----- Render: blocos de procedimentos ----- */
  function pdfBlocoProcs(titulo, itens, total, classe) {
    var li = (itens && itens.length)
      ? itens.map(function (it) {
          var cod = (it.cod && it.cod !== "\u2014") ? '<span class="pdf-proc-cod">' + it.cod + "</span>" : "";
          return '<li><span class="pdf-proc-nome">' + cod + escHtml(it.nome) + '</span><span class="pdf-proc-qtd">' + Number(it.qtd).toLocaleString("pt-BR") + "</span></li>";
        }).join("")
      : '<li class="pdf-procs-vazio">Nenhum procedimento com produ\u00E7\u00E3o no per\u00EDodo.</li>';
    return '<div class="pdf-procs-bloco ' + (classe || "") + '">' +
      '<p class="pdf-procs-bloco-titulo"><span>' + titulo + '</span><span class="pdf-procs-bloco-total">' + Number(total).toLocaleString("pt-BR") + "</span></p>" +
      '<ul class="pdf-procs-lista">' + li + "</ul></div>";
  }

  function pdfMetricasHtml(metricas) {
    if (!metricas || !metricas.length) return "";
    return '<div class="pdf-metricas">' + metricas.map(function (m) {
      return '<div class="pdf-metrica"><span class="pdf-metrica-label">' + m.label + '</span><span class="pdf-metrica-valor">' + m.valor + "</span></div>";
    }).join("") + "</div>";
  }

  function pdfCardResumo(o) {
    var interpHtml = "";
    if (o.interp) {
      interpHtml = '<div class="pdf-card-interp pdf-card-interp--' + o.interp.tipo + '">' +
        '<span class="pdf-card-interp-icone">' + o.interp.icone + "</span>" +
        '<div class="pdf-card-interp-corpo"><p class="pdf-card-interp-titulo">' + o.interp.titulo + '</p><p class="pdf-card-interp-texto">' + o.interp.texto + "</p></div></div>";
    }
    var resultadoHtml = o.pct != null
      ? '<div class="pdf-card-resultado"><span class="pdf-card-pct">' + fmtPct(o.pct) + '</span><span class="pdf-card-badge">' + o.classNome + "</span></div>"
      : "";
    return '<article class="pdf-card" id="' + o.cardId + '" style="--cor: ' + o.cor + '">' +
      '<div class="pdf-card-top"><h4 class="pdf-card-titulo"><span class="pdf-card-num">' + o.num + '.</span>' + o.titulo + "</h4>" +
      resultadoHtml + "</div>" +
      pdfMetricasHtml(o.metricas) +
      interpHtml +
      "</article>";
  }

  function pdfCardCalc(o) {
    var interpHtml = "";
    if (o.interp) {
      interpHtml = '<div class="pdf-card-interp pdf-card-interp--' + o.interp.tipo + '">' +
        '<span class="pdf-card-interp-icone">' + o.interp.icone + "</span>" +
        '<div class="pdf-card-interp-corpo"><p class="pdf-card-interp-titulo">' + o.interp.titulo + '</p><p class="pdf-card-interp-texto">' + o.interp.texto + "</p></div></div>";
    }
    return '<article class="pdf-card" id="' + o.cardId + '" style="--cor: ' + o.cor + '">' +
      '<div class="pdf-card-top"><h4 class="pdf-card-titulo"><span class="pdf-card-num">' + o.num + '.</span>' + o.titulo + "</h4>" +
      '<div class="pdf-card-resultado"><span class="pdf-card-pct">' + (o.valorTexto != null ? o.valorTexto : fmtPct(o.pct)) + '</span><span class="pdf-card-badge">' + o.classNome + "</span></div></div>" +
      (o.blocos && o.blocos.length ? '<div class="pdf-procs-grid">' + o.blocos.join("") + "</div>" : "") +
      interpHtml +
      (o.nota ? '<p class="pdf-card-info">' + o.nota + "</p>" : "") +
      "</article>";
  }

  function pdfCardSemDados(o) {
    return '<article class="pdf-card pdf-card--sem-dados" id="' + o.cardId + '" style="--cor: ' + o.cor + '">' +
      '<div class="pdf-card-top"><h4 class="pdf-card-titulo"><span class="pdf-card-num">' + o.num + '.</span>' + o.titulo + "</h4>" +
      '<div class="pdf-card-resultado"><span class="pdf-card-pct pdf-card-pct--vazio">Sem dados</span></div></div>' +
      '<p class="pdf-card-info pdf-card-info--aviso">' + o.info + "</p></article>";
  }

  function pdfCardInfo(o) {
    return '<article class="pdf-card" id="' + o.cardId + '" style="--cor: ' + o.cor + '">' +
      '<div class="pdf-card-top"><h4 class="pdf-card-titulo"><span class="pdf-card-num">' + o.num + '.</span>' + o.titulo + "</h4></div>" +
      '<div class="pdf-procs-grid">' + o.blocos.join("") + "</div>" +
      '<p class="pdf-card-info">' + o.info + "</p></article>";
  }

  /* ----- Render: banner do período ----- */
  function pdfRenderBanner(registro) {
    var mes = registro.mes, ano = registro.ano;
    var q = PDF_QUADRIMESTRES[pdfQuadrimestreIndice(mes)];
    var pos = pdfPosicaoNoQuadrimestre(mes);
    var arq = "";
    if (registro.arquivo && registro.arquivo.nome) {
      arq = registro.arquivo.dataUrl
        ? '<p class="pdf-banner-arquivo">Arquivo importado: <strong>' + escHtml(registro.arquivo.nome) + '</strong> \u2014 <a href="' + registro.arquivo.dataUrl + '" target="_blank" rel="noopener">abrir PDF</a></p>'
        : '<p class="pdf-banner-arquivo">Arquivo importado: <strong>' + escHtml(registro.arquivo.nome) + "</strong></p>";
    }
    pdfBannerEl.innerHTML =
      '<span class="pdf-banner-tag">\u2713 Relat\u00F3rio processado com sucesso</span>' +
      '<div class="pdf-banner-grid">' +
        '<div class="pdf-banner-item"><span class="pdf-banner-item-label">Compet\u00EAncia</span><span class="pdf-banner-item-valor">' + PDF_MESES[mes - 1] + " de " + ano + "</span></div>" +
        '<div class="pdf-banner-item"><span class="pdf-banner-item-label">Quadrimestre</span><span class="pdf-banner-item-valor">' + q.nome + " (" + q.intervalo + ")</span></div>" +
        '<div class="pdf-banner-item"><span class="pdf-banner-item-label">Posi\u00E7\u00E3o no quadrimestre</span><span class="pdf-banner-item-valor">' + pos + "\u00BA m\u00EAs de 4</span></div>" +
      "</div>" +
      '<p class="pdf-banner-status">' + pdfTextoStatus(pos, q) + "</p>" + arq;
    pdfBannerEl.hidden = false;
  }

  /* ----- Render: resultados (somente procedimentos encontrados) ----- */
  function pdfRenderResultados(registro) {
    var d = registro.dados;
    var cards = [];
    var indice = [];

    if (d.pcoPrimeiras !== null && populacaoAtual > 0) {
      var pcoRes = calcularResultadoMesPco(populacaoAtual, d.pcoPrimeiras);
      var pcoCls = classificacaoPcoPorId(pcoRes.classAtual);
      indice.push({
        id: "pdf-card-1",
        num: "1",
        titulo: "Primeira consulta programada",
        valor: fmtPct(pcoRes.pct),
        classNome: pcoCls.nome,
        cor: pcoCls.cor,
      });
      cards.push(pdfCardResumo({
        cardId: "pdf-card-1",
        num: "1",
        titulo: "Primeira consulta programada",
        cor: pcoCls.cor,
        pct: pcoRes.pct,
        classNome: pcoCls.nome,
        metricas: [
          { label: "Primeiras consultas no m\u00EAs", valor: Number(d.pcoPrimeiras).toLocaleString("pt-BR") },
        ],
      }));
    } else if (d.pcoPrimeiras !== null) {
      indice.push({
        id: "pdf-card-1",
        num: "1",
        titulo: "Primeira consulta programada",
        valor: Number(d.pcoPrimeiras).toLocaleString("pt-BR"),
        classNome: null,
        cor: "#0284c7",
      });
      cards.push(pdfCardResumo({
        cardId: "pdf-card-1",
        num: "1",
        titulo: "Primeira consulta programada",
        cor: "#0284c7",
        metricas: [
          { label: "Primeiras consultas no m\u00EAs", valor: Number(d.pcoPrimeiras).toLocaleString("pt-BR") },
        ],
      }));
    }

    if (d.tocConcluido !== null && d.pcoPrimeiras !== null && d.pcoPrimeiras > 0) {
      var tpct = (d.tocConcluido / d.pcoPrimeiras) * 100;
      var tcid = classificarToc(tpct), tc = classificacaoTocPorId(tcid);
      indice.push({
        id: "pdf-card-2",
        num: "2",
        titulo: "Tratamento odontol\u00F3gico conclu\u00EDdo",
        valor: fmtPct(tpct),
        classNome: tc.nome,
        cor: tc.cor,
      });
      cards.push(pdfCardResumo({
        cardId: "pdf-card-2",
        num: "2",
        titulo: "Tratamento odontol\u00F3gico conclu\u00EDdo",
        cor: tc.cor,
        pct: tpct,
        classNome: tc.nome,
        metricas: [
          { label: "Tratamentos conclu\u00EDdos", valor: Number(d.tocConcluido).toLocaleString("pt-BR") },
          { label: "Primeiras consultas", valor: Number(d.pcoPrimeiras).toLocaleString("pt-BR") },
        ],
        interp: pdfInterpToc(tcid, tpct),
      }));
    }

    (function pdfCardEscovacao() {
      var esc = pdfUnidadeId ? lerEscovacaoStorage()[pdfUnidadeId] : null;
      var classId = resolverClassificacaoEscovacaoLocal(esc);
      if (classId) {
        var ec = escConceitoPorId(classId) || classificacaoPcoPorId(classId);
        indice.push({
          id: "pdf-card-3",
          num: "3",
          titulo: "Escova\u00E7\u00E3o supervisionada",
          valor: ec.nome,
          classNome: ec.nome,
          cor: ec.cor,
        });
        cards.push(pdfCardCalc({
          cardId: "pdf-card-3",
          num: "3",
          titulo: "Escova\u00E7\u00E3o supervisionada",
          cor: ec.cor,
          valorTexto: ec.nome,
          classNome: ec.nome,
          blocos: [],
          nota: "Classifica\u00E7\u00E3o informada em <strong>Indicadores \u2192 Escova\u00E7\u00E3o supervisionada</strong> (conceito do quadrimestre). Este indicador n\u00E3o vem do relat\u00F3rio PDF.",
        }));
      } else {
        indice.push({
          id: "pdf-card-3",
          num: "3",
          titulo: "Escova\u00E7\u00E3o supervisionada",
          valor: "\u2014",
          classNome: null,
          cor: "#64748b",
        });
        cards.push(pdfCardSemDados({
          cardId: "pdf-card-3",
          num: "3",
          titulo: "Escova\u00E7\u00E3o supervisionada",
          cor: "#64748b",
          info: "N\u00E3o h\u00E1 classifica\u00E7\u00E3o informada. Este indicador <strong>n\u00E3o \u00E9 preenchido pelo PDF</strong> \u2014 escolha Regular, Suficiente, Bom ou \u00D3timo em <strong>Indicadores \u2192 Escova\u00E7\u00E3o supervisionada</strong>.",
        }));
      }
    })();

    var b5den = d.b5.num.total + d.b5.out.total;
    if (b5den > 0) {
      var p5 = (d.b5.num.total / b5den) * 100, c5id = classificarB5(p5), c5 = classificacaoB5PorId(c5id);
      indice.push({
        id: "pdf-card-4",
        num: "4",
        titulo: "Procedimentos preventivos",
        valor: fmtPct(p5),
        classNome: c5.nome,
        cor: c5.cor,
      });
      cards.push(pdfCardCalc({
        cardId: "pdf-card-4",
        num: "4", titulo: "Procedimentos individuais preventivos", cor: c5.cor, pct: p5, classNome: c5.nome,
        blocos: [
          pdfBlocoProcs("Numerador \u2014 preventivos", d.b5.num.itens, d.b5.num.total, "pdf-procs-bloco--num"),
          pdfBlocoProcs("Demais individuais (s\u00F3 no denominador)", d.b5.out.itens, d.b5.out.total, ""),
        ],
        interp: interpretacaoB5(c5id, p5, null),
      }));
    }

    var b6den = d.b6.num.total + d.b6.out.total;
    if (b6den > 0) {
      var p6 = (d.b6.num.total / b6den) * 100, c6id = classificarB6(p6), c6 = classificacaoB6PorId(c6id);
      indice.push({
        id: "pdf-card-5",
        num: "5",
        titulo: "TRA/ART",
        valor: fmtPct(p6),
        classNome: c6.nome,
        cor: c6.cor,
      });
      cards.push(pdfCardCalc({
        cardId: "pdf-card-5",
        num: "5", titulo: "Tratamento Restaurador Atraum\u00E1tico (TRA/ART)", cor: c6.cor, pct: p6, classNome: c6.nome,
        blocos: [
          pdfBlocoProcs("Numerador \u2014 TRA/ART", d.b6.num.itens, d.b6.num.total, "pdf-procs-bloco--num"),
          pdfBlocoProcs("Demais restaura\u00E7\u00F5es (denominador)", d.b6.out.itens, d.b6.out.total, ""),
        ],
        interp: interpretacaoB6(c6id, p6),
      }));
    }

    var b3den = d.b3.exo.total + d.b3.prev.total + d.b3.cur.total;
    if (b3den > 0) {
      var p3 = (d.b3.exo.total / b3den) * 100, c3id = classificarB3(p3), c3 = classificacaoB3PorId(c3id);
      indice.push({
        id: "pdf-card-6",
        num: "6",
        titulo: "Taxa de exodontias",
        valor: fmtPct(p3),
        classNome: c3.nome,
        cor: c3.cor,
      });
      cards.push(pdfCardCalc({
        cardId: "pdf-card-6",
        num: "6", titulo: "Taxa de exodontias", cor: c3.cor, pct: p3, classNome: c3.nome,
        blocos: [
          pdfBlocoProcs("Numerador \u2014 exodontias", d.b3.exo.itens, d.b3.exo.total, "pdf-procs-bloco--num"),
          pdfBlocoProcs("Preventivos (denominador)", d.b3.prev.itens, d.b3.prev.total, ""),
          pdfBlocoProcs("Curativos (denominador)", d.b3.cur.itens, d.b3.cur.total, ""),
        ],
        interp: interpretacaoB3(c3id, p3),
      }));
    }

    var base = cards.length
      ? cards.join("")
      : '<p class="pdf-card-info">Nenhum procedimento dos indicadores foi reconhecido neste relat\u00F3rio. Verifique se o arquivo \u00E9 o relat\u00F3rio de produ\u00E7\u00E3o do e-SUS APS.</p>';

    pdfResultadosEl.innerHTML = base;
    pdfRenderIndice(indice);
    pdfBindIndiceCliques();
    pdfTemConteudo = true;
    atualizarSidebarPdf(pdfUnidadeId);
    pdfAtualizarDrawer();
    if (pdfDrawerConteudo) pdfDrawerConteudo.scrollTop = 0;
    pdfBindIndiceScroll();
  }

  function contarMesesImportadosQuad(uid) {
    if (!uid) return 0;
    var info = obterRegistrosQuadPdf(uid);
    var n = 0;
    for (var p = 1; p <= 4; p++) {
      if (info.meses[p]) n++;
    }
    return n;
  }

  function atualizarSidebarPdf(uid) {
    var n = contarMesesImportadosQuad(uid);
    var show = n > 0 || pdfTemConteudo;
    [sidebarPdfBtn, bottomPdfBtn].forEach(function (btn) {
      if (btn) btn.hidden = !show;
    });
    [sidebarPdfBadge, bottomPdfBadge].forEach(function (badge) {
      if (!badge) return;
      if (n > 0) {
        badge.hidden = false;
        badge.textContent = String(n);
      } else {
        badge.hidden = true;
        badge.textContent = "";
      }
    });
  }

  function pdfDrawerTemDados() {
    var temHist = pdfHistoricoEl && !pdfHistoricoEl.hidden && pdfHistoricoEl.innerHTML.trim().length > 0;
    return pdfTemConteudo || temHist;
  }

  function pdfAbrirDrawer(origem) {
    if (!pdfDrawerTemDados()) {
      var sec = document.getElementById("pdf-import");
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (drawers) drawers.simFecharDrawer();
    pdfResultadosVisivel = true;
    pdfAtualizarDrawer();
    if (drawers) drawers.pdfNotificarAberto(origem);
  }

  function pdfFecharDrawer(opts) {
    pdfResultadosVisivel = false;
    pdfUnbindIndiceScroll();
    pdfAtualizarDrawer();
    if (drawers) drawers.pdfNotificarFechado(opts);
  }

  function pdfAtualizarDrawer() {
    if (pdfDrawerRoot) {
      pdfDrawerRoot.hidden = !pdfResultadosVisivel;
      pdfDrawerRoot.classList.toggle("is-aberto", pdfResultadosVisivel);
    }

    var temHist = pdfHistoricoEl && !pdfHistoricoEl.hidden && pdfHistoricoEl.innerHTML.trim().length > 0;
    var temLayout = pdfTemConteudo || temHist;

    if (pdfDrawerLayout) {
      pdfDrawerLayout.hidden = !temLayout;
    }
    if (pdfResultadosEl) {
      pdfResultadosEl.hidden = !pdfTemConteudo;
    }
    if (pdfDrawerVazio) {
      pdfDrawerVazio.hidden = temLayout;
    }

    if (pdfResultadosVisivel && pdfDrawerEhDesktop()) {
      pdfBindIndiceScroll();
    } else {
      pdfUnbindIndiceScroll();
    }

    if (pdfUnidadeId && pdfMesExibido) {
      pdfRenderDrawerNavegacao(pdfUnidadeId, pdfMesExibido);
    }

    if (drawers) drawers.syncDrawerNav();
  }

  drawers = window.IndicaDrawers.create({
    unidadeSelect: unidadeSelect,
    getPopulacao: function () { return populacaoAtual; },
    navIndicadores: navIndicadores,
    bottomIndicadores: bottomIndicadores,
    navSimulador: navSimulador,
    bottomNota: bottomNota,
    sidebarPdfBtn: sidebarPdfBtn,
    bottomPdfBtn: bottomPdfBtn,
    simDrawerRoot: simDrawerRoot,
    simDrawer: simDrawer,
    simDrawerOverlay: simDrawerOverlay,
    simDrawerFechar: simDrawerFechar,
    simDrawerConteudo: simDrawerConteudo,
    ativarIndicador: ativarIndicador,
    getPdfVisivel: function () { return pdfResultadosVisivel; },
    setPdfVisivel: function (v) { pdfResultadosVisivel = v; },
    pdfAtualizarDrawer: pdfAtualizarDrawer,
    pdfFecharDrawer: pdfFecharDrawer,
    pdfDrawer: pdfDrawer,
  });
  drawers.registrarEventos();

  /* ----- Navegação do drawer (competência + chips) ----- */
  function pdfRenderDrawerNavegacao(uid, mesCalendario) {
    if (!uid || !mesCalendario) {
      if (pdfDrawerCompetencia) pdfDrawerCompetencia.hidden = true;
      if (pdfDrawerMeses) {
        pdfDrawerMeses.hidden = true;
        pdfDrawerMeses.innerHTML = "";
      }
      return;
    }

    pdfMesExibido = mesCalendario;
    var pacote = obterRegistrosQuadPdf(uid);
    var reg = (pdfLerStore()[uid] || {})[mesCalendario];

    if (pdfDrawerCompetencia) {
      if (reg) {
        var pos = pdfPosicaoNoQuadrimestre(mesCalendario);
        pdfDrawerCompetencia.textContent =
          PDF_MESES[mesCalendario - 1] + " de " + reg.ano + " \u00B7 " + pos + "\u00BA m\u00EAs do quadrimestre";
        pdfDrawerCompetencia.hidden = false;
      } else {
        pdfDrawerCompetencia.hidden = true;
      }
    }

    if (!pdfDrawerMeses) return;

    if (!pacote.quad) {
      pdfDrawerMeses.hidden = true;
      pdfDrawerMeses.innerHTML = "";
      return;
    }

    var html = "";
    for (var pos = 1; pos <= 4; pos++) {
      var regPos = pacote.meses[pos];
      var ativo = !!(regPos && regPos.mes === mesCalendario);
      var chipClass = "pdf-drawer-mes-chip";
      if (ativo) chipClass += " is-active";
      if (regPos) chipClass += " is-preenchido";
      else chipClass += " is-vazio";

      if (regPos) {
        html += '<button type="button" class="' + chipClass + '" data-mes-cal="' + regPos.mes + '" aria-pressed="' + (ativo ? "true" : "false") + '">';
        html += '  <span class="pdf-drawer-mes-chip-label">' + QUAD_MESES_LABEL[pos - 1] + "</span>";
        html += '  <span class="pdf-drawer-mes-chip-comp">' + PDF_MESES[regPos.mes - 1] + " de " + regPos.ano + "</span>";
        html += "</button>";
      } else {
        html += '<span class="' + chipClass + '" aria-disabled="true">';
        html += '  <span class="pdf-drawer-mes-chip-label">' + QUAD_MESES_LABEL[pos - 1] + "</span>";
        html += '  <span class="pdf-drawer-mes-chip-comp">Sem importa\u00E7\u00E3o</span>';
        html += "</span>";
      }
    }

    pdfDrawerMeses.innerHTML = html;
    pdfDrawerMeses.hidden = false;

    pdfDrawerMeses.querySelectorAll("button[data-mes-cal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cal = Number(btn.dataset.mesCal);
        var r = (pdfLerStore()[uid] || {})[cal];
        if (r) pdfAplicarRegistro(uid, cal, r, false);
      });
    });
  }

  /* ----- Render: histórico do quadrimestre ----- */
  function pdfRenderHistorico(uid, mesRef) {
    var q = PDF_QUADRIMESTRES[pdfQuadrimestreIndice(mesRef)];
    var dadosUni = pdfLerStore()[uid] || {};
    var anoRef = dadosUni[mesRef] ? dadosUni[mesRef].ano : (pdfAnoInput.value || new Date().getFullYear());
    var rows = q.meses.map(function (m) {
      var reg = dadosUni[m];
      var status = reg
        ? '<span class="pdf-hist-status pdf-hist-status--ok">Processado</span>'
        : '<span class="pdf-hist-status pdf-hist-status--aguardando">Aguardando importa\u00E7\u00E3o</span>';
      var comp = reg ? PDF_MESES[m - 1] + " de " + reg.ano : PDF_MESES[m - 1];
      var quando = reg ? new Date(reg.importadoEm).toLocaleString("pt-BR") : "\u2014";
      var arq = reg && reg.arquivo && reg.arquivo.nome ? escHtml(reg.arquivo.nome) : "\u2014";
      return "<tr" + (m === mesRef ? ' class="is-atual"' : "") + "><td><strong>" + pdfPosicaoNoQuadrimestre(m) + "\u00BA</strong></td><td>" + comp + "</td><td>" + status + "</td><td>" + quando + "</td><td class=\"pdf-hist-arquivo\">" + arq + "</td></tr>";
    }).join("");

    pdfHistoricoEl.innerHTML =
      '<h3 class="pdf-historico-titulo">Hist\u00F3rico do ' + q.nome + " de " + anoRef + "</h3>" +
      '<p class="pdf-historico-sub">Registro dos relat\u00F3rios importados neste quadrimestre. Use os meses acima para alternar a visualiza\u00E7\u00E3o.</p>' +
      '<div class="tabela-wrap"><table class="pdf-historico-tabela"><thead><tr><th>M\u00EAs</th><th>Compet\u00EAncia</th><th>Status</th><th>Importado em</th><th>Arquivo</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
    pdfHistoricoEl.hidden = false;
    if (pdfHistoricoDetalhe) pdfHistoricoDetalhe.hidden = false;

    atualizarSidebarPdf(uid);
    if (pdfResultadosVisivel) pdfAtualizarDrawer();
  }

  /* ----- Preenchimento automático dos formulários existentes ----- */
  function pdfPreencherInputs(itens, prefixo) {
    itens.forEach(function (it) {
      var el = document.getElementById(prefixo + "-" + pdfDigitos(it.cod));
      if (el) el.value = it.qtd;
    });
  }

  function pdfPreencherFormularios(registro) {
    var d = registro.dados;

    document.querySelectorAll(".b5-item-input").forEach(function (i) { i.value = ""; });
    document.querySelectorAll(".b6-item-input").forEach(function (i) { i.value = ""; });

    pdfPreencherInputs(d.b5.num.itens.concat(d.b5.out.itens), "b5");
    if (typeof aplicarFiltroB5 === "function") aplicarFiltroB5();
    if (typeof atualizarResultadoLiveB5 === "function") atualizarResultadoLiveB5();
    else if (typeof renderizarMetasB5 === "function") renderizarMetasB5();

    pdfPreencherInputs(d.b6.num.itens.concat(d.b6.out.itens), "b6");
    if (typeof aplicarFiltroB6 === "function") aplicarFiltroB6();
    if (typeof atualizarResultadoLiveB6 === "function") atualizarResultadoLiveB6();
    else if (typeof renderizarMetasB6 === "function") renderizarMetasB6();

    var b3exo = document.getElementById("b3-exo");
    var b3prev = document.getElementById("b3-prev");
    var b3cur = document.getElementById("b3-cur");
    if (b3exo) b3exo.value = d.b3.exo.total || "";
    if (b3prev) b3prev.value = d.b3.prev.total || "";
    if (b3cur) b3cur.value = d.b3.cur.total || "";
    if (typeof atualizarResultadoLiveB3 === "function") atualizarResultadoLiveB3();
    else if (typeof renderizarMetasB3 === "function") renderizarMetasB3();

    var pos = pdfPosicaoNoQuadrimestre(registro.mes);
    var erroQuad = null;

    if (pcoUnidadeId && d.pcoPrimeiras !== null && typeof salvarMesPco === "function") {
      var resPco = salvarMesPco(pos, d.pcoPrimeiras, registro.mes, registro.ano);
      if (resPco && !resPco.ok) erroQuad = resPco.mensagem;
      else {
        pcoMesAtual = pos;
        if (typeof atualizarPainelPco === "function") atualizarPainelPco();
      }
    }

    if (!erroQuad && tocUnidadeId && d.tocConcluido !== null && d.pcoPrimeiras !== null &&
        typeof salvarMesToc === "function") {
      var resToc = salvarMesToc(pos, d.pcoPrimeiras, d.tocConcluido, registro.mes, registro.ano);
      if (resToc && !resToc.ok) erroQuad = resToc.mensagem;
      else if (typeof atualizarPainelToc === "function") atualizarPainelToc();
    }

    if (erroQuad) {
      pdfStatus(erroQuad, "erro");
      return false;
    }
    return true;
  }

  /* ----- Aplica um registro (preenche + renderiza) ----- */
  function pdfAplicarRegistro(uid, mes, registro, scroll) {
    if (!pdfPreencherFormularios(registro)) return;
    pdfMesExibido = mes;
    pdfRenderBanner(registro);
    pdfRenderResultados(registro);
    pdfRenderHistorico(uid, mes);
    pdfRenderDrawerNavegacao(uid, mes);
    pdfAtualizarMesesDisponiveis(uid);
    var pos = pdfPosicaoNoQuadrimestre(mes);
    if (quadUnidadeId === uid || !quadUnidadeId) {
      b5MesAtual = pos;
      b6MesAtual = pos;
      b3MesAtual = pos;
      atualizarPaineisQuadB456(uid);
    }
    if (scroll && pdfBannerEl) pdfBannerEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (drawers) drawers.simAtualizarSeAberto();
  }

  /* ----- Status / botão ----- */
  function pdfStatus(msg, tipo) {
    if (!pdfStatusEl) return;
    pdfStatusEl.innerHTML = msg;
    pdfStatusEl.className = "pdf-status pdf-status--" + (tipo || "info");
    pdfStatusEl.hidden = false;
  }
  function pdfAtualizarBotaoProcessar() {
    if (!pdfBtnProcessar) return;
    pdfBtnProcessar.textContent = "Processar relat\u00F3rio";
    var temArquivo = pdfFileInput && pdfFileInput.files && pdfFileInput.files.length > 0;
    var temMes = pdfMesSel && pdfMesSel.value;
    pdfBtnProcessar.disabled = !temArquivo || !temMes || populacaoAtual <= 0 || !pdfUnidadeId;
  }

  function pdfResetarArquivoImportacao(mensagem) {
    pdfPendente = null;
    pdfArquivoCompetencia = null;
    if (pdfFileInput) pdfFileInput.value = "";
    if (pdfConflitoEl) { pdfConflitoEl.hidden = true; pdfConflitoEl.innerHTML = ""; }
    if (mensagem) pdfStatus(mensagem, "info");
    pdfAtualizarBotaoProcessar();
  }

  function pdfRegistrarArquivoSelecionado() {
    var mes = Number(pdfMesSel && pdfMesSel.value);
    var ano = Number(pdfAnoInput && pdfAnoInput.value) || new Date().getFullYear();
    if (pdfFileInput && pdfFileInput.files && pdfFileInput.files[0] && mes) {
      pdfArquivoCompetencia = { mes: mes, ano: ano };
    } else {
      pdfArquivoCompetencia = null;
    }
    pdfAtualizarBotaoProcessar();
  }

  function pdfBtnOcupado() {
    if (pdfBtnProcessar) {
      pdfBtnProcessar.disabled = true;
      pdfBtnProcessar.textContent = "Processando...";
    }
  }

  function pdfBtnReset() {
    pdfAtualizarBotaoProcessar();
  }

  /* ----- Conflito de competência ----- */
  function pdfMostrarConflito(mes, ano) {
    if (!pdfConflitoEl) return;
    pdfConflitoEl.innerHTML =
      '<p class="pdf-conflito-texto">J\u00E1 existem dados importados para <strong>' + PDF_MESES[mes - 1] + " de " + ano + "</strong>. O que deseja fazer?</p>" +
      '<div class="pdf-conflito-acoes">' +
        '<button type="button" class="pdf-conflito-btn pdf-conflito-btn--prim" data-modo="substituir">Substituir os dados</button>' +
        '<button type="button" class="pdf-conflito-btn" data-modo="manter">Manter os dados atuais</button>' +
        '<button type="button" class="pdf-conflito-btn" data-modo="nova">Criar nova vers\u00E3o</button>' +
      "</div>";
    pdfConflitoEl.hidden = false;
    pdfConflitoEl.querySelectorAll(".pdf-conflito-btn").forEach(function (b) {
      b.addEventListener("click", function () { pdfFinalizar(b.dataset.modo); });
    });
  }

  /* ----- Finalização (salva e aplica) ----- */
  function pdfFinalizar(modo) {
    var uid = pdfUnidadeId, p = pdfPendente;
    if (!p) return;
    var store = pdfLerStore();
    if (!store[uid]) store[uid] = {};
    var existente = store[uid][p.mes];

    if (pdfConflitoEl) { pdfConflitoEl.hidden = true; pdfConflitoEl.innerHTML = ""; }

    var valQuad = pdfValidarImportacao(uid, p.mes, p.ano);
    if (!valQuad.ok) {
      pdfStatus(valQuad.mensagem, "erro");
      pdfPendente = null;
      pdfBtnReset();
      return;
    }

    if (modo === "manter" && existente) {
      pdfAplicarRegistro(uid, p.mes, existente, true);
      pdfStatus("Mantidos os dados j\u00E1 registrados para " + PDF_MESES[p.mes - 1] + " de " + existente.ano + ". Nada foi alterado.", "info");
      pdfPendente = null; pdfBtnReset(); return;
    }

    var registro = {
      ano: p.ano, mes: p.mes, importadoEm: new Date().toISOString(),
      populacao: p.populacao, dados: p.dados, arquivo: p.arquivo, versoes: [],
    };

    if (modo === "nova" && existente) {
      var versoes = (existente.versoes || []).slice();
      var copia = Object.assign({}, existente); delete copia.versoes;
      versoes.push(copia);
      registro.versoes = versoes;
    }

    store[uid][p.mes] = registro;
    pdfSalvarComFallback(store, registro);
    pdfAplicarRegistro(uid, p.mes, registro, true);

    var msg = modo === "substituir"
      ? "Dados de " + PDF_MESES[p.mes - 1] + " de " + p.ano + " substitu\u00EDdos com sucesso."
      : modo === "nova"
        ? "Nova vers\u00E3o do relat\u00F3rio de " + PDF_MESES[p.mes - 1] + " de " + p.ano + " registrada."
        : "Relat\u00F3rio de " + PDF_MESES[p.mes - 1] + " de " + p.ano + " processado e salvo com sucesso.";
    pdfStatus(msg, "sucesso");
    pdfPendente = null; pdfBtnReset();
    atualizarQuadResetBar(uid);
  }

  /* ----- Processamento (clique no botão) ----- */
  async function pdfProcessar() {
    if (populacaoAtual <= 0 || !pdfUnidadeId) {
      pdfStatus("Selecione uma unidade antes de importar o relat\u00F3rio.", "erro"); return;
    }
    var mes = Number(pdfMesSel.value);
    if (!mes) { pdfStatus("Selecione o m\u00EAs de refer\u00EAncia do relat\u00F3rio.", "erro"); return; }

    var ano = Number(pdfAnoInput.value);
    if (!ano || ano < 2020 || ano > 2099) { ano = new Date().getFullYear(); pdfAnoInput.value = ano; }

    var file = pdfFileInput.files && pdfFileInput.files[0];
    if (!file) { pdfStatus("Selecione o arquivo PDF do relat\u00F3rio.", "erro"); return; }

    if (!pdfArquivoCompetencia || pdfArquivoCompetencia.mes !== mes || pdfArquivoCompetencia.ano !== ano) {
      pdfStatus(
        "O arquivo selecionado n\u00E3o corresponde \u00E0 compet\u00EAncia de <strong>" + PDF_MESES[mes - 1] + " de " + ano + "</strong>. Selecione o PDF deste m\u00EAs.",
        "erro"
      );
      pdfResetarArquivoImportacao(null);
      return;
    }

    if (!window.pdfjsLib) { pdfStatus("A biblioteca de leitura de PDF n\u00E3o carregou. Verifique sua conex\u00E3o e recarregue a p\u00E1gina.", "erro"); return; }

    if (pdfConflitoEl) { pdfConflitoEl.hidden = true; pdfConflitoEl.innerHTML = ""; }
    pdfBtnOcupado();
    pdfStatus("Lendo e interpretando o relat\u00F3rio...", "carregando");

    try {
      var arrayBuffer = await pdfLerArquivo(file, "array");
      var linhas = pdfPrepararLinhas(await pdfExtrairLinhas(arrayBuffer));
      var dados = pdfCalcularDados(linhas);

      if (pdfContarEncontrados(dados) === 0) {
        pdfStatus("N\u00E3o foi poss\u00EDvel reconhecer procedimentos neste PDF. Confirme se \u00E9 o relat\u00F3rio de produ\u00E7\u00E3o do e-SUS APS (com nomes/c\u00F3digos dos procedimentos).", "erro");
        pdfBtnReset(); return;
      }

      var valQuad = pdfValidarImportacao(pdfUnidadeId, mes, ano);
      if (!valQuad.ok) {
        pdfStatus(valQuad.mensagem, "erro");
        pdfBtnReset();
        return;
      }

      var dataUrl = null;
      try { if (file.size <= 1.5 * 1024 * 1024) dataUrl = await pdfLerArquivo(file, "dataurl"); } catch (e) { dataUrl = null; }

      pdfPendente = {
        mes: mes, ano: ano, dados: dados, populacao: populacaoAtual,
        arquivo: { nome: file.name, tamanho: file.size, dataUrl: dataUrl },
      };

      var existente = (pdfLerStore()[pdfUnidadeId] || {})[mes];
      if (existente) {
        pdfStatus("J\u00E1 existe um relat\u00F3rio importado para esta compet\u00EAncia. Escolha como prosseguir abaixo.", "info");
        pdfMostrarConflito(mes, ano);
        pdfBtnReset();
        return;
      }

      pdfFinalizar("novo");
    } catch (err) {
      pdfStatus("Ocorreu um erro ao ler o PDF: " + (err && err.message ? err.message : "arquivo inv\u00E1lido ou protegido."), "erro");
      pdfBtnReset();
    }
  }

  /* ----- Inicialização para a unidade ----- */
  function pdfIniciar(uid) {
    pdfFecharDrawer();
    pdfUnidadeId = uid;
    pdfPendente = null;
    if (pdfAnoInput && !pdfAnoInput.value) pdfAnoInput.value = new Date().getFullYear();
    if (pdfConflitoEl) { pdfConflitoEl.hidden = true; pdfConflitoEl.innerHTML = ""; }
    if (pdfStatusEl) pdfStatusEl.hidden = true;

    var dadosUni = pdfLerStore()[uid] || {};
    var meses = Object.keys(dadosUni).map(Number).filter(function (m) { return m >= 1 && m <= 12; }).sort(function (a, b) { return a - b; });

    if (meses.length) {
      var ultimo = meses[meses.length - 1];
      if (pdfMesSel) pdfMesSel.value = String(ultimo);
      pdfAplicarRegistro(uid, ultimo, dadosUni[ultimo], false);
    } else {
      if (pdfBannerEl) { pdfBannerEl.hidden = true; pdfBannerEl.innerHTML = ""; }
      pdfTemConteudo = false;
      if (pdfResultadosEl) { pdfResultadosEl.hidden = true; pdfResultadosEl.innerHTML = ""; }
      if (pdfHistoricoEl) { pdfHistoricoEl.hidden = true; pdfHistoricoEl.innerHTML = ""; }
      if (pdfHistoricoDetalhe) pdfHistoricoDetalhe.hidden = true;
      pdfLimparIndice();
      atualizarSidebarPdf(uid);
      iniciarQuadPainelsParaUnidade(uid);
    }

    pdfAtualizarMesesDisponiveis(uid);
    atualizarQuadResetBar(uid);
    pdfAtualizarBotaoProcessar();
  }

  function pdfLimparUnidade(uid) {
    var store = pdfLerStore();
    if (!store[uid]) return false;
    delete store[uid];
    pdfTentarGravar(store);
    return true;
  }

  function pdfLimparInterface() {
    pdfPendente = null;
    pdfArquivoCompetencia = null;
    pdfResultadosVisivel = false;
    pdfTemConteudo = false;
    pdfMesExibido = null;
    if (pdfFileInput) pdfFileInput.value = "";
    if (pdfStatusEl) pdfStatusEl.hidden = true;
    if (pdfConflitoEl) { pdfConflitoEl.hidden = true; pdfConflitoEl.innerHTML = ""; }
    if (pdfBannerEl) { pdfBannerEl.hidden = true; pdfBannerEl.innerHTML = ""; }
    if (pdfResultadosEl) { pdfResultadosEl.hidden = true; pdfResultadosEl.innerHTML = ""; }
    if (pdfHistoricoEl) { pdfHistoricoEl.hidden = true; pdfHistoricoEl.innerHTML = ""; }
    if (pdfHistoricoDetalhe) pdfHistoricoDetalhe.hidden = true;
    pdfLimparIndice();
    pdfUnbindIndiceScroll();
    if (pdfDrawerCompetencia) pdfDrawerCompetencia.hidden = true;
    if (pdfDrawerMeses) { pdfDrawerMeses.hidden = true; pdfDrawerMeses.innerHTML = ""; }
    if (pdfMesSel) pdfMesSel.value = "";
    pdfAtualizarDrawer();
    atualizarSidebarPdf(pdfUnidadeId);
    pdfAtualizarBotaoProcessar();
  }

  function atualizarQuadResetBar(uid) {
    if (!quadResetBar || !quadResetPeriodo) return;
    if (!uid || populacaoAtual <= 0) {
      quadResetBar.hidden = true;
      return;
    }

    quadResetBar.hidden = false;
    var quad = pdfDetectarQuadAtivo(uid);
    if (quad && QUADRIMESTRES[quad.indice]) {
      var q = QUADRIMESTRES[quad.indice];
      quadResetPeriodo.textContent = q.nome + " de " + quad.ano + " \u00B7 " + q.intervalo;
    } else {
      quadResetPeriodo.textContent = "Nenhum m\u00EAs importado ainda. Use os relat\u00F3rios PDF do mesmo quadrimestre.";
    }
  }

  function reiniciarQuadrimestreCompleto() {
    var uid = pdfUnidadeId || pcoUnidadeId || tocUnidadeId;
    if (!uid || populacaoAtual <= 0) return;

    var msg = "Reiniciar o quadrimestre desta unidade?\n\nSer\u00E3o apagados:\n" +
      "\u2022 Todos os PDFs importados\n" +
      "\u2022 Dados dos 6 indicadores (1\u00AA consulta, tratamento conclu\u00EDdo, escova\u00E7\u00E3o, preventivos, ART e exodontias)\n\n" +
      "Esta a\u00E7\u00E3o n\u00E3o pode ser desfeita.";

    if (!window.confirm(msg)) return;

    reiniciarQuadrimestrePco(uid);
    reiniciarQuadrimestreToc(uid);
    pdfLimparUnidade(uid);
    limparFormulariosIndicadores();
    if (typeof limparEscovacaoUnidade === "function") limparEscovacaoUnidade(uid);

    pcoMesAtual = 1;
    tocMesAtual = 1;
    pcoMesEditando = null;
    tocMesEditando = null;
    limparQuadResumosB456();

    if (pcoUnidadeId === uid) {
      atualizarPainelPco();
      if (pcoResultado) { pcoResultado.hidden = true; pcoResultado.innerHTML = ""; }
    }

    if (tocUnidadeId === uid) {
      atualizarPainelToc();
      if (tocResumo) { tocResumo.hidden = true; tocResumo.innerHTML = ""; }
    }

    pdfLimparInterface();
    pdfAtualizarMesesDisponiveis(uid);
    atualizarQuadResetBar(uid);
    pdfStatus("Quadrimestre reiniciado. Importe os relat\u00F3rios do novo per\u00EDodo.", "sucesso");
  }

  if (btnReiniciarQuadrimestre) {
    btnReiniciarQuadrimestre.addEventListener("click", reiniciarQuadrimestreCompleto);
  }

  if (pdfBtnProcessar) pdfBtnProcessar.addEventListener("click", pdfProcessar);
  if (pdfFileInput) {
    pdfFileInput.addEventListener("change", pdfRegistrarArquivoSelecionado);
  }
  if (pdfAnoInput) {
    pdfAnoInput.addEventListener("change", function () {
      var mes = Number(pdfMesSel && pdfMesSel.value);
      var ano = Number(pdfAnoInput.value);
      var msg = mes && ano
        ? "Ano alterado. Selecione o PDF de <strong>" + PDF_MESES[mes - 1] + " de " + ano + "</strong>."
        : "Ano alterado. Selecione o PDF correspondente a esta compet\u00EAncia.";
      pdfResetarArquivoImportacao(msg);
    });
  }
  if (sidebarPdfBtn) {
    sidebarPdfBtn.addEventListener("click", function (e) {
      if (pdfResultadosVisivel) pdfFecharDrawer();
      else pdfAbrirDrawer(e.currentTarget);
    });
  }
  if (bottomPdfBtn) {
    bottomPdfBtn.addEventListener("click", function (e) {
      if (pdfResultadosVisivel) pdfFecharDrawer();
      else pdfAbrirDrawer(e.currentTarget);
    });
  }
  if (pdfDrawerFechar) pdfDrawerFechar.addEventListener("click", pdfFecharDrawer);
  if (pdfDrawerOverlay) pdfDrawerOverlay.addEventListener("click", pdfFecharDrawer);
  if (pdfMesSel) {
    pdfMesSel.addEventListener("change", function () {
      var m = Number(pdfMesSel.value);
      if (m) {
        pdfResetarArquivoImportacao(
          "Compet\u00EAncia alterada. Selecione o PDF do relat\u00F3rio de <strong>" + PDF_MESES[m - 1] + "</strong>."
        );
      } else {
        pdfResetarArquivoImportacao(null);
      }
      if (m && pdfUnidadeId) pdfRenderHistorico(pdfUnidadeId, m);
    });
  }

  if (location.hash === "#indicadores" && unidadeSelect.value) {
    entrarNoApp();
  } else if (location.hash === "#indicadores") {
    history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  window.addEventListener("hashchange", function () {
    if (location.hash !== "#indicadores") return;
    if (document.body.classList.contains("modo-app")) return;
    if (unidadeSelect.value) {
      entrarNoApp();
      return;
    }
    history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo({ top: 0, behavior: "auto" });
  });

  pdfAtualizarBotaoProcessar();

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
