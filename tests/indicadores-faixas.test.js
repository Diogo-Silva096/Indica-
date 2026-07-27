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

function carregarCore() {
  global.localStorage = mockStorage();
  global.sessionStorage = mockStorage();
  global.window = global;
  delete require.cache[require.resolve("../simulador-core.js")];
  require("../simulador-core.js");
  return global.IndicaNotaESB;
}

describe("faixas — PCO (B1)", function () {
  var ESB;
  beforeEach(function () { ESB = carregarCore(); });

  test("limiares oficiais nas bordas", function () {
    assert.equal(ESB.classificarPco(0), "regular");
    assert.equal(ESB.classificarPco(0.25), "regular");
    assert.equal(ESB.classificarPco(0.26), "suficiente");
    assert.equal(ESB.classificarPco(0.75), "suficiente");
    assert.equal(ESB.classificarPco(0.76), "bom");
    assert.equal(ESB.classificarPco(1.25), "bom");
    assert.equal(ESB.classificarPco(1.26), "otimo");
  });

  test("metasMensaisPco escala com a população", function () {
    var m = ESB.metasMensaisPco(1000);
    assert.equal(m.regular, 3); /* ceil(2.5) */
    assert.equal(m.suficiente, 8); /* ceil(7.5) */
    assert.equal(m.bom, 13); /* ceil(12.5) */
    assert.equal(m.otimo, 14);
  });
});

describe("faixas — TOC (B2)", function () {
  var ESB;
  beforeEach(function () { ESB = carregarCore(); });

  test("limiares oficiais nas bordas", function () {
    assert.equal(ESB.classificarToc(0), "regular");
    assert.equal(ESB.classificarToc(25), "regular");
    assert.equal(ESB.classificarToc(25.1), "suficiente");
    assert.equal(ESB.classificarToc(50), "suficiente");
    assert.equal(ESB.classificarToc(50.1), "bom");
    assert.equal(ESB.classificarToc(75), "bom");
    assert.equal(ESB.classificarToc(75.1), "otimo");
  });
});

describe("faixas — B3 exodontias", function () {
  var ESB;
  beforeEach(function () { ESB = carregarCore(); });

  test("faixa ótima e extremos regular", function () {
    assert.equal(ESB.classificarB3(2.9), "regular");
    assert.equal(ESB.classificarB3(3), "otimo");
    assert.equal(ESB.classificarB3(9.9), "otimo");
    assert.equal(ESB.classificarB3(10), "bom");
    assert.equal(ESB.classificarB3(11.9), "bom");
    assert.equal(ESB.classificarB3(12), "suficiente");
    assert.equal(ESB.classificarB3(13.9), "suficiente");
    assert.equal(ESB.classificarB3(14), "regular");
  });
});

describe("faixas — B5 preventivos", function () {
  var ESB;
  beforeEach(function () { ESB = carregarCore(); });

  test("faixa ótima entre 65% e 85%", function () {
    assert.equal(ESB.classificarB5(39.9), "regular");
    assert.equal(ESB.classificarB5(40), "suficiente");
    assert.equal(ESB.classificarB5(54.9), "suficiente");
    assert.equal(ESB.classificarB5(55), "bom");
    assert.equal(ESB.classificarB5(64.9), "bom");
    assert.equal(ESB.classificarB5(65), "otimo");
    assert.equal(ESB.classificarB5(85), "otimo");
    assert.equal(ESB.classificarB5(85.1), "regular");
  });
});

describe("faixas — B6 TRA/ART", function () {
  var ESB;
  beforeEach(function () { ESB = carregarCore(); });

  test("limiares oficiais nas bordas", function () {
    assert.equal(ESB.classificarB6(3), "regular");
    assert.equal(ESB.classificarB6(3.1), "suficiente");
    assert.equal(ESB.classificarB6(6), "suficiente");
    assert.equal(ESB.classificarB6(6.1), "bom");
    assert.equal(ESB.classificarB6(8), "bom");
    assert.equal(ESB.classificarB6(8.1), "otimo");
  });
});

describe("cálculo integrado dos indicadores", function () {
  var ESB;
  beforeEach(function () {
    ESB = carregarCore();
    localStorage.clear();
  });

  function pdfMes(ano, b5num, b5out, b6num, b6out, exo, prev, cur) {
    return {
      ano: ano,
      dados: {
        b5: { num: { total: b5num }, out: { total: b5out } },
        b6: { num: { total: b6num }, out: { total: b6out } },
        b3: { exo: { total: exo }, prev: { total: prev }, cur: { total: cur } },
      },
    };
  }

  test("TOC acumulado classifica B2 corretamente", function () {
    var uid = "2824";
    var toc = {
      _quad: { indice: 0, ano: 2026 },
      1: { primeiraConsulta: 100, concluidos: 80 },
      2: { primeiraConsulta: 100, concluidos: 80 },
      3: { primeiraConsulta: 100, concluidos: 80 },
      4: { primeiraConsulta: 100, concluidos: 80 },
    };
    localStorage.setItem(ESB.TOC_STORAGE_KEY, JSON.stringify({ [uid]: toc }));

    var res = ESB.calcularNotaFinal(uid, 2824);
    var b2 = res.indicadores.find(function (i) { return i.meta.id === "b2"; });
    assert.equal(b2.classificacao.id, "otimo"); /* 80% */
    assert.equal(b2.contribuicao, 2);
  });

  test("PDF do quadrimestre alimenta B3, B5 e B6", function () {
    var uid = "2824";
    var ano = 2026;
    /* B5 70%, B6 10%, B3 5% → todos ótimo */
    var bloco = pdfMes(ano, 70, 30, 10, 90, 5, 50, 45);
    var store = {
      [uid]: {
        1: bloco,
        2: bloco,
        3: bloco,
        4: bloco,
      },
    };
    localStorage.setItem(ESB.PDF_STORAGE_KEY, JSON.stringify(store));
    /* âncora de quadrimestre via PCO */
    localStorage.setItem(ESB.PCO_STORAGE_KEY, JSON.stringify({
      [uid]: { _quad: { indice: 0, ano: ano }, 1: { primeiras: 10 } },
    }));

    var res = ESB.calcularNotaFinal(uid, 2824);
    var b3 = res.indicadores.find(function (i) { return i.meta.id === "b3"; });
    var b5 = res.indicadores.find(function (i) { return i.meta.id === "b5"; });
    var b6 = res.indicadores.find(function (i) { return i.meta.id === "b6"; });

    assert.ok(b3.temDados);
    assert.ok(b5.temDados);
    assert.ok(b6.temDados);
    assert.equal(b3.classificacao.id, "otimo");
    assert.equal(b5.classificacao.id, "otimo");
    assert.equal(b6.classificacao.id, "otimo");
  });

  test("escovação informada classifica B4", function () {
    var uid = "2824";
    localStorage.setItem(ESB.ESC_STORAGE_KEY, JSON.stringify({
      [uid]: { classificacao: "bom" },
    }));
    var res = ESB.calcularNotaFinal(uid, 2824);
    var b4 = res.indicadores.find(function (i) { return i.meta.id === "b4"; });
    assert.ok(b4.temDados);
    assert.equal(b4.classificacao.id, "bom");
    assert.equal(b4.contribuicao, 0.75);
  });

  test("mensagem de quadrimestre incompatível orienta reinício", function () {
    var msg = ESB.mensagemQuadrimestreIncompativel(5, 2026, { indice: 0, ano: 2026 });
    assert.match(msg, /Maio/);
    assert.match(msg, /Reiniciar quadrimestre/);
    assert.match(msg, /1º|1\u00BA/);
  });
});
