/**
 * Conferência SIAPS — importar planilhas Excel oficiais e corrigir números do e-SUS.
 */
(function (global) {
  "use strict";

  var MSG_ARQUIVO_INVALIDO =
    "Envie a planilha Excel do SIAPS (Relat\u00F3rio Qualidade). O PDF do e-SUS n\u00E3o entra aqui.";

  var INDICADORES_SIAPS = {
    pco: { id: "pco", label: "1\u00AA consulta programada (PCO)", precisaDen: false },
    toc: { id: "toc", label: "Tratamento conclu\u00EDdo (TOC)", precisaDen: true },
    b5: { id: "b5", label: "Procedimentos preventivos", precisaDen: true },
    b6: { id: "b6", label: "TRA/ART", precisaDen: true },
    b3: { id: "b3", label: "Taxa de exodontias", precisaDen: true },
  };

  function norm(s) {
    return String(s == null ? "" : s)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function ehArquivoExcel(file) {
    if (!file || !file.name) return false;
    var nome = String(file.name).toLowerCase();
    if (/\.pdf$/i.test(nome) || (file.type && /pdf/i.test(file.type))) return false;
    if (/\.xlsx$/i.test(nome) || /\.xls$/i.test(nome)) return true;
    var tipo = String(file.type || "").toLowerCase();
    return (
      tipo.indexOf("spreadsheet") >= 0 ||
      tipo.indexOf("excel") >= 0 ||
      tipo === "application/vnd.ms-excel" ||
      tipo === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  }

  function identificarIndicador(texto) {
    var t = norm(texto);
    if (!t) return null;
    if (/exodont/.test(t) || /taxa de extracao/.test(t)) return "b3";
    if (/\btra\b/.test(t) || /\bart\b/.test(t) || /atraumatic/.test(t) || /restaurador/.test(t)) return "b6";
    if (/preventiv/.test(t) || /procedimentos individuais/.test(t)) return "b5";
    if (/tratamento/.test(t) && /conclu/.test(t)) return "toc";
    if (/primeira consulta/.test(t) || /\bpco\b/.test(t) || /consulta odontologica programada/.test(t)) return "pco";
    return null;
  }

  function celulaTexto(v) {
    if (v == null) return "";
    if (typeof v === "number" && isFinite(v)) return String(v);
    return String(v).trim();
  }

  function celulaNumero(v) {
    if (typeof v === "number" && isFinite(v)) return v;
    var s = celulaTexto(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
    if (!s) return null;
    var n = Number(s);
    return isNaN(n) ? null : n;
  }

  function parecePercentualSiaps(n) {
    if (n == null || !isFinite(n)) return false;
    if (n < 0) return false;
    /* Excel costuma guardar 1,88% como 0,0188. */
    if (n > 0 && n <= 1) return true;
    /* Percentual exibido (ex.: 1,88) — tem casa decimal e fica abaixo de 100. */
    if (Math.abs(n - Math.round(n)) > 1e-9 && n < 100) return true;
    return false;
  }

  function parecePopulacaoCadastrada(n, ESB) {
    if (n == null || !ESB || !ESB.UNIDADES) return false;
    var alvo = String(Math.round(Number(n)));
    return Object.prototype.hasOwnProperty.call(ESB.UNIDADES, alvo);
  }

  function coletarMetricasNumericas(row, cab) {
    var metricas = [];
    for (var j = 0; j < row.length; j++) {
      if (j === cab.cnes || (cab.ine >= 0 && j === cab.ine)) continue;
      if (cab.pop >= 0 && j === cab.pop) continue;
      if (cab.razao >= 0 && j === cab.razao) continue;
      var bruto = row[j];
      if (bruto == null || bruto === "") continue;
      if (typeof bruto === "string" && /[a-zA-ZÀ-ÿ]/.test(bruto) && !/^\s*[\d.,%\s-]+$/.test(bruto)) continue;
      var n = celulaNumero(bruto);
      if (n == null) continue;
      var dig = String(Math.round(n));
      if (dig.length >= 7) continue;
      if (parecePercentualSiaps(n)) continue;
      metricas.push({ idx: j, valor: Math.round(n) });
    }
    return metricas;
  }

  function extrairPrimeirasPcoDaLinha(row, cab, ESB) {
    if (cab.num >= 0) {
      var nNum = celulaNumero(row[cab.num]);
      if (nNum != null && !parecePercentualSiaps(nNum) && !parecePopulacaoCadastrada(nNum, ESB)) {
        return Math.round(nNum);
      }
    }
    var metricas = coletarMetricasNumericas(row, cab);
    for (var i = 0; i < metricas.length; i++) {
      if (parecePopulacaoCadastrada(metricas[i].valor, ESB)) continue;
      return metricas[i].valor;
    }
    return null;
  }

  /* TOC/B3/B5/B6: usa as 2 colunas (numerador + denominador), ignora a razão/%. */
  function extrairNumDenDaLinha(row, cab) {
    var num = cab.num >= 0 ? celulaNumero(row[cab.num]) : null;
    var den = cab.den >= 0 ? celulaNumero(row[cab.den]) : null;
    if (num != null && parecePercentualSiaps(num)) num = null;
    if (den != null && parecePercentualSiaps(den)) den = null;

    if (num != null && den != null) {
      return { numerador: Math.round(num), denominador: Math.round(den) };
    }

    var metricas = coletarMetricasNumericas(row, cab);
    if (num == null && metricas.length) {
      num = metricas[0].valor;
      if (metricas.length > 1 && den == null && metricas[1].idx !== (cab.num >= 0 ? cab.num : -1)) {
        den = metricas[1].valor;
      } else if (metricas.length > 1 && den == null) {
        den = metricas[1].valor;
      }
    } else if (den == null && metricas.length) {
      for (var i = 0; i < metricas.length; i++) {
        if (cab.num >= 0 && metricas[i].idx === cab.num) continue;
        den = metricas[i].valor;
        break;
      }
    }

    if (num == null) return null;
    return {
      numerador: Math.round(num),
      denominador: den != null ? Math.round(den) : null,
    };
  }

  function acharCabecalhoTabela(linhas, indicadorId) {
    indicadorId = indicadorId || null;
    for (var i = 0; i < linhas.length; i++) {
      var row = linhas[i] || [];
      var textos = row.map(function (c) { return norm(celulaTexto(c)); });
      var idxCnes = -1;
      var idxIne = -1;
      var idxNum = -1;
      var idxDen = -1;
      var idxPop = -1;
      var idxRazao = -1;

      textos.forEach(function (t, j) {
        if (!t) return;
        if (idxCnes < 0 && (t === "cnes" || t.indexOf("cnes") === 0)) idxCnes = j;
        if (idxIne < 0 && (t === "ine" || t.indexOf("ine") === 0)) idxIne = j;

        /* Coluna da %: "Razão entre o numerador e denominador..." — nunca num/den. */
        if (t.indexOf("razao") >= 0 || t.indexOf("multiplicado por 100") >= 0) {
          if (idxRazao < 0) idxRazao = j;
          return;
        }

        if (idxPop < 0 && (t.indexOf("vinculadas") >= 0 || t.indexOf("esf/eap") >= 0 || t.indexOf("populacao") >= 0 || t === "pop")) {
          idxPop = j;
          return;
        }

        if (indicadorId === "pco") {
          if (idxNum < 0 && (t.indexOf("primeira consulta") >= 0 || t.indexOf("programatica") >= 0)) {
            idxNum = j;
            return;
          }
        } else if (indicadorId === "toc") {
          if (idxNum < 0 && (t.indexOf("conclu") >= 0 || t.indexOf("tratamento odontologico") >= 0)) {
            idxNum = j;
            return;
          }
          if (idxDen < 0 && (t.indexOf("primeira consulta") >= 0 || t.indexOf("programatica") >= 0)) {
            idxDen = j;
            return;
          }
        } else if (indicadorId === "b5") {
          if (idxNum < 0 && t.indexOf("preventiv") >= 0) {
            idxNum = j;
            return;
          }
          if (idxDen < 0 && (t.indexOf("individual") >= 0 || t.indexOf("denominador") >= 0 || t.indexOf("total de pessoas") >= 0 || t.indexOf("procedimentos") >= 0)) {
            if (t.indexOf("preventiv") < 0) idxDen = j;
            return;
          }
        } else if (indicadorId === "b6") {
          if (idxNum < 0 && (/\btra\b/.test(t) || /\bart\b/.test(t) || t.indexOf("atraumatic") >= 0)) {
            idxNum = j;
            return;
          }
          if (idxDen < 0 && (t.indexOf("restaur") >= 0 || t.indexOf("denominador") >= 0 || t.indexOf("procedimentos") >= 0)) {
            if (!(/\btra\b/.test(t) || /\bart\b/.test(t))) idxDen = j;
            return;
          }
        } else if (indicadorId === "b3") {
          if (idxNum < 0 && t.indexOf("exodont") >= 0) {
            idxNum = j;
            return;
          }
          if (idxDen < 0 && (t.indexOf("denominador") >= 0 || t.indexOf("procedimentos") >= 0 || t.indexOf("curativ") >= 0 || t.indexOf("preventiv") >= 0)) {
            if (t.indexOf("exodont") < 0) idxDen = j;
            return;
          }
        }

        if (idxNum < 0 && (t.indexOf("numerador") >= 0 || t === "num")) idxNum = j;
        if (idxDen < 0 && (t.indexOf("denominador") >= 0 || t === "den")) idxDen = j;
      });

      /* Fallback posicional: após CNES/INE, as 2 primeiras colunas de métrica (antes da razão). */
      if (idxCnes >= 0 && (idxNum < 0 || idxDen < 0) && indicadorId && indicadorId !== "pco") {
        var candidatas = [];
        for (var c = 0; c < textos.length; c++) {
          if (c === idxCnes || c === idxIne || c === idxRazao || c === idxPop) continue;
          var ht = textos[c];
          if (!ht) continue;
          if (ht === "estabelecimento" || ht.indexOf("estabelecimento") === 0) continue;
          if (ht.indexOf("tipo do estabelecimento") >= 0 || ht.indexOf("nome da equipe") >= 0 || ht.indexOf("sigla") >= 0) continue;
          if (ht.indexOf("cnes") === 0 || ht.indexOf("ine") === 0) continue;
          candidatas.push(c);
        }
        if (idxNum < 0 && candidatas[0] != null) idxNum = candidatas[0];
        if (idxDen < 0 && candidatas[1] != null) idxDen = candidatas[1];
      }

      if (idxCnes >= 0 && (idxNum >= 0 || idxDen >= 0 || idxPop >= 0 || idxRazao >= 0 || idxIne >= 0)) {
        return {
          linha: i,
          cnes: idxCnes,
          ine: idxIne,
          num: idxNum,
          den: idxDen,
          pop: idxPop,
          razao: idxRazao,
        };
      }
    }
    return null;
  }

  function extrairIndicadorDoCabecalho(linhas) {
    for (var i = 0; i < Math.min(linhas.length, 30); i++) {
      var row = linhas[i] || [];
      for (var j = 0; j < row.length; j++) {
        var t = norm(celulaTexto(row[j]));
        if (t.indexOf("indicador") === 0) {
          var valor = celulaTexto(row[j + 1]) || celulaTexto(row[j]).replace(/^indicador\s*[:\-]?\s*/i, "");
          var id = identificarIndicador(valor);
          if (id) return { id: id, texto: valor };
        }
        var idDireto = identificarIndicador(celulaTexto(row[j]));
        if (idDireto && t.length > 12) return { id: idDireto, texto: celulaTexto(row[j]) };
      }
    }
    return null;
  }

  function planilhaPareceSiaps(linhas) {
    if (!linhas || !linhas.length) return false;
    var blob = "";
    for (var i = 0; i < Math.min(linhas.length, 40); i++) {
      blob += " " + (linhas[i] || []).map(celulaTexto).join(" ");
    }
    var t = norm(blob);
    var temSiaps = t.indexOf("siaps") >= 0 || t.indexOf("relatorio qualidade") >= 0 || t.indexOf("visao por competencia") >= 0;
    var temIndicador = t.indexOf("indicador") >= 0;
    var temTabela = !!(acharCabecalhoTabela(linhas, null));
    return temTabela && (temSiaps || temIndicador);
  }

  function parsearLinhasSiaps(linhas, ESB) {
    ESB = ESB || global.IndicaNotaESB;
    if (!planilhaPareceSiaps(linhas)) {
      return { ok: false, mensagem: MSG_ARQUIVO_INVALIDO };
    }
    var ind = extrairIndicadorDoCabecalho(linhas);
    if (!ind) {
      return { ok: false, mensagem: "N\u00E3o foi poss\u00EDvel identificar o indicador no cabe\u00E7alho da planilha SIAPS." };
    }
    var cab = acharCabecalhoTabela(linhas, ind.id);
    if (!cab) {
      return { ok: false, mensagem: "Tabela de equipes (CNES / numerador) n\u00E3o encontrada na planilha SIAPS." };
    }

    var equipes = [];
    for (var r = cab.linha + 1; r < linhas.length; r++) {
      var row = linhas[r] || [];
      var cnes = celulaTexto(row[cab.cnes]);
      var ine = cab.ine >= 0 ? celulaTexto(row[cab.ine]) : "";
      if (!cnes && !ine) continue;

      /* PCO: só a contagem de primeiras; ignora população e %. */
      if (ind.id === "pco") {
        var primeiras = extrairPrimeirasPcoDaLinha(row, cab, ESB);
        if (primeiras == null) continue;
        equipes.push({
          cnes: cnes,
          ine: ine,
          numerador: primeiras,
          denominador: null,
        });
        continue;
      }

      /* TOC / B3 / B5 / B6: numerador + denominador (ignora razão/%). */
      var par = extrairNumDenDaLinha(row, cab);
      if (!par || par.numerador == null) continue;
      equipes.push({
        cnes: cnes,
        ine: ine,
        numerador: par.numerador,
        denominador: par.denominador,
      });
    }

    if (!equipes.length) {
      return { ok: false, mensagem: "Nenhuma equipe com numerador encontrada na planilha SIAPS." };
    }

    return {
      ok: true,
      indicador: ind.id,
      indicadorTexto: ind.texto,
      equipes: equipes,
    };
  }

  function encontrarLinhaUnidade(equipes, unidadeId, ESB) {
    var ids = ESB.obterIdsUnidade(unidadeId);
    if (!ids) return null;
    var cnes = ESB.normalizarDigitosId(ids.cnes);
    var ine = ESB.normalizarDigitosId(ids.ine);
    var porCnes = [];
    for (var i = 0; i < equipes.length; i++) {
      var eq = equipes[i];
      if (ESB.normalizarDigitosId(eq.cnes) === cnes) porCnes.push(eq);
    }
    if (porCnes.length === 1) return porCnes[0];
    if (porCnes.length > 1) {
      for (var j = 0; j < porCnes.length; j++) {
        if (ESB.normalizarDigitosId(porCnes[j].ine) === ine) return porCnes[j];
      }
      return porCnes[0];
    }
    for (var k = 0; k < equipes.length; k++) {
      if (ESB.normalizarDigitosId(equipes[k].ine) === ine) return equipes[k];
    }
    return null;
  }

  function sheetParaLinhas(workbook) {
    var nomes = workbook.SheetNames || [];
    var preferida = null;
    for (var i = 0; i < nomes.length; i++) {
      var n = norm(nomes[i]);
      if (n.indexOf("siaps") >= 0 || n.indexOf("relatorio") >= 0) {
        preferida = nomes[i];
        break;
      }
    }
    var sheet = workbook.Sheets[preferida || nomes[0]];
    if (!sheet) return [];
    return global.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  }

  function install(env) {
    var ESB = env.ESB || global.IndicaNotaESB;
    var api = {};
    var pendencias = {};
    var competencia = { mes: null, ano: null };
    var siapsVisivel = false;
    var siapsUnidadeId = "";

    var siapsDrawerRoot = document.getElementById("siaps-drawer-root");
    var siapsDrawer = document.getElementById("siaps-drawer");
    var siapsDrawerOverlay = document.getElementById("siaps-drawer-overlay");
    var siapsDrawerFechar = document.getElementById("siaps-drawer-fechar");
    var sidebarSiaps = document.getElementById("sidebar-siaps");
    var bottomSiaps = document.getElementById("bottom-siaps");
    var siapsCompetenciaEl = document.getElementById("siaps-competencia");
    var siapsFile = document.getElementById("siaps-file");
    var siapsStatus = document.getElementById("siaps-status");
    var siapsPreview = document.getElementById("siaps-preview");
    var siapsAplicar = document.getElementById("siaps-aplicar");
    var siapsLimpar = document.getElementById("siaps-limpar");

    function getDrawers() { return env.drawers; }
    function getPdfApi() { return env.pdfApi || null; }

    function obterCompetenciaEsus() {
      var pdfApi = getPdfApi();
      if (pdfApi && typeof pdfApi.obterCompetencia === "function") {
        var viaApi = pdfApi.obterCompetencia();
        if (viaApi && viaApi.mes && viaApi.ano) return viaApi;
      }
      var pdfMes = document.getElementById("pdf-mes");
      var pdfAno = document.getElementById("pdf-ano");
      var mes = pdfMes ? Number(pdfMes.value) : 0;
      var ano = pdfAno ? Number(pdfAno.value) : 0;
      if (mes >= 1 && mes <= 12 && ano >= 2020 && ano <= 2100) return { mes: mes, ano: ano };
      return null;
    }

    function atualizarCompetenciaUi() {
      var c = obterCompetenciaEsus();
      competencia = c || { mes: null, ano: null };
      if (!siapsCompetenciaEl) return;
      if (competencia.mes && competencia.ano) {
        siapsCompetenciaEl.textContent =
          (ESB.MESES_NOME[competencia.mes - 1] || "") + " de " + competencia.ano;
        siapsCompetenciaEl.classList.remove("is-vazio");
      } else {
        siapsCompetenciaEl.textContent = "Defina o m\u00EAs/ano no Relat\u00F3rio PDF (e-SUS)";
        siapsCompetenciaEl.classList.add("is-vazio");
      }
    }

    function setStatus(msg, tipo) {
      if (!siapsStatus) return;
      if (!msg) {
        siapsStatus.hidden = true;
        siapsStatus.innerHTML = "";
        siapsStatus.className = "pdf-status";
        return;
      }
      siapsStatus.hidden = false;
      siapsStatus.className = "pdf-status pdf-status--" + (tipo || "info");
      siapsStatus.innerHTML = msg;
    }

    function atualizarNavSiaps(uid) {
      var show = !!uid;
      [sidebarSiaps, bottomSiaps].forEach(function (el) {
        if (el) el.hidden = !show;
      });
    }

    function fecharDrawer(opts) {
      opts = opts || {};
      if (!siapsVisivel) return;
      siapsVisivel = false;
      if (siapsDrawerRoot) {
        siapsDrawerRoot.hidden = true;
        siapsDrawerRoot.classList.remove("is-aberto");
      }
      var drawers = getDrawers();
      if (drawers && drawers.siapsNotificarFechado) drawers.siapsNotificarFechado(opts);
      if (drawers) drawers.syncDrawerNav();
    }

    function abrirDrawer(origem) {
      if (!siapsUnidadeId && env.unidadeSelect) siapsUnidadeId = env.unidadeSelect.value;
      if (!siapsUnidadeId) return;
      var drawers = getDrawers();
      if (drawers) {
        if (drawers.simFecharDrawer) drawers.simFecharDrawer();
      }
      var pdfApi = getPdfApi();
      if (pdfApi && pdfApi.fecharDrawer) pdfApi.fecharDrawer({ silencioso: true });
      siapsVisivel = true;
      if (siapsDrawerRoot) {
        siapsDrawerRoot.hidden = false;
        siapsDrawerRoot.classList.add("is-aberto");
      }
      if (drawers && drawers.siapsNotificarAberto) drawers.siapsNotificarAberto(origem);
      if (drawers) drawers.syncDrawerNav();
      atualizarCompetenciaUi();
    }

    function garantirCompetencia() {
      atualizarCompetenciaUi();
      if (competencia.mes && competencia.ano) return competencia;
      return null;
    }

    function limparSessao() {
      pendencias = {};
      competencia = { mes: null, ano: null };
      if (siapsFile) siapsFile.value = "";
      if (siapsPreview) {
        siapsPreview.hidden = true;
        siapsPreview.innerHTML = "";
      }
      if (siapsAplicar) siapsAplicar.hidden = true;
      setStatus(null);
      atualizarCompetenciaUi();
    }

    function renderPreview() {
      var chaves = Object.keys(pendencias);
      if (!siapsPreview) return;
      if (!chaves.length) {
        siapsPreview.hidden = true;
        siapsPreview.innerHTML = "";
        if (siapsAplicar) siapsAplicar.hidden = true;
        return;
      }

      var html = '<div class="siaps-preview-card">';
      html += '<h3 class="siaps-preview-titulo">Pr\u00E9via para a unidade ativa</h3>';
      html += '<p class="siaps-preview-sub">Compet\u00EAncia: <strong>' +
        (ESB.MESES_NOME[competencia.mes - 1] || "") + " de " + competencia.ano +
        "</strong>. Ao aplicar, cards, relat\u00F3rio e nota final ser\u00E3o atualizados juntos.</p>";
      html += '<ul class="siaps-preview-lista">';

      chaves.forEach(function (id) {
        var p = pendencias[id];
        var meta = INDICADORES_SIAPS[id];
        var linha = encontrarLinhaUnidade(p.equipes, siapsUnidadeId, ESB);
        html += "<li>";
        html += "<strong>" + (meta ? meta.label : id) + "</strong>";
        html += " <span class=\"siaps-preview-arq\">(" + escHtml(p.arquivoNome || "arquivo") + ")</span>";
        if (!linha) {
          html += '<p class="siaps-preview-aviso">Linha da unidade n\u00E3o encontrada pelo CNES/INE.</p>';
        } else if (id === "pco") {
          html += "<p>Primeiras consultas: <strong>" + Number(linha.numerador).toLocaleString("pt-BR") + "</strong></p>";
        } else {
          html += "<p>Numerador: <strong>" + Number(linha.numerador).toLocaleString("pt-BR") + "</strong>";
          if (linha.denominador != null) {
            html += " · Denominador: <strong>" + Number(linha.denominador).toLocaleString("pt-BR") + "</strong>";
          }
          html += "</p>";
        }
        html += "</li>";
      });

      html += "</ul></div>";
      siapsPreview.hidden = false;
      siapsPreview.innerHTML = html;
      if (siapsAplicar) siapsAplicar.hidden = false;
    }

    function escHtml(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function lerArquivoArrayBuffer(file) {
      return new Promise(function (resolve, reject) {
        var fr = new FileReader();
        fr.onload = function () { resolve(fr.result); };
        fr.onerror = function () { reject(fr.error || new Error("Falha ao ler arquivo")); };
        fr.readAsArrayBuffer(file);
      });
    }

    async function processarArquivos(files) {
      if (!global.XLSX) {
        setStatus("Biblioteca de Excel n\u00E3o carregada. Recarregue a p\u00E1gina.", "erro");
        return;
      }
      if (!siapsUnidadeId) {
        setStatus("Escolha uma unidade antes de importar o SIAPS.", "erro");
        return;
      }
      var comp = garantirCompetencia();
      if (!comp) {
        setStatus("Defina o m\u00EAs e o ano no Relat\u00F3rio PDF (e-SUS). A corre\u00E7\u00E3o SIAPS usa a mesma compet\u00EAncia.", "erro");
        return;
      }

      var lista = Array.prototype.slice.call(files || []);
      if (!lista.length) {
        setStatus("Selecione uma ou mais planilhas Excel do SIAPS.", "erro");
        return;
      }

      setStatus("Lendo planilha(s)\u2026", "carregando");
      var okCount = 0;
      var erros = [];

      for (var i = 0; i < lista.length; i++) {
        var file = lista[i];
        if (!ehArquivoExcel(file)) {
          erros.push(file.name + ": " + MSG_ARQUIVO_INVALIDO);
          continue;
        }
        try {
          var buf = await lerArquivoArrayBuffer(file);
          var wb = global.XLSX.read(buf, { type: "array" });
          var linhas = sheetParaLinhas(wb);
          var parsed = parsearLinhasSiaps(linhas, ESB);
          if (!parsed.ok) {
            erros.push(file.name + ": " + parsed.mensagem);
            continue;
          }
          pendencias[parsed.indicador] = {
            indicador: parsed.indicador,
            indicadorTexto: parsed.indicadorTexto,
            equipes: parsed.equipes,
            arquivoNome: file.name,
          };
          okCount++;
        } catch (err) {
          erros.push(file.name + ": n\u00E3o foi poss\u00EDvel ler a planilha.");
        }
      }

      renderPreview();
      if (okCount && !erros.length) {
        setStatus(okCount + " planilha(s) pronta(s). Revise a pr\u00E9via e clique em Aplicar.", "sucesso");
      } else if (okCount && erros.length) {
        setStatus(okCount + " ok. " + erros.join(" "), "info");
      } else {
        setStatus(erros.join(" ") || MSG_ARQUIVO_INVALIDO, "erro");
      }
      if (siapsFile) siapsFile.value = "";
    }

    function aplicarPendencias() {
      var chaves = Object.keys(pendencias);
      if (!chaves.length) return;
      var comp = garantirCompetencia();
      if (!comp) {
        setStatus("Defina o m\u00EAs e o ano no Relat\u00F3rio PDF (e-SUS). A corre\u00E7\u00E3o SIAPS usa a mesma compet\u00EAncia.", "erro");
        return;
      }
      if (!window.confirm("Aplicar as corre\u00E7\u00F5es SIAPS na unidade ativa? Isso atualiza cards, relat\u00F3rio e nota final.")) {
        return;
      }

      var agora = new Date().toISOString();
      var pos = ESB.quadPosicaoNoMes(competencia.mes);
      var pdfApi = getPdfApi();
      var aplicados = 0;
      var falhas = [];

      chaves.forEach(function (id) {
        var p = pendencias[id];
        var linha = encontrarLinhaUnidade(p.equipes, siapsUnidadeId, ESB);
        if (!linha) {
          falhas.push((INDICADORES_SIAPS[id] || {}).label || id);
          return;
        }

        var metaSiaps = { fonte: "siaps", ajustadoEm: agora };
        var okLocal = true;

        if (id === "pco") {
          var rPco = env.salvarMesPco(pos, linha.numerador, competencia.mes, competencia.ano, metaSiaps);
          if (!rPco || !rPco.ok) {
            okLocal = false;
            falhas.push("PCO");
          }
        } else if (id === "toc") {
          var primeiras = linha.denominador != null ? linha.denominador : linha.numerador;
          var rToc = env.salvarMesToc(pos, primeiras, linha.numerador, competencia.mes, competencia.ano, metaSiaps);
          if (!rToc || !rToc.ok) {
            okLocal = false;
            falhas.push("TOC");
          } else if (linha.denominador != null) {
            env.salvarMesPco(pos, linha.denominador, competencia.mes, competencia.ano, metaSiaps);
          }
        }

        if (pdfApi && typeof pdfApi.aplicarAjusteSiaps === "function") {
          var resPdf = pdfApi.aplicarAjusteSiaps(competencia.mes, competencia.ano, {
            indicador: id,
            numerador: linha.numerador,
            denominador: linha.denominador,
            ajustadoEm: agora,
          });
          if (!resPdf || !resPdf.ok) {
            okLocal = false;
            falhas.push(((INDICADORES_SIAPS[id] || {}).label || id) + " (relat\u00F3rio)");
          }
        }

        if (okLocal) aplicados++;
      });

      if (typeof env.atualizarPainelPco === "function") env.atualizarPainelPco();
      if (typeof env.atualizarPainelToc === "function") env.atualizarPainelToc();
      if (pdfApi && typeof pdfApi.atualizarQuadResetBar === "function") {
        pdfApi.atualizarQuadResetBar(siapsUnidadeId);
      }

      var drawers = getDrawers();
      if (drawers && drawers.simAtualizarSeAberto) drawers.simAtualizarSeAberto();

      if (aplicados) {
        setStatus(
          "Corre\u00E7\u00E3o aplicada em " + aplicados + " indicador(es). Cards, relat\u00F3rio e nota final atualizados.",
          "sucesso"
        );
        pendencias = {};
        renderPreview();
      } else {
        setStatus("N\u00E3o foi poss\u00EDvel aplicar: " + (falhas.join(", ") || "verifique CNES/INE."), "erro");
      }
    }

    function iniciar(unidadeId) {
      siapsUnidadeId = unidadeId || "";
      atualizarNavSiaps(siapsUnidadeId);
      if (!siapsUnidadeId) {
        limparSessao();
        fecharDrawer({ silencioso: true });
      }
    }

    function bind() {
      if (sidebarSiaps) {
        sidebarSiaps.addEventListener("click", function (e) {
          if (siapsVisivel) fecharDrawer();
          else abrirDrawer(e.currentTarget);
        });
      }
      if (bottomSiaps) {
        bottomSiaps.addEventListener("click", function (e) {
          if (siapsVisivel) fecharDrawer();
          else abrirDrawer(e.currentTarget);
        });
      }
      if (siapsDrawerFechar) siapsDrawerFechar.addEventListener("click", fecharDrawer);
      if (siapsDrawerOverlay) siapsDrawerOverlay.addEventListener("click", fecharDrawer);
      if (siapsFile) {
        siapsFile.addEventListener("change", function () {
          if (siapsFile.files && siapsFile.files.length) processarArquivos(siapsFile.files);
        });
      }
      if (siapsAplicar) siapsAplicar.addEventListener("click", aplicarPendencias);
      if (siapsLimpar) siapsLimpar.addEventListener("click", limparSessao);
    }

    bind();

    api.iniciar = iniciar;
    api.abrirDrawer = abrirDrawer;
    api.fecharDrawer = fecharDrawer;
    api.getVisivel = function () { return siapsVisivel; };
    api.getDrawerRoot = function () { return siapsDrawerRoot; };
    api.getDrawer = function () { return siapsDrawer; };
    api.atualizarNav = atualizarNavSiaps;
    api.limparSessao = limparSessao;
    /* Expostos para testes */
    api._test = {
      ehArquivoExcel: ehArquivoExcel,
      identificarIndicador: identificarIndicador,
      parsearLinhasSiaps: parsearLinhasSiaps,
      encontrarLinhaUnidade: encontrarLinhaUnidade,
      planilhaPareceSiaps: planilhaPareceSiaps,
      MSG_ARQUIVO_INVALIDO: MSG_ARQUIVO_INVALIDO,
    };
    return api;
  }

  global.IndicaSiaps = {
    install: install,
    ehArquivoExcel: ehArquivoExcel,
    identificarIndicador: identificarIndicador,
    parsearLinhasSiaps: parsearLinhasSiaps,
    encontrarLinhaUnidade: encontrarLinhaUnidade,
    planilhaPareceSiaps: planilhaPareceSiaps,
    extrairPrimeirasPcoDaLinha: extrairPrimeirasPcoDaLinha,
    parecePercentualSiaps: parecePercentualSiaps,
    MSG_ARQUIVO_INVALIDO: MSG_ARQUIVO_INVALIDO,
  };
})(typeof window !== "undefined" ? window : this);
