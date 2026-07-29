# INDICA — Saúde Bucal

Calculadora dos **seis indicadores odontológicos** da Atenção Primária (APS), com importação de PDF, visão por quadrimestre e nota final da equipe.

Versão atual: **1.1.1**

## Para quem é

Equipes de saúde bucal das unidades de atendimento que precisam calcular e acompanhar os indicadores (PCO, TOC, escovação, B3, B5 e B6 / TRA-ART).

## Como abrir

1. Abra a pasta do projeto no computador.
2. Abra o arquivo `index.html` no navegador (Chrome ou Edge recomendados).

Para uso como app instalável (PWA), sirva a pasta por um servidor local — por exemplo:

```bash
npx --yes serve .
```

Depois acesse o endereço indicado no terminal e, se quiser, use “Instalar app” no menu do navegador.

## Como usar (resumo)

1. Escolha a **unidade de atendimento** e continue.
2. Informe os dados de cada indicador (ou importe o **relatório PDF**).
3. Acompanhe o quadrimestre e a **nota final** na barra lateral.

Os dados ficam salvos no navegador (localStorage). Ao atualizar a página (F5), você permanece nos indicadores se já tiver entrado com uma unidade.

## Testes

Com Node.js instalado:

```bash
npm test
```

Os testes cobrem faixas oficiais (PCO, TOC, B3, B5, B6), nota final e regras de quadrimestre.

## Estrutura principal

| Arquivo / pasta | Função |
|-----------------|--------|
| `index.html` | Interface principal |
| `indicadores*.js` | Cálculo e UI dos indicadores |
| `pdf-import.js` | Leitura dos PDFs de produção |
| `simulador-core.js` | Nota final (ESB) |
| `unidade.js` | Sessão e navegação entre telas |
| `assets/` | Ícones e imagens do app |
| `manifest.json` / `sw.js` | App instalável (PWA) |

## Licença / uso

Ferramenta de apoio ao cálculo dos indicadores. Confira sempre a metodologia oficial vigente (nota técnica) antes de decisões assistenciais ou de gestão.
