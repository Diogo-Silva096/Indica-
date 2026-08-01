/**
 * Indicador 2 — Tratamento Odontológico Concluído (TOC).
 * Instalado por indicadores.js via IndicaToc.install(env).
 * Passo 4 da organização do código: extrair o bloco TOC do arquivo monolítico.
 */
(function (global) {
  "use strict";

  function install(env) {
    env = env || {};

    var ESB = env.ESB || window.IndicaNotaESB;
    var TOC_STORAGE_KEY = env.TOC_STORAGE_KEY || (ESB && ESB.TOC_STORAGE_KEY) || "indicaPlus_toc_v1";
    var QUAD_MESES_LABEL = env.QUAD_MESES_LABEL || ["1\u00BA m\u00EAs", "2\u00BA m\u00EAs", "3\u00BA m\u00EAs", "4\u00BA m\u00EAs"];

    var fmtPct = env.fmtPct || function (v) { return String(v); };
    var attrStyleCor = env.attrStyleCor || function () { return ""; };
    var attrStyleCorAcum = env.attrStyleCorAcum || function () { return ""; };
    var montarEscalaFaixas = env.montarEscalaFaixas || function () { return ""; };
    var resolverCompetenciaSalvar = env.resolverCompetenciaSalvar;
    var focarInputMesCard = env.focarInputMesCard;

    function lerPcoStorage() {
      return typeof env.lerPcoStorage === "function" ? env.lerPcoStorage() : {};
    }

    function obterPcoMesesUnidade(unidadeId) {
      return typeof env.obterPcoMesesUnidade === "function" ? env.obterPcoMesesUnidade(unidadeId) : {};
    }

    function getDrawers() {
      return typeof env.getDrawers === "function" ? env.getDrawers() : null;
    }

    function atualizarQuadResetBar(uid) {
      if (typeof env.atualizarQuadResetBar === "function") env.atualizarQuadResetBar(uid);
    }

    function aposSalvarToc(mes, primeiraConsulta, concluidos) {
      if (typeof env.aposSalvarToc === "function") {
        env.aposSalvarToc(mes, primeiraConsulta, concluidos);
      }
    }

    /* Regras de faixa: única fonte = simulador-core (IndicaNotaESB). */
    var CLASSIFICACOES_TOC = (ESB && ESB.CLASSIFICACOES && ESB.CLASSIFICACOES.toc) || [];
    var escalaToc = (ESB && ESB.ESCALAS_UI && ESB.ESCALAS_UI.toc) || { max: 100, ticks: [], zonas: [] };
    var TOC_ESCALA_MAX = escalaToc.max;
    var TOC_ESCALA_ZONAS = escalaToc.zonas;

    var TOC_MESES_LABEL = QUAD_MESES_LABEL;

    var tocMesAtual = 1;
    var tocUnidadeId = "";
    var tocMesEditando = null;

    var tocResumo = document.getElementById("toc-resumo");
    var tocMesesGrid = document.getElementById("toc-meses-grid");

    function classificarToc(pct) {
      return ESB && typeof ESB.classificarToc === "function" ? ESB.classificarToc(pct) : "regular";
    }

    function classificacaoTocPorId(id) {
      if (ESB && typeof ESB.classificacaoPorId === "function") {
        return ESB.classificacaoPorId("toc", id) || CLASSIFICACOES_TOC[0] || null;
      }
      return CLASSIFICACOES_TOC[0] || null;
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
      return lerTocStorage()[unidadeId] || {};
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

    function ultimoMesCadastrado(meses) {
      var ordenados = mesesTocOrdenados(meses);
      return ordenados.length ? ordenados[ordenados.length - 1] : 0;
    }

    function salvarMesToc(mes, primeiraConsulta, concluidos, mesCalendario, ano, opts) {
      var todos = lerTocStorage();
      if (!todos[tocUnidadeId]) todos[tocUnidadeId] = {};
      var unidade = todos[tocUnidadeId];
      var pcoQuad = (lerPcoStorage()[tocUnidadeId] || {})._quad;
      var val = ESB.validarQuadrimestreParaSalvar(unidade, mesCalendario, ano, pcoQuad);
      if (!val.ok) return val;

      var anterior = unidade[mes] || null;
      var registro = {
        primeiraConsulta: primeiraConsulta,
        concluidos: concluidos,
        atualizadoEm: new Date().toISOString(),
      };
      var meta = ESB.aplicarMetaFonteMes(anterior, opts);
      if (meta) {
        registro.fonte = meta.fonte;
        registro.ajustadoEm = meta.ajustadoEm;
      }
      unidade[mes] = registro;
      if (mesCalendario && ano) ESB.aplicarMetaQuad(unidade, mesCalendario, ano);
      gravarTocStorage(todos);
      return { ok: true };
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

      var comp = typeof resolverCompetenciaSalvar === "function"
        ? resolverCompetenciaSalvar(tocUnidadeId, mes)
        : { mes: null, ano: null };
      var res = salvarMesToc(mes, primeiraConsulta, concluidos, comp.mes, comp.ano, { origem: "manual" });
      if (!res.ok) {
        window.alert(
          (ESB && ESB.mensagemParaAlerta)
            ? ESB.mensagemParaAlerta(res.mensagem)
            : String(res.mensagem || "").replace(/<[^>]+>/g, "")
        );
        return;
      }

      tocMesEditando = null;
      tocMesAtual = mes;
      atualizarPainelToc();
      atualizarQuadResetBar(tocUnidadeId);
      aposSalvarToc(mes, primeiraConsulta, concluidos);
      var drawers = getDrawers();
      if (drawers) drawers.simAtualizarSeAberto();
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
          if (typeof focarInputMesCard === "function") {
            focarInputMesCard(tocMesesGrid, mes, '.pco-mes-card-input[data-campo="concluidos"]');
          }
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
        html += '    <div class="pco-mes-card-top-acoes">';
        if (registro && !editando) {
          html += ESB.htmlSeloOrigemMes(registro);
        }
        if (ativo && !editando) {
          html += '    <button type="button" class="pco-mes-card-editar">Editar</button>';
        }
        html += "    </div>";
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

    function gerarDicaTocProximoMes(dadosMes, statusMes) {
      if (!dadosMes || dadosMes.primeiraConsulta <= 0 || statusMes.pctMes === null) {
        return {
          titulo: "Dica para o pr\u00F3ximo m\u00EAs",
          texto: "Registre pelo menos 1 primeira consulta para receber recomenda\u00E7\u00F5es personalizadas.",
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
        alvo = "\u00D3timo";
        minimo = Math.floor(consultas * 0.75) + 1;
      } else {
        return {
          titulo: "Dica para o pr\u00F3ximo m\u00EAs",
          texto: "Voc\u00EA est\u00E1 em \u00D3timo. Para manter, busque fechar pelo menos 76% das primeiras consultas no pr\u00F3ximo m\u00EAs.",
        };
      }

      var faltam = Math.max(0, minimo - concluidos);
      if (faltam === 0) {
        return {
          titulo: "Dica para o pr\u00F3ximo m\u00EAs",
          texto: "Voc\u00EA j\u00E1 atingiu o patamar de " + alvo + " com este volume de primeiras consultas. Tente manter ou melhorar esse ritmo no pr\u00F3ximo m\u00EAs.",
        };
      }

      return {
        titulo: "Dica para o pr\u00F3ximo m\u00EAs",
        texto: "Se repetir " + consultas + " primeiras consultas, voc\u00EA precisar\u00E1 de pelo menos " + minimo + " tratamentos conclu\u00EDdos para atingir " + alvo + " (" + faltam + " a mais que neste m\u00EAs).",
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

      if (statusMes.pctMes !== null) {
        html += montarEscalaFaixas({
          pct: statusMes.pctMes,
          atual: cls,
          max: TOC_ESCALA_MAX,
          zonas: TOC_ESCALA_ZONAS,
          ticks: [25, 50, 75],
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

    function selecionarMesToc(mes) {
      if (mes !== tocMesEditando && tocMesEditando !== null) tocMesEditando = null;
      tocMesAtual = mes;
      var meses = obterTocMesesUnidade(tocUnidadeId);
      var registro = meses[mes];

      renderizarTocMesesGrid(meses);

      if (registro) {
        renderizarTocResumo(meses);
      } else if (tocResumo) {
        tocResumo.hidden = true;
        tocResumo.innerHTML = "";
      }
    }

    function atualizarPainelToc() {
      if (!tocUnidadeId) return;
      selecionarMesToc(tocMesAtual);
    }

    function reconciliarPrimeirasTocComPco(unidadeId) {
      if (!unidadeId) return false;
      var store = lerTocStorage();
      var toc = store[unidadeId];
      if (!toc) return false;
      var pco = obterPcoMesesUnidade(unidadeId);
      var mudou = false;
      for (var m = 1; m <= 4; m++) {
        if (!pco[m] || !toc[m]) continue;
        if (Number(toc[m].primeiraConsulta) === Number(pco[m].primeiras)) continue;
        toc[m].primeiraConsulta = pco[m].primeiras;
        toc[m].atualizadoEm = new Date().toISOString();
        mudou = true;
      }
      if (mudou) gravarTocStorage(store);
      return mudou;
    }

    function iniciarTocParaUnidade(unidadeId) {
      tocUnidadeId = unidadeId;
      tocMesEditando = null;
      reconciliarPrimeirasTocComPco(unidadeId);
      var meses = obterTocMesesUnidade(unidadeId);
      var ultimo = ultimoMesCadastrado(meses);
      tocMesAtual = ultimo || 1;
      bindTocMesesGrid();
      atualizarPainelToc();
    }

    return {
      tocResumo: tocResumo,
      classificarToc: classificarToc,
      classificacaoTocPorId: classificacaoTocPorId,
      lerTocStorage: lerTocStorage,
      gravarTocStorage: gravarTocStorage,
      obterTocMesesUnidade: obterTocMesesUnidade,
      salvarMesToc: salvarMesToc,
      excluirMesToc: excluirMesToc,
      reiniciarQuadrimestreToc: reiniciarQuadrimestreToc,
      atualizarPainelToc: atualizarPainelToc,
      iniciarTocParaUnidade: iniciarTocParaUnidade,
      getUnidadeId: function () { return tocUnidadeId; },
      setUnidadeId: function (v) { tocUnidadeId = v || ""; },
      getMesAtual: function () { return tocMesAtual; },
      setMesAtual: function (v) { tocMesAtual = v; },
      getMesEditando: function () { return tocMesEditando; },
      setMesEditando: function (v) { tocMesEditando = v; },
    };
  }

  global.IndicaToc = { install: install };
})(typeof window !== "undefined" ? window : global);
