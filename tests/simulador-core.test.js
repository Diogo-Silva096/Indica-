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

describe("simulador-core — quadrimestres", function () {
  var ESB;

  beforeEach(function () {
    ESB = carregarCore();
  });

  test("quadIndicePorMes mapeia meses corretamente", function () {
    assert.equal(ESB.quadIndicePorMes(1), 0);
    assert.equal(ESB.quadIndicePorMes(4), 0);
    assert.equal(ESB.quadIndicePorMes(5), 1);
    assert.equal(ESB.quadIndicePorMes(12), 2);
  });

  test("quadPosicaoNoMes retorna posição 1–4 no quadrimestre", function () {
    assert.equal(ESB.quadPosicaoNoMes(1), 1);
    assert.equal(ESB.quadPosicaoNoMes(4), 4);
    assert.equal(ESB.quadPosicaoNoMes(5), 1);
    assert.equal(ESB.quadPosicaoNoMes(8), 4);
  });

  test("validarQuadrimestreParaSalvar rejeita período diferente", function () {
    var dados = { _quad: { indice: 0, ano: 2026 }, 1: { valor: 10 } };
    var res = ESB.validarQuadrimestreParaSalvar(dados, 5, 2026, null);
    assert.equal(res.ok, false);
    assert.match(res.mensagem, /Maio/);
  });
});

describe("simulador-core — nota final", function () {
  var ESB;

  beforeEach(function () {
    ESB = carregarCore();
  });

  test("classificarNotaFinal aplica faixas oficiais", function () {
    assert.equal(ESB.classificarNotaFinal(8).id, "otimo");
    assert.equal(ESB.classificarNotaFinal(7.5).id, "bom");
    assert.equal(ESB.classificarNotaFinal(5).id, "bom");
    assert.equal(ESB.classificarNotaFinal(2.6).id, "suficiente");
    assert.equal(ESB.classificarNotaFinal(2.5).id, "regular");
  });

  test("classificar indicadores usa faixas únicas do core", function () {
    assert.equal(ESB.classificarPco(0.2), "regular");
    assert.equal(ESB.classificarPco(1.25), "bom");
    assert.equal(ESB.classificarPco(1.26), "otimo");
    assert.equal(ESB.classificarToc(50), "suficiente");
    assert.equal(ESB.classificarToc(76), "otimo");
    assert.equal(ESB.classificarB5(70), "otimo");
    assert.equal(ESB.classificarB5(90), "regular");
    assert.equal(ESB.classificarB3(5), "otimo");
    assert.equal(ESB.classificarB3(15), "regular");
    assert.equal(ESB.classificarB6(9), "otimo");
    assert.equal(ESB.classificarB6(2), "regular");
    assert.equal(ESB.classificacaoPorId("b5", "otimo").nome, "Ótimo");
    assert.ok(ESB.ESCALAS_UI.b5.zonas.length >= 4);
  });

  test("pesos dos indicadores somam 10", function () {
    var pesos = ESB.NOTA_ESB.pesos;
    var total = pesos.b1 + pesos.b2 + pesos.b3 + pesos.b4 + pesos.b5 + pesos.b6;
    assert.equal(total, 10);
  });

  test("fmtNota formata com vírgula decimal", function () {
    assert.equal(ESB.fmtNota(7.5), "7,50");
    assert.equal(ESB.fmtNota(10), "10,00");
  });

  test("calcularNotaFinal sem importação calcula B1 zerado (regular)", function () {
    localStorage.clear();
    var res = ESB.calcularNotaFinal("9999", 1000);
    var b1 = res.indicadores.find(function (i) { return i.meta.id === "b1"; });
    assert.ok(b1.temDados);
    assert.equal(b1.classificacao.id, "regular");
    assert.equal(res.notaFinal, 0.5);
  });

  test("calcularNotaFinal com PCO ótimo contribui 2 pontos no B1", function () {
    var uid = "2824";
    var pop = 2824;
    var pco = { _quad: { indice: 0, ano: 2026 } };
    for (var m = 1; m <= 4; m++) {
      pco[m] = { primeiras: Math.ceil(pop * 0.02) };
    }
    localStorage.setItem(ESB.PCO_STORAGE_KEY, JSON.stringify({ [uid]: pco }));

    var res = ESB.calcularNotaFinal(uid, pop);
    var b1 = res.indicadores.find(function (i) { return i.meta.id === "b1"; });
    assert.ok(b1.temDados);
    assert.equal(b1.contribuicao, 2);
  });
});
