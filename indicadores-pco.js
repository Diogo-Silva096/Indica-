/**
 * Indicador 1 — Primeira Consulta Odontológica Programada (PCO).
 * Instalado por indicadores.js via IndicaPco.install(env).
 * Passo 3 da organização do código: extrair o bloco PCO do arquivo monolítico.
 */
(function (global) {
  "use strict";

  function install(env) {
    env = env || {};

    var ESB = env.ESB || window.IndicaNotaESB;
    var PCO_STORAGE_KEY = env.PCO_STORAGE_KEY || (ESB && ESB.PCO_STORAGE_KEY) || "indicaPlus_pco_v1";
    var QUAD_MESES_LABEL = env.QUAD_MESES_LABEL || ["1\u00BA m\u00EAs", "2\u00BA m\u00EAs", "3\u00BA m\u00EAs", "4\u00BA m\u00EAs"];

    var fmtPct = env.fmtPct || function (v) { return String(v); };
    var plural = env.plural || function (q, um, muitos) { return q === 1 ? "1 " + um : q + " " + muitos; };
    var attrStyleCor = env.attrStyleCor || function () { return ""; };
    var montarEscalaFaixas = env.montarEscalaFaixas || function () { return ""; };
    var resolverCompetenciaSalvar = env.resolverCompetenciaSalvar;
    var focarInputMesCard = env.focarInputMesCard;
    var lerTocStorage = env.lerTocStorage || function () { return {}; };

    function getPopulacaoAtual() {
      return typeof env.getPopulacaoAtual === "function" ? env.getPopulacaoAtual() : 0;
    }

    function getDrawers() {
      return typeof env.getDrawers === "function" ? env.getDrawers() : null;
    }

    function atualizarQuadResetBar(uid) {
      if (typeof env.atualizarQuadResetBar === "function") env.atualizarQuadResetBar(uid);
    }

    function aposSalvarPco(mes, primeiras) {
      if (typeof env.aposSalvarPco === "function") env.aposSalvarPco(mes, primeiras);
    }

    /* Regras de faixa: única fonte = simulador-core (IndicaNotaESB). */
    var CLASSIFICACOES = (ESB && ESB.CLASSIFICACOES && ESB.CLASSIFICACOES.proporcao) || [];
    var escalaPco = (ESB && ESB.ESCALAS_UI && ESB.ESCALAS_UI.proporcao) || { max: 2, ticks: [], zonas: [] };
    var PCO_ESCALA_MAX = escalaPco.max;
    var PCO_ESCALA_ZONAS = escalaPco.zonas;
    var PCO_ESCALA_TICKS = escalaPco.ticks || [0.25, 0.75, 1.25];

    var PCO_MESES_LABEL = QUAD_MESES_LABEL;

    var pcoMesAtual = 1;
    var pcoUnidadeId = "";
    var pcoMesEditando = null;

    var pcoResultado = document.getElementById("pco-resultado");
    var pcoMetas = document.getElementById("pco-metas");
    var pcoMesesGrid = document.getElementById("pco-meses-grid");

    function classificarPco(pct) {
      return ESB && typeof ESB.classificarPco === "function" ? ESB.classificarPco(pct) : "regular";
    }

    function classificacaoPcoPorId(id) {
      if (ESB && typeof ESB.classificacaoPorId === "function") {
        return ESB.classificacaoPorId("proporcao", id) || CLASSIFICACOES[0] || null;
      }
      return CLASSIFICACOES[0] || null;
    }

    function metasMensaisPco(pop) {
      if (ESB && typeof ESB.metasMensaisPco === "function") return ESB.metasMensaisPco(pop);
      return {
        regular: Math.ceil(pop * 0.0025),
        suficiente: Math.ceil(pop * 0.0075),
        bom: Math.ceil(pop * 0.0125),
        otimo: Math.ceil(pop * 0.0125) + 1,
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

      var comp = typeof resolverCompetenciaSalvar === "function"
        ? resolverCompetenciaSalvar(pcoUnidadeId, mes)
        : { mes: null, ano: null };
      var res = salvarMesPco(mes, val, comp.mes, comp.ano);
      if (!res.ok) {
        window.alert(
          (ESB && ESB.mensagemParaAlerta)
            ? ESB.mensagemParaAlerta(res.mensagem)
            : String(res.mensagem || "").replace(/<[^>]+>/g, "")
        );
        return;
      }

      pcoMesEditando = null;
      pcoMesAtual = mes;
      atualizarPainelPco();
      atualizarQuadResetBar(pcoUnidadeId);
      if (typeof aposSalvarPco === "function") aposSalvarPco(mes, val);
      var drawers = getDrawers();
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
          renderizarPcoMesesGrid(obterPcoMesesUnidade(pcoUnidadeId), getPopulacaoAtual());
          selecionarMesPco(mes);
          if (typeof focarInputMesCard === "function") focarInputMesCard(pcoMesesGrid, mes);
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

    function renderizarPcoResultado(pop, primeiras) {
      if (!pcoResultado || pop <= 0) return;

      var d = calcularResultadoMesPco(pop, primeiras);
      var atual = classificacaoPcoPorId(d.classAtual);

      pcoResultado.innerHTML = montarEscalaFaixas({
        pct: d.pct,
        atual: atual,
        max: PCO_ESCALA_MAX,
        zonas: PCO_ESCALA_ZONAS,
        ticks: PCO_ESCALA_TICKS,
        fmtTick: fmtPct,
      });
      pcoResultado.hidden = false;

      renderizarPcoMetas(d);
    }

    function renderizarPcoMetas(d) {
      if (!pcoMetas) return;

      var html = "";
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

      pcoMetas.innerHTML = html;
      pcoMetas.hidden = false;
    }

    function selecionarMesPco(mes) {
      if (mes !== pcoMesEditando && pcoMesEditando !== null) pcoMesEditando = null;
      pcoMesAtual = mes;
      var meses = obterPcoMesesUnidade(pcoUnidadeId);
      var registro = meses[mes];
      var populacaoAtual = getPopulacaoAtual();

      renderizarPcoMesesGrid(meses, populacaoAtual);

      if (registro && populacaoAtual > 0) {
        renderizarPcoResultado(populacaoAtual, registro.primeiras);
      } else {
        if (pcoResultado) {
          pcoResultado.hidden = true;
          pcoResultado.innerHTML = "";
        }
        if (pcoMetas) {
          pcoMetas.hidden = true;
          pcoMetas.innerHTML = "";
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

    return {
      pcoResultado: pcoResultado,
      classificarPco: classificarPco,
      classificacaoPcoPorId: classificacaoPcoPorId,
      calcularResultadoMesPco: calcularResultadoMesPco,
      lerPcoStorage: lerPcoStorage,
      obterPcoMesesUnidade: obterPcoMesesUnidade,
      salvarMesPco: salvarMesPco,
      excluirMesPco: excluirMesPco,
      reiniciarQuadrimestrePco: reiniciarQuadrimestrePco,
      atualizarPainelPco: atualizarPainelPco,
      iniciarPcoParaUnidade: iniciarPcoParaUnidade,
      getUnidadeId: function () { return pcoUnidadeId; },
      setUnidadeId: function (v) { pcoUnidadeId = v || ""; },
      getMesAtual: function () { return pcoMesAtual; },
      setMesAtual: function (v) { pcoMesAtual = v; },
      getMesEditando: function () { return pcoMesEditando; },
      setMesEditando: function (v) { pcoMesEditando = v; },
    };
  }

  global.IndicaPco = { install: install };
})(typeof window !== "undefined" ? window : global);
