const fs = require("fs");
const pdf = fs.readFileSync("pdf-import.js", "utf8");
const ind = fs.readFileSync("indicadores.js", "utf8");

const defined = new Set();
for (const m of pdf.matchAll(/function\s+([A-Za-z_][A-Za-z0-9_]*)/g)) defined.add(m[1]);
for (const m of pdf.matchAll(/\b(?:var|const|let)\s+([A-Za-z_][A-Za-z0-9_]*)/g)) defined.add(m[1]);

const builtins = new Set([
  "parseInt", "parseFloat", "isNaN", "isFinite", "encodeURIComponent", "decodeURIComponent",
  "setTimeout", "clearTimeout", "setInterval", "clearInterval", "undefined", "NaN", "Infinity",
  "arguments", "Promise", "Map", "Set", "Array", "Object", "String", "Number", "Boolean",
  "Math", "Date", "JSON", "RegExp", "Error", "TypeError", "console", "document", "window",
  "localStorage", "sessionStorage", "location", "history", "navigator", "FileReader",
  "Uint8Array", "Blob", "URL", "fetch", "atob", "btoa", "requestAnimationFrame",
  "cancelAnimationFrame", "matchMedia", "confirm", "alert", "prompt",
]);

const calls = new Set();
for (const m of pdf.matchAll(/\b([a-z][A-Za-z0-9_]*)\s*\(/g)) calls.add(m[1]);

const envMatch = ind.match(/var env = \{([\s\S]*?)\};\s*Object\.defineProperties/);
const envText = envMatch ? envMatch[1] : "";
const envKeys = new Set();
for (const m of envText.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)) envKeys.add(m[1]);
[
  "populacaoAtual", "drawers", "pcoUnidadeId", "tocUnidadeId",
  "pcoMesAtual", "tocMesAtual", "pcoMesEditando", "tocMesEditando",
].forEach((k) => envKeys.add(k));

const missing = [...calls]
  .filter((c) => !defined.has(c) && !builtins.has(c) && !envKeys.has(c))
  .sort();

console.log("missing:", missing.join(", ") || "(none)");
console.log("QUAD_MESES_LABEL in env:", envKeys.has("QUAD_MESES_LABEL"));
console.log("attrStyleCor in env:", envKeys.has("attrStyleCor"));
