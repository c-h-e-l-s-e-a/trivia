// Make one self-contained HTML file for offline use.
// Run from anywhere:  node tools/build-offline.mjs [output.html]
// The styles, scripts, questions, Facts tables and pictures are all copied inside the file.
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const out = process.argv[2] || "trivia-night-practice.html";

// Keep inline JSON and code from ending their <script> or <style> tag early.
const safe = (text) => text.replace(/<\//g, "<\\/");

let html = read("index.html");

// Styles: swap the stylesheet link for the stylesheet itself.
const cssLink = '<link rel="stylesheet" href="css/style.css">';
if (!html.includes(cssLink)) throw new Error("stylesheet link not found in index.html");
const css = read("css/style.css");
if (/<\/style/i.test(css)) throw new Error("css/style.css contains </style");
html = html.replace(cssLink, () => "<style>\n" + css + "</style>");

// Data: questions by topic, the Facts tables, and pictures as data URIs.
const config = read("js/config.js");
const start = config.indexOf("var TOPICS = [");
const ids = [...config.slice(start, config.indexOf("];", start)).matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
const bank = Object.fromEntries(ids.map((t) => [t, JSON.parse(read(`data/questions/${t}.json`))]));
const facts = JSON.parse(read("data/facts.json"));
const MIME = { ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };
const images = {};
for (const [id, info] of Object.entries(JSON.parse(read("data/images.json")))) {
  const bytes = readFileSync(join(ROOT, info.src));
  images[id] = { src: `data:${MIME[extname(info.src).toLowerCase()]};base64,${bytes.toString("base64")}`, alt: info.alt };
}
const blob = (id, value) => `<script type="application/json" id="${id}">` + safe(JSON.stringify(value)) + "</script>\n";
const data = blob("bank", bank) + blob("facts", facts) + blob("images", images);

// Scripts: swap each <script src> for the code itself, after the data.
const srcs = [...html.matchAll(/<script src="(js\/[a-z-]+\.js)"><\/script>\n/g)].map((m) => m[1]);
if (!srcs.length) throw new Error("no scripts found in index.html");
html = html.replace(`<script src="${srcs[0]}"></script>\n`, (tag) => data + tag);
for (const src of srcs) {
  const code = read(src);
  if (/<\/script/i.test(code)) throw new Error(`${src} contains </script`);
  html = html.replace(`<script src="${src}"></script>\n`, () => "<script>\n" + code + "</script>\n");
}

writeFileSync(out, html);
const nQ = Object.values(bank).reduce((n, list) => n + list.length, 0);
console.log(`Wrote ${out} (${Math.round(statSync(out).size / 1024)} KB): ${ids.length} topics, ${nQ} questions, ${facts.tabs.length} Facts tabs, ${Object.keys(images).length} pictures.`);
