import { createRequire } from "node:module";
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);

function mockStorage() {
  var store = {};
  return {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem: function (key, value) {
      store[key] = String(value);
    },
    removeItem: function (key) {
      delete store[key];
    },
    clear: function () {
      store = {};
    },
  };
}

function carregar() {
  global.localStorage = mockStorage();
  global.sessionStorage = mockStorage();
  global.window = global;
  delete require.cache[require.resolve("../simulador-core.js")];
  delete require.cache[require.resolve("../siaps-import.js")];
  require("../simulador-core.js");
  require("../siaps-import.js");
  return {
    ESB: global.IndicaNotaESB,
    Siaps: global.IndicaSiaps,
  };
}

describe("SIAPS — CNES/INE", function () {
  var ESB;

  beforeEach(function () {
    ESB = carregar().ESB;
  });

  test("obterIdsUnidade retorna CNES/INE internos", function () {
    var ids = ESB.obterIdsUnidade("2824");
    assert.equal(ids.cnes, "2478455");
    assert.equal(ids.ine, "0001873628");
  });

  test("obterUnidadePorCnes e por INE", function () {
    assert.equal(ESB.obterUnidadePorCnes("2478455"), "2824");
    assert.equal(ESB.obterUnidadePorIne("0001873628"), "2824");
  });
});

describe("SIAPS — validação e parse", function () {
  var Siaps;
  var ESB;

  beforeEach(function () {
    var mods = carregar();
    Siaps = mods.Siaps;
    ESB = mods.ESB;
  });

  test("ehArquivoExcel rejeita PDF", function () {
    assert.equal(Siaps.ehArquivoExcel({ name: "relatorio.pdf", type: "application/pdf" }), false);
    assert.equal(Siaps.ehArquivoExcel({ name: "siaps.xlsx", type: "" }), true);
    assert.equal(Siaps.ehArquivoExcel({ name: "siaps.xls", type: "" }), true);
  });

  test("identificarIndicador mapeia textos comuns", function () {
    assert.equal(Siaps.identificarIndicador("Primeira consulta odontológica programada"), "pco");
    assert.equal(Siaps.identificarIndicador("Tratamento odontológico concluído"), "toc");
    assert.equal(Siaps.identificarIndicador("Procedimentos individuais preventivos"), "b5");
    assert.equal(Siaps.identificarIndicador("Tratamento Restaurador Atraumático (TRA)"), "b6");
    assert.equal(Siaps.identificarIndicador("Taxa de exodontia"), "b3");
  });

  test("parsearLinhasSiaps extrai equipes e rejeita planilha sem cara de SIAPS", function () {
    var ruim = Siaps.parsearLinhasSiaps([["Qualquer", "coisa"], [1, 2]]);
    assert.equal(ruim.ok, false);

    var linhas = [
      ["Relatório - SIAPS"],
      ["Indicador", "Tratamento odontológico concluído"],
      ["Competência", "01/2026"],
      ["CNES", "Estabelecimento", "INE", "Equipe", "Numerador", "Denominador", "Razão"],
      ["2478455", "Sede 1", "0001873628", "eSB", 20, 42, "47,62"],
      ["7629192", "Sede 2", "0002316323", "eSB", 5, 10, "50,00"],
    ];
    var ok = Siaps.parsearLinhasSiaps(linhas);
    assert.equal(ok.ok, true);
    assert.equal(ok.indicador, "toc");
    assert.equal(ok.equipes.length, 2);

    var linha = Siaps.encontrarLinhaUnidade(ok.equipes, "2824", ESB);
    assert.ok(linha);
    assert.equal(linha.numerador, 20);
    assert.equal(linha.denominador, 42);
  });

  test("PCO no SIAPS usa o denominador (1º número) e ignora população/% ", function () {
    var linhas = [
      ["Relatório - SIAPS"],
      ["Indicador", "Primeira consulta odontológica programada"],
      ["CNES", "INE", "Denominador", "População", "Razão"],
      ["2478447", "0001873652", 32, 1710, "1,88"],
    ];
    var ok = Siaps.parsearLinhasSiaps(linhas);
    assert.equal(ok.ok, true);
    assert.equal(ok.indicador, "pco");
    var linha = Siaps.encontrarLinhaUnidade(ok.equipes, "1710", ESB);
    assert.ok(linha);
    assert.equal(linha.numerador, 32);
    assert.equal(linha.denominador, null);
  });

  test("PCO com colunas Numerador/Denominador/Razão usa o Numerador (contagem)", function () {
    var linhas = [
      ["Relatório - SIAPS"],
      ["Indicador", "Primeira consulta odontológica programada"],
      ["CNES", "INE", "Numerador", "Denominador", "Razão"],
      ["2478447", "0001873652", 32, 1710, "1,88"],
    ];
    var ok = Siaps.parsearLinhasSiaps(linhas);
    assert.equal(ok.ok, true);
    var linha = Siaps.encontrarLinhaUnidade(ok.equipes, "1710", ESB);
    assert.equal(linha.numerador, 32);
  });

  test("PCO ignora percentual e população mesmo em ordem ruim", function () {
    var linhas = [
      ["Relatório - SIAPS"],
      ["Indicador", "Primeira consulta odontológica programada"],
      ["CNES", "INE", "Equipe", "A", "B", "C"],
      ["2478447", "0001873652", "LAPA", 1.88, 1710, 32],
    ];
    var ok = Siaps.parsearLinhasSiaps(linhas);
    assert.equal(ok.ok, true);
    var linha = Siaps.encontrarLinhaUnidade(ok.equipes, "1710", ESB);
    assert.equal(linha.numerador, 32);
  });

  test("PCO com ordem 32, população, % pega 32", function () {
    var linhas = [
      ["Relatório - SIAPS"],
      ["Indicador", "Primeira consulta odontológica programada"],
      ["CNES", "INE", "Equipe", "X", "Y", "Z"],
      ["2478447", "0001873652", "LAPA", 32, 1710, 1.88],
    ];
    var ok = Siaps.parsearLinhasSiaps(linhas);
    var linha = Siaps.encontrarLinhaUnidade(ok.equipes, "1710", ESB);
    assert.equal(linha.numerador, 32);
  });

  test("PCO com Numerador = % e Denominador = contagem pega 32", function () {
    var linhas = [
      ["Relatório - SIAPS"],
      ["Indicador", "Primeira consulta odontológica programada"],
      ["CNES", "INE", "Numerador", "Denominador", "Razão"],
      ["2478447", "0001873652", "1,88", 32, "1,88"],
    ];
    var ok = Siaps.parsearLinhasSiaps(linhas);
    var linha = Siaps.encontrarLinhaUnidade(ok.equipes, "1710", ESB);
    assert.equal(linha.numerador, 32);
  });

  test("PCO com cabeçalhos reais do SIAPS (planilha visão por competência)", function () {
    var linhas = [
      ["Relatório Qualidade - Visão por Competência"],
      ["Indicador: Primeira consulta odontológica programada"],
      [
        "CNES",
        "ESTABELECIMENTO",
        "TIPO DO ESTABELECIMENTO",
        "INE",
        "NOME DA EQUIPE",
        "SIGLA DA EQUIPE",
        "Nº TOTAL DE PESSOAS COM PRIMEIRA CONSULTA ODONTOLÓGICA PROGRAMÁTICA REALIZADAS PELA ESB",
        "Nº TOTAL DE PESSOAS VINCULADAS À ESF/EAP DA ESB DE REFERÊNCIA",
        "RAZÃO ENTRE O NUMERADOR E DENOMINADOR MULTIPLICADO POR 100",
      ],
      ["2478447", "UNIDADE BASICA DE SAUDE DE LAPA", "POSTO DE SAUDE", "0001873652", "ESB LAPA", "eSB", 32, 1705, "1,88"],
    ];
    var ok = Siaps.parsearLinhasSiaps(linhas);
    assert.equal(ok.ok, true);
    assert.equal(ok.indicador, "pco");
    var linha = Siaps.encontrarLinhaUnidade(ok.equipes, "1710", ESB);
    assert.ok(linha);
    assert.equal(linha.numerador, 32);
  });

  test("TOC usa numerador e denominador e ignora a razão/%", function () {
    var linhas = [
      ["Relatório Qualidade - Visão por Competência"],
      ["Indicador: Tratamento odontológico concluído"],
      [
        "CNES",
        "ESTABELECIMENTO",
        "INE",
        "NOME DA EQUIPE",
        "SIGLA DA EQUIPE",
        "Nº TOTAL DE PESSOAS COM TRATAMENTO ODONTOLÓGICO CONCLUÍDO",
        "Nº TOTAL DE PESSOAS COM PRIMEIRA CONSULTA ODONTOLÓGICA PROGRAMÁTICA",
        "RAZÃO ENTRE O NUMERADOR E DENOMINADOR MULTIPLICADO POR 100",
      ],
      ["2478447", "UBS LAPA", "0001873652", "ESB LAPA", "eSB", 18, 32, "56,25"],
    ];
    var ok = Siaps.parsearLinhasSiaps(linhas);
    assert.equal(ok.ok, true);
    assert.equal(ok.indicador, "toc");
    var linha = Siaps.encontrarLinhaUnidade(ok.equipes, "1710", ESB);
    assert.equal(linha.numerador, 18);
    assert.equal(linha.denominador, 32);
  });

  test("B5 usa as 2 colunas de métrica (num/den) ignorando %", function () {
    var linhas = [
      ["Relatório - SIAPS"],
      ["Indicador", "Procedimentos individuais preventivos"],
      [
        "CNES",
        "INE",
        "Nº TOTAL DE PROCEDIMENTOS PREVENTIVOS",
        "Nº TOTAL DE PROCEDIMENTOS INDIVIDUAIS",
        "RAZÃO ENTRE O NUMERADOR E DENOMINADOR MULTIPLICADO POR 100",
      ],
      ["2478447", "0001873652", 120, 200, "60,00"],
    ];
    var ok = Siaps.parsearLinhasSiaps(linhas);
    assert.equal(ok.ok, true);
    assert.equal(ok.indicador, "b5");
    var linha = Siaps.encontrarLinhaUnidade(ok.equipes, "1710", ESB);
    assert.equal(linha.numerador, 120);
    assert.equal(linha.denominador, 200);
  });

  test("htmlSeloOrigemMes gera Corrigido e Editado", function () {
    var c = ESB.htmlSeloOrigemMes({ fonte: "siaps", ajustadoEm: "2026-07-31T12:00:00.000Z" });
    assert.match(c, /Corrigido/);
    assert.match(c, /Ajustado com SIAPS/);
    var e = ESB.htmlSeloOrigemMes({ fonte: "editado", ajustadoEm: "2026-07-31T12:00:00.000Z" });
    assert.match(e, /Editado/);
  });
});
