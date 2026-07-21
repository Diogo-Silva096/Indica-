(function () {
  "use strict";

  var ESB = window.IndicaNotaESB;
  if (!ESB) return;

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function q(root, sel) {
    return root.querySelector(sel);
  }

  function badgeConceito(info, semDados) {
    if (semDados || !info) {
      return '<span class="sim-badge sim-badge--sem-dados">Sem dados</span>';
    }
    return '<span class="sim-badge" style="--cor: ' + info.cor + '">' + escHtml(info.nome) + "</span>";
  }

  function corIndicador(ind) {
    if (ind.temDados && ind.classificacao) return ind.classificacao.cor;
    return "#94a3b8";
  }

  function renderizarStatusMeses(statusMeses) {
    var chips = statusMeses.lista.map(function (m) {
      var cls = m.importado ? "sim-mes-chip is-ok" : "sim-mes-chip is-pendente";
      var icone = m.importado ? "&#10003;" : "&#8212;";
      return '<span class="' + cls + '"><span class="sim-mes-icone" aria-hidden="true">' + icone + "</span>" + escHtml(m.nome) + "</span>";
    }).join("");

    var alertaParcial = statusMeses.incompleto
      ? '<p class="sim-alerta sim-alerta--parcial"><strong>Simulação parcial</strong> — faltam ' + (4 - statusMeses.total) + " meses para o quadrimestre completo.</p>"
      : '<p class="sim-alerta sim-alerta--ok">Quadrimestre com os 4 meses importados.</p>';

    return (
      '<div class="sim-status-card">' +
        '<div class="sim-status-topo">' +
          '<h2 class="sim-status-titulo">Acompanhamento do quadrimestre</h2>' +
          (statusMeses.periodo ? '<p class="sim-status-periodo">' + escHtml(statusMeses.periodo) + "</p>" : "") +
        "</div>" +
        '<p class="sim-status-contagem"><strong>' + statusMeses.total + " de 4</strong> meses importados neste quadrimestre</p>" +
        '<div class="sim-meses-chips" aria-label="Meses do quadrimestre">' + chips + "</div>" +
        alertaParcial +
      "</div>"
    );
  }

  function renderizarFaltas(indicadores, opts) {
    opts = opts || {};
    var itens = [];

    indicadores.forEach(function (ind) {
      if (!ind.faltas || !ind.faltas.length) return;
      var acaoB4 = "";
      if (ind.meta.id === "b4" && !ind.temDados) {
        acaoB4 = opts.modoDrawer
          ? '<p class="sim-falta-acao"><button type="button" class="sim-ir-indicador" data-indicador="escovacao">Ir para Escovação supervisionada</button></p>'
          : '<p class="sim-falta-acao"><a href="index.html#indicadores">Ir para Escovação supervisionada</a> nos indicadores</p>';
      }
      itens.push(
        '<li class="sim-falta-item">' +
          '<span class="sim-falta-cod">' + escHtml(ind.meta.codigo) + "</span>" +
          '<div class="sim-falta-corpo">' +
            '<strong>' + escHtml(ind.meta.nome) + "</strong>" +
            "<ul>" + ind.faltas.map(function (f) { return "<li>" + escHtml(f) + "</li>"; }).join("") + "</ul>" +
            acaoB4 +
          "</div>" +
        "</li>"
      );
    });

    if (!itens.length) return "";

    var count = itens.length;
    var countLabel = count === 1 ? "1 indicador" : count + " indicadores";

    return (
      '<details class="sim-faltas-card">' +
        '<summary class="sim-faltas-sum">Dados que ainda faltam <span class="sim-faltas-contagem">' + countLabel + "</span></summary>" +
        '<ul class="sim-faltas-lista">' + itens.join("") + "</ul>" +
      "</details>"
    );
  }

  function renderizarHero(res) {
    var cls = res.classificacaoFinal;
    var parcial = res.pesoComDados < res.pesoTotal;

    return (
      '<div class="sim-hero-card" style="--cor: ' + cls.cor + '">' +
        '<div class="sim-hero-nota">' +
          '<span class="sim-hero-label">Nota estimada</span>' +
          '<p class="sim-hero-valor">' + ESB.fmtNota(res.notaFinal) + '<span class="sim-hero-max"> / 10</span></p>' +
          (parcial ? '<p class="sim-hero-parcial">Com ' + res.pesoComDados + " de " + res.pesoTotal + " pontos possíveis preenchidos</p>" : "") +
        "</div>" +
        '<div class="sim-hero-class">' +
          '<span class="sim-hero-class-label">Classificação prevista</span>' +
          badgeConceito(cls, cls.id === "sem_dados") +
        "</div>" +
      "</div>"
    );
  }

  function renderizarTabela(root, res) {
    var tabelaCorpo = q(root, ".sim-tabela-corpo");
    var tabelaRodape = q(root, ".sim-tabela-rodape");
    if (!tabelaCorpo || !tabelaRodape) return;

    var linhas = res.indicadores.map(function (ind) {
      var r = ind.resultado;
      var resultadoTxt = r.status === "ok" ? escHtml(r.resultadoTexto) : '<span class="sim-sem-valor">—</span>';
      var pontosTxt = ind.temDados ? ESB.fmtNota(ind.pontos) : "0,00";
      var contribTxt = ind.temDados ? ESB.fmtNota(ind.contribuicao) : "0,00";

      return (
        "<tr" + (ind.temDados ? "" : ' class="sim-linha-sem-dados"') + ">" +
          "<td><strong>" + escHtml(ind.meta.codigo) + "</strong></td>" +
          "<td>" + escHtml(ind.meta.nome) + "</td>" +
          "<td>" + resultadoTxt + "</td>" +
          "<td>" + badgeConceito(ind.classificacao, !ind.temDados) + "</td>" +
          "<td>" + pontosTxt + "</td>" +
          "<td>" + ind.peso + "</td>" +
          "<td><strong>" + contribTxt + "</strong></td>" +
        "</tr>"
      );
    }).join("");

    tabelaCorpo.innerHTML = linhas;
    tabelaRodape.innerHTML =
      "<tr>" +
        '<td colspan="6" class="sim-total-label">Nota final estimada</td>' +
        '<td class="sim-total-valor">' + ESB.fmtNota(res.notaFinal) + "</td>" +
      "</tr>";
  }

  function renderizarDetalheCard(ind) {
    var r = ind.resultado;
    var cor = corIndicador(ind);
    var faixasHtml = (ind.faixas || []).map(function (f) {
      var atual = ind.classificacao && ind.classificacao.id === f.id ? " is-atual" : "";
      return '<li class="sim-faixa' + atual + '"><span class="sim-faixa-dot" style="--cor: ' + f.cor + '"></span>' + escHtml(f.nome) + ": " + escHtml(f.faixa) + "</li>";
    }).join("");

    var desempenhoHtml = "";
    if (r.status === "ok") {
      desempenhoHtml =
        '<div class="sim-det-bloco sim-det-bloco--desempenho">' +
          '<span class="sim-det-bloco-label">Desempenho</span>' +
          '<p class="sim-det-resultado"><strong>' + escHtml(r.resultadoTexto) + "</strong></p>" +
        "</div>";
    } else {
      desempenhoHtml =
        '<div class="sim-det-bloco sim-det-bloco--desempenho">' +
          '<span class="sim-det-bloco-label">Desempenho</span>' +
          '<p class="sim-det-sem-dados">' + escHtml(r.motivo) + "</p>" +
        "</div>";
    }

    var calculoHtml = "";
    if (r.status === "ok") {
      var mesesHtml = "";
      if (ind.meta.id === "b1" && r.detalhe) {
        mesesHtml = '<ul class="sim-det-meses">' + r.detalhe.map(function (m, i) {
          var cls = ESB.classificacaoPorId("proporcao", m.classificacao);
          return "<li>" + (i + 1) + "º mês: " + ESB.fmtPct(m.pct) + " (" + (cls ? cls.nome : "") + ")</li>";
        }).join("") + "</ul>";
      }

      calculoHtml =
        '<div class="sim-det-bloco sim-det-bloco--calculo">' +
          '<span class="sim-det-bloco-label">Cálculo</span>' +
          '<p class="sim-det-formula">' + escHtml(r.formula) + "</p>" +
          mesesHtml +
          (ind.temDados
            ? '<p class="sim-det-contrib">' + ESB.fmtNota(ind.pontos) + " × " + ind.peso + " = <strong>" + ESB.fmtNota(ind.contribuicao) + "</strong></p>"
            : "") +
          '<p class="sim-det-regra">' + escHtml(ind.meta.regra) + "</p>" +
        "</div>";
    }

    return (
      '<article class="sim-det-card" style="--cor: ' + cor + '">' +
        '<header class="sim-det-header">' +
          '<span class="sim-det-cod">' + escHtml(ind.meta.codigo) + "</span>" +
          '<h3 class="sim-det-titulo">' + escHtml(ind.meta.nome) + "</h3>" +
          '<div class="sim-det-header-badge">' + badgeConceito(ind.classificacao, !ind.temDados) + "</div>" +
        "</header>" +
        '<div class="sim-det-corpo">' +
          desempenhoHtml +
          calculoHtml +
          '<details class="sim-det-faixas-detalhe">' +
            '<summary class="sim-det-faixas-sum">Faixas de classificação</summary>' +
            '<ul class="sim-det-faixas" aria-label="Faixas de classificação">' + faixasHtml + "</ul>" +
          "</details>" +
        "</div>" +
      "</article>"
    );
  }

  function renderizarDetalhes(root, res) {
    var detalhesEl = q(root, ".sim-detalhes");
    if (!detalhesEl) return;

    var cards = res.indicadores.map(renderizarDetalheCard).join("");

    detalhesEl.innerHTML =
      '<h2 class="sim-sec-titulo sim-sec-titulo--detalhe">Como cada indicador foi calculado</h2>' +
      '<div class="sim-det-grid">' + cards + "</div>";
  }

  function renderizarFormula(root, res) {
    var formulaEl = q(root, ".sim-formula");
    if (!formulaEl) return;

    var avisos = res.avisos.map(function (a) { return "<li>" + escHtml(a) + "</li>"; }).join("");

    formulaEl.innerHTML =
      '<div class="sim-formula-card">' +
        '<h2 class="sim-sec-titulo">Fórmula da nota final</h2>' +
        '<p class="sim-formula-expressao">Nota = soma de (pontuação do conceito × peso do indicador)</p>' +
        '<p class="sim-formula-calculo"><strong>' + escHtml(res.formulaExpandida) + "</strong></p>" +
        '<div class="sim-formula-pesos">' +
          "<p><strong>Pesos oficiais:</strong> B1, B2, B3 e B5 = 2 · B4 e B6 = 1 · Total = 10</p>" +
          "<p><strong>Pontos por conceito:</strong> Regular = 0,25 · Suficiente = 0,50 · Bom = 0,75 · Ótimo = 1,00</p>" +
          "<p><strong>Classificação final:</strong> Ótimo &gt; 7,5 · Bom 5,0 a 7,5 · Suficiente 2,6 a 4,9 · Regular ≤ 2,5</p>" +
        "</div>" +
        '<ul class="sim-avisos">' + avisos + "</ul>" +
      "</div>";
  }

  function renderizar(root, sessao, res, opts) {
    opts = opts || {};
    var unidadeBar = q(root, ".sim-unidade-bar");
    var statusEl = q(root, ".sim-status");
    var heroEl = q(root, ".sim-hero");
    var metodologiaEl = q(root, ".sim-metodologia");

    if (unidadeBar) {
      unidadeBar.innerHTML =
        '<span class="sim-unidade-nome">Unidade: <strong>' + escHtml(sessao.unidadeNome) + "</strong></span>" +
        '<span class="sim-unidade-pop">Pop. cadastrada: <strong>' + Number(sessao.populacao).toLocaleString("pt-BR") + "</strong></span>";
    }
    if (statusEl) {
      statusEl.innerHTML = renderizarStatusMeses(res.statusMeses) + renderizarFaltas(res.indicadores, opts);
    }
    if (heroEl) heroEl.innerHTML = renderizarHero(res);
    renderizarTabela(root, res);
    renderizarDetalhes(root, res);
    renderizarFormula(root, res);
    if (metodologiaEl) metodologiaEl.textContent = ESB.NOTA_ESB.versao;

    return res;
  }

  function recalcular(root, sessao, opts) {
    var res = ESB.calcularNotaFinal(sessao.unidadeId, Number(sessao.populacao));
    return renderizar(root, sessao, res, opts);
  }

  window.IndicaNotaUI = {
    renderizar: renderizar,
    recalcular: recalcular,
  };
})();
