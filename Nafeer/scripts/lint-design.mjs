#!/usr/bin/env node
// ─── lint:design ──────────────────────────────────────────────────────────────
// Counts design-system violations per area (docs/design-system.md §9).
//
// It is a ratchet, not a gate: the counts in design-baseline.json are what the
// code held when the system was introduced, and the check fails only when a
// count RISES. Migrating a surface lowers its counts; run with --update to
// record the new floor. --update refuses to raise a count unless --force is
// also given, so the baseline cannot quietly absorb a regression.
//
//   npm run lint:design             compare against the baseline
//   npm run lint:design -- --update lower the baseline to the current counts
//
// Plain line-based regexes on purpose — no parser, no dependency. A rule can
// misfire on a comment; that cost is accepted for a check that runs in under
// a second and that anyone can read.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT     = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC      = path.join(ROOT, 'src');
const BASELINE = path.join(ROOT, 'scripts', 'design-baseline.json');

// Out of scope, each for a reason:
const EXCLUDE = [
  'app/demo/', 'components/demo/',  // mirrors the Basheer app's own roles inside .bsh
  'lib/math/',                      // Arabic-Indic digits are subject notation there
  'lib/email/',                     // email clients need inline hex; no CSS variables
  'app/opengraph-image.js',         // Satori renders it; no CSS variables
  'lib/format.js',                  // the one place toLocaleString is allowed
];

const AREAS = [
  ['ui',      /^components\/ui\//],        // the shared library — held at zero
  ['landing', /^components\/landing\//],
  ['editor',  /^(components\/editor\/|app\/editor\/)/],
  ['admin',   /^app\/admin\//],
  ['flow',    /^app\/(join|prejoin|interview|onboard|signin)\//],
  ['profile', /^app\/contributor\//],
  ['other',   /./],
];

const ARABIC = /[؀-ٟ٪-ۿ]/;   // letters, not the digit block
const RULES = {
  hex:          { re: /#[0-9a-fA-F]{6}\b|['"`]#[0-9a-fA-F]{3}['"`]/, why: 'hex colour — use a role token' },
  rgba:         { re: /rgba?\(\s*\d/,                                why: 'rgb()/rgba() literal — use a role token' },
  rawPalette:   { re: /\b(text|bg|border|ring|from|to|via|fill|stroke|outline|divide|decoration)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/, why: 'raw Tailwind palette — use a role or status token' },
  rampDirect:   { re: /\b[a-z]+-(ink|sand)-\d{2,3}\b/,               why: 'ramp step used directly — use a role (bg-raised, text-fg-muted …)' },
  arbitraryText:{ re: /\btext-\[\d/,                                 why: 'arbitrary font size — use a type role (t-label, t-caption …)' },
  inlineStyle:  { re: /style=\{\{/,                                  why: 'inline style object' },
  toLocale:     { re: /\.toLocale(String|DateString|TimeString)\(/,  why: 'ad-hoc formatting — use src/lib/format.js' },
  arabicIndic:  { re: /[٠-٩]/,                                       why: 'Arabic-Indic digit — the site uses 0–9' },
  arabicTracking:{ test: (l) => ARABIC.test(l) && /tracking-|letterSpacing/.test(l), why: 'letter spacing on an Arabic line pulls joins apart' },
  arabicMono:   { test: (l) => ARABIC.test(l) && /font-mono|--font-mono|monospace/.test(l), why: 'mono face on an Arabic line — mono is for Latin and code' },
};

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

const counts = {};
const samples = {};
for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  if (EXCLUDE.some((x) => rel.startsWith(x))) continue;
  const area = AREAS.find(([, re]) => re.test(rel))[0];
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
    for (const [rule, r] of Object.entries(RULES)) {
      const hit = r.test ? r.test(line) : r.re.test(line);
      if (!hit) continue;
      counts[rule] ??= {};
      counts[rule][area] = (counts[rule][area] || 0) + 1;
      (samples[`${rule}|${area}`] ??= []).push(`src/${rel}:${i + 1}`);
    }
  });
}

const args     = new Set(process.argv.slice(2));
const baseline = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : null;
const areas    = AREAS.map(([a]) => a);

// ── Report ────────────────────────────────────────────────────────────────────
const pad = (s, n) => String(s).padStart(n);
console.log(`${'rule'.padEnd(15)}${areas.map((a) => pad(a, 9)).join('')}${pad('total', 9)}`);
const regressions = [];
for (const rule of Object.keys(RULES)) {
  let total = 0;
  const cells = areas.map((a) => {
    const n = counts[rule]?.[a] || 0;
    const b = baseline?.counts?.[rule]?.[a];
    total += n;
    if (b !== undefined && n > b) regressions.push({ rule, area: a, n, b });
    const mark = b === undefined ? '' : n > b ? '↑' : n < b ? '↓' : '';
    return pad(`${n}${mark}`, 9);
  });
  console.log(`${rule.padEnd(15)}${cells.join('')}${pad(total, 9)}`);
}

// ── Update ────────────────────────────────────────────────────────────────────
if (args.has('--update')) {
  if (regressions.length && !args.has('--force')) {
    console.error('\nRefusing to raise the baseline — fix the regressions below, or pass --force if a rise is intended.');
  } else {
    const full = {};
    for (const rule of Object.keys(RULES)) {
      full[rule] = {};
      for (const a of areas) full[rule][a] = counts[rule]?.[a] || 0;
    }
    fs.writeFileSync(BASELINE, JSON.stringify({
      note: 'Violation counts per area. lint:design fails if any count rises. Lower with --update after a migration.',
      updated: new Date().toISOString().slice(0, 10),
      counts: full,
    }, null, 2) + '\n');
    console.log(`\nBaseline written to ${path.relative(ROOT, BASELINE)}`);
    process.exit(0);
  }
}

if (!baseline) {
  console.log('\nNo baseline yet — run with --update to record one.');
  process.exit(0);
}
if (regressions.length) {
  console.error('\nNew violations since the baseline:');
  for (const { rule, area, n, b } of regressions) {
    console.error(`  ${rule} in ${area}: ${b} → ${n}  (${RULES[rule].why})`);
    for (const s of samples[`${rule}|${area}`].slice(0, 5)) console.error(`    ${s}`);
  }
  process.exit(1);
}
console.log('\nNo new violations.');
