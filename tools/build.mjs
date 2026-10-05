// One-off converter: design-source.html (Claude Design prototype) -> static pages.
// Usage: node tools/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seoHead, writeCrawlFiles } from './seo.mjs';
import { writeGeoFiles } from './geo.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'tools/design-source.html'), 'utf8');

const pages = [
  { key: 'home', flag: 'isHome', file: 'index.html', href: '/' },
  { key: 'products', flag: 'isProducts', file: 'products/index.html', href: '/products/' },
  { key: 'about', flag: 'isAbout', file: 'about/index.html', href: '/about/' },
  { key: 'certifications', flag: 'isCerts', file: 'certifications/index.html', href: '/certifications/' },
  { key: 'news', flag: 'isNews', file: 'news/index.html', href: '/news/' },
  { key: 'contact', flag: 'isContact', file: 'contact/index.html', href: '/contact/' },
];
const titles = {
  home: 'Rooibos North America | Bulk Rooibos, Botanicals, Extracts & Powders',
  products: 'Products | Rooibos North America',
  about: 'About | Rooibos North America',
  certifications: 'Certifications | Rooibos North America',
  news: 'Rooibos News | Rooibos North America',
  contact: 'Contact | Rooibos North America',
};

// ---- hover styles -> classes ----
const hoverMap = new Map();
function hoverClass(rule) {
  if (!hoverMap.has(rule)) hoverMap.set(rule, 'h' + (hoverMap.size + 1));
  return hoverMap.get(rule);
}
function convertHover(html) {
  return html.replace(/<([a-z0-9]+)\b([^>]*?)\sstyle-hover="([^"]+)"([^>]*)>/gi, (m, tag, a, hv, b) => {
    const cls = hoverClass(hv);
    const attrs = a + b;
    if (/\sclass="/.test(attrs)) return `<${tag}${(a + b).replace(/class="/, `class="${cls} `)}>`;
    return `<${tag} class="${cls}"${a}${b}>`;
  });
}

// ---- sc-if / sc-for / handlers ----
function sliceBetween(s, startMarker, endMarker) {
  const i = s.indexOf(startMarker);
  const j = s.indexOf(endMarker, i);
  return s.slice(i + startMarker.length, j);
}
const mainStart = src.indexOf('<main>');
const mainEnd = src.indexOf('</main>');
const mainHtml = src.slice(mainStart + 6, mainEnd);

function pageBody(flag) {
  const open = `<sc-if value="{{ ${flag} }}"`;
  const i = mainHtml.indexOf(open);
  const bodyStart = mainHtml.indexOf('>', i) + 1;
  const end = mainHtml.indexOf('</sc-if>', bodyStart);
  // nested sc-if? pages only contain top-level div; verify no nested
  let body = mainHtml.slice(bodyStart, end);
  if (body.includes('<sc-if')) throw new Error('nested sc-if in ' + flag);
  return body;
}

// Carousel items
const carMatch = src.match(/carItems: \[([\s\S]*?)\n      \],/)[1];
const carItems = [...carMatch.matchAll(/img: '([^']+)', origin: '([^']+)', name: '([^']+)'/g)].map(m => ({ img: m[1], origin: m[2], name: m[3] }));
const esc = s => s.replace(/&/g, '&amp;');

function expandFor(body) {
  return body.replace(/<sc-for list="\{\{ carItems \}\}"[^>]*>([\s\S]*?)<\/sc-for>/, (m, tpl) =>
    carItems.map(p => tpl
      .replace(/\{\{ p\.img \}\}/g, p.img)
            .replace(/\{\{ p\.name \}\}/g, esc(p.name))
      .replace(/\{\{ p\.origin \}\}/g, esc(p.origin))).join(''));
}

function fixLinks(html) {
  const map = { '#home': '/', '#products': '/products/', '#about': '/about/', '#certifications': '/certifications/', '#news': '/news/', '#contact': '/contact/' };
  // Botanicals deep link
  html = html.replace(/href="#products"\s+onClick="\{\{ goBotanicals \}\}"/g, 'href="/products/#botanicals"');
  html = html.replace(/\sonClick="\{\{ go\w+ \}\}"/g, '');
  html = html.replace(/href="(#(?:home|products|about|certifications|news|contact))"/g, (m, h) => `href="${map[h]}"`);
  html = html.replace(/\sonMouse(?:Enter|Leave)="\{\{ \w+ \}\}"/g, '');
  html = html.replace(/\sonClick="\{\{ car(?:Prev|Next) \}\}"/g, '');
  html = html.replace(/src="assets\//g, 'src="/assets/').replace(/href="assets\//g, 'href="/assets/');
  return html;
}

// Carousel buttons need identifiers
function carButtons(html) {
  html = html.replace(/<button type="button" onClick="\{\{ carPrev \}\}"/, '<button type="button" data-car-prev');
  html = html.replace(/<button type="button" onClick="\{\{ carNext \}\}"/, '<button type="button" data-car-next');
  html = html.replace('data-car-track="1"', 'data-car-track');
  return html;
}

// ---- header / footer ----
const headerRaw = sliceBetween(src, '<header', '</header>');
const footerRaw = sliceBetween(src, '<footer', '</footer>');

function buildHeader(active) {
  let h = '<header' + headerRaw + '</header>';
  h = h.replace(/<sc-if value="\{\{ (?:newsTab|partnerMark) \}\}"[^>]*>|<\/sc-if>/g, '');
  const keys = { Home: 'home', Products: 'products', About: 'about', Cert: 'certifications', News: 'news', Contact: 'contact' };
  const nameMap = { cHome: 'home', cProducts: 'products', cAbout: 'about', cCerts: 'certifications', cNews: 'news', cContact: 'contact' };
  h = h.replace(/\{\{ (c\w+) \}\}/g, (m, k) => nameMap[k] === active ? '#b32025' : '#333');
  const uMap = { uHome: 'home', uProducts: 'products', uAbout: 'about', uCerts: 'certifications', uNews: 'news', uContact: 'contact' };
  h = h.replace(/\{\{ (u\w+) \}\}/g, (m, k) => uMap[k] === active ? '#b32025' : 'transparent');
  // aria-current on active link
  const href = pages.find(p => p.key === active).href;
  h = h.replace(new RegExp(`(<a href="${href.replace(/\//g, '\\/')}")(?= onClick)`), '$1 aria-current="page"');
  h = fixLinks(h);
  // hooks for the mobile burger menu (see css/site.css, js/site.js)
  h = h.replace('<header style=', '<header class="site-header" style=');
  h = h.replace(/<header([^>]*)>\s*<div style=/, '<header$1>\n    <div class="hdr-in" style=');
  h = h.replace(/<a href="\/" style=([^>]*aria-label="Rooibos North America home")>/, '<a href="/" class="hdr-logo" style=$1>');
  h = h.replace(/(class="hdr-logo"[\s\S]*?<img )/, '$1class="hdr-logo-img" ');
  h = h.replace('<nav aria-label="Primary navigation" style=', '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Menu"><span></span><span></span><span></span></button>\n      <nav id="site-nav" class="site-nav" aria-label="Primary navigation" style=');
  h = h.replace(/<div style="display:flex;align-items:center;justify-content:flex-end/, '<div class="hdr-partner" style="display:flex;align-items:center;justify-content:flex-end');
  return h;
}
function buildFooter() {
  return fixLinks('<footer' + footerRaw + '</footer>');
}

// keep a valid h1 > h2 > h3 outline per page (design used h4/h3 for cards)
function fixHeadings(key, body) {
  const retag = (b, from, to) => b.replace(new RegExp(`<${from}(?=[\\s>])`, 'g'), `<${to}`).replace(new RegExp(`</${from}>`, 'g'), `</${to}>`);
  if (key === 'home' || key === 'products') body = retag(body, 'h4', 'h3');
  if (key === 'news') body = retag(body, 'h3', 'h2');
  if (key === 'about') body = body.replace('<h2', '<h1').replace('</h2>', '</h1>');
  return body;
}

// lazy-load every image after the first section (above-the-fold stays eager)
function lazyImages(body) {
  const cut = body.indexOf('</section>');
  const rest = body.slice(cut).replace(/<img (?![^>]*loading=)/g, '<img loading="lazy" decoding="async" ');
  const first = body.slice(0, cut).replace(/<img /, '<img fetchpriority="high" ');
  return first + rest;
}

const head = (key, seo) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${seo}
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script>document.documentElement.className+=' js'</script>
<link rel="stylesheet" href="/css/site.css">
</head>
<body>
<div class="curtain" aria-hidden="true"><span></span><span></span></div>
`;

for (const p of pages) {
  let body = pageBody(p.flag);
  body = expandFor(body);
  body = carButtons(body);
  body = fixLinks(body);
  body = convertHover(body);
  body = lazyImages(body);
  body = fixHeadings(p.key, body);
  let header = convertHover(buildHeader(p.key));
  let footer = convertHover(buildFooter());
  const html = head(p.key, seoHead(p, body, pages)) + '<div style="background:#fff">\n' + header + '\n<main id="main">' + body + '</main>\n' + footer + '\n</div>\n<script src="/js/site.js" defer></script>\n</body>\n</html>\n';
  const out = path.join(root, p.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}

writeCrawlFiles(root, pages);
writeGeoFiles(root, pages);

// hover css -> appended to css/site.css between markers
let css = '/* hover:start (generated) */\n';
for (const [rule, cls] of hoverMap) css += `.${cls}:hover{${rule.split(';').filter(Boolean).map(d => d.trim() + ' !important').join(';')}}\n`;
css += '/* hover:end */';
const cssPath = path.join(root, 'css/site.css');
let cur = fs.readFileSync(cssPath, 'utf8');
cur = /\/\* hover:start[\s\S]*hover:end \*\//.test(cur) ? cur.replace(/\/\* hover:start[\s\S]*hover:end \*\//, css) : cur.replace(/\/\* generated from style-hover attributes \*\/[\s\S]*$/, css + '\n');
fs.writeFileSync(cssPath, cur);
console.log('built', pages.length, 'pages;', hoverMap.size, 'hover rules');
