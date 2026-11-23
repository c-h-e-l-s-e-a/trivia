// Check the game's data files for mistakes before publishing.
// Run from anywhere:  node tools/check.mjs
// Exits with status 1 and a list of problems if anything is wrong.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const LEVEL_TARGET = { e: 20, m: 40, h: 40 };
const FIELDS = ["level", "question", "answer", "wrong", "explanation"];
const problems = [];
const notes = [];

// The topic ids, read from the TOPICS list in js/config.js.
export function topicIds(config) {
  const start = config.indexOf("var TOPICS = [");
  const block = config.slice(start, config.indexOf("];", start));
  return [...block.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
}

const ids = topicIds(read("js/config.js"));
const seen = new Map();
let total = 0;

for (const t of ids) {
  const rel = `data/questions/${t}.json`;
  if (!existsSync(join(ROOT, rel))) { problems.push(`${rel}: missing (topic "${t}" is listed in js/config.js)`); continue; }
  let items;
  try { items = JSON.parse(read(rel)); } catch (e) { problems.push(`${rel}: not valid JSON (${e.message})`); continue; }
  if (!Array.isArray(items)) { problems.push(`${rel}: should be a list of questions`); continue; }
  const levels = { e: 0, m: 0, h: 0 };
  items.forEach((q, i) => {
    const where = `${rel} #${i + 1}`;
    if (!q || typeof q !== "object") { problems.push(`${where}: not an object`); return; }
    const missing = FIELDS.filter((k) => !q[k]);
    if (missing.length) { problems.push(`${where}: missing ${missing.join(", ")}`); return; }
    const extra = Object.keys(q).filter((k) => !FIELDS.includes(k));
    if (extra.length) problems.push(`${where}: unexpected field(s) ${extra.join(", ")}`);
    if (!(q.level in LEVEL_TARGET)) problems.push(`${where}: level must be e, m or h, not "${q.level}"`);
    else levels[q.level]++;
    if (!Array.isArray(q.wrong) || q.wrong.length !== 3 || !q.wrong.every((w) => typeof w === "string" && w.trim())) {
      problems.push(`${where}: needs exactly three wrong answers`);
    } else if (new Set([q.answer, ...q.wrong].map((o) => o.trim().toLowerCase())).size !== 4) {
      problems.push(`${where}: the answer and wrong answers must all be different`);
    }
    if ([q.question, q.answer, ...[].concat(q.wrong), q.explanation].join("").includes('"')) {
      problems.push(`${where}: use curly quotes “ ” instead of straight double quotes`);
    }
    const key = q.question.trim().toLowerCase();
    if (seen.has(key)) problems.push(`${where}: same question as ${seen.get(key)}`);
    seen.set(key, where);
    total++;
  });
  for (const [lv, want] of Object.entries(LEVEL_TARGET)) {
    if (levels[lv] !== want) notes.push(`${rel}: ${levels[lv]} ${lv}-level questions (usual is ${want})`);
  }
}

// Pictures: every file exists, every picture named in the Facts tables is listed.
const images = JSON.parse(read("data/images.json"));
for (const [id, info] of Object.entries(images)) {
  if (!existsSync(join(ROOT, info.src))) problems.push(`data/images.json: ${id} points to missing file ${info.src}`);
  if (!info.alt) problems.push(`data/images.json: ${id} has no alt text`);
}
const facts = JSON.parse(read("data/facts.json"));
for (const tab of facts.tabs) {
  for (const mapping of Object.values(tab.pics || {})) {
    for (const [name, id] of Object.entries(mapping)) {
      if (!images[id]) problems.push(`data/facts.json tab ${tab.id}: picture ${id} for "${name}" is not in data/images.json`);
    }
  }
  tab.rows.forEach((row, i) => {
    if (row.length !== tab.cols.length) problems.push(`data/facts.json tab ${tab.id} row ${i + 1}: ${row.length} cells but ${tab.cols.length} columns`);
  });
}

notes.forEach((n) => console.log("note:", n));
if (problems.length) {
  problems.forEach((p) => console.log("PROBLEM:", p));
  process.exit(1);
}
console.log(`OK: ${ids.length} topics, ${total} questions, ${facts.tabs.length} Facts tabs, ${Object.keys(images).length} pictures.`);
