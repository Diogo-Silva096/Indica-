/**
 * Indicadores 4–6 — B5 (preventivos), B3 (exodontia) e B6 (TRA/ART).
 * Instalado por indicadores.js via IndicaB456.install(env).
 * Passo 6 da organização do código: extrair formulários B3/B5/B6 do arquivo monolítico.
 */
(function (global) {
  "use strict";

  function install(env) {
    env = env || {};

    var ESB = env.ESB || window.IndicaNotaESB;
    var montarEscalaFaixas = env.montarEscalaFaixas || function () { return ""; };

    function atualizarResultadoLiveB5() {
      if (typeof env.atualizarResultadoLiveB5 === "function") env.atualizarResultadoLiveB5();
    }
    function atualizarResultadoLiveB6() {
      if (typeof env.atualizarResultadoLiveB6 === "function") env.atualizarResultadoLiveB6();
    }
    function atualizarResultadoLiveB3() {
      if (typeof env.atualizarResultadoLiveB3 === "function") env.atualizarResultadoLiveB3();
    }

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

  /* Regras de faixa: única fonte = simulador-core (IndicaNotaESB). */
  var CLASSIFICACOES_B5 = (ESB && ESB.CLASSIFICACOES && ESB.CLASSIFICACOES.b5) || [];
  var escalaB5 = (ESB && ESB.ESCALAS_UI && ESB.ESCALAS_UI.b5) || { max: 100, ticks: [], zonas: [] };
  var B5_ESCALA_MAX = escalaB5.max;
  var B5_ESCALA_ZONAS = escalaB5.zonas;
  var B5_ESCALA_TICKS = escalaB5.ticks || [40, 55, 65, 85];

  function classificarB5(pct) {
    return ESB && typeof ESB.classificarB5 === "function" ? ESB.classificarB5(pct) : "regular";
  }

  function classificacaoB5PorId(id) {
    if (ESB && typeof ESB.classificacaoPorId === "function") {
      return ESB.classificacaoPorId("b5", id) || null;
    }
    return null;
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

  /* Campo com valor digitado (inclui 0) conta como preenchido; vazio some no filtro. */
  function campoProcedimentoPreenchido(inp) {
    return !!(inp && String(inp.value).trim() !== "");
  }

  /* Oculta procedimentos sem valor digitado para facilitar a leitura.
     Zero permanece visível para permitir edição. Se nenhum campo tiver valor,
     mostra todos para digitar manualmente. */
  function aplicarFiltroB5() {
    if (!b5Form) return;
    var itens = b5Form.querySelectorAll(".b5-item");
    var ativo = b5FiltroPreenchidos ? b5FiltroPreenchidos.checked : false;
    var algumPreenchido = false;
    itens.forEach(function (item) {
      var inp = item.querySelector(".b5-item-input");
      if (campoProcedimentoPreenchido(inp)) algumPreenchido = true;
    });
    itens.forEach(function (item) {
      var inp = item.querySelector(".b5-item-input");
      var preenchido = campoProcedimentoPreenchido(inp);
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
      ticks: B5_ESCALA_TICKS,
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

  /* Regras de faixa: única fonte = simulador-core (IndicaNotaESB). */
  var CLASSIFICACOES_B3 = (ESB && ESB.CLASSIFICACOES && ESB.CLASSIFICACOES.b3) || [];
  var escalaB3 = (ESB && ESB.ESCALAS_UI && ESB.ESCALAS_UI.b3) || { max: 20, ticks: [], zonas: [] };
  var B3_ESCALA_MAX = escalaB3.max;
  var B3_ESCALA_ZONAS = escalaB3.zonas;
  var B3_ESCALA_TICKS = escalaB3.ticks || [3, 10, 12, 14];

  function classificarB3(pct) {
    return ESB && typeof ESB.classificarB3 === "function" ? ESB.classificarB3(pct) : "regular";
  }

  function classificacaoB3PorId(id) {
    if (ESB && typeof ESB.classificacaoPorId === "function") {
      return ESB.classificacaoPorId("b3", id) || null;
    }
    return null;
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
      ticks: B3_ESCALA_TICKS,
    });
    b3MetasEscala.hidden = false;
  }

  function montarEscalaB3(pct, classId, atual) {
    return montarEscalaFaixas({
      pct: pct,
      atual: atual,
      max: B3_ESCALA_MAX,
      zonas: B3_ESCALA_ZONAS,
      ticks: B3_ESCALA_TICKS,
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

  /* Regras de faixa: única fonte = simulador-core (IndicaNotaESB). */
  var CLASSIFICACOES_B6 = (ESB && ESB.CLASSIFICACOES && ESB.CLASSIFICACOES.b6) || [];
  var escalaB6 = (ESB && ESB.ESCALAS_UI && ESB.ESCALAS_UI.b6) || { max: 12, ticks: [], zonas: [] };
  var B6_ESCALA_MAX = escalaB6.max;
  var B6_ESCALA_ZONAS = escalaB6.zonas;
  var B6_ESCALA_TICKS = escalaB6.ticks || [3, 6, 8];

  function classificarB6(pct) {
    return ESB && typeof ESB.classificarB6 === "function" ? ESB.classificarB6(pct) : "regular";
  }

  function classificacaoB6PorId(id) {
    if (ESB && typeof ESB.classificacaoPorId === "function") {
      return ESB.classificacaoPorId("b6", id) || null;
    }
    return null;
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

  /* Oculta procedimentos sem valor digitado no ART (mesma lógica do b5; zero fica visível). */
  function aplicarFiltroB6() {
    if (!b6Form) return;
    var itens = b6Form.querySelectorAll(".b5-item");
    var ativo = b6FiltroPreenchidos ? b6FiltroPreenchidos.checked : false;
    var algumPreenchido = false;
    itens.forEach(function (item) {
      var inp = item.querySelector(".b6-item-input");
      if (campoProcedimentoPreenchido(inp)) algumPreenchido = true;
    });
    itens.forEach(function (item) {
      var inp = item.querySelector(".b6-item-input");
      var preenchido = campoProcedimentoPreenchido(inp);
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
      ticks: B6_ESCALA_TICKS,
    });
    b6MetasEscala.hidden = false;
  }

  function montarEscalaB6(pct, atual) {
    return montarEscalaFaixas({
      pct: pct,
      atual: atual,
      max: B6_ESCALA_MAX,
      zonas: B6_ESCALA_ZONAS,
      ticks: B6_ESCALA_TICKS,
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

    return {
      B5_PREVENTIVOS: B5_PREVENTIVOS,
      B5_OUTROS: B5_OUTROS,
      B3_EXODONTIAS: B3_EXODONTIAS,
      B3_PREVENTIVOS: B3_PREVENTIVOS,
      B3_CURATIVOS: B3_CURATIVOS,
      B6_TRA: B6_TRA,
      B6_OUTROS: B6_OUTROS,
      classificarB5: classificarB5,
      classificacaoB5PorId: classificacaoB5PorId,
      classificarB3: classificarB3,
      classificacaoB3PorId: classificacaoB3PorId,
      classificarB6: classificarB6,
      classificacaoB6PorId: classificacaoB6PorId,
      interpretacaoB5: interpretacaoB5,
      interpretacaoB3: interpretacaoB3,
      interpretacaoB6: interpretacaoB6,
      aplicarFiltroB5: aplicarFiltroB5,
      aplicarFiltroB6: aplicarFiltroB6,
      renderizarMetasB5: renderizarMetasB5,
      renderizarMetasB6: renderizarMetasB6,
      renderizarMetasB3: renderizarMetasB3,
      metricasB5DeForm: metricasB5DeForm,
      metricasB6DeForm: metricasB6DeForm,
      metricasB3DeForm: metricasB3DeForm,
      b5Form: b5Form,
      b6Form: b6Form,
      b3Form: b3Form,
      b3InExo: b3InExo,
      b3InPrev: b3InPrev,
      b3InCur: b3InCur,
      b5MetasEscala: b5MetasEscala,
      b6MetasEscala: b6MetasEscala,
      b3MetasEscala: b3MetasEscala,
    };
  }

  global.IndicaB456 = { install: install };
})(typeof window !== "undefined" ? window : global);
