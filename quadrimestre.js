/**
 * Acompanhamento do quadrimestre — barra de reset e status mensal (B3/B5/B6).
 * Instalado por pdf-import.js via IndicaQuad.install(env).
 * Passo 7 da organização do código.
 */
(function (global) {
  // Sem "use strict": usa with(env), como pdf-import.js.
  function install(env) {
    var api = {};

    (function () {
      with (env) {
        /* ===== ACOMPANHAMENTO QUADRIMESTRAL — INDICADORES 4, 5 E 6 ===== */
        
        var b5MesesGrid = document.getElementById("b5-meses-grid");
        var b5QuadResumo = document.getElementById("b5-quad-resumo");
        var b6MesesGrid = document.getElementById("b6-meses-grid");
        var b6QuadResumo = document.getElementById("b6-quad-resumo");
        var b3MesesGrid = document.getElementById("b3-meses-grid");
        var b3QuadResumo = document.getElementById("b3-quad-resumo");
        
        var b5MesAtual = 1;
        var b5MesOverride = null;
        var b6MesAtual = 1;
        var b6MesOverride = null;
        var b3MesAtual = 1;
        var b3MesOverride = null;
        var quadUnidadeId = "";
        var preenchendoFormulario = false;
        var preenchendoFormularioDepth = 0;
        
        function comPreenchimentoFormulario(fn) {
          preenchendoFormularioDepth++;
          preenchendoFormulario = true;
          try { fn(); } finally {
            preenchendoFormularioDepth--;
            preenchendoFormulario = preenchendoFormularioDepth > 0;
          }
        }
        
        function pdfGrupoDeItens(itens) {
          var lista = [];
          var total = 0;
          (itens || []).forEach(function (it) {
            var qtd = Number(it.qtd);
            if (!isNaN(qtd) && qtd > 0) {
              lista.push({ cod: it.cod, nome: it.nome, qtd: qtd });
              total += qtd;
            }
          });
          return { itens: lista, total: total };
        }
        
        function pdfColetarGrupoDoForm(listaProcs, prefixo) {
          var itens = [];
          var total = 0;
          (listaProcs || []).forEach(function (p) {
            var el = document.getElementById(prefixo + "-" + pdfDigitos(p.cod));
            var qtd = el ? Number(el.value) : 0;
            if (!isNaN(qtd) && qtd > 0) {
              itens.push({ cod: p.cod, nome: p.nome, qtd: qtd });
              total += qtd;
            }
          });
          return { itens: itens, total: total };
        }
        
        function pdfGruposIguais(a, b) {
          if (!a || !b) return !a && !b;
          if (Number(a.total) !== Number(b.total)) return false;
          var ia = a.itens || [];
          var ib = b.itens || [];
          if (ia.length !== ib.length) return false;
          var mapa = {};
          ia.forEach(function (it) { mapa[pdfDigitos(it.cod) || it.nome] = Number(it.qtd); });
          for (var i = 0; i < ib.length; i++) {
            var chave = pdfDigitos(ib[i].cod) || ib[i].nome;
            if (mapa[chave] !== Number(ib[i].qtd)) return false;
          }
          return true;
        }
        
        /* Catálogo de códigos compartilhados entre B3, B5 e B6. */
        var pdfCatalogoCruzadoCache = null;
        function pdfCatalogoCruzado() {
          if (pdfCatalogoCruzadoCache) return pdfCatalogoCruzadoCache;
          var cat = {};
          function add(ind, grupo, lista) {
            (lista || []).forEach(function (p) {
              var k = pdfDigitos(p.cod);
              if (!k) return;
              if (!cat[k]) cat[k] = [];
              cat[k].push({ ind: ind, grupo: grupo, proc: p });
            });
          }
          add("b5", "num", B5_PREVENTIVOS);
          add("b5", "out", B5_OUTROS);
          add("b6", "num", B6_TRA);
          add("b6", "out", B6_OUTROS);
          add("b3", "exo", B3_EXODONTIAS);
          add("b3", "prev", B3_PREVENTIVOS);
          add("b3", "cur", B3_CURATIVOS);
          pdfCatalogoCruzadoCache = cat;
          return cat;
        }
        
        function pdfMapaQtdsDasListas(listasPorGrupo, dadosGrupo) {
          var mapa = {};
          Object.keys(listasPorGrupo).forEach(function (g) {
            var porCod = {};
            var bloco = dadosGrupo && dadosGrupo[g] ? dadosGrupo[g] : null;
            ((bloco && bloco.itens) || []).forEach(function (it) {
              var k = pdfDigitos(it.cod);
              if (k) porCod[k] = Number(it.qtd) || 0;
            });
            (listasPorGrupo[g] || []).forEach(function (p) {
              var k = pdfDigitos(p.cod);
              if (!k) return;
              mapa[k] = { qtd: porCod[k] || 0, cod: p.cod, nome: p.nome };
            });
          });
          return mapa;
        }
        
        function pdfDefinirQtdNoGrupo(grupo, proc, qtd) {
          var itens = ((grupo && grupo.itens) || []).slice();
          var k = pdfDigitos(proc.cod);
          var idx = -1;
          for (var i = 0; i < itens.length; i++) {
            if (pdfDigitos(itens[i].cod) === k) { idx = i; break; }
          }
          qtd = Number(qtd) || 0;
          if (qtd > 0) {
            if (idx >= 0) itens[idx] = { cod: proc.cod, nome: proc.nome || itens[idx].nome, qtd: qtd };
            else itens.push({ cod: proc.cod, nome: proc.nome, qtd: qtd });
          } else if (idx >= 0) {
            itens.splice(idx, 1);
          }
          return pdfGrupoDeItens(itens);
        }
        
        function pdfGarantirEstruturaDados(dados) {
          if (!dados.b5) dados.b5 = { num: { itens: [], total: 0 }, out: { itens: [], total: 0 } };
          if (!dados.b5.num) dados.b5.num = { itens: [], total: 0 };
          if (!dados.b5.out) dados.b5.out = { itens: [], total: 0 };
          if (!dados.b6) dados.b6 = { num: { itens: [], total: 0 }, out: { itens: [], total: 0 } };
          if (!dados.b6.num) dados.b6.num = { itens: [], total: 0 };
          if (!dados.b6.out) dados.b6.out = { itens: [], total: 0 };
          if (!dados.b3) dados.b3 = { exo: { itens: [], total: 0 }, prev: { itens: [], total: 0 }, cur: { itens: [], total: 0 } };
          if (!dados.b3.exo) dados.b3.exo = { itens: [], total: 0 };
          if (!dados.b3.prev) dados.b3.prev = { itens: [], total: 0 };
          if (!dados.b3.cur) dados.b3.cur = { itens: [], total: 0 };
        }
        
        function pdfEspelharQtdsEntreIndicadores(dados, mapaQtds, origemInd) {
          if (!dados || !mapaQtds) return;
          pdfGarantirEstruturaDados(dados);
          var cat = pdfCatalogoCruzado();
          Object.keys(mapaQtds).forEach(function (k) {
            var info = mapaQtds[k];
            var alvos = cat[k] || [];
            alvos.forEach(function (alvo) {
              if (alvo.ind === origemInd) return;
              if (alvo.ind === "b5") {
                dados.b5[alvo.grupo] = pdfDefinirQtdNoGrupo(dados.b5[alvo.grupo], alvo.proc, info.qtd);
              } else if (alvo.ind === "b6") {
                dados.b6[alvo.grupo] = pdfDefinirQtdNoGrupo(dados.b6[alvo.grupo], alvo.proc, info.qtd);
              } else if (alvo.ind === "b3") {
                dados.b3[alvo.grupo] = pdfDefinirQtdNoGrupo(dados.b3[alvo.grupo], alvo.proc, info.qtd);
              }
            });
          });
        }
        
        function pdfAtualizarFormsAposSyncCruzado(registro, origem, posMes) {
          if (!registro || !registro.dados) return;
          comPreenchimentoFormulario(function () {
            if (origem !== "b5" && b5MesAtual === posMes) {
              if (typeof pdfPreencherB5DeRegistro === "function") pdfPreencherB5DeRegistro(registro);
            }
            if (origem !== "b6" && b6MesAtual === posMes) {
              if (typeof pdfPreencherB6DeRegistro === "function") pdfPreencherB6DeRegistro(registro);
            }
            if (origem !== "b3" && b3MesAtual === posMes) {
              if (typeof pdfPreencherB3DeRegistro === "function") pdfPreencherB3DeRegistro(registro);
            }
            var pacote = obterRegistrosQuadPdf(quadUnidadeId);
            var meses = pacote.meses;
            if (origem !== "b5") {
              renderizarB5MesesGrid(meses);
              if (typeof renderizarQuadResumoB5 === "function") renderizarQuadResumoB5(meses, b5MesAtual);
            }
            if (origem !== "b6") {
              renderizarB6MesesGrid(meses);
              if (typeof renderizarQuadResumoB6 === "function") renderizarQuadResumoB6(meses, b6MesAtual);
            }
            if (origem !== "b3") {
              renderizarB3MesesGrid(meses);
              if (typeof renderizarQuadResumoB3 === "function") renderizarQuadResumoB3(meses, b3MesAtual);
            }
          });
        }
        
        function pdfObterRegistroMesQuad(posMes) {
          if (!quadUnidadeId || !posMes) return null;
          var pacote = obterRegistrosQuadPdf(quadUnidadeId);
          return pacote.meses[posMes] || null;
        }
        
        function pdfGravarRegistroAtualizado(registro) {
          if (!quadUnidadeId || !registro || !registro.mes) return false;
          var store = pdfLerStore();
          if (!store[quadUnidadeId]) store[quadUnidadeId] = {};
          store[quadUnidadeId][registro.mes] = registro;
          return pdfSalvarComFallback(store, registro);
        }
        
        function pdfAtualizarVisaoRelatorio(registro) {
          if (!registro || pdfMesExibido !== registro.mes) return;
          if (typeof pdfRenderBanner === "function") pdfRenderBanner(registro);
          if (typeof pdfRenderResultados === "function") pdfRenderResultados(registro);
        }
        
        function pdfAposPersistirEdicao(registro) {
          if (!pdfGravarRegistroAtualizado(registro)) return false;
          pdfAtualizarVisaoRelatorio(registro);
          if (drawers) drawers.simAtualizarSeAberto();
          return true;
        }
        
        function pdfSincronizarPcoTocEditados(posMes, primeiras, concluidos) {
          if (preenchendoFormulario || !quadUnidadeId) return false;
          var registro = pdfObterRegistroMesQuad(posMes);
          if (!registro || !registro.dados) return false;
        
          var mudou = false;
          if (typeof primeiras === "number" && !isNaN(primeiras) && primeiras >= 0 &&
              registro.dados.pcoPrimeiras !== primeiras) {
            registro.dados.pcoPrimeiras = primeiras;
            mudou = true;
          }
          if (typeof concluidos === "number" && !isNaN(concluidos) && concluidos >= 0 &&
              registro.dados.tocConcluido !== concluidos) {
            registro.dados.tocConcluido = concluidos;
            mudou = true;
          }
          if (!mudou) return false;
        
          registro.editadoEm = new Date().toISOString();
          return pdfAposPersistirEdicao(registro);
        }
        
        function pdfPersistirEdicaoB5() {
          if (preenchendoFormulario || !quadUnidadeId) return false;
          var registro = pdfObterRegistroMesQuad(b5MesAtual);
          if (!registro || !registro.dados) return false;
        
          var novoNum = pdfColetarGrupoDoForm(B5_PREVENTIVOS, "b5");
          var novoOut = pdfColetarGrupoDoForm(B5_OUTROS, "b5");
          if (pdfGruposIguais(registro.dados.b5.num, novoNum) && pdfGruposIguais(registro.dados.b5.out, novoOut)) {
            return false;
          }
        
          registro.dados.b5 = { num: novoNum, out: novoOut };
          var mapa = pdfMapaQtdsDasListas(
            { num: B5_PREVENTIVOS, out: B5_OUTROS },
            registro.dados.b5
          );
          pdfEspelharQtdsEntreIndicadores(registro.dados, mapa, "b5");
          registro.editadoEm = new Date().toISOString();
          if (!pdfAposPersistirEdicao(registro)) return false;
          pdfAtualizarFormsAposSyncCruzado(registro, "b5", b5MesAtual);
          return true;
        }
        
        function pdfPersistirEdicaoB6() {
          if (preenchendoFormulario || !quadUnidadeId) return false;
          var registro = pdfObterRegistroMesQuad(b6MesAtual);
          if (!registro || !registro.dados) return false;
        
          var novoNum = pdfColetarGrupoDoForm(B6_TRA, "b6");
          var novoOut = pdfColetarGrupoDoForm(B6_OUTROS, "b6");
          if (pdfGruposIguais(registro.dados.b6.num, novoNum) && pdfGruposIguais(registro.dados.b6.out, novoOut)) {
            return false;
          }
        
          registro.dados.b6 = { num: novoNum, out: novoOut };
          var mapa = pdfMapaQtdsDasListas(
            { num: B6_TRA, out: B6_OUTROS },
            registro.dados.b6
          );
          pdfEspelharQtdsEntreIndicadores(registro.dados, mapa, "b6");
          registro.editadoEm = new Date().toISOString();
          if (!pdfAposPersistirEdicao(registro)) return false;
          pdfAtualizarFormsAposSyncCruzado(registro, "b6", b6MesAtual);
          return true;
        }
        
        function pdfPersistirEdicaoB3() {
          if (preenchendoFormulario || !quadUnidadeId) return false;
          var registro = pdfObterRegistroMesQuad(b3MesAtual);
          if (!registro || !registro.dados || !registro.dados.b3) return false;
        
          var exo = b3InExo ? Number(b3InExo.value) : 0;
          var prev = b3InPrev ? Number(b3InPrev.value) : 0;
          var cur = b3InCur ? Number(b3InCur.value) : 0;
          if (isNaN(exo) || exo < 0) exo = 0;
          if (isNaN(prev) || prev < 0) prev = 0;
          if (isNaN(cur) || cur < 0) cur = 0;
        
          var b3 = registro.dados.b3;
          if (Number(b3.exo.total) === exo && Number(b3.prev.total) === prev && Number(b3.cur.total) === cur) {
            return false;
          }
        
          function ajustarGrupo(grupo, totalNovo) {
            var itens = (grupo && grupo.itens) ? grupo.itens.slice() : [];
            if (itens.length === 1) {
              itens[0] = { cod: itens[0].cod, nome: itens[0].nome, qtd: totalNovo };
              return pdfGrupoDeItens(itens);
            }
            if (itens.length === 0) {
              return totalNovo > 0
                ? { itens: [{ cod: "\u2014", nome: "Total editado manualmente", qtd: totalNovo }], total: totalNovo }
                : { itens: [], total: 0 };
            }
            var soma = 0;
            itens.forEach(function (it) { soma += Number(it.qtd) || 0; });
            if (soma <= 0 || totalNovo === 0) {
              return totalNovo > 0
                ? { itens: [{ cod: "\u2014", nome: "Total editado manualmente", qtd: totalNovo }], total: totalNovo }
                : { itens: [], total: 0 };
            }
            var restante = totalNovo;
            var novos = itens.map(function (it, idx) {
              var qtd = idx === itens.length - 1
                ? restante
                : Math.round((Number(it.qtd) / soma) * totalNovo);
              restante -= qtd;
              return { cod: it.cod, nome: it.nome, qtd: Math.max(0, qtd) };
            });
            return pdfGrupoDeItens(novos);
          }
        
          registro.dados.b3 = {
            exo: ajustarGrupo(b3.exo, exo),
            prev: ajustarGrupo(b3.prev, prev),
            cur: ajustarGrupo(b3.cur, cur),
          };
          var mapa = pdfMapaQtdsDasListas(
            { exo: B3_EXODONTIAS, prev: B3_PREVENTIVOS, cur: B3_CURATIVOS },
            registro.dados.b3
          );
          pdfEspelharQtdsEntreIndicadores(registro.dados, mapa, "b3");
          registro.editadoEm = new Date().toISOString();
          if (!pdfAposPersistirEdicao(registro)) return false;
          pdfAtualizarFormsAposSyncCruzado(registro, "b3", b3MesAtual);
          return true;
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
        
        function obterRegistrosQuadPdf(uid) {
          var quad = pdfDetectarQuadAtivo(uid);
          var meses = { 1: null, 2: null, 3: null, 4: null };
        
          if (!quad) return { quad: null, meses: meses };
        
          var store = pdfLerStore()[uid] || {};
          var calMeses = QUADRIMESTRES[quad.indice].meses;
        
          for (var pos = 1; pos <= 4; pos++) {
            var cal = calMeses[pos - 1];
            var reg = store[cal] || null;
            meses[pos] = (reg && reg.ano === quad.ano) ? reg : null;
          }
        
          return { quad: quad, meses: meses };
        }
        
        function ultimoMesQuadComDados(meses, metricaFn) {
          for (var m = 4; m >= 1; m--) {
            if (meses[m] && metricaFn(meses[m].dados)) return m;
          }
          return 0;
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
        
        function badgeClassGenerico(classId, classificacaoFn) {
          var c = classificacaoFn(classId);
          if (!c) return "";
          return '<span class="badge-class" style="--cor: ' + c.cor + '">' + c.nome + "</span>";
        }
        
        function montarHtmlQuadResumoB5(mesSel, met, editado) {
          var classMes = classificarB5(met.pct);
          var cls = classificacaoB5PorId(classMes);
          var label = "Acompanhamento mensal \u2014 " + QUAD_MESES_LABEL[mesSel - 1];
          if (editado) label += " \u00B7 valores editados";
        
          var html = '<div class="toc-resumo-compact ind-quad-resumo-inner" style="--cor-status: ' + cls.cor + '">';
          html += '  <div class="toc-resumo-bloco">';
          html += '    <span class="toc-resumo-bloco-label">' + label + "</span>";
          html += '    <span class="toc-resumo-bloco-pct">' + fmtPct(met.pct) + "</span>";
          html += badgeClassGenerico(classMes, classificacaoB5PorId);
          html += '    <p class="toc-resumo-dica-texto">' + met.numerador.toLocaleString("pt-BR") + " preventivos \u00F7 " + met.denominador.toLocaleString("pt-BR") + " procedimentos individuais</p>";
          html += "  </div>";
          html += "</div>";
          return html;
        }
        
        function renderizarQuadResumoB5(meses, mesSel) {
          if (!b5QuadResumo) return;
          var reg = meses[mesSel];
          var met = reg ? metricasB5DeDados(reg.dados) : null;
          if (!met) {
            b5QuadResumo.hidden = true;
            b5QuadResumo.innerHTML = "";
            return;
          }
        
          b5QuadResumo.innerHTML = montarHtmlQuadResumoB5(mesSel, met, false);
          b5QuadResumo.hidden = false;
        }
        
        function b5FormDiferenteDoPdf() {
          var metForm = metricasB5DeForm();
          if (!metForm) return false;
          if (!quadUnidadeId) return true;
        
          var pacote = obterRegistrosQuadPdf(quadUnidadeId);
          var reg = pacote.meses[b5MesAtual];
          if (!reg || !reg.dados) return true;
        
          var pdfMet = metricasB5DeDados(reg.dados);
          if (!pdfMet) return true;
          return pdfMet.numerador !== metForm.numerador || pdfMet.denominador !== metForm.denominador;
        }
        
        function atualizarResultadoLiveB5() {
          renderizarMetasB5();
          pdfPersistirEdicaoB5();
        
          var metForm = metricasB5DeForm();
          var editado = metForm && b5FormDiferenteDoPdf();
          b5MesOverride = editado ? metForm : null;
        
          var pacote = quadUnidadeId ? obterRegistrosQuadPdf(quadUnidadeId) : null;
          var meses = pacote ? pacote.meses : { 1: null, 2: null, 3: null, 4: null };
        
          if (metForm) {
            if (b5QuadResumo) {
              b5QuadResumo.innerHTML = montarHtmlQuadResumoB5(b5MesAtual, metForm, editado);
              b5QuadResumo.hidden = false;
            }
            renderizarB5MesesGrid(meses, editado ? b5MesAtual : null, editado ? metForm : null);
            return;
          }
        
          b5MesOverride = null;
          var reg = meses[b5MesAtual];
          if (reg && metricasB5DeDados(reg.dados)) {
            renderizarQuadResumoB5(meses, b5MesAtual);
          } else if (b5QuadResumo) {
            b5QuadResumo.hidden = true;
            b5QuadResumo.innerHTML = "";
          }
          renderizarB5MesesGrid(meses);
        }
        
        function renderizarQuadResumoB6(meses, mesSel) {
          if (!b6QuadResumo) return;
          var reg = meses[mesSel];
          var met = reg ? metricasB6DeDados(reg.dados) : null;
          if (!met) {
            b6QuadResumo.hidden = true;
            b6QuadResumo.innerHTML = "";
            return;
          }
        
          b6QuadResumo.innerHTML = montarHtmlQuadResumoB6(mesSel, met, false);
          b6QuadResumo.hidden = false;
        }
        
        function montarHtmlQuadResumoB6(mesSel, met, editado) {
          var classMes = classificarB6(met.pct);
          var cls = classificacaoB6PorId(classMes);
          var label = "Acompanhamento mensal \u2014 " + QUAD_MESES_LABEL[mesSel - 1];
          if (editado) label += " \u00B7 valores editados";
        
          var html = '<div class="toc-resumo-compact ind-quad-resumo-inner" style="--cor-status: ' + cls.cor + '">';
          html += '  <div class="toc-resumo-bloco">';
          html += '    <span class="toc-resumo-bloco-label">' + label + "</span>";
          html += '    <span class="toc-resumo-bloco-pct">' + fmtPct(met.pct) + "</span>";
          html += badgeClassGenerico(classMes, classificacaoB6PorId);
          html += '    <p class="toc-resumo-dica-texto">' + met.numerador.toLocaleString("pt-BR") + " TRA/ART \u00F7 " + met.denominador.toLocaleString("pt-BR") + " restaura\u00E7\u00F5es</p>";
          html += "  </div>";
          html += "</div>";
          return html;
        }
        
        function b6FormDiferenteDoPdf() {
          var metForm = metricasB6DeForm();
          if (!metForm) return false;
          if (!quadUnidadeId) return true;
        
          var pacote = obterRegistrosQuadPdf(quadUnidadeId);
          var reg = pacote.meses[b6MesAtual];
          if (!reg || !reg.dados) return true;
        
          var pdfMet = metricasB6DeDados(reg.dados);
          if (!pdfMet) return true;
          return pdfMet.numerador !== metForm.numerador || pdfMet.denominador !== metForm.denominador;
        }
        
        function atualizarResultadoLiveB6() {
          renderizarMetasB6();
          pdfPersistirEdicaoB6();
        
          var metForm = metricasB6DeForm();
          var editado = metForm && b6FormDiferenteDoPdf();
          b6MesOverride = editado ? metForm : null;
        
          var pacote = quadUnidadeId ? obterRegistrosQuadPdf(quadUnidadeId) : null;
          var meses = pacote ? pacote.meses : { 1: null, 2: null, 3: null, 4: null };
        
          if (metForm) {
            if (b6QuadResumo) {
              b6QuadResumo.innerHTML = montarHtmlQuadResumoB6(b6MesAtual, metForm, editado);
              b6QuadResumo.hidden = false;
            }
            renderizarB6MesesGrid(meses, editado ? b6MesAtual : null, editado ? metForm : null);
            return;
          }
        
          b6MesOverride = null;
          var reg = meses[b6MesAtual];
          if (reg && metricasB6DeDados(reg.dados)) {
            renderizarQuadResumoB6(meses, b6MesAtual);
          } else if (b6QuadResumo) {
            b6QuadResumo.hidden = true;
            b6QuadResumo.innerHTML = "";
          }
          renderizarB6MesesGrid(meses);
        }
        
        function montarHtmlQuadResumoB3(mesSel, met, editado) {
          var classMes = classificarB3(met.pct);
          var cls = classificacaoB3PorId(classMes);
          var label = "Acompanhamento mensal \u2014 " + QUAD_MESES_LABEL[mesSel - 1];
          if (editado) label += " \u00B7 valores editados";
        
          var html = '<div class="toc-resumo-compact ind-quad-resumo-inner" style="--cor-status: ' + cls.cor + '">';
          html += '  <div class="toc-resumo-bloco">';
          html += '    <span class="toc-resumo-bloco-label">' + label + "</span>";
          html += '    <span class="toc-resumo-bloco-pct">' + fmtPct(met.pct) + "</span>";
          html += badgeClassGenerico(classMes, classificacaoB3PorId);
          html += '    <p class="toc-resumo-dica-texto">' + met.exodontias.toLocaleString("pt-BR") + " exodontias \u00F7 " + met.denominador.toLocaleString("pt-BR") + " procedimentos</p>";
          html += "  </div>";
          html += "</div>";
          return html;
        }
        
        function renderizarQuadResumoB3(meses, mesSel) {
          if (!b3QuadResumo) return;
          var reg = meses[mesSel];
          var met = reg ? metricasB3DeDados(reg.dados) : null;
          if (!met) {
            b3QuadResumo.hidden = true;
            b3QuadResumo.innerHTML = "";
            return;
          }
        
          b3QuadResumo.innerHTML = montarHtmlQuadResumoB3(mesSel, met, false);
          b3QuadResumo.hidden = false;
        }
        
        function b3FormDiferenteDoPdf() {
          var metForm = metricasB3DeForm();
          if (!metForm) return false;
          if (!quadUnidadeId) return true;
        
          var pacote = obterRegistrosQuadPdf(quadUnidadeId);
          var reg = pacote.meses[b3MesAtual];
          if (!reg || !reg.dados) return true;
        
          var pdfMet = metricasB3DeDados(reg.dados);
          if (!pdfMet) return true;
          return pdfMet.exodontias !== metForm.exodontias ||
            pdfMet.preventivos !== metForm.preventivos ||
            pdfMet.curativos !== metForm.curativos;
        }
        
        function atualizarResultadoLiveB3() {
          renderizarMetasB3();
          pdfPersistirEdicaoB3();
        
          var metForm = metricasB3DeForm();
          var editado = metForm && b3FormDiferenteDoPdf();
          b3MesOverride = editado ? metForm : null;
        
          var pacote = quadUnidadeId ? obterRegistrosQuadPdf(quadUnidadeId) : null;
          var meses = pacote ? pacote.meses : { 1: null, 2: null, 3: null, 4: null };
        
          if (metForm) {
            if (b3QuadResumo) {
              b3QuadResumo.innerHTML = montarHtmlQuadResumoB3(b3MesAtual, metForm, editado);
              b3QuadResumo.hidden = false;
            }
            renderizarB3MesesGrid(meses, editado ? b3MesAtual : null, editado ? metForm : null);
            return;
          }
        
          b3MesOverride = null;
          var reg = meses[b3MesAtual];
          if (reg && metricasB3DeDados(reg.dados)) {
            renderizarQuadResumoB3(meses, b3MesAtual);
          } else if (b3QuadResumo) {
            b3QuadResumo.hidden = true;
            b3QuadResumo.innerHTML = "";
          }
          renderizarB3MesesGrid(meses);
        }
        
        /* Atualiza metas/grades sem persistir — evita recursão B5↔B6↔B3 no espelhamento. */
        function atualizarUiB5AposPreenchimento() {
          b5MesOverride = null;
          if (typeof renderizarMetasB5 === "function") renderizarMetasB5();
          var pacote = quadUnidadeId ? obterRegistrosQuadPdf(quadUnidadeId) : null;
          var meses = pacote ? pacote.meses : { 1: null, 2: null, 3: null, 4: null };
          if (pacote) renderizarQuadResumoB5(meses, b5MesAtual);
          else if (b5QuadResumo) { b5QuadResumo.hidden = true; b5QuadResumo.innerHTML = ""; }
          renderizarB5MesesGrid(meses);
        }

        function atualizarUiB6AposPreenchimento() {
          b6MesOverride = null;
          if (typeof renderizarMetasB6 === "function") renderizarMetasB6();
          var pacote = quadUnidadeId ? obterRegistrosQuadPdf(quadUnidadeId) : null;
          var meses = pacote ? pacote.meses : { 1: null, 2: null, 3: null, 4: null };
          if (pacote) renderizarQuadResumoB6(meses, b6MesAtual);
          else if (b6QuadResumo) { b6QuadResumo.hidden = true; b6QuadResumo.innerHTML = ""; }
          renderizarB6MesesGrid(meses);
        }

        function atualizarUiB3AposPreenchimento() {
          b3MesOverride = null;
          if (typeof renderizarMetasB3 === "function") renderizarMetasB3();
          var pacote = quadUnidadeId ? obterRegistrosQuadPdf(quadUnidadeId) : null;
          var meses = pacote ? pacote.meses : { 1: null, 2: null, 3: null, 4: null };
          if (pacote) renderizarQuadResumoB3(meses, b3MesAtual);
          else if (b3QuadResumo) { b3QuadResumo.hidden = true; b3QuadResumo.innerHTML = ""; }
          renderizarB3MesesGrid(meses);
        }

        function pdfPreencherB5DeRegistro(registro) {
          if (!registro || !registro.dados) return;
          comPreenchimentoFormulario(function () {
            var d = registro.dados;
            if (b5Form) b5Form.querySelectorAll(".b5-item-input").forEach(function (inp) { inp.value = ""; });
            pdfPreencherInputs(d.b5.num.itens.concat(d.b5.out.itens), "b5");
            if (typeof aplicarFiltroB5 === "function") aplicarFiltroB5();
            atualizarUiB5AposPreenchimento();
          });
        }
        
        function pdfPreencherB6DeRegistro(registro) {
          if (!registro || !registro.dados) return;
          comPreenchimentoFormulario(function () {
            var d = registro.dados;
            if (b6Form) b6Form.querySelectorAll(".b6-item-input").forEach(function (inp) { inp.value = ""; });
            pdfPreencherInputs(d.b6.num.itens.concat(d.b6.out.itens), "b6");
            if (typeof aplicarFiltroB6 === "function") aplicarFiltroB6();
            atualizarUiB6AposPreenchimento();
          });
        }
        
        function pdfPreencherB3DeRegistro(registro) {
          if (!registro || !registro.dados) return;
          comPreenchimentoFormulario(function () {
            var d = registro.dados;
            if (b3InExo) b3InExo.value = d.b3.exo.total || "";
            if (b3InPrev) b3InPrev.value = d.b3.prev.total || "";
            if (b3InCur) b3InCur.value = d.b3.cur.total || "";
            atualizarUiB3AposPreenchimento();
          });
        }
        
        function renderizarB5MesesGrid(meses, mesOverride, metOverride) {
          if (!b5MesesGrid) return;
        
          var html = "";
          for (var mes = 1; mes <= 4; mes++) {
            var registro = meses[mes];
            var met = registro ? metricasB5DeDados(registro.dados) : null;
            var editado = mesOverride && metOverride && mes === mesOverride;
            if (editado) met = metOverride;
        
            var ativo = mes === b5MesAtual;
            var cardClass = "pco-mes-card";
            if (ativo) cardClass += " is-active";
            if (met) cardClass += " is-preenchido";
            if (editado) cardClass += " is-editado";
        
            var cls = null;
            if (met) cls = classificacaoB5PorId(classificarB5(met.pct));
        
            html += '<button type="button" class="' + cardClass + '"' + attrStyleCor(cls ? cls.cor : "") + ' data-mes="' + mes + '" role="tab" aria-selected="' + (ativo ? "true" : "false") + '">';
            html += '  <p class="pco-mes-card-titulo">' + QUAD_MESES_LABEL[mes - 1] + "</p>";
            html += '  <p class="pco-mes-card-label">Procedimentos preventivos neste m\u00EAs</p>';
        
            if (met) {
              html += '  <p class="pco-mes-card-valor">' + met.numerador.toLocaleString("pt-BR") + "</p>";
              html += '  <div class="pco-mes-card-extra">';
              html += '    <span class="pco-mes-card-pct">' + fmtPct(met.pct) + " do m\u00EAs</span>";
              html += '    <span class="pco-mes-card-class" style="--cor: ' + cls.cor + '">' + cls.nome + "</span>";
              html += "  </div>";
            } else {
              html += '  <p class="pco-mes-card-valor pco-mes-card-valor--vazio">\u2014</p>';
            }
        
            html += "</button>";
          }
        
          b5MesesGrid.innerHTML = html;
          b5MesesGrid.querySelectorAll(".pco-mes-card").forEach(function (btn) {
            btn.addEventListener("click", function () { selecionarMesQuadB5(Number(btn.dataset.mes)); });
          });
        }
        
        function renderizarB6MesesGrid(meses, mesOverride, metOverride) {
          if (!b6MesesGrid) return;
        
          var html = "";
          for (var mes = 1; mes <= 4; mes++) {
            var registro = meses[mes];
            var met = registro ? metricasB6DeDados(registro.dados) : null;
            var editado = mesOverride && metOverride && mes === mesOverride;
            if (editado) met = metOverride;
        
            var ativo = mes === b6MesAtual;
            var cardClass = "pco-mes-card";
            if (ativo) cardClass += " is-active";
            if (met) cardClass += " is-preenchido";
            if (editado) cardClass += " is-editado";
        
            var cls = null;
            if (met) cls = classificacaoB6PorId(classificarB6(met.pct));
        
            html += '<button type="button" class="' + cardClass + '"' + attrStyleCor(cls ? cls.cor : "") + ' data-mes="' + mes + '" role="tab" aria-selected="' + (ativo ? "true" : "false") + '">';
            html += '  <p class="pco-mes-card-titulo">' + QUAD_MESES_LABEL[mes - 1] + "</p>";
            html += '  <p class="pco-mes-card-label">TRA\u002FART neste m\u00EAs</p>';
        
            if (met) {
              html += '  <p class="pco-mes-card-valor">' + met.numerador.toLocaleString("pt-BR") + "</p>";
              html += '  <div class="pco-mes-card-extra">';
              html += '    <span class="pco-mes-card-pct">' + fmtPct(met.pct) + " do m\u00EAs</span>";
              html += '    <span class="pco-mes-card-class" style="--cor: ' + cls.cor + '">' + cls.nome + "</span>";
              html += "  </div>";
            } else {
              html += '  <p class="pco-mes-card-valor pco-mes-card-valor--vazio">\u2014</p>';
            }
        
            html += "</button>";
          }
        
          b6MesesGrid.innerHTML = html;
          b6MesesGrid.querySelectorAll(".pco-mes-card").forEach(function (btn) {
            btn.addEventListener("click", function () { selecionarMesQuadB6(Number(btn.dataset.mes)); });
          });
        }
        
        function renderizarB3MesesGrid(meses, mesOverride, metOverride) {
          if (!b3MesesGrid) return;
        
          var html = "";
          for (var mes = 1; mes <= 4; mes++) {
            var registro = meses[mes];
            var met = registro ? metricasB3DeDados(registro.dados) : null;
            var editado = mesOverride && metOverride && mes === mesOverride;
            if (editado) met = metOverride;
        
            var ativo = mes === b3MesAtual;
            var cardClass = "pco-mes-card";
            if (ativo) cardClass += " is-active";
            if (met) cardClass += " is-preenchido";
            if (editado) cardClass += " is-editado";
        
            var cls = null;
            if (met) cls = classificacaoB3PorId(classificarB3(met.pct));
        
            html += '<button type="button" class="' + cardClass + '"' + attrStyleCor(cls ? cls.cor : "") + ' data-mes="' + mes + '" role="tab" aria-selected="' + (ativo ? "true" : "false") + '">';
            html += '  <p class="pco-mes-card-titulo">' + QUAD_MESES_LABEL[mes - 1] + "</p>";
            html += '  <p class="pco-mes-card-label">Exodontias neste m\u00EAs</p>';
        
            if (met) {
              html += '  <p class="pco-mes-card-valor">' + met.exodontias.toLocaleString("pt-BR") + "</p>";
              html += '  <div class="pco-mes-card-extra">';
              html += '    <span class="pco-mes-card-pct">' + fmtPct(met.pct) + " do m\u00EAs</span>";
              html += '    <span class="pco-mes-card-class" style="--cor: ' + cls.cor + '">' + cls.nome + "</span>";
              html += "  </div>";
            } else {
              html += '  <p class="pco-mes-card-valor pco-mes-card-valor--vazio">\u2014</p>';
            }
        
            html += "</button>";
          }
        
          b3MesesGrid.innerHTML = html;
          b3MesesGrid.querySelectorAll(".pco-mes-card").forEach(function (btn) {
            btn.addEventListener("click", function () { selecionarMesQuadB3(Number(btn.dataset.mes)); });
          });
        }
        
        function selecionarMesQuadB5(mes) {
          b5MesAtual = mes;
          b5MesOverride = null;
          var pacote = obterRegistrosQuadPdf(quadUnidadeId);
        
          var reg = pacote.meses[mes];
          if (reg && metricasB5DeDados(reg.dados)) {
            pdfPreencherB5DeRegistro(reg);
          } else {
            if (b5Form) b5Form.querySelectorAll(".b5-item-input").forEach(function (inp) { inp.value = ""; });
            if (typeof aplicarFiltroB5 === "function") aplicarFiltroB5();
            atualizarUiB5AposPreenchimento();
          }
        }
        
        function selecionarMesQuadB6(mes) {
          b6MesAtual = mes;
          b6MesOverride = null;
          var pacote = obterRegistrosQuadPdf(quadUnidadeId);
        
          var reg = pacote.meses[mes];
          if (reg && metricasB6DeDados(reg.dados)) {
            pdfPreencherB6DeRegistro(reg);
          } else {
            if (b6Form) b6Form.querySelectorAll(".b6-item-input").forEach(function (inp) { inp.value = ""; });
            if (typeof aplicarFiltroB6 === "function") aplicarFiltroB6();
            atualizarUiB6AposPreenchimento();
          }
        }
        
        function selecionarMesQuadB3(mes) {
          b3MesAtual = mes;
          b3MesOverride = null;
          var pacote = obterRegistrosQuadPdf(quadUnidadeId);
        
          var reg = pacote.meses[mes];
          if (reg && metricasB3DeDados(reg.dados)) {
            pdfPreencherB3DeRegistro(reg);
          } else {
            if (b3InExo) b3InExo.value = "";
            if (b3InPrev) b3InPrev.value = "";
            if (b3InCur) b3InCur.value = "";
            atualizarUiB3AposPreenchimento();
          }
        }
        
        function atualizarPainelQuadB5() {
          if (!quadUnidadeId) return;
          b5MesOverride = null;
          var pacote = obterRegistrosQuadPdf(quadUnidadeId);
          var reg = pacote.meses[b5MesAtual];
          if (reg && metricasB5DeDados(reg.dados)) {
            pdfPreencherB5DeRegistro(reg);
          } else {
            if (b5Form) b5Form.querySelectorAll(".b5-item-input").forEach(function (inp) { inp.value = ""; });
            if (typeof aplicarFiltroB5 === "function") aplicarFiltroB5();
            atualizarUiB5AposPreenchimento();
          }
        }
        
        function atualizarPainelQuadB6() {
          if (!quadUnidadeId) return;
          b6MesOverride = null;
          var pacote = obterRegistrosQuadPdf(quadUnidadeId);
          var reg = pacote.meses[b6MesAtual];
          if (reg && metricasB6DeDados(reg.dados)) {
            pdfPreencherB6DeRegistro(reg);
          } else {
            if (b6Form) b6Form.querySelectorAll(".b6-item-input").forEach(function (inp) { inp.value = ""; });
            if (typeof aplicarFiltroB6 === "function") aplicarFiltroB6();
            atualizarUiB6AposPreenchimento();
          }
        }
        
        function atualizarPainelQuadB3() {
          if (!quadUnidadeId) return;
          b3MesOverride = null;
          var pacote = obterRegistrosQuadPdf(quadUnidadeId);
          var reg = pacote.meses[b3MesAtual];
          if (reg && metricasB3DeDados(reg.dados)) {
            pdfPreencherB3DeRegistro(reg);
          } else {
            if (b3InExo) b3InExo.value = "";
            if (b3InPrev) b3InPrev.value = "";
            if (b3InCur) b3InCur.value = "";
            atualizarUiB3AposPreenchimento();
          }
        }
        
        function atualizarPaineisQuadB456(uid) {
          quadUnidadeId = uid || quadUnidadeId;
          if (!quadUnidadeId) return;
        
          var pacote = obterRegistrosQuadPdf(quadUnidadeId);
          var ult5 = ultimoMesQuadComDados(pacote.meses, metricasB5DeDados);
          var ult6 = ultimoMesQuadComDados(pacote.meses, metricasB6DeDados);
          var ult3 = ultimoMesQuadComDados(pacote.meses, metricasB3DeDados);
        
          if (ult5) b5MesAtual = ult5;
          if (ult6) b6MesAtual = ult6;
          if (ult3) b3MesAtual = ult3;
        
          atualizarPainelQuadB5();
          atualizarPainelQuadB6();
          atualizarPainelQuadB3();
        }
        
        function iniciarQuadPainelsParaUnidade(unidadeId) {
          quadUnidadeId = unidadeId;
          var pacote = obterRegistrosQuadPdf(unidadeId);
        
          b5MesAtual = ultimoMesQuadComDados(pacote.meses, metricasB5DeDados) || 1;
          b6MesAtual = ultimoMesQuadComDados(pacote.meses, metricasB6DeDados) || 1;
          b3MesAtual = ultimoMesQuadComDados(pacote.meses, metricasB3DeDados) || 1;
        
          atualizarPaineisQuadB456(unidadeId);
        }
        
        function limparQuadResumosB456() {
          b5MesAtual = 1;
          b5MesOverride = null;
          b6MesAtual = 1;
          b6MesOverride = null;
          b3MesAtual = 1;
          b3MesOverride = null;
          if (b5QuadResumo) { b5QuadResumo.hidden = true; b5QuadResumo.innerHTML = ""; }
          if (b6QuadResumo) { b6QuadResumo.hidden = true; b6QuadResumo.innerHTML = ""; }
          if (b3QuadResumo) { b3QuadResumo.hidden = true; b3QuadResumo.innerHTML = ""; }
          var vazio = { 1: null, 2: null, 3: null, 4: null };
          if (b5MesesGrid) renderizarB5MesesGrid(vazio);
          if (b6MesesGrid) renderizarB6MesesGrid(vazio);
          if (b3MesesGrid) renderizarB3MesesGrid(vazio);
        }

        function atualizarQuadResetBar(uid) {
          if (!quadResetBar || !quadResetPeriodo) return;
          if (!uid || populacaoAtual <= 0) {
            quadResetBar.hidden = true;
            return;
          }
        
          quadResetBar.hidden = false;
          var quad = pdfDetectarQuadAtivo(uid);
          if (quad && QUADRIMESTRES[quad.indice]) {
            var q = QUADRIMESTRES[quad.indice];
            quadResetPeriodo.textContent = q.nome + " de " + quad.ano + " \u00B7 " + q.intervalo;
          } else {
            quadResetPeriodo.textContent = "Nenhum m\u00EAs importado ainda. Use os relat\u00F3rios PDF do mesmo quadrimestre.";
          }
        }

        api.comPreenchimentoFormulario = comPreenchimentoFormulario;
        api.obterRegistrosQuadPdf = obterRegistrosQuadPdf;
        api.atualizarResultadoLiveB5 = atualizarResultadoLiveB5;
        api.atualizarResultadoLiveB6 = atualizarResultadoLiveB6;
        api.atualizarResultadoLiveB3 = atualizarResultadoLiveB3;
        api.sincronizarPcoTocEditados = pdfSincronizarPcoTocEditados;
        api.iniciarQuadPainelsParaUnidade = iniciarQuadPainelsParaUnidade;
        api.limparQuadResumosB456 = limparQuadResumosB456;
        api.atualizarPaineisQuadB456 = atualizarPaineisQuadB456;
        api.atualizarQuadResetBar = atualizarQuadResetBar;
        api.resetQuadOverrides = function () {
          b5MesOverride = null;
          b6MesOverride = null;
          b3MesOverride = null;
        };
        api.sincronizarMesesAposImportacao = function (uid, pos) {
          if (quadUnidadeId === uid || !quadUnidadeId) {
            b5MesAtual = pos;
            b6MesAtual = pos;
            b3MesAtual = pos;
            atualizarPaineisQuadB456(uid);
          }
        };
        api.getQuadUnidadeId = function () { return quadUnidadeId; };
        api.setQuadUnidadeId = function (v) { quadUnidadeId = v || ""; };
      }
    })();

    return api;
  }

  global.IndicaQuad = { install: install };
})(typeof window !== "undefined" ? window : global);
