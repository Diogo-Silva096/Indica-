/**
 * Módulo de cálculo da nota estimada do Componente de Qualidade da eSB.
 * Metodologia de referência: Nota Técnica nº 06/2025 (Ministério da Saúde).
 */
(function (global) {
  "use strict";

  var MESES_NOME = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  var QUADRIMESTRES = [
    { nome: "1º Quadrimestre", intervalo: "Janeiro a Abril", meses: [1, 2, 3, 4] },
    { nome: "2º Quadrimestre", intervalo: "Maio a Agosto", meses: [5, 6, 7, 8] },
    { nome: "3º Quadrimestre", intervalo: "Setembro a Dezembro", meses: [9, 10, 11, 12] },
  ];

  var PCO_STORAGE_KEY = "indicaPlus_pco_v1";
  var TOC_STORAGE_KEY = "indicaPlus_toc_v1";
  var PDF_STORAGE_KEY = "indicaPlus_pdf_v1";
  var ESC_STORAGE_KEY = "indicaPlus_escovacao_v1";
  var SESSAO_KEY = "indicaPlus_sessao_v1";
  var UNIDADE_ATIVA_KEY = "indicaPlus_unidade_ativa_v1";

  var UNIDADES = {
    "2824": "SEDE 1",
    "2045": "SEDE 2",
    "1710": "LAPA",
    "2174": "PIRITUBA",
    "1282": "CAETANO",
    "1147": "BARRO VERMELHO",
    "561": "EXTREMAS",
  };

  var NOTA_ESB = {
    versao: "Nota Técnica nº 06/2025",
    pesos: { b1: 2, b2: 2, b3: 2, b4: 1, b5: 2, b6: 1 },
    pontosConceito: { regular: 0.25, suficiente: 0.5, bom: 0.75, otimo: 1 },
    faixasFinal: [
      { id: "otimo", nome: "Ótimo", cor: "#059669", min: 7.51 },
      { id: "bom", nome: "Bom", cor: "#0284c7", min: 5 },
      { id: "suficiente", nome: "Suficiente", cor: "#d97706", min: 2.6 },
      { id: "regular", nome: "Regular", cor: "#64748b", min: 0 },
    ],
  };

  var CLASSIFICACOES = {
    proporcao: [
      { id: "regular", nome: "Regular", cor: "#64748b", faixa: "≤ 0,25%" },
      { id: "suficiente", nome: "Suficiente", cor: "#d97706", faixa: "> 0,25% e ≤ 0,75%" },
      { id: "bom", nome: "Bom", cor: "#0284c7", faixa: "> 0,75% e ≤ 1,25%" },
      { id: "otimo", nome: "Ótimo", cor: "#059669", faixa: "≥ 1,25%" },
    ],
    toc: [
      { id: "regular", nome: "Regular", cor: "#64748b", faixa: "≤ 25%" },
      { id: "suficiente", nome: "Suficiente", cor: "#d97706", faixa: "> 25% e ≤ 50%" },
      { id: "bom", nome: "Bom", cor: "#0284c7", faixa: "> 50% e ≤ 75%" },
      { id: "otimo", nome: "Ótimo", cor: "#059669", faixa: "> 75% e ≤ 100%" },
    ],
    b3: [
      { id: "otimo", nome: "Ótimo", cor: "#059669", faixa: "≥ 3% e < 10%" },
      { id: "bom", nome: "Bom", cor: "#0284c7", faixa: "≥ 10% e < 12%" },
      { id: "suficiente", nome: "Suficiente", cor: "#d97706", faixa: "≥ 12% e < 14%" },
      { id: "regular", nome: "Regular", cor: "#64748b", faixa: "< 3% ou ≥ 14%" },
    ],
    b5: [
      { id: "otimo", nome: "Ótimo", cor: "#059669", faixa: "≥ 65% e ≤ 85%" },
      { id: "bom", nome: "Bom", cor: "#0284c7", faixa: "≥ 55% e < 65%" },
      { id: "suficiente", nome: "Suficiente", cor: "#d97706", faixa: "≥ 40% e < 55%" },
      { id: "regular", nome: "Regular", cor: "#64748b", faixa: "< 40% ou > 85%" },
    ],
    b4: [
      { id: "regular", nome: "Regular", cor: "#64748b", faixa: "Informado pela coordenação de saúde bucal" },
      { id: "suficiente", nome: "Suficiente", cor: "#d97706", faixa: "Informado pela coordenação de saúde bucal" },
      { id: "bom", nome: "Bom", cor: "#0284c7", faixa: "Informado pela coordenação de saúde bucal" },
      { id: "otimo", nome: "Ótimo", cor: "#059669", faixa: "Informado pela coordenação de saúde bucal" },
    ],
    b6: [
      { id: "otimo", nome: "Ótimo", cor: "#059669", faixa: "> 8%" },
      { id: "bom", nome: "Bom", cor: "#0284c7", faixa: "> 6% e ≤ 8%" },
      { id: "suficiente", nome: "Suficiente", cor: "#d97706", faixa: "> 3% e ≤ 6%" },
      { id: "regular", nome: "Regular", cor: "#64748b", faixa: "≤ 3%" },
    ],
  };

  var INDICADORES_META = [
    { id: "b1", codigo: "B1", nome: "Primeira consulta programada", peso: 2, tipoClass: "proporcao", regra: "Média dos 4 percentuais mensais" },
    { id: "b2", codigo: "B2", nome: "Tratamento concluído", peso: 2, tipoClass: "toc", regra: "Acumulado do quadrimestre" },
    { id: "b3", codigo: "B3", nome: "Taxa de exodontias", peso: 2, tipoClass: "b3", regra: "Acumulado do quadrimestre" },
    { id: "b4", codigo: "B4", nome: "Escovação supervisionada", peso: 1, tipoClass: "b4", regra: "Classificação do quadrimestre informada em Indicadores (coordenação de saúde bucal)" },
    { id: "b5", codigo: "B5", nome: "Procedimentos individuais preventivos", peso: 2, tipoClass: "b5", regra: "Acumulado do quadrimestre" },
    { id: "b6", codigo: "B6", nome: "Tratamento restaurador atraumático (ART)", peso: 1, tipoClass: "b6", regra: "Acumulado do quadrimestre" },
  ];

  function lerStorage(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function normalizarSessao(dados) {
    if (!dados || !dados.unidadeId) return null;
    var pop = Number(dados.populacao || dados.unidadeId);
    if (pop <= 0) return null;
    return {
      unidadeId: String(dados.unidadeId),
      unidadeNome: dados.unidadeNome || UNIDADES[dados.unidadeId] || "Unidade",
      populacao: pop,
    };
  }

  function lerSessao() {
    try {
      var raw = sessionStorage.getItem(SESSAO_KEY);
      return raw ? normalizarSessao(JSON.parse(raw)) : null;
    } catch (e) {
      return null;
    }
  }

  function lerUnidadeAtivaStorage() {
    try {
      var raw = localStorage.getItem(UNIDADE_ATIVA_KEY);
      return raw ? normalizarSessao(JSON.parse(raw)) : null;
    } catch (e) {
      return null;
    }
  }

  function lerUnidadeDaUrl() {
    if (typeof location === "undefined" || !location.search) return null;
    var params = new URLSearchParams(location.search);
    var id = params.get("u") || params.get("unidade");
    if (!id || !UNIDADES[id]) return null;
    return normalizarSessao({
      unidadeId: id,
      unidadeNome: UNIDADES[id],
      populacao: Number(id),
    });
  }

  function resolverUnidadeAtiva() {
    return lerUnidadeDaUrl() || lerUnidadeAtivaStorage() || lerSessao();
  }

  function gravarUnidadeAtiva(dados) {
    var sessao = normalizarSessao(dados);
    if (!sessao) return null;
    try {
      localStorage.setItem(UNIDADE_ATIVA_KEY, JSON.stringify(sessao));
      sessionStorage.setItem(SESSAO_KEY, JSON.stringify(sessao));
    } catch (e) { /* storage indisponível */ }
    return sessao;
  }

  function gravarSessao(dados) {
    return gravarUnidadeAtiva(dados);
  }

  function limparUnidadeAtiva() {
    try {
      localStorage.removeItem(UNIDADE_ATIVA_KEY);
      sessionStorage.removeItem(SESSAO_KEY);
    } catch (e) { /* noop */ }
  }

  function gravarEscovacao(unidadeId, dados) {
    var todos = lerStorage(ESC_STORAGE_KEY);
    if (!dados || !dados.classificacao) {
      delete todos[unidadeId];
    } else {
      todos[unidadeId] = {
        classificacao: dados.classificacao,
        atualizadoEm: new Date().toISOString(),
      };
    }
    localStorage.setItem(ESC_STORAGE_KEY, JSON.stringify(todos));
  }

  function resolverClassificacaoEscovacao(escovacao) {
    if (!escovacao) return null;
    if (escovacao.classificacao && NOTA_ESB.pontosConceito[escovacao.classificacao] != null) {
      return escovacao.classificacao;
    }
    /* Compatibilidade com o formato antigo (sessões ÷ população). */
    if (escovacao.populacao > 0 && escovacao.sessoes != null) {
      return classificarPco((escovacao.sessoes / escovacao.populacao) * 100);
    }
    return null;
  }

  var QUAD_MESES_LABEL = ["1\u00BA m\u00EAs", "2\u00BA m\u00EAs", "3\u00BA m\u00EAs", "4\u00BA m\u00EAs"];

  function quadIndicePorMes(mes) { return Math.floor((mes - 1) / 4); }
  function quadPosicaoNoMes(mes) { return ((mes - 1) % 4) + 1; }

  function unidadeTemMesesQuad(unidadeData) {
    if (!unidadeData) return false;
    return Object.keys(unidadeData).some(function (k) {
      var n = Number(k);
      return n >= 1 && n <= 4 && unidadeData[k];
    });
  }

  function mensagemQuadrimestreIncompativel(mesCalendario, ano, quadAtivo) {
    var qNovo = QUADRIMESTRES[quadIndicePorMes(mesCalendario)];
    var qAtivo = QUADRIMESTRES[quadAtivo.indice];
    return "Este relat\u00F3rio \u00E9 de <strong>" + MESES_NOME[mesCalendario - 1] + " de " + ano +
      "</strong> (" + qNovo.nome + "), mas os dados atuais s\u00E3o do <strong>" + qAtivo.nome +
      " de " + quadAtivo.ano + "</strong>. Use <strong>Reiniciar quadrimestre</strong> nos indicadores 1 e 2 antes de importar outro per\u00EDodo.";
  }

  function validarQuadrimestreParaSalvar(unidadeData, mesCalendario, ano, quadReferencia) {
    if (!mesCalendario || !ano) return { ok: true };

    if (unidadeTemMesesQuad(unidadeData) && !unidadeData._quad) {
      return {
        ok: false,
        mensagem: "Os dados desta unidade misturam per\u00EDodos diferentes. Use <strong>Reiniciar quadrimestre</strong> nos indicadores 1 e 2 e importe novamente somente meses do mesmo quadrimestre.",
      };
    }

    var novoIdx = quadIndicePorMes(mesCalendario);
    var referencia = unidadeData._quad || quadReferencia;

    if (referencia && (referencia.indice !== novoIdx || referencia.ano !== ano)) {
      return { ok: false, mensagem: mensagemQuadrimestreIncompativel(mesCalendario, ano, referencia) };
    }

    return { ok: true };
  }

  function aplicarMetaQuad(unidadeData, mesCalendario, ano) {
    if (!unidadeData._quad) {
      unidadeData._quad = { indice: quadIndicePorMes(mesCalendario), ano: ano };
    }
  }

  function obterQuadReferencia(pco, toc, pdfStore) {
    if (pco && pco._quad) return pco._quad;
    if (toc && toc._quad) return toc._quad;
    for (var k in pdfStore) {
      var m = Number(k);
      if (m >= 1 && m <= 12 && pdfStore[k]) {
        return { indice: quadIndicePorMes(m), ano: pdfStore[k].ano };
      }
    }
    return null;
  }

  function classificarPco(pct) {
    if (pct <= 0.25) return "regular";
    if (pct <= 0.75) return "suficiente";
    if (pct <= 1.25) return "bom";
    return "otimo";
  }

  function classificarToc(pct) {
    if (pct <= 25) return "regular";
    if (pct <= 50) return "suficiente";
    if (pct <= 75) return "bom";
    return "otimo";
  }

  function classificarB3(pct) {
    if (pct >= 3 && pct < 10) return "otimo";
    if (pct >= 10 && pct < 12) return "bom";
    if (pct >= 12 && pct < 14) return "suficiente";
    return "regular";
  }

  function classificarB5(pct) {
    if (pct >= 65 && pct <= 85) return "otimo";
    if (pct >= 55 && pct < 65) return "bom";
    if (pct >= 40 && pct < 55) return "suficiente";
    return "regular";
  }

  function classificarB6(pct) {
    if (pct > 8) return "otimo";
    if (pct > 6 && pct <= 8) return "bom";
    if (pct > 3 && pct <= 6) return "suficiente";
    return "regular";
  }

  function classificacaoPorId(tipo, id) {
    var lista = CLASSIFICACOES[tipo] || [];
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].id === id) return lista[i];
    }
    return null;
  }

  function classificarIndicador(tipo, pct) {
    if (tipo === "proporcao") return classificarPco(pct);
    if (tipo === "toc") return classificarToc(pct);
    if (tipo === "b3") return classificarB3(pct);
    if (tipo === "b5") return classificarB5(pct);
    if (tipo === "b6") return classificarB6(pct);
    return "regular";
  }

  function fmtPct(valor) {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + "%";
  }

  function fmtNota(valor) {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

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

  function obterRegistrosQuadPdf(uid, quad) {
    var meses = { 1: null, 2: null, 3: null, 4: null };
    if (!quad) return meses;

    var store = lerStorage(PDF_STORAGE_KEY)[uid] || {};
    var calMeses = QUADRIMESTRES[quad.indice].meses;

    for (var pos = 1; pos <= 4; pos++) {
      var cal = calMeses[pos - 1];
      var reg = store[cal] || null;
      meses[pos] = (reg && reg.ano === quad.ano) ? reg : null;
    }
    return meses;
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

  function mesImportado(pos, pco, toc, pdfMeses) {
    return !!(pco[pos] || toc[pos] || pdfMeses[pos]);
  }

  function montarStatusMeses(quad, pco, toc, pdfMeses) {
    if (!quad) {
      return { total: 0, lista: [], incompleto: true, texto: "Nenhum quadrimestre identificado" };
    }

    var calMeses = QUADRIMESTRES[quad.indice].meses;
    var lista = [];
    var total = 0;

    for (var pos = 1; pos <= 4; pos++) {
      var importado = mesImportado(pos, pco, toc, pdfMeses);
      if (importado) total++;
      lista.push({
        pos: pos,
        nome: MESES_NOME[calMeses[pos - 1] - 1],
        importado: importado,
      });
    }

    return {
      total: total,
      lista: lista,
      incompleto: total < 4,
      texto: total + " de 4 meses importados",
      periodo: QUADRIMESTRES[quad.indice].nome + " de " + quad.ano + " · " + QUADRIMESTRES[quad.indice].intervalo,
    };
  }

  function calcularB1(pco, populacao) {
    if (populacao <= 0) {
      return { status: "sem_dados", motivo: "População da unidade não definida" };
    }

    var pctsMensais = [];
    var detalheMeses = [];

    for (var m = 1; m <= 4; m++) {
      var primeiras = pco[m] ? pco[m].primeiras : 0;
      var pct = (primeiras / populacao) * 100;
      pctsMensais.push(pct);
      detalheMeses.push({ mes: m, primeiras: primeiras, pct: pct, classificacao: classificarPco(pct) });
    }

    var media = pctsMensais.reduce(function (a, b) { return a + b; }, 0) / 4;
    var classId = classificarPco(media);

    return {
      status: "ok",
      pct: media,
      classificacao: classId,
      resultadoTexto: fmtPct(media) + " (média dos 4 meses)",
      formula: "(" + pctsMensais.map(function (p) { return fmtPct(p); }).join(" + ") + ") ÷ 4",
      detalhe: detalheMeses,
      faltas: [],
    };
  }

  function calcularB2(toc) {
    var totalPco = 0;
    var totalConcl = 0;
    var mesesComDado = 0;

    for (var m = 1; m <= 4; m++) {
      if (toc[m]) {
        totalPco += toc[m].primeiraConsulta || 0;
        totalConcl += toc[m].concluidos || 0;
        mesesComDado++;
      }
    }

    if (totalPco <= 0) {
      return {
        status: "sem_dados",
        motivo: "Sem registros de primeira consulta e tratamento concluído no quadrimestre",
        faltas: ["Importe os relatórios PDF ou preencha os dados do indicador 2"],
      };
    }

    var pct = (totalConcl / totalPco) * 100;
    var classId = classificarToc(pct);

    return {
      status: "ok",
      pct: pct,
      classificacao: classId,
      resultadoTexto: fmtPct(pct),
      formula: totalConcl.toLocaleString("pt-BR") + " concluídos ÷ " + totalPco.toLocaleString("pt-BR") + " primeiras consultas × 100",
      numerador: totalConcl,
      denominador: totalPco,
      faltas: mesesComDado < 4 ? ["Quadrimestre incompleto — faltam meses no acumulado"] : [],
    };
  }

  function calcularB3(pdfMeses) {
    var acum = acumularMetricasQuad(pdfMeses, 4, metricasB3DeDados);
    if (!acum) {
      return {
        status: "sem_dados",
        motivo: "Sem produção de exodontias, preventivos ou curativos reconhecida nos PDFs",
        faltas: ["Importe os relatórios PDF do quadrimestre"],
      };
    }

    var classId = classificarB3(acum.pct);
    return {
      status: "ok",
      pct: acum.pct,
      classificacao: classId,
      resultadoTexto: fmtPct(acum.pct),
      formula: acum.exodontias.toLocaleString("pt-BR") + " exodontias ÷ " + acum.denominador.toLocaleString("pt-BR") + " procedimentos × 100",
      numerador: acum.numerador,
      denominador: acum.denominador,
      faltas: [],
    };
  }

  function calcularB4(escovacao) {
    var classId = resolverClassificacaoEscovacao(escovacao);
    if (!classId) {
      return {
        status: "sem_dados",
        motivo: "Escovação não informada",
        faltas: ["Informe a classificação do quadrimestre em Indicadores → Escovação supervisionada"],
      };
    }

    var classInfo = classificacaoPorId("b4", classId);
    return {
      status: "ok",
      classificacao: classId,
      resultadoTexto: classInfo ? classInfo.nome : classId,
      formula: "Classificação informada pela coordenação de saúde bucal ao final do quadrimestre",
      faltas: [],
    };
  }

  function calcularB5(pdfMeses) {
    var acum = acumularMetricasQuad(pdfMeses, 4, metricasB5DeDados);
    if (!acum) {
      return {
        status: "sem_dados",
        motivo: "Sem procedimentos individuais preventivos reconhecidos nos PDFs",
        faltas: ["Importe os relatórios PDF do quadrimestre"],
      };
    }

    var classId = classificarB5(acum.pct);
    return {
      status: "ok",
      pct: acum.pct,
      classificacao: classId,
      resultadoTexto: fmtPct(acum.pct),
      formula: acum.numerador.toLocaleString("pt-BR") + " preventivos ÷ " + acum.denominador.toLocaleString("pt-BR") + " individuais × 100",
      numerador: acum.numerador,
      denominador: acum.denominador,
      faltas: [],
    };
  }

  function calcularB6(pdfMeses) {
    var acum = acumularMetricasQuad(pdfMeses, 4, metricasB6DeDados);
    if (!acum) {
      return {
        status: "sem_dados",
        motivo: "Sem restaurações reconhecidas nos PDFs",
        faltas: ["Importe os relatórios PDF do quadrimestre"],
      };
    }

    var classId = classificarB6(acum.pct);
    return {
      status: "ok",
      pct: acum.pct,
      classificacao: classId,
      resultadoTexto: fmtPct(acum.pct),
      formula: acum.numerador.toLocaleString("pt-BR") + " TRA/ART ÷ " + acum.denominador.toLocaleString("pt-BR") + " restaurações × 100",
      numerador: acum.numerador,
      denominador: acum.denominador,
      faltas: [],
    };
  }

  function classificarNotaFinal(nota) {
    for (var i = 0; i < NOTA_ESB.faixasFinal.length; i++) {
      if (nota >= NOTA_ESB.faixasFinal[i].min) return NOTA_ESB.faixasFinal[i];
    }
    return NOTA_ESB.faixasFinal[NOTA_ESB.faixasFinal.length - 1];
  }

  function detectarFaltasPorIndicador(meta, resultado, statusMeses) {
    var faltas = (resultado.faltas || []).slice();

    if (resultado.status === "sem_dados") {
      faltas.unshift(resultado.motivo);
      return faltas;
    }

    if (meta.id !== "b4" && statusMeses.incompleto) {
      var mesesFaltando = statusMeses.lista
        .filter(function (m) { return !m.importado; })
        .map(function (m) { return m.nome; });
      if (mesesFaltando.length) {
        faltas.push("Meses sem importação: " + mesesFaltando.join(", "));
      }
    }

    return faltas;
  }

  function calcularNotaFinal(unidadeId, populacao) {
    var pcoAll = lerStorage(PCO_STORAGE_KEY)[unidadeId] || {};
    var tocAll = lerStorage(TOC_STORAGE_KEY)[unidadeId] || {};
    var pdfStore = lerStorage(PDF_STORAGE_KEY)[unidadeId] || {};
    var escStore = lerStorage(ESC_STORAGE_KEY)[unidadeId] || null;

    var pco = {};
    var toc = {};
    for (var k in pcoAll) { if (Number(k) >= 1 && Number(k) <= 4) pco[k] = pcoAll[k]; }
    for (var k2 in tocAll) { if (Number(k2) >= 1 && Number(k2) <= 4) toc[k2] = tocAll[k2]; }

    var quad = obterQuadReferencia(pcoAll, tocAll, pdfStore);
    var pdfMeses = obterRegistrosQuadPdf(unidadeId, quad);
    var statusMeses = montarStatusMeses(quad, pco, toc, pdfMeses);

    var calculadores = {
      b1: function () { return calcularB1(pco, populacao); },
      b2: function () { return calcularB2(toc); },
      b3: function () { return calcularB3(pdfMeses); },
      b4: function () { return calcularB4(escStore); },
      b5: function () { return calcularB5(pdfMeses); },
      b6: function () { return calcularB6(pdfMeses); },
    };

    var indicadores = [];
    var somaContribuicao = 0;
    var somaPesoComDados = 0;
    var somaPesoTotal = 0;
    var termosFormula = [];
    var avisosGerais = [];

    INDICADORES_META.forEach(function (meta) {
      var peso = NOTA_ESB.pesos[meta.id];
      somaPesoTotal += peso;

      var resultado = calculadores[meta.id]();
      var faltas = detectarFaltasPorIndicador(meta, resultado, statusMeses);
      var pontos = 0;
      var contribuicao = 0;
      var classInfo = null;

      if (resultado.status === "ok") {
        pontos = NOTA_ESB.pontosConceito[resultado.classificacao];
        contribuicao = pontos * peso;
        somaContribuicao += contribuicao;
        somaPesoComDados += peso;
        classInfo = classificacaoPorId(meta.tipoClass, resultado.classificacao);
        termosFormula.push(fmtNota(pontos) + " × " + peso);
      }

      indicadores.push({
        meta: meta,
        resultado: resultado,
        peso: peso,
        pontos: pontos,
        contribuicao: contribuicao,
        classificacao: classInfo,
        faixas: CLASSIFICACOES[meta.tipoClass],
        faltas: faltas,
        temDados: resultado.status === "ok",
      });
    });

    var notaFinal = somaContribuicao;
    var classFinal = indicadores.some(function (i) { return i.temDados; })
      ? classificarNotaFinal(notaFinal)
      : { id: "sem_dados", nome: "Sem dados", cor: "#94a3b8" };

    if (statusMeses.incompleto) {
      avisosGerais.push("Simulação parcial — " + statusMeses.texto + ". O resultado pode mudar quando os meses restantes forem importados.");
    }

    var semDados = indicadores.filter(function (i) { return !i.temDados; });
    if (semDados.length) {
      avisosGerais.push(semDados.length + " indicador(es) sem dados não entram na soma (contribuição 0).");
    }

  avisosGerais.push("Simulação com base nos dados importados. A nota oficial é apurada pelo Siaps.");

    return {
      unidadeId: unidadeId,
      populacao: populacao,
      quad: quad,
      statusMeses: statusMeses,
      indicadores: indicadores,
      notaFinal: notaFinal,
      notaMaximaPossivel: 10,
      pesoComDados: somaPesoComDados,
      pesoTotal: somaPesoTotal,
      classificacaoFinal: classFinal,
      formulaExpandida: termosFormula.length ? termosFormula.join(" + ") + " = " + fmtNota(notaFinal) : "—",
      avisos: avisosGerais,
      escovacao: escStore,
    };
  }

  global.IndicaNotaESB = {
    NOTA_ESB: NOTA_ESB,
    INDICADORES_META: INDICADORES_META,
    MESES_NOME: MESES_NOME,
    QUADRIMESTRES: QUADRIMESTRES,
    QUAD_MESES_LABEL: QUAD_MESES_LABEL,
    SESSAO_KEY: SESSAO_KEY,
    UNIDADE_ATIVA_KEY: UNIDADE_ATIVA_KEY,
    PCO_STORAGE_KEY: PCO_STORAGE_KEY,
    TOC_STORAGE_KEY: TOC_STORAGE_KEY,
    PDF_STORAGE_KEY: PDF_STORAGE_KEY,
    UNIDADES: UNIDADES,
    ESC_STORAGE_KEY: ESC_STORAGE_KEY,
    lerStorage: lerStorage,
    lerSessao: lerSessao,
    lerUnidadeAtivaStorage: lerUnidadeAtivaStorage,
    resolverUnidadeAtiva: resolverUnidadeAtiva,
    gravarSessao: gravarSessao,
    gravarUnidadeAtiva: gravarUnidadeAtiva,
    limparUnidadeAtiva: limparUnidadeAtiva,
    gravarEscovacao: gravarEscovacao,
    lerEscovacao: function (uid) { return lerStorage(ESC_STORAGE_KEY)[uid] || null; },
    quadIndicePorMes: quadIndicePorMes,
    quadPosicaoNoMes: quadPosicaoNoMes,
    unidadeTemMesesQuad: unidadeTemMesesQuad,
    validarQuadrimestreParaSalvar: validarQuadrimestreParaSalvar,
    aplicarMetaQuad: aplicarMetaQuad,
    mensagemQuadrimestreIncompativel: mensagemQuadrimestreIncompativel,
    classificarNotaFinal: classificarNotaFinal,
    classificarPco: classificarPco,
    classificarToc: classificarToc,
    calcularNotaFinal: calcularNotaFinal,
    fmtPct: fmtPct,
    fmtNota: fmtNota,
    classificacaoPorId: classificacaoPorId,
  };
})(typeof window !== "undefined" ? window : this);
