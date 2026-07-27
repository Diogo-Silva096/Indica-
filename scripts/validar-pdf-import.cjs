const fs = require("fs");
const vm = require("vm");

const sandbox = {
  console,
  pdfjsLib: null,
  IndicaDrawers: {
    create() {
      return {
        registrarEventos() {},
        syncDrawerNav() {},
        simFecharDrawer() {},
        pdfNotificarAberto() {},
        pdfNotificarFechado() {},
        fecharTodos() {},
        simAtualizarSeAberto() {},
      };
    },
  },
  document: {
    getElementById() {
      return null;
    },
  },
  matchMedia() {
    return { matches: false };
  },
  requestAnimationFrame(cb) {
    return 0;
  },
  cancelAnimationFrame() {},
};

sandbox.window = sandbox;
sandbox.global = sandbox;

try {
  vm.runInNewContext(fs.readFileSync("pdf-import.js", "utf8"), sandbox, {
    filename: "pdf-import.js",
  });
  console.log("pdf-import OK", typeof sandbox.IndicaPdf.install);

  let drawersValue = null;
  const env = {
    ESB: {
      quadIndicePorMes: () => 0,
      quadPosicaoNoMes: () => 1,
      mensagemQuadrimestreIncompativel: () => "x",
    },
    MESES_NOME: Array(12).fill("Mes"),
    QUADRIMESTRES: [{ nome: "1", intervalo: "", meses: [1, 2, 3, 4] }],
    PDF_STORAGE_KEY: "k",
    unidadeSelect: null,
    navIndicadores: null,
    bottomIndicadores: null,
    navSimulador: null,
    bottomNota: null,
    ativarIndicador() {},
    obterQuadReferenciaUnidade() {
      return null;
    },
    B5_PREVENTIVOS: [],
    B5_OUTROS: [],
    B3_EXODONTIAS: [],
    B3_PREVENTIVOS: [],
    B3_CURATIVOS: [],
    B6_TRA: [],
    B6_OUTROS: [],
    fmtPct: (n) => String(n),
    classificarPco: () => "regular",
    classificacaoPcoPorId: () => ({ nome: "R", cor: "#000" }),
    classificarToc: () => "regular",
    classificacaoTocPorId: () => ({ nome: "R", cor: "#000" }),
    classificarB3: () => "regular",
    classificarB5: () => "regular",
    classificarB6: () => "regular",
    classificacaoB3PorId: () => ({ nome: "R", cor: "#000" }),
    classificacaoB5PorId: () => ({ nome: "R", cor: "#000" }),
    classificacaoB6PorId: () => ({ nome: "R", cor: "#000" }),
    calcularResultadoMesPco: () => ({ pct: 0, classAtual: "regular" }),
    lerEscovacaoStorage: () => ({}),
    escConceitoPorId: () => null,
    resolverClassificacaoEscovacaoLocal: () => null,
    salvarMesPco: () => ({ ok: true }),
    salvarMesToc: () => ({ ok: true }),
    atualizarPainelPco() {},
    atualizarPainelToc() {},
    aplicarFiltroB5() {},
    aplicarFiltroB6() {},
    renderizarMetasB5() {},
    renderizarMetasB6() {},
    renderizarMetasB3() {},
    metricasB5DeForm: () => null,
    metricasB6DeForm: () => null,
    metricasB3DeForm: () => null,
    reiniciarQuadrimestrePco() {},
    reiniciarQuadrimestreToc() {},
    limparFormulariosIndicadores() {},
    limparEscovacaoUnidade() {},
    b5Form: null,
    b6Form: null,
    b3Form: null,
    b3InExo: null,
    b3InPrev: null,
    b3InCur: null,
    pcoResultado: null,
    tocResumo: null,
    quadResetBar: null,
    quadResetPeriodo: null,
    btnReiniciarQuadrimestre: null,
    simDrawerRoot: null,
    simDrawerOverlay: null,
    simDrawerFechar: null,
    simDrawer: null,
    simDrawerConteudo: null,
  };

  Object.defineProperties(env, {
    populacaoAtual: {
      get() {
        return 1000;
      },
      enumerable: true,
    },
    drawers: {
      get() {
        return drawersValue;
      },
      set(v) {
        drawersValue = v;
      },
      enumerable: true,
    },
    pcoUnidadeId: {
      get() {
        return "";
      },
      enumerable: true,
    },
    tocUnidadeId: {
      get() {
        return "";
      },
      enumerable: true,
    },
    pcoMesAtual: {
      get() {
        return 1;
      },
      set() {},
      enumerable: true,
    },
    tocMesAtual: {
      get() {
        return 1;
      },
      set() {},
      enumerable: true,
    },
    pcoMesEditando: {
      get() {
        return null;
      },
      set() {},
      enumerable: true,
    },
    tocMesEditando: {
      get() {
        return null;
      },
      set() {},
      enumerable: true,
    },
  });

  const api = sandbox.IndicaPdf.install(env);

  console.log("install OK", typeof api.iniciar, typeof api.atualizarBotaoProcessar);
} catch (e) {
  console.error("FAIL", e.stack || e.message);
  process.exit(1);
}
