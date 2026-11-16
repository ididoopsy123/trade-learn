#!/usr/bin/env node
/* Bundles Trade Mastery into single-file HTML builds:
     dist/trade-mastery.html  — a complete standalone page (double-click to open, works offline except fonts)
     dist/artifact.html       — the same content without <html>/<head>/<body> wrappers, for hosts that add their own skeleton
   Usage: node tools/build.js */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const html = read('index.html');
const css = read('css/styles.css');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const js = scripts.map((src) => `/* ---- ${src} ---- */\n` + read(src).replace(/<\/script/gi, '<\\/script')).join('\n');

const bodyMatch = html.match(/<body>([\s\S]*?)<script/);
const body = bodyMatch[1].trim();
const head = {
  title: html.match(/<title>.*?<\/title>/)[0],
  metas: (html.match(/<meta name="(claude:viewport-fit-sides|description|theme-color)"[^>]*>/g) || []).join('\n'),
  fonts: (html.match(/<link rel="(preconnect|stylesheet)" href="https:\/\/fonts[^>]*>/g) || []).join('\n'),
};

const full = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head.title}
${head.metas}
${head.fonts}
<style>
${css}
</style>
</head>
<body>
${body}
<script>
${js}
</script>
</body>
</html>
`;

const artifact = `${head.title}
${head.metas}
${head.fonts}
<style>
${css}
</style>
${body}
<script>
${js}
</script>
`;

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/trade-mastery.html'), full);
fs.writeFileSync(path.join(root, 'dist/artifact.html'), artifact);
console.log(`Built dist/trade-mastery.html (${(full.length / 1024).toFixed(0)} KB) from ${scripts.length} scripts.`);
