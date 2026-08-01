/**
 * Importação automática do relatório PDF (e-SUS APS) e painéis B3/B5/B6 ligados ao PDF.
 * Instalado por indicadores.js via IndicaPdf.install(env).
 * Passo 1 da organização do código: extrair o bloco PDF do arquivo monolítico.
 */
(function (global) {
  // Sem "use strict" neste arquivo: a extração mecânica usa with(env).
  function install(env) {
    var api = {};

    (function () {
      with (env) {
        /* ===== IMPORTAÇÃO AUTOMÁTICA DO RELATÓRIO PDF (e-SUS APS) ===== */
        /* Não se aplica à Escovação supervisionada. */
        var PDF_MESES = MESES_NOME;
        var PDF_QUADRIMESTRES = QUADRIMESTRES;
        
        var pdfMesSel        = document.getElementById("pdf-mes");
        var pdfAnoInput      = document.getElementById("pdf-ano");
        var pdfFileInput     = document.getElementById("pdf-file");
        var pdfBtnProcessar  = document.getElementById("pdf-processar");
        var pdfStatusEl      = document.getElementById("pdf-status");
        var pdfConflitoEl    = document.getElementById("pdf-conflito");
        var pdfBannerEl      = document.getElementById("pdf-banner");
        var pdfResultadosEl  = document.getElementById("pdf-resultados");
        var pdfHistoricoEl   = document.getElementById("pdf-historico");
        var pdfHistoricoDetalhe = document.getElementById("pdf-historico-detalhe");
        var pdfDrawerRoot    = document.getElementById("pdf-drawer-root");
        var pdfDrawer        = document.getElementById("pdf-drawer");
        var pdfDrawerOverlay = document.getElementById("pdf-drawer-overlay");
        var pdfDrawerFechar  = document.getElementById("pdf-drawer-fechar");
        var pdfDrawerVazio   = document.getElementById("pdf-drawer-vazio");
        var pdfDrawerCompetencia = document.getElementById("pdf-drawer-competencia");
        var pdfDrawerMeses   = document.getElementById("pdf-drawer-meses");
        var pdfDrawerLayout  = document.getElementById("pdf-drawer-layout");
        var pdfDrawerIndice  = document.getElementById("pdf-drawer-indice");
        var pdfDrawerConteudo = document.getElementById("pdf-drawer-conteudo");
        var sidebarPdfBtn    = document.getElementById("sidebar-pdf");
        var bottomPdfBtn     = document.getElementById("bottom-pdf");
        var sidebarPdfBadge  = document.getElementById("sidebar-pdf-badge");
        var bottomPdfBadge   = document.getElementById("bottom-pdf-badge");
        var simDrawerRoot    = document.getElementById("sim-drawer-root");
        var simDrawerOverlay = document.getElementById("sim-drawer-overlay");
        var simDrawerFechar  = document.getElementById("sim-drawer-fechar");
        var simDrawer        = document.getElementById("sim-drawer");
        var simDrawerConteudo = document.getElementById("sim-drawer-conteudo");
        
        var pdfUnidadeId = "";
        var pdfPendente  = null;
        var pdfArquivoCompetencia = null;
        var pdfResultadosVisivel = false;
        var pdfTemConteudo = false;
        /* Nome interno distinto: getter/setter em env (via with) não podem
           reler/reescrever "pdfMesExibido" senão entra em recursão infinita. */
        var pdfMesExibidoAtual = null;
        var pdfIndiceScrollBound = false;
        var pdfIndiceScrollRaf = 0;
        
        function pdfDrawerEhDesktop() {
          return window.matchMedia("(min-width: 769px)").matches;
        }
        
        function pdfLimparIndice() {
          if (pdfDrawerIndice) {
            pdfDrawerIndice.innerHTML = "";
            pdfDrawerIndice.hidden = true;
          }
        }
        
        function pdfRenderIndice(meta) {
          if (!pdfDrawerIndice) return;
          if (!meta.length || !pdfDrawerEhDesktop()) {
            pdfLimparIndice();
            return;
          }
        
          var html = '<p class="pdf-indice-titulo">Neste m\u00EAs</p><ul class="pdf-indice-lista">';
          meta.forEach(function (m, i) {
            var badge = m.classNome
              ? '<span class="pdf-indice-badge" style="--cor:' + m.cor + '">' + m.classNome + "</span>"
              : "";
            var active = i === 0 ? " is-active" : "";
            html += '<li><a class="pdf-indice-item' + active + '" href="#' + m.id + '" style="--cor:' + m.cor + '">';
            html += '<span class="pdf-indice-num">' + m.num + "</span>";
            html += '<span class="pdf-indice-corpo"><span class="pdf-indice-nome">' + m.titulo + "</span>";
            html += '<span class="pdf-indice-meta"><span class="pdf-indice-valor">' + m.valor + "</span>" + badge + "</span>";
            html += "</span></a></li>";
          });
          html += "</ul>";
        
          pdfDrawerIndice.innerHTML = html;
          pdfDrawerIndice.hidden = false;
        }
        
        function pdfMarcarIndiceAtivo(cardId) {
          if (!pdfDrawerIndice || !cardId) return;
          pdfDrawerIndice.querySelectorAll(".pdf-indice-item").forEach(function (item) {
            var ativo = item.getAttribute("href") === "#" + cardId;
            item.classList.toggle("is-active", ativo);
            if (ativo) item.setAttribute("aria-current", "true");
            else item.removeAttribute("aria-current");
          });
        }
        
        function pdfAtualizarIndiceAtivo() {
          if (!pdfDrawerConteudo || !pdfDrawerEhDesktop()) return;
          var cards = pdfDrawerConteudo.querySelectorAll(".pdf-card[id]");
          if (!cards.length) return;
        
          var limite = pdfDrawerConteudo.getBoundingClientRect().top + 96;
          var ativo = cards[0].id;
          cards.forEach(function (card) {
            if (card.getBoundingClientRect().top <= limite) ativo = card.id;
          });
          pdfMarcarIndiceAtivo(ativo);
        }
        
        function pdfOnIndiceScroll() {
          if (pdfIndiceScrollRaf) return;
          pdfIndiceScrollRaf = window.requestAnimationFrame(function () {
            pdfIndiceScrollRaf = 0;
            pdfAtualizarIndiceAtivo();
          });
        }
        
        function pdfBindIndiceScroll() {
          if (!pdfDrawerConteudo || pdfIndiceScrollBound || !pdfDrawerEhDesktop()) return;
          pdfDrawerConteudo.addEventListener("scroll", pdfOnIndiceScroll, { passive: true });
          pdfIndiceScrollBound = true;
          pdfAtualizarIndiceAtivo();
        }
        
        function pdfUnbindIndiceScroll() {
          if (!pdfDrawerConteudo || !pdfIndiceScrollBound) return;
          pdfDrawerConteudo.removeEventListener("scroll", pdfOnIndiceScroll);
          pdfIndiceScrollBound = false;
          if (pdfIndiceScrollRaf) {
            window.cancelAnimationFrame(pdfIndiceScrollRaf);
            pdfIndiceScrollRaf = 0;
          }
        }
        
        function pdfBindIndiceCliques() {
          if (!pdfDrawerIndice || pdfDrawerIndice.dataset.bound === "1") return;
          pdfDrawerIndice.addEventListener("click", function (e) {
            var link = e.target.closest(".pdf-indice-item");
            if (!link || !pdfDrawerConteudo) return;
            var id = (link.getAttribute("href") || "").replace(/^#/, "");
            var card = id ? document.getElementById(id) : null;
            if (!card) return;
            e.preventDefault();
            var cardTop = card.getBoundingClientRect().top;
            var containerTop = pdfDrawerConteudo.getBoundingClientRect().top;
            var destino = pdfDrawerConteudo.scrollTop + (cardTop - containerTop) - 12;
            pdfDrawerConteudo.scrollTo({ top: Math.max(0, destino), behavior: "smooth" });
            pdfMarcarIndiceAtivo(id);
          });
          pdfDrawerIndice.dataset.bound = "1";
        }
        
        if (window.pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
        
        /* ----- Helpers de período ----- */
        function pdfQuadrimestreIndice(mes) { return ESB.quadIndicePorMes(mes); }
        function pdfPosicaoNoQuadrimestre(mes) { return ESB.quadPosicaoNoMes(mes); }
        
        function pdfDetectarQuadAtivo(uid) {
          var ref = obterQuadReferenciaUnidade(uid);
          if (ref) return ref;
        
          var store = pdfLerStore()[uid] || {};
          for (var k in store) {
            var m = Number(k);
            if (m < 1 || m > 12) continue;
            return { indice: ESB.quadIndicePorMes(m), ano: store[k].ano };
          }
          return null;
        }
        
        /* ===== ACOMPANHAMENTO QUADRIMESTRAL: stubs (Passo 7 → quadrimestre.js) ===== */
        var quadApi = null;
        var comPreenchimentoFormulario = function (fn) { if (typeof fn === "function") fn(); };
        var obterRegistrosQuadPdf = function () { return { meses: { 1: null, 2: null, 3: null, 4: null }, quad: null }; };
        var atualizarResultadoLiveB5 = function () {};
        var atualizarResultadoLiveB6 = function () {};
        var atualizarResultadoLiveB3 = function () {};
        var pdfSincronizarPcoTocEditados = function () {};
        var iniciarQuadPainelsParaUnidade = function () {};
        var limparQuadResumosB456 = function () {};
        var atualizarPaineisQuadB456 = function () {};
        var atualizarQuadResetBar = function () {};
        var resetQuadOverridesLocal = function () {};
        var sincronizarMesesAposImportacao = function () {};
        var quadUnidadeId = "";

        function pdfValidarImportacao(uid, mes, ano) {
          var novoIdx = ESB.quadIndicePorMes(mes);
          var store = pdfLerStore()[uid] || {};
        
          for (var k in store) {
            var m = Number(k);
            if (m < 1 || m > 12) continue;
            var reg = store[m];
            var idxExist = ESB.quadIndicePorMes(m);
            if (idxExist !== novoIdx || reg.ano !== ano) {
              return { ok: false, mensagem: ESB.mensagemQuadrimestreIncompativel(mes, ano, { indice: idxExist, ano: reg.ano }) };
            }
          }
        
          var ref = obterQuadReferenciaUnidade(uid);
          if (ref && (ref.indice !== novoIdx || ref.ano !== ano)) {
            return { ok: false, mensagem: ESB.mensagemQuadrimestreIncompativel(mes, ano, ref) };
          }
        
          return { ok: true };
        }
        
        function pdfAtualizarMesesDisponiveis(uid) {
          if (!pdfMesSel) return;
        
          var quadAtivo = pdfDetectarQuadAtivo(uid);
          var opcoes = pdfMesSel.querySelectorAll("option[value]");
          var selecaoValida = false;
        
          opcoes.forEach(function (opt) {
            var m = Number(opt.value);
            if (!m) return;
            var permitido = !quadAtivo || ESB.quadIndicePorMes(m) === quadAtivo.indice;
            opt.disabled = !permitido;
            if (permitido && pdfMesSel.value === opt.value) selecaoValida = true;
          });
        
          if (quadAtivo && !selecaoValida) {
            var primeira = Array.from(opcoes).find(function (opt) {
              return opt.value && !opt.disabled;
            });
            if (primeira) pdfMesSel.value = primeira.value;
          }
        }
        
        function pdfTextoStatus(pos, q) {
          if (pos === 1) {
            return "<strong>Status do acompanhamento:</strong> os resultados correspondem ao 1\u00BA m\u00EAs do " + q.nome +
              ". Os indicadores ainda podem sofrer altera\u00E7\u00F5es at\u00E9 o encerramento do quadrimestre, conforme novas produ\u00E7\u00F5es sejam registradas.";
          }
          if (pos === 4) {
            return "<strong>Status do acompanhamento:</strong> este \u00E9 o 4\u00BA e \u00FAltimo m\u00EAs do " + q.nome +
              ". Com os quatro meses processados, o resultado do quadrimestre est\u00E1 completo.";
          }
          return "<strong>Status do acompanhamento:</strong> dados referentes ao " + pos + "\u00BA m\u00EAs do " + q.nome +
            ". Os resultados j\u00E1 podem ser comparados com os meses anteriores para an\u00E1lise da evolu\u00E7\u00E3o dos indicadores.";
        }
        
        /* ----- Helpers de texto ----- */
        function escHtml(s) {
          return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        }
        function pdfNorm(s) {
          return (s || "").toString().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9 ]/g, " ")
            .replace(/\s+/g, " ").trim();
        }
        function pdfDigitos(s) { return (s || "").replace(/\D/g, ""); }
        
        /* ----- Leitura do arquivo ----- */
        function pdfLerArquivo(file, como) {
          return new Promise(function (resolve, reject) {
            var fr = new FileReader();
            fr.onload = function () { resolve(fr.result); };
            fr.onerror = function () { reject(fr.error); };
            if (como === "array") fr.readAsArrayBuffer(file);
            else fr.readAsDataURL(file);
          });
        }
        
        /* ----- Extração de linhas do PDF ----- */
        async function pdfExtrairLinhas(arrayBuffer) {
          var data = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
          var pdf = await pdfjsLib.getDocument({
            data: data,
            disableFontFace: true,
            useSystemFonts: true,
          }).promise;
          var linhas = [];
          for (var p = 1; p <= pdf.numPages; p++) {
            var page = await pdf.getPage(p);
            var content = await page.getTextContent();
            var mapa = {};
            content.items.forEach(function (it) {
              if (!it.str || !it.str.trim()) return;
              var y = Math.round(it.transform[5]);
              if (!mapa[y]) mapa[y] = [];
              mapa[y].push({ x: it.transform[4], s: it.str });
            });
            Object.keys(mapa).map(Number).sort(function (a, b) { return b - a; }).forEach(function (y) {
              var arr = mapa[y].sort(function (a, b) { return a.x - b.x; });
              var texto = arr.map(function (o) { return o.s; }).join(" ").replace(/\s+/g, " ").trim();
              if (texto) linhas.push(texto);
            });
          }
          return linhas;
        }
        
        /* Agrupa o texto extra\u00EDdo em registros { codigo10, norm, qtd }.
           No relat\u00F3rio do e-SUS o nome do procedimento pode quebrar em v\u00E1rias
           linhas e a quantidade aparecer numa linha separada logo abaixo. Por isso
           acumulamos o texto de cada procedimento at\u00E9 encontrar o primeiro n\u00FAmero,
           que representa a quantidade produzida. */
        function pdfPrepararLinhas(linhasTexto) {
          var registros = [];
          /* Tolerante a espa\u00E7os que o pdf.js insere entre os blocos do c\u00F3digo
             (ex.: "01.01.02.005 -8" ou "01.01.02.005 - 8"). */
          var codeRe = /^(\d{2}\s*\.?\s*\d{2}\s*\.?\s*\d{2}\s*\.?\s*\d{3}\s*-?\s*\d)/;
          var numRe = /\d{1,3}(?:\.\d{3})+|\d+/;
          var codigoAtual = null;
          var partes = [];
        
          function reset() { codigoAtual = null; partes = []; }
        
          function adicionar(codigo, nome, qtd) {
            var bruto = (nome || "").replace(/\s+/g, " ").trim();
            var n = pdfNorm(bruto);
            if (codigo || n) registros.push({ codigo10: codigo, norm: n, nome: bruto, qtd: qtd });
          }
        
          function fechar(qtd) {
            adicionar(codigoAtual, partes.join(" "), qtd);
            reset();
          }
        
          linhasTexto.forEach(function (bruto) {
            var t = (bruto || "").replace(/\s+/g, " ").trim();
            if (!t) return;
        
            var cm = t.match(codeRe);
            if (cm) {
              reset();
              var dig = pdfDigitos(cm[1]);
              codigoAtual = dig.length === 10 ? dig : null;
              var resto = t.slice(cm[0].length).replace(/^\s*-\s*/, "");
              var nm = resto.match(numRe);
              if (nm) {
                partes.push(resto.slice(0, nm.index));
                fechar(parseInt(nm[0].replace(/\./g, ""), 10));
              } else {
                partes.push(resto);
              }
              return;
            }
        
            var nm2 = t.match(numRe);
            if (nm2) {
              var antes = t.slice(0, nm2.index).trim();
              var qtd = parseInt(nm2[0].replace(/\./g, ""), 10);
              if (codigoAtual || partes.length) {
                if (antes) partes.push(antes);
                fechar(qtd);
              } else {
                adicionar(null, antes, qtd);
              }
            } else {
              partes.push(t);
            }
          });
        
          return registros;
        }
        
        function pdfQtdPorCodigo(registros, codFormatado) {
          var d = pdfDigitos(codFormatado);
          var total = 0, achou = false;
          for (var i = 0; i < registros.length; i++) {
            if (registros[i].codigo10 === d && registros[i].qtd !== null && registros[i].qtd !== undefined) {
              total += registros[i].qtd; achou = true;
            }
          }
          return achou ? total : null;
        }
        
        /* N\u00FAcleo do nome: remove complementos entre par\u00EAnteses
           (ex.: "(por dente)", "(individual por sess\u00E3o)") para casar tamb\u00E9m
           quando o relat\u00F3rio abrevia o nome do procedimento. */
        function pdfNucleo(nome) {
          return pdfNorm(String(nome || "").replace(/\([^)]*\)/g, " "));
        }
        
        /* Palavras de liga\u00E7\u00E3o ignoradas no casamento por tokens, para que pequenas
           diferen\u00E7as de reda\u00E7\u00E3o do relat\u00F3rio (ex.: "Raspagem alisamento" vs
           "Raspagem e alisamento") n\u00E3o impe\u00E7am o reconhecimento. */
        var PDF_STOP = { e: 1, de: 1, da: 1, do: 1, das: 1, dos: 1, com: 1, ou: 1, por: 1, a: 1, o: 1, sem: 1, em: 1, para: 1, ao: 1, "no": 1, "na": 1 };
        
        function pdfTokensSig(s) {
          return pdfNorm(s).split(" ").filter(function (t) { return t && t.length > 1 && !PDF_STOP[t]; });
        }
        
        function pdfTokensSet(norm) {
          var set = {};
          (norm || "").split(" ").forEach(function (t) { if (t) set[t] = 1; });
          return set;
        }
        
        function pdfQtdPorNome(registros, nomes) {
          var alvos = nomes
            .map(function (n) { return { full: pdfNorm(n), core: pdfNucleo(n), toks: pdfTokensSig(n) }; })
            .filter(function (a) { return a.full; });
        
          /* Passo 1: o texto lido cont\u00E9m o nome completo do procedimento. */
          for (var i = 0; i < registros.length; i++) {
            var r = registros[i];
            if (!r.norm) continue;
            for (var j = 0; j < alvos.length; j++) {
              if (alvos[j].full && r.norm.indexOf(alvos[j].full) >= 0) return r.qtd;
            }
          }
        
          /* Passo 2: o relat\u00F3rio abreviou o nome (sem o complemento entre
             par\u00EAnteses). Usa o n\u00FAcleo, exigindo um m\u00EDnimo de caracteres para
             evitar casar com procedimentos parecidos por engano. */
          for (var k = 0; k < registros.length; k++) {
            var rr = registros[k];
            if (!rr.norm) continue;
            for (var m = 0; m < alvos.length; m++) {
              var core = alvos[m].core;
              if (core && core.length >= 8 && rr.norm.indexOf(core) >= 0) return rr.qtd;
            }
          }
        
          /* Passo 3: todos os tokens significativos do nome esperado est\u00E3o
             presentes no texto lido (em qualquer ordem), tolerando diferen\u00E7as de
             palavras de liga\u00E7\u00E3o e pontua\u00E7\u00E3o. */
          for (var p = 0; p < registros.length; p++) {
            var reg = registros[p];
            if (!reg.norm) continue;
            var rset = pdfTokensSet(reg.norm);
            for (var q = 0; q < alvos.length; q++) {
              var toks = alvos[q].toks;
              if (toks.length < 2) continue;
              var todos = true;
              for (var z = 0; z < toks.length; z++) { if (!rset[toks[z]]) { todos = false; break; } }
              if (todos) return reg.qtd;
            }
          }
          return null;
        }
        
        function pdfQtdProcedimento(linhas, proc) {
          var q = pdfQtdPorCodigo(linhas, proc.cod);
          if (q === null) q = pdfQtdPorNome(linhas, [proc.nome]);
          return q;
        }
        
        function pdfFmtCodigo(d) {
          if (!d || d.length !== 10) return d || "";
          return d.slice(0, 2) + "." + d.slice(2, 4) + "." + d.slice(4, 6) + "." + d.slice(6, 9) + "-" + d.slice(9);
        }
        
        /* Linhas que n\u00E3o s\u00E3o procedimentos (rodap\u00E9s, cabe\u00E7alhos, totais). */
        function pdfEhRodape(norm) {
          if (!norm) return true;
          if (norm === "procedimentos" || norm === "quantidade" || norm === "competencia" || norm === "qtd") return true;
          return /^(total|subtotal|sub total|cds|pagina|relatorio|consolidado)\b/.test(norm);
        }
        
        /* Agrega os procedimentos lidos no PDF em uma lista \u00DANICA, somando as
           quantidades por c\u00F3digo (ou nome, quando n\u00E3o h\u00E1 c\u00F3digo) e descartando
           rodap\u00E9s/cabe\u00E7alhos. Cada procedimento aparece uma s\u00F3 vez \u2014 \u00E9 a base que
           garante que a contagem nunca ultrapasse o total real do relat\u00F3rio. */
        function pdfAgregarLidos(linhas) {
          var agg = {}, ordem = [];
          linhas.forEach(function (r) {
            if (r.qtd === null || r.qtd === undefined || r.qtd <= 0) return;
            if (pdfEhRodape(r.norm)) return;
            var chave = r.codigo10 || r.norm;
            if (!chave) return;
            if (!agg[chave]) { agg[chave] = { codigo10: r.codigo10 || "", norm: r.norm || "", nome: r.nome || "", qtd: 0, n: 0 }; ordem.push(chave); }
            agg[chave].qtd += r.qtd;
            agg[chave].n += 1;
            if (!agg[chave].nome && r.nome) agg[chave].nome = r.nome;
            if (!agg[chave].norm && r.norm) agg[chave].norm = r.norm;
          });
          return ordem.map(function (k) { return agg[k]; });
        }
        
        /* Dado um procedimento lido (reg) e uma lista de procedimentos esperados,
           devolve o procedimento da lista que corresponde, ou null. Casa por c\u00F3digo
           e, na falta dele, por nome (completo, n\u00FAcleo sem par\u00EAnteses ou conjunto
           de tokens significativos). */
        function pdfMatchProc(reg, lista) {
          var i, p;
          if (reg.codigo10) {
            for (i = 0; i < lista.length; i++) {
              if (reg.codigo10 === pdfDigitos(lista[i].cod)) return lista[i];
            }
          }
          if (!reg.norm) return null;
          var rset = pdfTokensSet(reg.norm);
          for (i = 0; i < lista.length; i++) {
            p = lista[i];
            var full = pdfNorm(p.nome);
            if (full && reg.norm.indexOf(full) >= 0) return p;
            var core = pdfNucleo(p.nome);
            if (core && core.length >= 8 && reg.norm.indexOf(core) >= 0) return p;
            var toks = pdfTokensSig(p.nome);
            if (toks.length >= 2) {
              var todos = true;
              for (var z = 0; z < toks.length; z++) { if (!rset[toks[z]]) { todos = false; break; } }
              if (todos) return p;
            }
          }
          return null;
        }
        
        /* Classifica os procedimentos lidos em grupos de um indicador, contando cada
           procedimento UMA \u00DANICA vez (registro-c\u00EAntrico). Como percorre os lidos e
           n\u00E3o a lista esperada, \u00E9 imposs\u00EDvel somar o mesmo registro duas vezes. */
        function pdfClassificar(lidos, grupos) {
          var res = {};
          grupos.forEach(function (g) { res[g.chave] = { itens: [], total: 0 }; });
          lidos.forEach(function (reg) {
            for (var i = 0; i < grupos.length; i++) {
              var p = pdfMatchProc(reg, grupos[i].lista);
              if (p) {
                res[grupos[i].chave].itens.push({ cod: p.cod, nome: p.nome, qtd: reg.qtd });
                res[grupos[i].chave].total += reg.qtd;
                break;
              }
            }
          });
          return res;
        }
        
        /* Diagn\u00F3stico de leitura: usa a mesma base agregada e separa os
           procedimentos que N\u00C3O foram reconhecidos por nenhuma lista de indicador.
           Funciona tamb\u00E9m em relat\u00F3rios que trazem apenas nomes, sem c\u00F3digo. */
        function pdfDiagnostico(lidos) {
          var TODOS = B5_PREVENTIVOS
            .concat(B5_OUTROS, B6_TRA, B6_OUTROS, B3_EXODONTIAS, B3_PREVENTIVOS, B3_CURATIVOS, [
              { cod: "", nome: "Primeira consulta odontol\u00F3gica program\u00E1tica" },
              { cod: "", nome: "Tratamento odontol\u00F3gico conclu\u00EDdo" },
            ]);
        
          var naoReconhecidos = [];
          var totalLido = 0, totalReconhecido = 0, temDuplicados = false;
        
          lidos.forEach(function (reg) {
            if (reg.n > 1) temDuplicados = true;
            totalLido += reg.qtd;
            if (pdfMatchProc(reg, TODOS)) {
              totalReconhecido += reg.qtd;
            } else {
              naoReconhecidos.push({ codigo10: reg.codigo10, nome: reg.nome, qtd: reg.qtd, n: reg.n });
            }
          });
        
          naoReconhecidos.sort(function (a, b) { return b.qtd - a.qtd; });
          return {
            naoReconhecidos: naoReconhecidos,
            totalLido: totalLido,
            totalReconhecido: totalReconhecido,
            totalNaoReconhecido: totalLido - totalReconhecido,
            temDuplicados: temDuplicados,
          };
        }
        
        /* ----- Cálculo dos indicadores a partir das linhas ----- */
        function pdfCalcularDados(linhas) {
          var lidos = pdfAgregarLidos(linhas);
        
          var b5 = pdfClassificar(lidos, [
            { chave: "num", lista: B5_PREVENTIVOS },
            { chave: "out", lista: B5_OUTROS },
          ]);
          var b6 = pdfClassificar(lidos, [
            { chave: "num", lista: B6_TRA },
            { chave: "out", lista: B6_OUTROS },
          ]);
          var b3 = pdfClassificar(lidos, [
            { chave: "exo", lista: B3_EXODONTIAS },
            { chave: "prev", lista: B3_PREVENTIVOS },
            { chave: "cur", lista: B3_CURATIVOS },
          ]);
        
          return {
            b5: { num: b5.num, out: b5.out },
            b6: { num: b6.num, out: b6.out },
            b3: { exo: b3.exo, prev: b3.prev, cur: b3.cur },
            pcoPrimeiras: pdfQtdPorNome(linhas, ["primeira consulta odontologica programatica", "primeira consulta odontologica"]),
            tocConcluido: pdfQtdPorNome(linhas, ["tratamento odontologico concluido", "tratamento concluido"]),
            diagnostico: pdfDiagnostico(lidos),
          };
        }
        
        function pdfContarEncontrados(d) {
          var n = d.b5.num.itens.length + d.b5.out.itens.length +
                  d.b6.num.itens.length + d.b6.out.itens.length +
                  d.b3.exo.itens.length + d.b3.prev.itens.length + d.b3.cur.itens.length;
          if (d.pcoPrimeiras !== null) n++;
          if (d.tocConcluido !== null) n++;
          return n;
        }
        
        /* ----- Persistência ----- */
        function pdfLerStore() {
          try { var raw = localStorage.getItem(PDF_STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
          catch (e) { return {}; }
        }
        function pdfTentarGravar(store) {
          try { localStorage.setItem(PDF_STORAGE_KEY, JSON.stringify(store)); return true; }
          catch (e) { return false; }
        }
        function pdfSalvarComFallback(store, registro) {
          if (pdfTentarGravar(store)) return true;
          if (registro.arquivo) registro.arquivo.dataUrl = null;
          Object.keys(store).forEach(function (u) {
            Object.keys(store[u]).forEach(function (m) {
              var r = store[u][m];
              if (r.arquivo) r.arquivo.dataUrl = null;
              if (r.versoes) r.versoes.forEach(function (v) { if (v.arquivo) v.arquivo.dataUrl = null; });
            });
          });
          return pdfTentarGravar(store);
        }

        function pdfEhArquivoPdf(file) {
          if (!file) return false;
          var nome = String(file.name || "").toLowerCase();
          if (nome.slice(-4) === ".pdf") return true;
          var tipo = String(file.type || "").toLowerCase();
          return tipo === "application/pdf";
        }

        function pdfMensagemErroLeitura(err, etapa) {
          var raw = String((err && (err.message || err.name)) || "");
          var lower = raw.toLowerCase();

          if (/password|senha|encrypted/i.test(raw)) {
            return "Este PDF est\u00E1 protegido por senha. Exporte novamente pelo e-SUS APS sem prote\u00E7\u00E3o e tente de novo.";
          }
          if (/invalid pdf|missing pdf header|not a pdf|format error|corrupt/i.test(lower)) {
            return "O arquivo n\u00E3o parece um PDF v\u00E1lido. Confirme se \u00E9 o relat\u00F3rio de produ\u00E7\u00E3o exportado do e-SUS APS e selecione o arquivo novamente.";
          }
          if (/network|failed to fetch|load/i.test(lower) && etapa === "leitura do arquivo") {
            return "N\u00E3o foi poss\u00EDvel ler o arquivo. Verifique se ele n\u00E3o foi movido ou corrompido e selecione-o de novo.";
          }
          return "N\u00E3o foi poss\u00EDvel concluir a " + etapa + ". " +
            "Confirme se o arquivo \u00E9 o relat\u00F3rio de produ\u00E7\u00E3o do e-SUS APS e tente novamente." +
            (raw ? " (Detalhe t\u00E9cnico: " + raw + ")" : "");
        }

        function pdfMsgEspacoInsuficiente() {
          return "N\u00E3o h\u00E1 espa\u00E7o suficiente neste navegador para salvar o relat\u00F3rio. " +
            "Libere espa\u00E7o (ou reinicie um quadrimestre antigo) e tente importar de novo.";
        }
        
        /* ----- Interpretação TOC ----- */
        function pdfInterpToc(classId, pct) {
          var arred = pct !== null ? Math.round(pct) : 0;
          if (classId === "otimo") return { tipo: "sucesso", icone: "\u2713", titulo: "\u00D3timo \u2014 tratamentos sendo conclu\u00EDdos", texto: "Cerca de <strong>" + arred + " a cada 100</strong> primeiras consultas resultaram em tratamento conclu\u00EDdo. A equipe est\u00E1 fechando bem os tratamentos iniciados." };
          if (classId === "bom") return { tipo: "info", icone: "\u2192", titulo: "Bom \u2014 perto do ideal", texto: "Cerca de <strong>" + arred + " a cada 100</strong> primeiras consultas evolu\u00EDram para tratamento conclu\u00EDdo. Acompanhe os casos em aberto para passar de 75%." };
          if (classId === "suficiente") return { tipo: "atencao", icone: "!", titulo: "Suficiente \u2014 d\u00E1 para concluir mais", texto: "Apenas cerca de <strong>" + arred + " a cada 100</strong> primeiras consultas viraram tratamento conclu\u00EDdo. Refor\u00E7e o acompanhamento dos tratamentos iniciados." };
          return { tipo: "critico", icone: "\u2716", titulo: "Baixa conclus\u00E3o de tratamentos", texto: "Cerca de <strong>" + arred + " a cada 100</strong> primeiras consultas resultaram em tratamento conclu\u00EDdo. Muitos tratamentos iniciados n\u00E3o est\u00E3o sendo finalizados." };
        }
        
        /* ----- Render: blocos de procedimentos ----- */
        function pdfBlocoProcs(titulo, itens, total, classe) {
          var li = (itens && itens.length)
            ? itens.map(function (it) {
                var cod = (it.cod && it.cod !== "\u2014") ? '<span class="pdf-proc-cod">' + it.cod + "</span>" : "";
                return '<li><span class="pdf-proc-nome">' + cod + escHtml(it.nome) + '</span><span class="pdf-proc-qtd">' + Number(it.qtd).toLocaleString("pt-BR") + "</span></li>";
              }).join("")
            : '<li class="pdf-procs-vazio">Nenhum procedimento com produ\u00E7\u00E3o no per\u00EDodo.</li>';
          return '<div class="pdf-procs-bloco ' + (classe || "") + '">' +
            '<p class="pdf-procs-bloco-titulo"><span>' + titulo + '</span><span class="pdf-procs-bloco-total">' + Number(total).toLocaleString("pt-BR") + "</span></p>" +
            '<ul class="pdf-procs-lista">' + li + "</ul></div>";
        }
        
        function pdfMetricasHtml(metricas) {
          if (!metricas || !metricas.length) return "";
          return '<div class="pdf-metricas">' + metricas.map(function (m) {
            return '<div class="pdf-metrica"><span class="pdf-metrica-label">' + m.label + '</span><span class="pdf-metrica-valor">' + m.valor + "</span></div>";
          }).join("") + "</div>";
        }
        
        function pdfCardResumo(o) {
          var interpHtml = "";
          if (o.interp) {
            interpHtml = '<div class="pdf-card-interp pdf-card-interp--' + o.interp.tipo + '">' +
              '<span class="pdf-card-interp-icone">' + o.interp.icone + "</span>" +
              '<div class="pdf-card-interp-corpo"><p class="pdf-card-interp-titulo">' + o.interp.titulo + '</p><p class="pdf-card-interp-texto">' + o.interp.texto + "</p></div></div>";
          }
          var resultadoHtml = o.pct != null
            ? '<div class="pdf-card-resultado"><span class="pdf-card-pct">' + fmtPct(o.pct) + '</span><span class="pdf-card-badge">' + o.classNome + "</span></div>"
            : "";
          return '<article class="pdf-card" id="' + o.cardId + '" style="--cor: ' + o.cor + '">' +
            '<div class="pdf-card-top"><h4 class="pdf-card-titulo"><span class="pdf-card-num">' + o.num + '.</span>' + o.titulo + "</h4>" +
            resultadoHtml + "</div>" +
            pdfMetricasHtml(o.metricas) +
            interpHtml +
            "</article>";
        }
        
        function pdfCardCalc(o) {
          var interpHtml = "";
          if (o.interp) {
            interpHtml = '<div class="pdf-card-interp pdf-card-interp--' + o.interp.tipo + '">' +
              '<span class="pdf-card-interp-icone">' + o.interp.icone + "</span>" +
              '<div class="pdf-card-interp-corpo"><p class="pdf-card-interp-titulo">' + o.interp.titulo + '</p><p class="pdf-card-interp-texto">' + o.interp.texto + "</p></div></div>";
          }
          return '<article class="pdf-card" id="' + o.cardId + '" style="--cor: ' + o.cor + '">' +
            '<div class="pdf-card-top"><h4 class="pdf-card-titulo"><span class="pdf-card-num">' + o.num + '.</span>' + o.titulo + "</h4>" +
            '<div class="pdf-card-resultado"><span class="pdf-card-pct">' + (o.valorTexto != null ? o.valorTexto : fmtPct(o.pct)) + '</span><span class="pdf-card-badge">' + o.classNome + "</span></div></div>" +
            (o.blocos && o.blocos.length ? '<div class="pdf-procs-grid">' + o.blocos.join("") + "</div>" : "") +
            interpHtml +
            (o.nota ? '<p class="pdf-card-info">' + o.nota + "</p>" : "") +
            "</article>";
        }
        
        function pdfCardSemDados(o) {
          return '<article class="pdf-card pdf-card--sem-dados" id="' + o.cardId + '" style="--cor: ' + o.cor + '">' +
            '<div class="pdf-card-top"><h4 class="pdf-card-titulo"><span class="pdf-card-num">' + o.num + '.</span>' + o.titulo + "</h4>" +
            '<div class="pdf-card-resultado"><span class="pdf-card-pct pdf-card-pct--vazio">Sem dados</span></div></div>' +
            '<p class="pdf-card-info pdf-card-info--aviso">' + o.info + "</p></article>";
        }
        
        function pdfCardInfo(o) {
          return '<article class="pdf-card" id="' + o.cardId + '" style="--cor: ' + o.cor + '">' +
            '<div class="pdf-card-top"><h4 class="pdf-card-titulo"><span class="pdf-card-num">' + o.num + '.</span>' + o.titulo + "</h4></div>" +
            '<div class="pdf-procs-grid">' + o.blocos.join("") + "</div>" +
            '<p class="pdf-card-info">' + o.info + "</p></article>";
        }
        
        /* ----- Render: banner do período ----- */
        function pdfRenderBanner(registro) {
          var mes = registro.mes, ano = registro.ano;
          var q = PDF_QUADRIMESTRES[pdfQuadrimestreIndice(mes)];
          var pos = pdfPosicaoNoQuadrimestre(mes);
          var arq = "";
          if (registro.arquivo && registro.arquivo.nome) {
            arq = '<p class="pdf-banner-arquivo">Arquivo importado: <strong>' + escHtml(registro.arquivo.nome) + "</strong></p>";
          }
          pdfBannerEl.innerHTML =
            '<span class="pdf-banner-tag">\u2713 Relat\u00F3rio processado com sucesso</span>' +
            '<div class="pdf-banner-grid">' +
              '<div class="pdf-banner-item"><span class="pdf-banner-item-label">Compet\u00EAncia</span><span class="pdf-banner-item-valor">' + PDF_MESES[mes - 1] + " de " + ano + "</span></div>" +
              '<div class="pdf-banner-item"><span class="pdf-banner-item-label">Quadrimestre</span><span class="pdf-banner-item-valor">' + q.nome + " (" + q.intervalo + ")</span></div>" +
              '<div class="pdf-banner-item"><span class="pdf-banner-item-label">Posi\u00E7\u00E3o no quadrimestre</span><span class="pdf-banner-item-valor">' + pos + "\u00BA m\u00EAs de 4</span></div>" +
            "</div>" +
            '<p class="pdf-banner-status">' + pdfTextoStatus(pos, q) + "</p>" + arq;
          pdfBannerEl.hidden = false;
        }
        
        /* ----- Render: resultados (somente procedimentos encontrados) ----- */
        function pdfRenderResultados(registro) {
          var d = registro.dados;
          var cards = [];
          var indice = [];
        
          if (d.pcoPrimeiras !== null && populacaoAtual > 0) {
            var pcoRes = calcularResultadoMesPco(populacaoAtual, d.pcoPrimeiras);
            var pcoCls = classificacaoPcoPorId(pcoRes.classAtual);
            indice.push({
              id: "pdf-card-1",
              num: "1",
              titulo: "Primeira consulta programada",
              valor: fmtPct(pcoRes.pct),
              classNome: pcoCls.nome,
              cor: pcoCls.cor,
            });
            cards.push(pdfCardResumo({
              cardId: "pdf-card-1",
              num: "1",
              titulo: "Primeira consulta programada",
              cor: pcoCls.cor,
              pct: pcoRes.pct,
              classNome: pcoCls.nome,
              metricas: [
                { label: "Primeiras consultas no m\u00EAs", valor: Number(d.pcoPrimeiras).toLocaleString("pt-BR") },
              ],
            }));
          } else if (d.pcoPrimeiras !== null) {
            indice.push({
              id: "pdf-card-1",
              num: "1",
              titulo: "Primeira consulta programada",
              valor: Number(d.pcoPrimeiras).toLocaleString("pt-BR"),
              classNome: null,
              cor: "#0284c7",
            });
            cards.push(pdfCardResumo({
              cardId: "pdf-card-1",
              num: "1",
              titulo: "Primeira consulta programada",
              cor: "#0284c7",
              metricas: [
                { label: "Primeiras consultas no m\u00EAs", valor: Number(d.pcoPrimeiras).toLocaleString("pt-BR") },
              ],
            }));
          }
        
          if (d.tocConcluido !== null && d.pcoPrimeiras !== null && d.pcoPrimeiras > 0) {
            var tpct = (d.tocConcluido / d.pcoPrimeiras) * 100;
            var tcid = classificarToc(tpct), tc = classificacaoTocPorId(tcid);
            indice.push({
              id: "pdf-card-2",
              num: "2",
              titulo: "Tratamento odontol\u00F3gico conclu\u00EDdo",
              valor: fmtPct(tpct),
              classNome: tc.nome,
              cor: tc.cor,
            });
            cards.push(pdfCardResumo({
              cardId: "pdf-card-2",
              num: "2",
              titulo: "Tratamento odontol\u00F3gico conclu\u00EDdo",
              cor: tc.cor,
              pct: tpct,
              classNome: tc.nome,
              metricas: [
                { label: "Tratamentos conclu\u00EDdos", valor: Number(d.tocConcluido).toLocaleString("pt-BR") },
                { label: "Primeiras consultas", valor: Number(d.pcoPrimeiras).toLocaleString("pt-BR") },
              ],
              interp: pdfInterpToc(tcid, tpct),
            }));
          }
        
          (function pdfCardEscovacao() {
            var esc = pdfUnidadeId ? lerEscovacaoStorage()[pdfUnidadeId] : null;
            var classId = resolverClassificacaoEscovacaoLocal(esc);
            if (classId) {
              var ec = escConceitoPorId(classId) || classificacaoPcoPorId(classId);
              indice.push({
                id: "pdf-card-3",
                num: "3",
                titulo: "Escova\u00E7\u00E3o supervisionada",
                valor: ec.nome,
                classNome: ec.nome,
                cor: ec.cor,
              });
              cards.push(pdfCardCalc({
                cardId: "pdf-card-3",
                num: "3",
                titulo: "Escova\u00E7\u00E3o supervisionada",
                cor: ec.cor,
                valorTexto: ec.nome,
                classNome: ec.nome,
                blocos: [],
                nota: "Classifica\u00E7\u00E3o informada em <strong>Indicadores \u2192 Escova\u00E7\u00E3o supervisionada</strong> (conceito do quadrimestre). Este indicador n\u00E3o vem do relat\u00F3rio PDF.",
              }));
            } else {
              indice.push({
                id: "pdf-card-3",
                num: "3",
                titulo: "Escova\u00E7\u00E3o supervisionada",
                valor: "\u2014",
                classNome: null,
                cor: "#64748b",
              });
              cards.push(pdfCardSemDados({
                cardId: "pdf-card-3",
                num: "3",
                titulo: "Escova\u00E7\u00E3o supervisionada",
                cor: "#64748b",
                info: "N\u00E3o h\u00E1 classifica\u00E7\u00E3o informada. Este indicador <strong>n\u00E3o \u00E9 preenchido pelo PDF</strong> \u2014 escolha Regular, Suficiente, Bom ou \u00D3timo em <strong>Indicadores \u2192 Escova\u00E7\u00E3o supervisionada</strong>.",
              }));
            }
          })();
        
          var b5den = d.b5.num.total + d.b5.out.total;
          if (b5den > 0) {
            var p5 = (d.b5.num.total / b5den) * 100, c5id = classificarB5(p5), c5 = classificacaoB5PorId(c5id);
            indice.push({
              id: "pdf-card-4",
              num: "4",
              titulo: "Procedimentos preventivos",
              valor: fmtPct(p5),
              classNome: c5.nome,
              cor: c5.cor,
            });
            cards.push(pdfCardCalc({
              cardId: "pdf-card-4",
              num: "4", titulo: "Procedimentos individuais preventivos", cor: c5.cor, pct: p5, classNome: c5.nome,
              blocos: [
                pdfBlocoProcs("Numerador \u2014 preventivos", d.b5.num.itens, d.b5.num.total, "pdf-procs-bloco--num"),
                pdfBlocoProcs("Demais individuais (s\u00F3 no denominador)", d.b5.out.itens, d.b5.out.total, ""),
              ],
              interp: interpretacaoB5(c5id, p5, null),
            }));
          }
        
          var b6den = d.b6.num.total + d.b6.out.total;
          if (b6den > 0) {
            var p6 = (d.b6.num.total / b6den) * 100, c6id = classificarB6(p6), c6 = classificacaoB6PorId(c6id);
            indice.push({
              id: "pdf-card-5",
              num: "5",
              titulo: "TRA/ART",
              valor: fmtPct(p6),
              classNome: c6.nome,
              cor: c6.cor,
            });
            cards.push(pdfCardCalc({
              cardId: "pdf-card-5",
              num: "5", titulo: "Tratamento Restaurador Atraum\u00E1tico (TRA/ART)", cor: c6.cor, pct: p6, classNome: c6.nome,
              blocos: [
                pdfBlocoProcs("Numerador \u2014 TRA/ART", d.b6.num.itens, d.b6.num.total, "pdf-procs-bloco--num"),
                pdfBlocoProcs("Demais restaura\u00E7\u00F5es (denominador)", d.b6.out.itens, d.b6.out.total, ""),
              ],
              interp: interpretacaoB6(c6id, p6),
            }));
          }
        
          var b3den = d.b3.exo.total + d.b3.prev.total + d.b3.cur.total;
          if (b3den > 0) {
            var p3 = (d.b3.exo.total / b3den) * 100, c3id = classificarB3(p3), c3 = classificacaoB3PorId(c3id);
            indice.push({
              id: "pdf-card-6",
              num: "6",
              titulo: "Taxa de exodontias",
              valor: fmtPct(p3),
              classNome: c3.nome,
              cor: c3.cor,
            });
            cards.push(pdfCardCalc({
              cardId: "pdf-card-6",
              num: "6", titulo: "Taxa de exodontias", cor: c3.cor, pct: p3, classNome: c3.nome,
              blocos: [
                pdfBlocoProcs("Numerador \u2014 exodontias", d.b3.exo.itens, d.b3.exo.total, "pdf-procs-bloco--num"),
                pdfBlocoProcs("Preventivos (denominador)", d.b3.prev.itens, d.b3.prev.total, ""),
                pdfBlocoProcs("Curativos (denominador)", d.b3.cur.itens, d.b3.cur.total, ""),
              ],
              interp: interpretacaoB3(c3id, p3),
            }));
          }
        
          var base = cards.length
            ? cards.join("")
            : '<p class="pdf-card-info">Nenhum procedimento dos indicadores foi reconhecido neste relat\u00F3rio. Verifique se o arquivo \u00E9 o relat\u00F3rio de produ\u00E7\u00E3o do e-SUS APS.</p>';
        
          pdfResultadosEl.innerHTML = base;
          pdfRenderIndice(indice);
          pdfBindIndiceCliques();
          pdfTemConteudo = true;
          atualizarSidebarPdf(pdfUnidadeId);
          pdfAtualizarDrawer();
          if (pdfDrawerConteudo) pdfDrawerConteudo.scrollTop = 0;
          pdfBindIndiceScroll();
        }
        
        function contarMesesImportadosQuad(uid) {
          if (!uid) return 0;
          var info = obterRegistrosQuadPdf(uid);
          var n = 0;
          for (var p = 1; p <= 4; p++) {
            if (info.meses[p]) n++;
          }
          return n;
        }
        
        function atualizarSidebarPdf(uid) {
          var n = contarMesesImportadosQuad(uid);
          var show = n > 0 || pdfTemConteudo;
          [sidebarPdfBtn, bottomPdfBtn].forEach(function (btn) {
            if (btn) btn.hidden = !show;
          });
          [sidebarPdfBadge, bottomPdfBadge].forEach(function (badge) {
            if (!badge) return;
            if (n > 0) {
              badge.hidden = false;
              badge.textContent = String(n);
            } else {
              badge.hidden = true;
              badge.textContent = "";
            }
          });
        }
        
        function pdfDrawerTemDados() {
          var temHist = pdfHistoricoEl && !pdfHistoricoEl.hidden && pdfHistoricoEl.innerHTML.trim().length > 0;
          return pdfTemConteudo || temHist;
        }
        
        function pdfAbrirDrawer(origem) {
          if (!pdfDrawerTemDados()) {
            var sec = document.getElementById("pdf-import");
            if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
          }
          if (drawers) drawers.simFecharDrawer();
          pdfResultadosVisivel = true;
          pdfAtualizarDrawer();
          if (drawers) drawers.pdfNotificarAberto(origem);
        }
        
        function pdfFecharDrawer(opts) {
          pdfResultadosVisivel = false;
          pdfUnbindIndiceScroll();
          pdfAtualizarDrawer();
          if (drawers) drawers.pdfNotificarFechado(opts);
        }
        
        function pdfAtualizarDrawer() {
          if (pdfDrawerRoot) {
            pdfDrawerRoot.hidden = !pdfResultadosVisivel;
            pdfDrawerRoot.classList.toggle("is-aberto", pdfResultadosVisivel);
          }
        
          var temHist = pdfHistoricoEl && !pdfHistoricoEl.hidden && pdfHistoricoEl.innerHTML.trim().length > 0;
          var temLayout = pdfTemConteudo || temHist;
        
          if (pdfDrawerLayout) {
            pdfDrawerLayout.hidden = !temLayout;
          }
          if (pdfResultadosEl) {
            pdfResultadosEl.hidden = !pdfTemConteudo;
          }
          if (pdfDrawerVazio) {
            pdfDrawerVazio.hidden = temLayout;
          }
        
          if (pdfResultadosVisivel && pdfDrawerEhDesktop()) {
            pdfBindIndiceScroll();
          } else {
            pdfUnbindIndiceScroll();
          }
        
          if (pdfUnidadeId && pdfMesExibido) {
            pdfRenderDrawerNavegacao(pdfUnidadeId, pdfMesExibido);
          }
        
          if (drawers) drawers.syncDrawerNav();
        }
        
        drawers = window.IndicaDrawers.create({
          unidadeSelect: unidadeSelect,
          getPopulacao: function () { return populacaoAtual; },
          navIndicadores: navIndicadores,
          bottomIndicadores: bottomIndicadores,
          navSimulador: navSimulador,
          bottomNota: bottomNota,
          sidebarPdfBtn: sidebarPdfBtn,
          bottomPdfBtn: bottomPdfBtn,
          sidebarSiapsBtn: document.getElementById("sidebar-siaps"),
          bottomSiapsBtn: document.getElementById("bottom-siaps"),
          simDrawerRoot: simDrawerRoot,
          simDrawer: simDrawer,
          simDrawerOverlay: simDrawerOverlay,
          simDrawerFechar: simDrawerFechar,
          simDrawerConteudo: simDrawerConteudo,
          ativarIndicador: ativarIndicador,
          getPdfVisivel: function () { return pdfResultadosVisivel; },
          setPdfVisivel: function (v) { pdfResultadosVisivel = v; },
          pdfAtualizarDrawer: pdfAtualizarDrawer,
          pdfFecharDrawer: pdfFecharDrawer,
          pdfDrawer: pdfDrawer,
          siapsDrawer: document.getElementById("siaps-drawer"),
          getSiapsVisivel: function () {
            return !!(env.siapsApi && env.siapsApi.getVisivel && env.siapsApi.getVisivel());
          },
          siapsFecharDrawer: function (opts) {
            if (env.siapsApi && env.siapsApi.fecharDrawer) env.siapsApi.fecharDrawer(opts);
          },
        });
        drawers.registrarEventos();
        
        /* ----- Navegação do drawer (competência + chips) ----- */
        function pdfRenderDrawerNavegacao(uid, mesCalendario) {
          if (!uid || !mesCalendario) {
            if (pdfDrawerCompetencia) pdfDrawerCompetencia.hidden = true;
            if (pdfDrawerMeses) {
              pdfDrawerMeses.hidden = true;
              pdfDrawerMeses.innerHTML = "";
            }
            return;
          }
        
          pdfMesExibido = mesCalendario;
          var pacote = obterRegistrosQuadPdf(uid);
          var reg = (pdfLerStore()[uid] || {})[mesCalendario];
        
          if (pdfDrawerCompetencia) {
            if (reg) {
              var pos = pdfPosicaoNoQuadrimestre(mesCalendario);
              pdfDrawerCompetencia.textContent =
                PDF_MESES[mesCalendario - 1] + " de " + reg.ano + " \u00B7 " + pos + "\u00BA m\u00EAs do quadrimestre";
              pdfDrawerCompetencia.hidden = false;
            } else {
              pdfDrawerCompetencia.hidden = true;
            }
          }
        
          if (!pdfDrawerMeses) return;
        
          if (!pacote.quad) {
            pdfDrawerMeses.hidden = true;
            pdfDrawerMeses.innerHTML = "";
            return;
          }
        
          var html = "";
          for (var pos = 1; pos <= 4; pos++) {
            var regPos = pacote.meses[pos];
            var ativo = !!(regPos && regPos.mes === mesCalendario);
            var chipClass = "pdf-drawer-mes-chip";
            if (ativo) chipClass += " is-active";
            if (regPos) chipClass += " is-preenchido";
            else chipClass += " is-vazio";
        
            if (regPos) {
              html += '<button type="button" class="' + chipClass + '" data-mes-cal="' + regPos.mes + '" aria-pressed="' + (ativo ? "true" : "false") + '">';
              html += '  <span class="pdf-drawer-mes-chip-label">' + QUAD_MESES_LABEL[pos - 1] + "</span>";
              html += '  <span class="pdf-drawer-mes-chip-comp">' + PDF_MESES[regPos.mes - 1] + " de " + regPos.ano + "</span>";
              html += "</button>";
            } else {
              html += '<span class="' + chipClass + '" aria-disabled="true">';
              html += '  <span class="pdf-drawer-mes-chip-label">' + QUAD_MESES_LABEL[pos - 1] + "</span>";
              html += '  <span class="pdf-drawer-mes-chip-comp">Sem importa\u00E7\u00E3o</span>';
              html += "</span>";
            }
          }
        
          pdfDrawerMeses.innerHTML = html;
          pdfDrawerMeses.hidden = false;
        
          pdfDrawerMeses.querySelectorAll("button[data-mes-cal]").forEach(function (btn) {
            btn.addEventListener("click", function () {
              var cal = Number(btn.dataset.mesCal);
              var r = (pdfLerStore()[uid] || {})[cal];
              if (r) pdfAplicarRegistro(uid, cal, r, false);
            });
          });
        }
        
        /* ----- Render: histórico do quadrimestre ----- */
        function pdfRenderHistorico(uid, mesRef) {
          var q = PDF_QUADRIMESTRES[pdfQuadrimestreIndice(mesRef)];
          var dadosUni = pdfLerStore()[uid] || {};
          var anoRef = dadosUni[mesRef] ? dadosUni[mesRef].ano : (pdfAnoInput.value || new Date().getFullYear());
          var rows = q.meses.map(function (m) {
            var reg = dadosUni[m];
            var status = reg
              ? '<span class="pdf-hist-status pdf-hist-status--ok">Processado</span>'
              : '<span class="pdf-hist-status pdf-hist-status--aguardando">Aguardando importa\u00E7\u00E3o</span>';
            var comp = reg ? PDF_MESES[m - 1] + " de " + reg.ano : PDF_MESES[m - 1];
            var quando = reg ? new Date(reg.importadoEm).toLocaleString("pt-BR") : "\u2014";
            var arq = reg && reg.arquivo && reg.arquivo.nome ? escHtml(reg.arquivo.nome) : "\u2014";
            return "<tr" + (m === mesRef ? ' class="is-atual"' : "") + "><td><strong>" + pdfPosicaoNoQuadrimestre(m) + "\u00BA</strong></td><td>" + comp + "</td><td>" + status + "</td><td>" + quando + "</td><td class=\"pdf-hist-arquivo\">" + arq + "</td></tr>";
          }).join("");
        
          pdfHistoricoEl.innerHTML =
            '<h3 class="pdf-historico-titulo">Hist\u00F3rico do ' + q.nome + " de " + anoRef + "</h3>" +
            '<p class="pdf-historico-sub">Registro dos relat\u00F3rios importados neste quadrimestre. Use os meses acima para alternar a visualiza\u00E7\u00E3o.</p>' +
            '<div class="tabela-wrap"><table class="pdf-historico-tabela"><thead><tr><th>M\u00EAs</th><th>Compet\u00EAncia</th><th>Status</th><th>Importado em</th><th>Arquivo</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
          pdfHistoricoEl.hidden = false;
          if (pdfHistoricoDetalhe) pdfHistoricoDetalhe.hidden = false;
        
          atualizarSidebarPdf(uid);
          if (pdfResultadosVisivel) pdfAtualizarDrawer();
        }
        
        /* ----- Preenchimento automático dos formulários existentes ----- */
        function pdfPreencherInputs(itens, prefixo) {
          itens.forEach(function (it) {
            var el = document.getElementById(prefixo + "-" + pdfDigitos(it.cod));
            if (el) el.value = it.qtd;
          });
        }
        
        function pdfPreencherFormularios(registro, opcoes) {
          opcoes = opcoes || {};
          var d = registro.dados;
        
          comPreenchimentoFormulario(function () {
            document.querySelectorAll(".b5-item-input").forEach(function (i) { i.value = ""; });
            document.querySelectorAll(".b6-item-input").forEach(function (i) { i.value = ""; });
        
            pdfPreencherInputs(d.b5.num.itens.concat(d.b5.out.itens), "b5");
            if (typeof aplicarFiltroB5 === "function") aplicarFiltroB5();
            if (typeof renderizarMetasB5 === "function") renderizarMetasB5();
        
            pdfPreencherInputs(d.b6.num.itens.concat(d.b6.out.itens), "b6");
            if (typeof aplicarFiltroB6 === "function") aplicarFiltroB6();
            if (typeof renderizarMetasB6 === "function") renderizarMetasB6();
        
            var b3exo = document.getElementById("b3-exo");
            var b3prev = document.getElementById("b3-prev");
            var b3cur = document.getElementById("b3-cur");
            if (b3exo) b3exo.value = d.b3.exo.total || "";
            if (b3prev) b3prev.value = d.b3.prev.total || "";
            if (b3cur) b3cur.value = d.b3.cur.total || "";
            if (typeof renderizarMetasB3 === "function") renderizarMetasB3();
          });
        
          /* PCO/TOC s\u00F3 sincronizam na importa\u00E7\u00E3o nova. Ao restaurar (F5 / trocar m\u00EAs),
             preservar edi\u00E7\u00F5es manuais j\u00E1 salvas em B1 e B2. */
          if (!opcoes.syncPcoToc) return true;
        
          var pos = pdfPosicaoNoQuadrimestre(registro.mes);
          var erroQuad = null;
        
          if (pcoUnidadeId && d.pcoPrimeiras !== null && typeof salvarMesPco === "function") {
            var resPco = salvarMesPco(pos, d.pcoPrimeiras, registro.mes, registro.ano);
            if (resPco && !resPco.ok) erroQuad = resPco.mensagem;
            else {
              pcoMesAtual = pos;
              if (typeof atualizarPainelPco === "function") atualizarPainelPco();
            }
          }
        
          if (!erroQuad && tocUnidadeId && d.tocConcluido !== null && d.pcoPrimeiras !== null &&
              typeof salvarMesToc === "function") {
            var resToc = salvarMesToc(pos, d.pcoPrimeiras, d.tocConcluido, registro.mes, registro.ano);
            if (resToc && !resToc.ok) erroQuad = resToc.mensagem;
            else if (typeof atualizarPainelToc === "function") atualizarPainelToc();
          }
        
          if (erroQuad) {
            pdfStatus(erroQuad, "erro");
            return false;
          }
          return true;
        }
        
        /* ----- Aplica um registro (preenche + renderiza) ----- */
        function pdfAplicarRegistro(uid, mes, registro, scroll, opcoes) {
          if (!pdfPreencherFormularios(registro, opcoes)) return;
          pdfMesExibido = mes;
          pdfRenderBanner(registro);
          pdfRenderResultados(registro);
          pdfRenderHistorico(uid, mes);
          pdfRenderDrawerNavegacao(uid, mes);
          pdfAtualizarMesesDisponiveis(uid);
          var pos = pdfPosicaoNoQuadrimestre(mes);
          sincronizarMesesAposImportacao(uid, pos);
          if (scroll && pdfBannerEl) pdfBannerEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          if (drawers) drawers.simAtualizarSeAberto();
        }
        
        /* ----- Status / botão ----- */
        function pdfStatus(msg, tipo) {
          if (!pdfStatusEl) return;
          pdfStatusEl.innerHTML = msg;
          pdfStatusEl.className = "pdf-status pdf-status--" + (tipo || "info");
          pdfStatusEl.hidden = false;
        }
        function pdfAtualizarBotaoProcessar() {
          if (!pdfBtnProcessar) return;
          pdfBtnProcessar.textContent = "Processar relat\u00F3rio";
          var temArquivo = pdfFileInput && pdfFileInput.files && pdfFileInput.files.length > 0;
          var temMes = pdfMesSel && pdfMesSel.value;
          pdfBtnProcessar.disabled = !temArquivo || !temMes || populacaoAtual <= 0 || !pdfUnidadeId;
        }
        
        function pdfResetarArquivoImportacao(mensagem) {
          pdfPendente = null;
          pdfArquivoCompetencia = null;
          if (pdfFileInput) pdfFileInput.value = "";
          if (pdfConflitoEl) { pdfConflitoEl.hidden = true; pdfConflitoEl.innerHTML = ""; }
          if (mensagem) pdfStatus(mensagem, "info");
          pdfAtualizarBotaoProcessar();
        }
        
        function pdfRegistrarArquivoSelecionado() {
          var mes = Number(pdfMesSel && pdfMesSel.value);
          var ano = Number(pdfAnoInput && pdfAnoInput.value) || new Date().getFullYear();
          var temArquivo = pdfFileInput && pdfFileInput.files && pdfFileInput.files[0];

          if (temArquivo && !mes) {
            pdfResetarArquivoImportacao(
              "Selecione primeiro o <strong>m\u00EAs</strong> (passo 1) e confira o <strong>ano</strong> (passo 2). Depois escolha o PDF do relat\u00F3rio."
            );
            return;
          }

          if (temArquivo && mes) {
            pdfArquivoCompetencia = { mes: mes, ano: ano };
          } else {
            pdfArquivoCompetencia = null;
          }
          pdfAtualizarBotaoProcessar();
        }
        
        function pdfBtnOcupado() {
          if (pdfBtnProcessar) {
            pdfBtnProcessar.disabled = true;
            pdfBtnProcessar.textContent = "Processando...";
          }
        }
        
        function pdfBtnReset() {
          pdfAtualizarBotaoProcessar();
        }
        
        /* ----- Conflito de competência ----- */
        function pdfMostrarConflito(mes, ano) {
          if (!pdfConflitoEl) return;
          pdfConflitoEl.innerHTML =
            '<p class="pdf-conflito-texto">J\u00E1 existem dados importados para <strong>' + PDF_MESES[mes - 1] + " de " + ano + "</strong>. O que deseja fazer?</p>" +
            '<div class="pdf-conflito-acoes">' +
              '<button type="button" class="pdf-conflito-btn pdf-conflito-btn--prim" data-modo="substituir">Substituir os dados</button>' +
              '<button type="button" class="pdf-conflito-btn" data-modo="manter">Manter os dados atuais</button>' +
              '<button type="button" class="pdf-conflito-btn" data-modo="nova">Criar nova vers\u00E3o</button>' +
            "</div>";
          pdfConflitoEl.hidden = false;
          pdfConflitoEl.querySelectorAll(".pdf-conflito-btn").forEach(function (b) {
            b.addEventListener("click", function () { pdfFinalizar(b.dataset.modo); });
          });
        }
        
        /* ----- Finalização (salva e aplica) ----- */
        function pdfFinalizar(modo) {
          var uid = pdfUnidadeId, p = pdfPendente;
          if (!p) return;
          var store = pdfLerStore();
          if (!store[uid]) store[uid] = {};
          var existente = store[uid][p.mes];
        
          if (pdfConflitoEl) { pdfConflitoEl.hidden = true; pdfConflitoEl.innerHTML = ""; }
        
          var valQuad = pdfValidarImportacao(uid, p.mes, p.ano);
          if (!valQuad.ok) {
            pdfStatus(valQuad.mensagem, "erro");
            pdfPendente = null;
            pdfBtnReset();
            return;
          }
        
          if (modo === "manter" && existente) {
            pdfAplicarRegistro(uid, p.mes, existente, true);
            pdfStatus("Mantidos os dados j\u00E1 registrados para " + PDF_MESES[p.mes - 1] + " de " + existente.ano + ". Nada foi alterado.", "info");
            pdfPendente = null; pdfBtnReset(); return;
          }
        
          var registro = {
            ano: p.ano, mes: p.mes, importadoEm: new Date().toISOString(),
            populacao: p.populacao, dados: p.dados, arquivo: p.arquivo, versoes: [],
          };
        
          if (modo === "nova" && existente) {
            var versoes = (existente.versoes || []).slice();
            var copia = Object.assign({}, existente); delete copia.versoes;
            versoes.push(copia);
            registro.versoes = versoes;
          }
        
          store[uid][p.mes] = registro;
          if (!pdfSalvarComFallback(store, registro)) {
            pdfStatus(pdfMsgEspacoInsuficiente(), "erro");
            pdfPendente = null;
            pdfBtnReset();
            return;
          }
          pdfAplicarRegistro(uid, p.mes, registro, true, { syncPcoToc: true });
        
          var msg = modo === "substituir"
            ? "Dados de " + PDF_MESES[p.mes - 1] + " de " + p.ano + " substitu\u00EDdos com sucesso."
            : modo === "nova"
              ? "Nova vers\u00E3o do relat\u00F3rio de " + PDF_MESES[p.mes - 1] + " de " + p.ano + " registrada."
              : "Relat\u00F3rio de " + PDF_MESES[p.mes - 1] + " de " + p.ano + " processado e salvo com sucesso.";
          pdfStatus(msg, "sucesso");
          pdfPendente = null; pdfBtnReset();
          atualizarQuadResetBar(uid);
        }
        
        /* ----- Processamento (clique no botão) ----- */
        async function pdfProcessar() {
          if (populacaoAtual <= 0 || !pdfUnidadeId) {
            pdfStatus("Antes de importar, escolha a unidade na tela inicial e entre no app.", "erro"); return;
          }
          var mes = Number(pdfMesSel.value);
          if (!mes) { pdfStatus("Selecione o m\u00EAs de refer\u00EAncia do relat\u00F3rio (passo 1).", "erro"); return; }
        
          var ano = Number(pdfAnoInput.value);
          if (!ano || ano < 2020 || ano > 2099) { ano = new Date().getFullYear(); pdfAnoInput.value = ano; }
        
          var file = pdfFileInput.files && pdfFileInput.files[0];
          if (!file) { pdfStatus("Selecione o arquivo PDF do relat\u00F3rio (passo 3).", "erro"); return; }

          if (!pdfEhArquivoPdf(file)) {
            pdfStatus(
              "O arquivo selecionado n\u00E3o \u00E9 um PDF. No e-SUS APS, exporte o relat\u00F3rio de produ\u00E7\u00E3o em PDF e selecione esse arquivo.",
              "erro"
            );
            pdfResetarArquivoImportacao(null);
            return;
          }

          if (!pdfArquivoCompetencia || pdfArquivoCompetencia.mes !== mes || pdfArquivoCompetencia.ano !== ano) {
            pdfStatus(
              "O arquivo selecionado n\u00E3o corresponde \u00E0 compet\u00EAncia de <strong>" + PDF_MESES[mes - 1] + " de " + ano + "</strong>. " +
              "Ajuste o m\u00EAs/ano ou selecione novamente o PDF desta compet\u00EAncia.",
              "erro"
            );
            pdfResetarArquivoImportacao(null);
            return;
          }
        
          if (!window.pdfjsLib) {
            pdfStatus(
              "A leitura de PDF n\u00E3o est\u00E1 dispon\u00EDvel agora. Verifique a conex\u00E3o com a internet e recarregue a p\u00E1gina (F5).",
              "erro"
            );
            return;
          }
        
          if (pdfConflitoEl) { pdfConflitoEl.hidden = true; pdfConflitoEl.innerHTML = ""; }
          pdfBtnOcupado();
          pdfStatus("Lendo e interpretando o relat\u00F3rio...", "carregando");
        
          var etapa = "leitura do arquivo";
          try {
            var arrayBuffer = await pdfLerArquivo(file, "array");
            etapa = "extra\u00E7\u00E3o do texto";
            var linhas = pdfPrepararLinhas(await pdfExtrairLinhas(arrayBuffer));
            etapa = "c\u00E1lculo dos indicadores";
            var dados = pdfCalcularDados(linhas);
        
            if (pdfContarEncontrados(dados) === 0) {
              pdfStatus(
                "N\u00E3o encontramos procedimentos odontol\u00F3gicos neste PDF. " +
                "Confirme se \u00E9 o <strong>relat\u00F3rio de produ\u00E7\u00E3o do e-SUS APS</strong> " +
                "(com nomes ou c\u00F3digos dos procedimentos) e se a compet\u00EAncia (m\u00EAs/ano) est\u00E1 correta.",
                "erro"
              );
              pdfBtnReset(); return;
            }
        
            var valQuad = pdfValidarImportacao(pdfUnidadeId, mes, ano);
            if (!valQuad.ok) {
              pdfStatus(valQuad.mensagem, "erro");
              pdfBtnReset();
              return;
            }
        
            etapa = "anexo do arquivo";
            pdfPendente = {
              mes: mes, ano: ano, dados: dados, populacao: populacaoAtual,
              arquivo: { nome: file.name, tamanho: file.size, dataUrl: null },
            };
        
            var existente = (pdfLerStore()[pdfUnidadeId] || {})[mes];
            if (existente) {
              pdfStatus(
                "J\u00E1 existe um relat\u00F3rio para <strong>" + PDF_MESES[mes - 1] + " de " + ano + "</strong>. " +
                "Escolha abaixo se deseja manter, substituir ou registrar uma nova vers\u00E3o.",
                "info"
              );
              pdfMostrarConflito(mes, ano);
              pdfBtnReset();
              return;
            }
        
            etapa = "grava\u00E7\u00E3o e aplica\u00E7\u00E3o dos dados";
            pdfFinalizar("novo");
          } catch (err) {
            pdfStatus(pdfMensagemErroLeitura(err, etapa), "erro");
            pdfBtnReset();
          }
        }
        
        /* ----- Inicialização para a unidade ----- */
        function pdfIniciar(uid) {
          pdfFecharDrawer();
          pdfUnidadeId = uid;
          pdfPendente = null;
          if (pdfAnoInput && !pdfAnoInput.value) pdfAnoInput.value = new Date().getFullYear();
          if (pdfConflitoEl) { pdfConflitoEl.hidden = true; pdfConflitoEl.innerHTML = ""; }
          if (pdfStatusEl) pdfStatusEl.hidden = true;
        
          var dadosUni = pdfLerStore()[uid] || {};
          var meses = Object.keys(dadosUni).map(Number).filter(function (m) { return m >= 1 && m <= 12; }).sort(function (a, b) { return a - b; });
        
          if (meses.length) {
            var ultimo = meses[meses.length - 1];
            if (pdfMesSel) pdfMesSel.value = String(ultimo);
            pdfAplicarRegistro(uid, ultimo, dadosUni[ultimo], false);
          } else {
            if (pdfBannerEl) { pdfBannerEl.hidden = true; pdfBannerEl.innerHTML = ""; }
            pdfTemConteudo = false;
            if (pdfResultadosEl) { pdfResultadosEl.hidden = true; pdfResultadosEl.innerHTML = ""; }
            if (pdfHistoricoEl) { pdfHistoricoEl.hidden = true; pdfHistoricoEl.innerHTML = ""; }
            if (pdfHistoricoDetalhe) pdfHistoricoDetalhe.hidden = true;
            pdfLimparIndice();
            atualizarSidebarPdf(uid);
            iniciarQuadPainelsParaUnidade(uid);
          }
        
          pdfAtualizarMesesDisponiveis(uid);
          atualizarQuadResetBar(uid);
          pdfAtualizarBotaoProcessar();
        }
        
        function pdfLimparUnidade(uid) {
          var store = pdfLerStore();
          if (!store[uid]) return false;
          delete store[uid];
          pdfTentarGravar(store);
          return true;
        }
        
        function pdfLimparInterface() {
          pdfPendente = null;
          pdfArquivoCompetencia = null;
          pdfResultadosVisivel = false;
          pdfTemConteudo = false;
          pdfMesExibido = null;
          if (pdfFileInput) pdfFileInput.value = "";
          if (pdfStatusEl) pdfStatusEl.hidden = true;
          if (pdfConflitoEl) { pdfConflitoEl.hidden = true; pdfConflitoEl.innerHTML = ""; }
          if (pdfBannerEl) { pdfBannerEl.hidden = true; pdfBannerEl.innerHTML = ""; }
          if (pdfResultadosEl) { pdfResultadosEl.hidden = true; pdfResultadosEl.innerHTML = ""; }
          if (pdfHistoricoEl) { pdfHistoricoEl.hidden = true; pdfHistoricoEl.innerHTML = ""; }
          if (pdfHistoricoDetalhe) pdfHistoricoDetalhe.hidden = true;
          pdfLimparIndice();
          pdfUnbindIndiceScroll();
          if (pdfDrawerCompetencia) pdfDrawerCompetencia.hidden = true;
          if (pdfDrawerMeses) { pdfDrawerMeses.hidden = true; pdfDrawerMeses.innerHTML = ""; }
          if (pdfMesSel) pdfMesSel.value = "";
          pdfAtualizarDrawer();
          atualizarSidebarPdf(pdfUnidadeId);
          pdfAtualizarBotaoProcessar();
        }
        
        function reiniciarQuadrimestreCompleto() {
          var uid = pdfUnidadeId || pcoUnidadeId || tocUnidadeId;
          if (!uid || populacaoAtual <= 0) return;
        
          var msg = "Reiniciar o quadrimestre desta unidade?\n\nSer\u00E3o apagados:\n" +
            "\u2022 Todos os PDFs importados\n" +
            "\u2022 Dados dos 6 indicadores (1\u00AA consulta, tratamento conclu\u00EDdo, escova\u00E7\u00E3o, preventivos, ART e exodontias)\n\n" +
            "Esta a\u00E7\u00E3o n\u00E3o pode ser desfeita.";
        
          if (!window.confirm(msg)) return;
        
          reiniciarQuadrimestrePco(uid);
          reiniciarQuadrimestreToc(uid);
          pdfLimparUnidade(uid);
          limparFormulariosIndicadores();
          if (typeof limparEscovacaoUnidade === "function") limparEscovacaoUnidade(uid);
        
          pcoMesAtual = 1;
          tocMesAtual = 1;
          pcoMesEditando = null;
          tocMesEditando = null;
          limparQuadResumosB456();
        
          if (pcoUnidadeId === uid) {
            atualizarPainelPco();
            if (pcoResultado) { pcoResultado.hidden = true; pcoResultado.innerHTML = ""; }
          }
        
          if (tocUnidadeId === uid) {
            atualizarPainelToc();
            if (tocResumo) { tocResumo.hidden = true; tocResumo.innerHTML = ""; }
          }
        
          pdfLimparInterface();
          pdfAtualizarMesesDisponiveis(uid);
          atualizarQuadResetBar(uid);
          pdfStatus("Quadrimestre reiniciado. Importe os relat\u00F3rios do novo per\u00EDodo.", "sucesso");
        }
        
        if (btnReiniciarQuadrimestre) {
          btnReiniciarQuadrimestre.addEventListener("click", reiniciarQuadrimestreCompleto);
        }
        
        if (pdfBtnProcessar) pdfBtnProcessar.addEventListener("click", pdfProcessar);
        if (pdfFileInput) {
          pdfFileInput.addEventListener("change", pdfRegistrarArquivoSelecionado);
        }
        if (pdfAnoInput) {
          pdfAnoInput.addEventListener("change", function () {
            var mes = Number(pdfMesSel && pdfMesSel.value);
            var ano = Number(pdfAnoInput.value);
            var msg = mes && ano
              ? "Ano alterado. Selecione o PDF de <strong>" + PDF_MESES[mes - 1] + " de " + ano + "</strong>."
              : "Ano alterado. Selecione o PDF correspondente a esta compet\u00EAncia.";
            pdfResetarArquivoImportacao(msg);
          });
        }
        if (sidebarPdfBtn) {
          sidebarPdfBtn.addEventListener("click", function (e) {
            if (pdfResultadosVisivel) pdfFecharDrawer();
            else pdfAbrirDrawer(e.currentTarget);
          });
        }
        if (bottomPdfBtn) {
          bottomPdfBtn.addEventListener("click", function (e) {
            if (pdfResultadosVisivel) pdfFecharDrawer();
            else pdfAbrirDrawer(e.currentTarget);
          });
        }
        if (pdfDrawerFechar) pdfDrawerFechar.addEventListener("click", pdfFecharDrawer);
        if (pdfDrawerOverlay) pdfDrawerOverlay.addEventListener("click", pdfFecharDrawer);
        if (pdfMesSel) {
          pdfMesSel.addEventListener("change", function () {
            var m = Number(pdfMesSel.value);
            if (m) {
              pdfResetarArquivoImportacao(
                "Compet\u00EAncia alterada. Selecione o PDF do relat\u00F3rio de <strong>" + PDF_MESES[m - 1] + "</strong>."
              );
            } else {
              pdfResetarArquivoImportacao(null);
            }
            if (m && pdfUnidadeId) pdfRenderHistorico(pdfUnidadeId, m);
          });
        }
        /* ===== QUAD: instalado via quadrimestre.js (Passo 7) ===== */
        (function instalarQuad() {
          var IndicaQuadMod = window.IndicaQuad;
          if (!IndicaQuadMod || typeof IndicaQuadMod.install !== "function") {
            console.error("IndicaQuad não carregado. Inclua quadrimestre.js antes de pdf-import.js.");
            return;
          }

          env.pdfDetectarQuadAtivo = pdfDetectarQuadAtivo;
          env.pdfDigitos = pdfDigitos;
          env.pdfLerStore = pdfLerStore;
          env.pdfSalvarComFallback = pdfSalvarComFallback;
          env.pdfRenderBanner = pdfRenderBanner;
          env.pdfRenderResultados = pdfRenderResultados;
          env.pdfPreencherInputs = pdfPreencherInputs;
          Object.defineProperty(env, "pdfMesExibido", {
            get: function () { return pdfMesExibidoAtual; },
            set: function (v) { pdfMesExibidoAtual = v; },
            configurable: true,
            enumerable: true,
          });

          quadApi = IndicaQuadMod.install(env);
          if (!quadApi) return;

          comPreenchimentoFormulario = quadApi.comPreenchimentoFormulario;
          obterRegistrosQuadPdf = quadApi.obterRegistrosQuadPdf;
          atualizarResultadoLiveB5 = quadApi.atualizarResultadoLiveB5;
          atualizarResultadoLiveB6 = quadApi.atualizarResultadoLiveB6;
          atualizarResultadoLiveB3 = quadApi.atualizarResultadoLiveB3;
          pdfSincronizarPcoTocEditados = quadApi.sincronizarPcoTocEditados;
          iniciarQuadPainelsParaUnidade = quadApi.iniciarQuadPainelsParaUnidade;
          limparQuadResumosB456 = quadApi.limparQuadResumosB456;
          atualizarPaineisQuadB456 = quadApi.atualizarPaineisQuadB456;
          atualizarQuadResetBar = quadApi.atualizarQuadResetBar;
          resetQuadOverridesLocal = quadApi.resetQuadOverrides;
          sincronizarMesesAposImportacao = quadApi.sincronizarMesesAposImportacao;
        })();

        function pdfAtualizarAposEscovacao() {
          if (!pdfUnidadeId || !pdfMesExibido) return;
          var registro = (pdfLerStore()[pdfUnidadeId] || {})[pdfMesExibido];
          if (!registro) return;
          pdfRenderResultados(registro);
          if (drawers) drawers.simAtualizarSeAberto();
        }

        api.iniciar = pdfIniciar;
        api.fecharDrawer = pdfFecharDrawer;
        api.abrirDrawer = pdfAbrirDrawer;
        api.limparInterface = pdfLimparInterface;
        api.limparUnidade = pdfLimparUnidade;
        api.atualizarQuadResetBar = atualizarQuadResetBar;
        api.atualizarBotaoProcessar = pdfAtualizarBotaoProcessar;
        api.atualizarResultadoLiveB5 = atualizarResultadoLiveB5;
        api.atualizarResultadoLiveB6 = atualizarResultadoLiveB6;
        api.atualizarResultadoLiveB3 = atualizarResultadoLiveB3;
        api.sincronizarPcoTocEditados = pdfSincronizarPcoTocEditados;
        api.atualizarAposEscovacao = pdfAtualizarAposEscovacao;
        api.aplicarAjusteSiaps = function (mesCal, ano, ajuste) {
          return quadApi && typeof quadApi.aplicarAjusteSiaps === "function"
            ? quadApi.aplicarAjusteSiaps(mesCal, ano, ajuste)
            : { ok: false, mensagem: "M\u00F3dulo do quadrimestre indispon\u00EDvel." };
        };
        api.iniciarQuadPainelsParaUnidade = iniciarQuadPainelsParaUnidade;
        api.limparQuadResumosB456 = limparQuadResumosB456;
        api.resetQuadOverrides = function () { resetQuadOverridesLocal(); };
        api.getUnidadeId = function () { return pdfUnidadeId; };
        api.getResultadosVisivel = function () { return pdfResultadosVisivel; };
        api.setResultadosVisivel = function (v) { pdfResultadosVisivel = !!v; };
        api.getDrawerRoot = function () { return pdfDrawerRoot; };
        api.getTemConteudo = function () { return pdfTemConteudo; };
        api.obterCompetencia = function () {
          var mes = Number(pdfMesSel && pdfMesSel.value) || 0;
          var ano = Number(pdfAnoInput && pdfAnoInput.value) || 0;
          if ((!mes || mes < 1 || mes > 12) && pdfMesExibido) mes = Number(pdfMesExibido) || 0;
          if ((!ano || ano < 2020) && pdfMesExibido && pdfUnidadeId) {
            var reg = (pdfLerStore()[pdfUnidadeId] || {})[pdfMesExibido];
            if (reg && reg.ano) ano = Number(reg.ano) || 0;
          }
          if (!ano || ano < 2020) ano = new Date().getFullYear();
          if (mes >= 1 && mes <= 12 && ano >= 2020 && ano <= 2100) return { mes: mes, ano: ano };
          return null;
        };
      }
    })();

    return api;
  }

  global.IndicaPdf = { install: install };
})(typeof window !== "undefined" ? window : global);
